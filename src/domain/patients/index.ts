/**
 * PatientInstance lifecycle.
 *
 * The panel is durable state (spec §12, §31): patients stay until discharged,
 * skipped days do nothing to them, and every screen is rebuilt from these rows
 * rather than from anything held in memory.
 */

import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import {
  ACTIVE_PANEL_STATES,
  type EntryMode,
  type PatientState,
  type StudyEventType,
} from "@/domain/constants";
import { USER_ID } from "@/domain/profile";
import { sortByRoomOrder } from "@/domain/rooms";
import { nowIso, toIsoDate, todayIso, type IsoDate } from "@/lib/date";

/* ------------------------------- study events ----------------------------- */

export interface StudyEventInput {
  eventType: StudyEventType;
  patientInstanceId?: string | null;
  caseId?: string | null;
  conceptId?: string | null;
  lectureId?: string | null;
  response?: string | null;
  correct?: boolean | null;
  metadata?: Record<string, unknown>;
  date?: IsoDate;
}

/** Append-only audit log. Aggregates can always be rebuilt from these rows. */
export function recordStudyEvent(db: Db, input: StudyEventInput): void {
  db.insert(t.studyEvent)
    .values({
      id: `evt_${crypto.randomUUID()}`,
      userId: USER_ID,
      patientInstanceId: input.patientInstanceId ?? null,
      caseId: input.caseId ?? null,
      conceptId: input.conceptId ?? null,
      lectureId: input.lectureId ?? null,
      eventType: input.eventType,
      response: input.response ?? null,
      correct: input.correct ?? null,
      metadataJson: JSON.stringify(input.metadata ?? {}),
      eventDate: input.date ?? todayIso(),
      createdAt: nowIso(),
    })
    .run();
}

export function listStudyEvents(db: Db, limit = 200): t.StudyEventRow[] {
  return db
    .select()
    .from(t.studyEvent)
    .where(eq(t.studyEvent.userId, USER_ID))
    .orderBy(desc(t.studyEvent.createdAt))
    .limit(limit)
    .all();
}

export function listStudyEventsForPatient(db: Db, patientId: string): t.StudyEventRow[] {
  return db
    .select()
    .from(t.studyEvent)
    .where(
      and(eq(t.studyEvent.userId, USER_ID), eq(t.studyEvent.patientInstanceId, patientId)),
    )
    .orderBy(asc(t.studyEvent.createdAt))
    .all();
}

/* --------------------------------- queries -------------------------------- */

export function getPatient(db: Db, id: string): t.PatientInstanceRow | null {
  return (
    db
      .select()
      .from(t.patientInstance)
      .where(and(eq(t.patientInstance.id, id), eq(t.patientInstance.userId, USER_ID)))
      .get() ?? null
  );
}

/** Every patient occupying a panel slot, in room order. */
export function listActivePanel(db: Db): t.PatientInstanceRow[] {
  return db
    .select()
    .from(t.patientInstance)
    .where(
      and(
        eq(t.patientInstance.userId, USER_ID),
        inArray(t.patientInstance.state, [...ACTIVE_PANEL_STATES]),
      ),
    )
    .orderBy(asc(t.patientInstance.roomNumber))
    .all();
}

export function listByState(db: Db, state: PatientState): t.PatientInstanceRow[] {
  return db
    .select()
    .from(t.patientInstance)
    .where(and(eq(t.patientInstance.userId, USER_ID), eq(t.patientInstance.state, state)))
    .orderBy(asc(t.patientInstance.roomNumber))
    .all();
}

export function listDischarged(db: Db): t.PatientInstanceRow[] {
  return db
    .select()
    .from(t.patientInstance)
    .where(
      and(eq(t.patientInstance.userId, USER_ID), eq(t.patientInstance.state, "DISCHARGED")),
    )
    .orderBy(desc(t.patientInstance.dischargedAt))
    .all();
}

export function listAllPatients(db: Db): t.PatientInstanceRow[] {
  return db
    .select()
    .from(t.patientInstance)
    .where(eq(t.patientInstance.userId, USER_ID))
    .orderBy(desc(t.patientInstance.assignedAt))
    .all();
}

/**
 * Patients on service whose rounds encounter has not happened today, in
 * walking order: lowest occupied room first (spec §30).
 */
export function listRoundsDue(db: Db, today: IsoDate = todayIso()): t.PatientInstanceRow[] {
  const due = listActivePanel(db).filter(
    (p) =>
      (p.state === "ON_SERVICE" || p.state === "DISCHARGE_ELIGIBLE") &&
      p.lastRoundsDate !== today,
  );
  return sortByRoomOrder(db, due);
}

export function countActivePanel(db: Db): number {
  return listActivePanel(db).length;
}

