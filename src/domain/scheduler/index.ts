/**
 * The daily scheduler.
 *
 * Contract (spec §24): it never generates content, only chooses from what
 * exists; it is deterministic given (user, date, database state); and every
 * decision it makes is written to `scheduler_run.debugJson` so the developer
 * inspector shows exactly what happened rather than a reconstruction.
 *
 * It runs at most once per study date. Re-opening the app the same day reads
 * the persisted run instead of assigning more patients.
 */

import { and, eq } from "drizzle-orm";
import { SCHEDULER_CONFIG } from "@/config/scheduler";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { DEMO_PATIENT_NAMES, DEMO_ROOM_MAX, DEMO_ROOM_MIN } from "@/content/demo/patientNames";
import type { EntryMode } from "@/domain/constants";
import { getCaseConceptIds, listCases } from "@/domain/cases";
import { getRecentLectureConceptIds, markLectureScheduled, selectDailyLecture } from "@/domain/lectures";
import { getDueConcepts, getWeakConcepts, listConceptStates } from "@/domain/mastery";
import {
  countActivePanel,
  createPatientInstance,
  listActivePanel,
  listAllPatients,
} from "@/domain/patients";
import { getCurrentRotation, getProfile, USER_ID } from "@/domain/profile";
import { nowIso, todayIso, type IsoDate } from "@/lib/date";
import { seededUnit } from "@/lib/seededRandom";
import { chooseEntryMode, type EntryModeDecision } from "./entryMode";
import {
  availablePanelSlots,
  calculateDailyPatientTarget,
  type PacingResult,
} from "./pacing";
import { rankCandidates, type CandidateCase, type ScoreBreakdown } from "./scoring";

/** Starter panel size on a cold start, so every mode is reachable on day one. */
const FIRST_RUN_PATIENT_COUNT = 3;

export * from "./pacing";
export * from "./scoring";
export * from "./entryMode";

export interface AssignedPatientDebug {
  caseId: string;
  code: string;
  title: string;
  patientName: string;
  roomNumber: string;
  entryMode: EntryMode;
  entryModeReason: string;
  score: number;
}

/** Everything the developer inspector needs, captured at decision time. */
export interface SchedulerDebug {
  runDate: IsoDate;
  rotation: { name: string; specialty: string; isOffService: boolean };
  pacing: PacingResult;
  activePanelSize: number;
  availableSlots: number;
  newPatientsRequested: number;
  newPatientsAssigned: number;
  candidateScores: ScoreBreakdown[];
  assigned: AssignedPatientDebug[];
  lecture: { lectureId: string | null; reason: string; priority: number };
  dueConceptCount: number;
  weakConceptCount: number;
  recentLectureConceptCount: number;
  notes: string[];
}

export interface SchedulerRunResult {
  ranNow: boolean;
  debug: SchedulerDebug;
  newPatientIds: string[];
  lectureId: string | null;
}

function getExistingRun(db: Db, date: IsoDate): t.SchedulerRunRow | null {
  return (
    db
      .select()
      .from(t.schedulerRun)
      .where(and(eq(t.schedulerRun.userId, USER_ID), eq(t.schedulerRun.runDate, date)))
      .get() ?? null
  );
}

export function getSchedulerDebug(db: Db, date: IsoDate = todayIso()): SchedulerDebug | null {
  const run = getExistingRun(db, date);
  if (!run) return null;
  try {
    return JSON.parse(run.debugJson) as SchedulerDebug;
  } catch {
    return null;
  }
}

/**
 * Deterministically picks a name and room for a new demo patient, avoiding
 * collisions with anyone currently on the panel.
 */
function assignIdentity(
  db: Db,
  caseId: string,
  today: IsoDate,
  usedNames: Set<string>,
  usedRooms: Set<string>,
): { patientName: string; roomNumber: string } {
  const base = seededUnit(USER_ID, today, caseId, "identity");

  let patientName = DEMO_PATIENT_NAMES[0] ?? "Patient";
  for (let i = 0; i < DEMO_PATIENT_NAMES.length; i += 1) {
    const index = (Math.floor(base * DEMO_PATIENT_NAMES.length) + i) % DEMO_PATIENT_NAMES.length;
    const candidate = DEMO_PATIENT_NAMES[index] as string;
    if (!usedNames.has(candidate)) {
      patientName = candidate;
      break;
    }
  }
  usedNames.add(patientName);

  const span = DEMO_ROOM_MAX - DEMO_ROOM_MIN + 1;
  let roomNumber = String(DEMO_ROOM_MIN);
  for (let i = 0; i < span; i += 1) {
    const candidate = String(DEMO_ROOM_MIN + ((Math.floor(base * span) + i) % span));
    if (!usedRooms.has(candidate)) {
      roomNumber = candidate;
      break;
    }
  }
  usedRooms.add(roomNumber);

  return { patientName, roomNumber };
}

