/**
 * Learner-initiated admissions — the ED board.
 *
 * The daily scheduler decides what the learner *should* see. This is the other
 * direction: a learner with time left, or a specific weakness to work on, can
 * walk down to the emergency department and pick up a patient themselves.
 *
 * One deliberate difference from a scheduled admission: the board shows the
 * working diagnosis. A scheduled admission hides it because the exercise is to
 * work it out; here the learner is *choosing* what to practise, so hiding it
 * would make the feature unusable. The workup itself is identical either way.
 */

import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { listCases } from "@/domain/cases";
import { ACTIVE_PANEL_STATES } from "@/domain/constants";
import { createPatientInstance, listActivePanel } from "@/domain/patients";
import { USER_ID } from "@/domain/profile";
import {
  countAvailableInpatientRooms,
  findOrOpenRoom,
  remainingOverflowCapacity,
} from "@/domain/rooms";
import { getPreferences, resolveSchedulerTuning } from "@/domain/settings";
import { DEMO_PATIENT_NAMES } from "@/content/demo/patientNames";
import { seededUnit } from "@/lib/seededRandom";
import type { IsoDate } from "@/lib/date";

export interface EdBoardEntry {
  caseId: string;
  code: string;
  title: string;
  /** The working diagnosis, shown deliberately — see the module note. */
  diagnosis: string;
  specialty: string;
  topic: string;
  difficulty: number;
  /** One-line triage note, the way an ED board reads. */
  oneLiner: string;
  /** Deterministic ED bay this patient is waiting in. */
  bay: string;
  /** True once this case is already somewhere on the learner's service. */
  alreadyOnService: boolean;
}

export interface EdCapacity {
  activePanelSize: number;
  censusCap: number;
  freeBeds: number;
  overflowRemaining: number;
  /** How many more patients the learner may admit right now. */
  admissionsRemaining: number;
  /** Set when admitting would need the ward to flex open an overflow bed. */
  willOpenOverflow: boolean;
  /** True once the panel has reached the learner's own census cap. */
  overCap: boolean;
  /** Explains the consequence of admitting past the cap. Never a refusal. */
  capWarning: string | null;
  blockedReason: string | null;
}

/**
 * What the learner may admit right now.
 *
 * The census cap paces the *scheduler* — it decides how many patients arrive
 * on their own. It is deliberately not a hard stop on the learner's own
 * choices: someone with an hour spare who wants three more cardiology cases
 * should be able to take them. So self-admission is bounded by beds rather
 * than by the cap, and the ward opens overflow beds when Floor 4 fills.
 *
 * Going above the cap is surfaced as a warning rather than a refusal, because
 * the consequence is real but reversible: the scheduler will assign nothing
 * new until the census falls back under it.
 */
export function getEdCapacity(db: Db): EdCapacity {
  const tuning = resolveSchedulerTuning(getPreferences(db).scheduler);
  const activePanelSize = listActivePanel(db).length;
  const freeBeds = countAvailableInpatientRooms(db);
  const overflowRemaining = remainingOverflowCapacity(db);
  const admissionsRemaining = freeBeds + overflowRemaining;

  const overCap = activePanelSize >= tuning.effectiveCensusCap;

  return {
    activePanelSize,
    censusCap: tuning.effectiveCensusCap,
    freeBeds,
    overflowRemaining,
    admissionsRemaining,
    willOpenOverflow: admissionsRemaining > 0 && freeBeds === 0,
    overCap,
    capWarning: overCap
      ? `You are at your census cap of ${tuning.effectiveCensusCap}. You can still admit from the ED, but the scheduler will not send new patients until you discharge back under the cap.`
      : null,
    blockedReason:
      admissionsRemaining === 0
        ? "Every inpatient bed, including overflow, is occupied. Discharge someone to take another admission."
        : null,
  };
}

/** First sentence of the opening line — the triage note an ED board shows. */
export function toOneLiner(template: t.CaseTemplateRow): string {
  if (template.chiefComplaint.trim()) {
    const demographics = [
      template.patientAgeYears ? `${template.patientAgeYears}` : null,
      template.patientSex,
    ]
      .filter(Boolean)
      .join(" ");
    return demographics
      ? `${demographics} — ${template.chiefComplaint}`
      : template.chiefComplaint;
  }

  const opening = template.admissionOpening.trim();
  const firstSentence = /^[^.!?]*[.!?]/.exec(opening)?.[0] ?? opening;
  return firstSentence.length > 160 ? `${firstSentence.slice(0, 157)}…` : firstSentence;
}

function matchesQuery(entry: EdBoardEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  // Every term must appear somewhere, so "af cardio" narrows rather than widens.
  const haystack = [
    entry.title,
    entry.diagnosis,
    entry.specialty,
    entry.topic,
    entry.oneLiner,
    entry.code,
  ]
    .join(" ")
    .toLowerCase();
  return needle.split(/\s+/).every((term) => haystack.includes(term));
}