/** Every case that has ever been assigned to this learner. */
export function listAssignedCaseIds(db: Db): string[] {
  return db
    .select({ caseId: t.patientInstance.caseId })
    .from(t.patientInstance)
    .where(eq(t.patientInstance.userId, USER_ID))
    .all()
    .map((r) => r.caseId);
}

/* -------------------------------- mutations ------------------------------- */

export interface CreatePatientInput {
  caseId: string;
  patientName: string;
  roomNumber: string;
  entryMode: EntryMode;
  assignedDate: IsoDate;
  /** Physical room being occupied, when the hospital map has capacity. */
  roomId?: string | null;
  locationType?: "ED" | "INPATIENT";
}

export function createPatientInstance(db: Db, input: CreatePatientInput): string {
  const id = `pt_${crypto.randomUUID()}`;
  db.insert(t.patientInstance)
    .values({
      id,
      userId: USER_ID,
      caseId: input.caseId,
      patientName: input.patientName,
      roomNumber: input.roomNumber,
      entryMode: input.entryMode,
      state: input.entryMode === "HANDOFF" ? "PENDING_HANDOFF" : "PENDING_ADMISSION",
      assignedDate: input.assignedDate,
      assignedAt: nowIso(),
      roundsCompleted: 0,
      currentRoundPromptIndex: 0,
      activeDatesJson: "[]",
      roomId: input.roomId ?? null,
      locationType: input.locationType ?? "INPATIENT",
    })
    .run();

  // Initials today, a generated headshot later (spec §31). Storing the row now
  // means no caller has to care which of the two it is getting.
  db.insert(t.patientVisual)
    .values({
      patientInstanceId: id,
      assetType: "INITIALS",
      assetPath: null,
      fallbackInitials: initialsOf(input.patientName),
    })
    .onConflictDoNothing()
    .run();

  recordStudyEvent(db, {
    eventType: "PATIENT_ASSIGNED",
    patientInstanceId: id,
    caseId: input.caseId,
    metadata: { entryMode: input.entryMode, room: input.roomNumber },
    date: input.assignedDate,
  });

  return id;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "??";
}