/**
 * Runs the scheduler for `today` if it has not already run.
 *
 * Order of operations (spec §27): load the existing panel first, work out how
 * much capacity is left, and only then consider adding new patients.
 */
export function runDailyScheduler(
  db: Db,
  options: { today?: IsoDate; force?: boolean } = {},
): SchedulerRunResult {
  const today = options.today ?? todayIso();
  const notes: string[] = [];

  const existing = getExistingRun(db, today);
  if (existing && !options.force) {
    const debug = getSchedulerDebug(db, today);
    return {
      ranNow: false,
      debug: debug ?? emptyDebug(db, today),
      newPatientIds: [],
      lectureId: existing.lectureId,
    };
  }

  const profile = getProfile(db);
  if (!profile) {
    const debug = emptyDebug(db, today);
    debug.notes.push("No profile yet — onboarding has not been completed.");
    return { ranNow: false, debug, newPatientIds: [], lectureId: null };
  }

  const rotation = getCurrentRotation(db, today);

  /* --- 1. Existing panel comes first ------------------------------------- */
  const panel = listActivePanel(db);
  const activePanelSize = panel.length;
  const slots = availablePanelSlots(activePanelSize);
  if (slots === 0) {
    notes.push(
      `Panel is at capacity (${activePanelSize}/${SCHEDULER_CONFIG.MAX_ACTIVE_PANEL_SIZE}); no new patients today.`,
    );
  }

  /* --- 2. Pacing ---------------------------------------------------------- */
  const allPatients = listAllPatients(db);
  const pacing = calculateDailyPatientTarget({
    studyStartDate: profile.studyStartDate,
    step3Date: profile.step3Date,
    targetPatientCount: profile.targetPatientCount,
    patientsAssigned: allPatients.length,
    today,
  });

  // First run: guarantee enough of a panel that the learner sees the whole
  // workflow immediately (spec §42) rather than a single handoff patient.
  const isFirstRun = allPatients.length === 0;
  const desired = isFirstRun
    ? Math.max(pacing.dailyTarget, FIRST_RUN_PATIENT_COUNT)
    : pacing.dailyTarget;
  const newPatientsRequested = Math.min(desired, slots);
  if (isFirstRun) {
    notes.push(
      `First run: seeding a starter panel of ${newPatientsRequested} patient(s) so handoff, rounds and admission are all reachable.`,
    );
  }
  if (pacing.catchUpAdjustment > 0) {
    notes.push(
      `Catch-up active: ${pacing.deficit.toFixed(1)} patient deficit spread over ${SCHEDULER_CONFIG.CATCHUP_SPREAD_DAYS} days.`,
    );
  }

  /* --- 3. Score candidates ------------------------------------------------ */
  const cases = listCases(db);
  const candidates: CandidateCase[] = cases.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    specialty: c.specialty,
    topic: c.topic,
    step3Importance: c.step3Importance,
    conceptIds: getCaseConceptIds(db, c.id),
  }));

  const activeCaseIds = new Set(panel.map((p) => p.caseId));
  const topicCaseCounts = new Map<string, number>();
  const caseById = new Map(cases.map((c) => [c.id, c]));
  const lastAssignedByCase = new Map<string, IsoDate>();
  for (const patient of allPatients) {
    const template = caseById.get(patient.caseId);
    if (template) {
      topicCaseCounts.set(template.topic, (topicCaseCounts.get(template.topic) ?? 0) + 1);
    }
    const prior = lastAssignedByCase.get(patient.caseId);
    if (!prior || patient.assignedDate > prior) {
      lastAssignedByCase.set(patient.caseId, patient.assignedDate);
    }
  }

  const dueConceptIds = new Set(getDueConcepts(db, today));
  const weakConceptIds = new Set(getWeakConcepts(db));
  const recentLectureConceptIds = getRecentLectureConceptIds(db, today);

  const eligible = candidates.filter((c) => !activeCaseIds.has(c.id));
  const ranked = rankCandidates(eligible, {
    userId: USER_ID,
    today,
    rotationSpecialty: rotation.specialty,
    dueConceptIds,
    weakConceptIds,
    topicCaseCounts,
    recentLectureConceptIds,
    lastAssignedByCase,
  });

  if (eligible.length < newPatientsRequested) {
    notes.push(
      `Only ${eligible.length} case(s) eligible today (cases already on service are excluded).`,
    );
  }

  /* --- 4. Assign ---------------------------------------------------------- */
  const masteryByConcept = new Map(listConceptStates(db).map((s) => [s.conceptId, s.masteryLevel]));
  const usedNames = new Set(panel.map((p) => p.patientName));
  const usedRooms = new Set(panel.map((p) => p.roomNumber));

  const assigned: AssignedPatientDebug[] = [];
  const newPatientIds: string[] = [];

  for (const score of ranked.slice(0, newPatientsRequested)) {
    const candidate = eligible.find((c) => c.id === score.caseId);
    if (!candidate) continue;

    let decision: EntryModeDecision = chooseEntryMode({
      conceptMasteryLevels: candidate.conceptIds.map((id) => masteryByConcept.get(id) ?? 0),
      alternationIndex: assigned.length,
    });

    // On a cold start every concept is unseen, so chooseEntryMode would make
    // every patient a handoff. Force the last starter patient to be an active
    // admission so the learner can exercise that mode on day one.
    if (isFirstRun && assigned.length === newPatientsRequested - 1 && newPatientsRequested > 1) {
      decision = {
        ...decision,
        entryMode: "ADMISSION",
        reason:
          "First run: one starter patient arrives as an active admission so the full workflow is reachable immediately.",
      };
    }

    const identity = assignIdentity(db, candidate.id, today, usedNames, usedRooms);
    const patientId = createPatientInstance(db, {
      caseId: candidate.id,
      patientName: identity.patientName,
      roomNumber: identity.roomNumber,
      entryMode: decision.entryMode,
      assignedDate: today,
    });

    newPatientIds.push(patientId);
    assigned.push({
      caseId: candidate.id,
      code: candidate.code,
      title: candidate.title,
      patientName: identity.patientName,
      roomNumber: identity.roomNumber,
      entryMode: decision.entryMode,
      entryModeReason: decision.reason,
      score: score.total,
    });
  }

  /* --- 5. Daily lecture --------------------------------------------------- */
  const recentPatientTopics = panel
    .map((p) => caseById.get(p.caseId)?.topic)
    .filter((topic): topic is string => Boolean(topic));

  const lecture = selectDailyLecture(db, {
    rotationSpecialty: rotation.specialty,
    recentPatientTopics,
    today,
  });
  if (lecture.lectureId) markLectureScheduled(db, lecture.lectureId, today);

  /* --- 6. Persist the run ------------------------------------------------- */
  const debug: SchedulerDebug = {
    runDate: today,
    rotation: {
      name: rotation.name,
      specialty: rotation.specialty,
      isOffService: rotation.isOffService,
    },
    pacing,
    activePanelSize,
    availableSlots: slots,
    newPatientsRequested,
    newPatientsAssigned: assigned.length,
    candidateScores: ranked.slice(0, 25),
    assigned,
    lecture,
    dueConceptCount: dueConceptIds.size,
    weakConceptCount: weakConceptIds.size,
    recentLectureConceptCount: recentLectureConceptIds.size,
    notes,
  };

  db.insert(t.schedulerRun)
    .values({
      id: `run_${USER_ID}_${today}`,
      userId: USER_ID,
      runDate: today,
      debugJson: JSON.stringify(debug),
      newPatientsAssigned: assigned.length,
      lectureId: lecture.lectureId,
      createdAt: nowIso(),
    })
    .onConflictDoUpdate({
      target: [t.schedulerRun.userId, t.schedulerRun.runDate],
      set: {
        debugJson: JSON.stringify(debug),
        newPatientsAssigned: assigned.length,
        lectureId: lecture.lectureId,
      },
    })
    .run();

  return { ranNow: true, debug, newPatientIds, lectureId: lecture.lectureId };
}