/**
 * The waiting room, ordered deterministically by a seed on (user, date, case)
 * so the board is stable through a session but rotates day to day.
 *
 * By default this returns *every* admittable case, not a page of them. The UI
 * filters and paginates on the client, and if the server pre-trimmed the list
 * a search would silently only reach the trimmed slice — which is exactly the
 * bug that a learner searching for a specific diagnosis would hit. Pass
 * `limit` only when the caller genuinely wants a short board.
 */
export function listEdBoard(
  db: Db,
  options: { today: IsoDate; query?: string; limit?: number },
): EdBoardEntry[] {
  const query = options.query?.trim() ?? "";
  const onService = new Set(listActivePanel(db).map((p) => p.caseId));

  const entries = listCases(db)
    .filter((c) => c.status === "PUBLISHED")
    .map((template) => ({
      caseId: template.id,
      code: template.code,
      title: template.title,
      diagnosis: template.primaryDiagnosis,
      specialty: template.specialty,
      topic: template.topic,
      difficulty: template.difficulty,
      oneLiner: toOneLiner(template),
      bay: edBayFor(template.id, options.today),
      alreadyOnService: onService.has(template.id),
    }))
    .filter((entry) => !entry.alreadyOnService)
    .filter((entry) => matchesQuery(entry, query));

  const ordered = entries.sort(
    (a, b) =>
      seededUnit(USER_ID, options.today, b.caseId, "ed") -
        seededUnit(USER_ID, options.today, a.caseId, "ed") ||
      a.code.localeCompare(b.code),
  );

  return options.limit === undefined ? ordered : ordered.slice(0, options.limit);
}

const ED_BAYS = ["ED 1", "ED 2", "ED 3", "ED 4", "TRAUMA 1", "BOARDING 1", "HALL A"];

function edBayFor(caseId: string, today: IsoDate): string {
  const index = Math.floor(seededUnit(USER_ID, today, caseId, "bay") * ED_BAYS.length);
  return ED_BAYS[Math.min(index, ED_BAYS.length - 1)] as string;
}

export interface AdmitResult {
  ok: boolean;
  error?: string;
  patientId?: string;
  roomNumber?: string;
  patientName?: string;
  openedOverflow?: boolean;
}

/**
 * Admits a chosen case. Capacity is re-checked here rather than trusted from
 * the page, because the board may have been rendered before a discharge.
 */
export function admitFromEd(
  db: Db,
  caseId: string,
  today: IsoDate,
): AdmitResult {
  const template = db
    .select()
    .from(t.caseTemplate)
    .where(eq(t.caseTemplate.id, caseId))
    .get();
  if (!template) return { ok: false, error: "That case no longer exists." };
  if (template.status !== "PUBLISHED") {
    return { ok: false, error: "That case is not published, so it cannot be admitted." };
  }

  const duplicate = db
    .select({ id: t.patientInstance.id })
    .from(t.patientInstance)
    .where(
      and(
        eq(t.patientInstance.userId, USER_ID),
        eq(t.patientInstance.caseId, caseId),
        inArray(t.patientInstance.state, [...ACTIVE_PANEL_STATES]),
      ),
    )
    .get();
  if (duplicate) {
    return { ok: false, error: "That patient is already on your service." };
  }

  const capacity = getEdCapacity(db);
  if (capacity.admissionsRemaining === 0) {
    return { ok: false, error: capacity.blockedReason ?? "No capacity for another admission." };
  }

  const placement = findOrOpenRoom(db, "INPATIENT");
  if (!placement) {
    return { ok: false, error: "Every inpatient bed, including overflow, is occupied." };
  }

  const patientName = pickName(db, caseId, today);
  const patientId = createPatientInstance(db, {
    caseId,
    patientName,
    roomNumber: placement.room.roomNumber,
    roomId: placement.room.id,
    locationType: "INPATIENT",
    entryMode: "ADMISSION",
    assignedDate: today,
  });

  return {
    ok: true,
    patientId,
    patientName,
    roomNumber: placement.room.roomNumber,
    openedOverflow: placement.openedOverflow,
  };
}

/** Deterministic name that does not collide with anyone already on service. */
function pickName(db: Db, caseId: string, today: IsoDate): string {
  const used = new Set(listActivePanel(db).map((p) => p.patientName));
  const base = seededUnit(USER_ID, today, caseId, "ed-identity");
  for (let i = 0; i < DEMO_PATIENT_NAMES.length; i += 1) {
    const index = (Math.floor(base * DEMO_PATIENT_NAMES.length) + i) % DEMO_PATIENT_NAMES.length;
    const candidate = DEMO_PATIENT_NAMES[index] as string;
    if (!used.has(candidate)) return candidate;
  }
  return "Patient";
}