export function parseActiveDates(patient: t.PatientInstanceRow): IsoDate[] {
  try {
    const parsed: unknown = JSON.parse(patient.activeDatesJson);
    return Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Hospital day = the number of distinct real-world dates on which the learner
 * has interacted with this patient (spec §12). Narrative only.
 */
export function hospitalDay(patient: t.PatientInstanceRow): number {
  return Math.max(1, parseActiveDates(patient).length);
}

/** Records an interaction today, advancing the narrative hospital day if new. */
export function touchPatient(
  db: Db,
  patient: t.PatientInstanceRow,
  today: IsoDate = todayIso(),
): void {
  const dates = parseActiveDates(patient);
  if (!dates.includes(today)) dates.push(today);
  db.update(t.patientInstance)
    .set({ activeDatesJson: JSON.stringify(dates), lastInteractedAt: nowIso() })
    .where(eq(t.patientInstance.id, patient.id))
    .run();
}

export function setPatientState(db: Db, id: string, state: PatientState): void {
  db.update(t.patientInstance)
    .set({ state })
    .where(eq(t.patientInstance.id, id))
    .run();
}

/** Handoff acceptance: PENDING_HANDOFF -> ON_SERVICE. */
export function acceptHandoffPatient(
  db: Db,
  patient: t.PatientInstanceRow,
  today: IsoDate = todayIso(),
): void {
  db.update(t.patientInstance)
    .set({ state: "ON_SERVICE", acceptedAt: nowIso() })
    .where(eq(t.patientInstance.id, patient.id))
    .run();
  touchPatient(db, patient, today);
  recordStudyEvent(db, {
    eventType: "PATIENT_ACCEPTED",
    patientInstanceId: patient.id,
    caseId: patient.caseId,
    date: today,
  });
}

/** Admission completion: PENDING_ADMISSION -> ON_SERVICE. */
export function completeAdmission(
  db: Db,
  patient: t.PatientInstanceRow,
  today: IsoDate = todayIso(),
): void {
  db.update(t.patientInstance)
    .set({ state: "ON_SERVICE", acceptedAt: nowIso(), admissionCompletedAt: nowIso() })
    .where(eq(t.patientInstance.id, patient.id))
    .run();
  touchPatient(db, patient, today);
  recordStudyEvent(db, {
    eventType: "ADMISSION_COMPLETED",
    patientInstanceId: patient.id,
    caseId: patient.caseId,
    date: today,
  });
}

/**
 * Records a completed rounds encounter and advances the prompt cursor.
 * Prompts cycle when exhausted so a long-stay patient keeps generating work.
 */
export function advancePatientAfterRounds(
  db: Db,
  patient: t.PatientInstanceRow,
  promptCount: number,
  minimumRounds: number,
  today: IsoDate = todayIso(),
): { roundsCompleted: number; dischargeEligible: boolean } {
  const roundsCompleted = patient.roundsCompleted + 1;
  const nextIndex = promptCount > 0 ? (patient.currentRoundPromptIndex + 1) % promptCount : 0;
  const dischargeEligible = roundsCompleted >= minimumRounds;

  db.update(t.patientInstance)
    .set({
      roundsCompleted,
      currentRoundPromptIndex: nextIndex,
      lastRoundsDate: today,
      lastInteractedAt: nowIso(),
      state: dischargeEligible && patient.state === "ON_SERVICE"
        ? "DISCHARGE_ELIGIBLE"
        : patient.state,
    })
    .where(eq(t.patientInstance.id, patient.id))
    .run();

  touchPatient(db, patient, today);
  return { roundsCompleted, dischargeEligible };
}

export function dischargePatient(
  db: Db,
  patient: t.PatientInstanceRow,
  today: IsoDate = todayIso(),
): void {
  // Clearing roomId is what frees the bed: occupancy is derived from active
  // patients pointing at rooms, so there is no second place to update.
  db.update(t.patientInstance)
    .set({
      state: "DISCHARGED",
      dischargedAt: nowIso(),
      lastInteractedAt: nowIso(),
      roomId: null,
      locationType: "DISCHARGED",
    })
    .where(eq(t.patientInstance.id, patient.id))
    .run();
  touchPatient(db, patient, today);
  recordStudyEvent(db, {
    eventType: "PATIENT_DISCHARGED",
    patientInstanceId: patient.id,
    caseId: patient.caseId,
    date: today,
  });
}

/* --------------------- revealed findings & taken actions ------------------- */

export function listPatientActions(db: Db, patientId: string): t.PatientActionRow[] {
  return db
    .select()
    .from(t.patientAction)
    .where(eq(t.patientAction.patientInstanceId, patientId))
    .orderBy(asc(t.patientAction.createdAt))
    .all();
}

export function recordPatientAction(
  db: Db,
  patientId: string,
  actionCode: string,
  classification: string,
  resultText: string,
): void {
  db.insert(t.patientAction)
    .values({
      id: `pa_${crypto.randomUUID()}`,
      patientInstanceId: patientId,
      actionCode,
      classification,
      resultText,
      createdAt: nowIso(),
    })
    .run();
}

export function listRevealedFindingIds(db: Db, patientId: string): string[] {
  return db
    .select({ findingId: t.patientRevealedFinding.findingId })
    .from(t.patientRevealedFinding)
    .where(eq(t.patientRevealedFinding.patientInstanceId, patientId))
    .all()
    .map((r) => r.findingId);
}

export function revealFindings(db: Db, patientId: string, findingIds: readonly string[]): void {
  for (const findingId of findingIds) {
    db.insert(t.patientRevealedFinding)
      .values({ patientInstanceId: patientId, findingId, revealedAt: nowIso() })
      .onConflictDoNothing()
      .run();
  }
}

export function listPromptResponses(db: Db, patientId: string): t.PatientPromptResponseRow[] {
  return db
    .select()
    .from(t.patientPromptResponse)
    .where(eq(t.patientPromptResponse.patientInstanceId, patientId))
    .orderBy(asc(t.patientPromptResponse.createdAt))
    .all();
}

/**
 * Whether this prompt was already answered on `date`.
 *
 * Rounds keeps a patient on the list until the learner explicitly finishes with
 * them, so the same question can be reached twice in a day. Answering it twice
 * would record two responses and move mastery twice off one piece of knowledge,
 * which this lets the caller refuse.
 */
export function hasAnsweredPromptOn(
  db: Db,
  patientId: string,
  promptId: string,
  date: IsoDate,
): boolean {
  // `created_at` is a UTC instant while `date` is a local calendar day, so the
  // comparison is made after converting — matching on the stored string's
  // prefix would put a late-evening answer on the wrong day west of UTC.
  return db
    .select({ createdAt: t.patientPromptResponse.createdAt })
    .from(t.patientPromptResponse)
    .where(
      and(
        eq(t.patientPromptResponse.patientInstanceId, patientId),
        eq(t.patientPromptResponse.promptId, promptId),
      ),
    )
    .all()
    .some((row) => toIsoDate(new Date(row.createdAt)) === date);
}

export function recordPromptResponse(
  db: Db,
  patientId: string,
  promptId: string,
  stage: string,
  response: string,
  correct: boolean,
): void {
  db.insert(t.patientPromptResponse)
    .values({
      id: `ppr_${crypto.randomUUID()}`,
      patientInstanceId: patientId,
      promptId,
      stage,
      response,
      correct,
      createdAt: nowIso(),
    })
    .run();
}

void ne;