function emptyDebug(db: Db, today: IsoDate): SchedulerDebug {
  const rotation = getCurrentRotation(db, today);
  return {
    runDate: today,
    rotation: {
      name: rotation.name,
      specialty: rotation.specialty,
      isOffService: rotation.isOffService,
    },
    pacing: {
      daysRemaining: 0,
      windowDays: 0,
      fractionElapsed: 0,
      expectedProgress: 0,
      actualProgress: 0,
      remainingPatients: 0,
      baselineRate: 0,
      deficit: 0,
      catchUpAdjustment: 0,
      rawTarget: 0,
      dailyTarget: 0,
    },
    activePanelSize: countActivePanel(db),
    availableSlots: 0,
    newPatientsRequested: 0,
    newPatientsAssigned: 0,
    candidateScores: [],
    assigned: [],
    lecture: { lectureId: null, reason: "", priority: 0 },
    dueConceptCount: 0,
    weakConceptCount: 0,
    recentLectureConceptCount: 0,
    notes: [],
  };
}

/**
 * True when the learner has been away long enough to warrant the neutral
 * "welcome back" message (spec §58). Never punitive.
 */
export function daysSinceLastSchedulerRun(db: Db, today: IsoDate = todayIso()): number | null {
  const rows = db
    .select({ runDate: t.schedulerRun.runDate })
    .from(t.schedulerRun)
    .where(eq(t.schedulerRun.userId, USER_ID))
    .all()
    .map((r) => r.runDate)
    .filter((d) => d < today)
    .sort();
  const last = rows[rows.length - 1];
  if (!last) return null;
  const [y, m, d] = last.split("-").map(Number);
  const [y2, m2, d2] = today.split("-").map(Number);
  const a = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
  const b = new Date(y2 ?? 1970, (m2 ?? 1) - 1, d2 ?? 1).getTime();
  return Math.round((b - a) / 86_400_000);
}
