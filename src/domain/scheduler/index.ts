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
import { INPATIENT_UNIT } from "@/config/hospital";
import { SCHEDULER_CONFIG } from "@/config/scheduler";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { DEMO_PATIENT_NAMES } from "@/content/demo/patientNames";
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
import { getBootstrapDate } from "./bootstrap";
import {
  countAvailableInpatientRooms,
  countPlaceableInpatientBeds,
  findOrOpenRoom,
  reconcilePatientRooms,
  seedHospitalRooms,
} from "@/domain/rooms";
import { getPreferences, resolveSchedulerTuning } from "@/domain/settings";
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
export * from "./bootstrap";

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
  /* --- capacity & eligibility diagnostics (spec §36) --------------------- */
  totalCaseCount: number;
  eligibleCaseCount: number;
  excludedCaseCount: number;
  availableBeds: number;
  censusCap: number;
  physicalRoomCap: number;
  /**
   * Set whenever zero patients were assigned. The whole point of §36 is that
   * "no patients today" is never unexplained, so this is populated even when
   * the outcome is perfectly reasonable.
   */
  blockedReason: string | null;
}

/**
 * Names the single binding constraint when nothing was assigned. Ordered from
 * most specific to most general so the answer is actionable rather than "some
 * combination of things".
 */
function explainNoAssignment(input: {
  assignedCount: number;
  requested: number;
  slots: number;
  freeRooms: number;
  eligibleCount: number;
  totalCases: number;
  dailyTarget: number;
  remainingPatients: number;
  censusCap: number;
  activePanelSize: number;
}): string | null {
  if (input.assignedCount > 0) return null;

  if (input.totalCases === 0) {
    return "The content library contains no cases. Seed the demo library or import a content pack.";
  }
  if (input.eligibleCount === 0) {
    return "Every published case is already on your service. Discharge someone, or add more content.";
  }
  if (input.freeRooms === 0) {
    return `Every inpatient room on ${INPATIENT_UNIT}, including overflow, is occupied.`;
  }
  if (input.slots === 0) {
    return `Your census cap of ${input.censusCap} is reached (${input.activePanelSize} active).`;
  }
  if (input.remainingPatients === 0) {
    return "You have reached your target patient count for this study plan.";
  }
  if (input.dailyTarget === 0) {
    return "Today's pacing target is zero — you are ahead of your study plan.";
  }
  if (input.requested === 0) {
    return "Capacity and pacing combined to request zero new patients today.";
  }
  return "No candidate case scored high enough to be assigned.";
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

/**
 * Reads back a persisted run.
 *
 * This crosses a version boundary — the row may have been written by an earlier
 * build with a different debug shape — so the essential fields are checked
 * before the record is handed to a UI that would otherwise crash reading them.
 * An unrecognisable record reads as "no run", which every caller already
 * handles.
 */
export function getSchedulerDebug(db: Db, date: IsoDate = todayIso()): SchedulerDebug | null {
  const run = getExistingRun(db, date);
  if (!run) return null;
  try {
    const parsed = JSON.parse(run.debugJson) as Partial<SchedulerDebug>;
    if (!parsed?.rotation?.name || !parsed.pacing || !Array.isArray(parsed.candidateScores)) {
      return null;
    }
    return parsed as SchedulerDebug;
  } catch {
    return null;
  }
}

/**
 * Deterministically picks a name for a new demo patient, avoiding collisions
 * with anyone currently on the panel. The *room* is no longer chosen here:
 * physical rooms come from the hospital map (spec §29), which is what makes
 * double-booking impossible.
 */
function assignPatientName(
  caseId: string,
  today: IsoDate,
  usedNames: Set<string>,
): string {
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
  return patientName;
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

  // The ward has to exist before anyone can be put in it, and a V1 panel has
  // no room ids at all — both are cheap and idempotent to settle here.
  seedHospitalRooms(db);
  reconcilePatientRooms(db);

  const tuning = resolveSchedulerTuning(getPreferences(db).scheduler);

  /* --- 1. Existing panel comes first ------------------------------------- */
  const panel = listActivePanel(db);
  const activePanelSize = panel.length;
  const freeRooms = countAvailableInpatientRooms(db);
  // Beds the ward could still produce, counting overflow it would open. A
  // learner who filled Floor 4 from the ED must not silently cost themselves
  // tomorrow's scheduled patient.
  const placeableBeds = countPlaceableInpatientBeds(db);
  // Two independent ceilings: the learner's census preference and the physical
  // ward. Whichever binds first is the one to report (spec §55).
  const slots = Math.min(
    availablePanelSlots(activePanelSize, tuning.effectiveCensusCap),
    placeableBeds,
  );
  if (slots === 0) {
    notes.push(
      placeableBeds === 0
        ? `Every inpatient room on ${INPATIENT_UNIT}, including overflow, is occupied; no new patients today.`
        : `Census is at your configured cap (${activePanelSize}/${tuning.effectiveCensusCap}); no new patients today.`,
    );
  }

  /* --- 2. Pacing ---------------------------------------------------------- */
  const allPatients = listAllPatients(db);
  const basePacing = calculateDailyPatientTarget({
    studyStartDate: profile.studyStartDate,
    step3Date: profile.step3Date,
    targetPatientCount: profile.targetPatientCount,
    patientsAssigned: allPatients.length,
    today,
  });

  // Workload intensity scales the finished target rather than any single term,
  // so "Light" stays light even when catch-up is also pushing.
  const pacing: PacingResult = {
    ...basePacing,
    dailyTarget: Math.min(
      Math.max(
        basePacing.dailyTarget === 0 ? 0 : 1,
        Math.round(basePacing.dailyTarget * tuning.workloadMultiplier),
      ),
      SCHEDULER_CONFIG.MAX_NEW_PATIENTS_PER_DAY,
      basePacing.remainingPatients,
    ),
  };
  if (tuning.workloadMultiplier !== 1) {
    notes.push(
      `Workload intensity adjusted today's target from ${basePacing.dailyTarget} to ${pacing.dailyTarget}.`,
    );
  }

  // The starter service was created today by the bootstrap. Adding more on top
  // of it would fill the ward on day one, so this run assigns nothing — but it
  // still runs, so the day still gets a teaching conference and a debug record.
  const bootstrappedToday = getBootstrapDate(db) === today;
  if (bootstrappedToday) {
    notes.push(
      "Your starter service was created today, so no additional patients were assigned. Normal pacing resumes tomorrow.",
    );
  }

  // First run: guarantee enough of a panel that the learner sees the whole
  // workflow immediately (spec §42) rather than a single handoff patient.
  const isFirstRun = allPatients.length === 0;
  const desired = isFirstRun
    ? Math.max(pacing.dailyTarget, FIRST_RUN_PATIENT_COUNT)
    : pacing.dailyTarget;
  const newPatientsRequested = bootstrappedToday ? 0 : Math.min(desired, slots);
  if (isFirstRun && !bootstrappedToday) {
    notes.push(
      `First run: seeding a starter panel of ${newPatientsRequested} patient(s) so handoff, rounds and admission are all reachable.`,
    );
  }
  if (pacing.catchUpAdjustment > 0) {
    notes.push(
      `Catch-up active: ${pacing.deficit.toFixed(1)} patient deficit spread over ${tuning.catchUpSpreadDays} days.`,
    );
  }

  /* --- 3. Score candidates ------------------------------------------------ */
  const cases = listCases(db);
  // Only publishable content may reach a learner (spec §7): drafts, cases in
  // review and archived cases are never scheduled.
  const publishedCases = cases.filter((c) => c.status === "PUBLISHED");
  const candidates: CandidateCase[] = publishedCases.map((c) => ({
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
    rotationRelevanceWeight: tuning.rotationRelevanceWeight,
  });

  const unpublishedCount = cases.length - publishedCases.length;
  if (unpublishedCount > 0) {
    notes.push(
      `${unpublishedCount} case(s) excluded because they are not published (draft, review or archived).`,
    );
  }
  if (eligible.length < newPatientsRequested) {
    notes.push(
      `Only ${eligible.length} case(s) eligible today (cases already on service are excluded).`,
    );
  }

  /* --- 4. Assign ---------------------------------------------------------- */
  const masteryByConcept = new Map(listConceptStates(db).map((s) => [s.conceptId, s.masteryLevel]));
  const usedNames = new Set(panel.map((p) => p.patientName));
  const reservedRooms = new Set<string>();

  const assigned: AssignedPatientDebug[] = [];
  const newPatientIds: string[] = [];

  for (const score of ranked.slice(0, newPatientsRequested)) {
    const candidate = eligible.find((c) => c.id === score.caseId);
    if (!candidate) continue;

    const placement = findOrOpenRoom(db, "INPATIENT", reservedRooms);
    if (!placement) {
      notes.push("Ran out of inpatient rooms partway through today's assignment.");
      break;
    }
    const room = placement.room;
    reservedRooms.add(room.id);
    if (placement.openedOverflow) {
      notes.push(
        `Floor 4 was full, so overflow bed ${room.roomNumber} was opened for this patient.`,
      );
    }

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

    const patientName = assignPatientName(candidate.id, today, usedNames);
    const patientId = createPatientInstance(db, {
      caseId: candidate.id,
      patientName,
      roomNumber: room.roomNumber,
      roomId: room.id,
      locationType: "INPATIENT",
      entryMode: decision.entryMode,
      assignedDate: today,
    });

    newPatientIds.push(patientId);
    assigned.push({
      caseId: candidate.id,
      code: candidate.code,
      title: candidate.title,
      patientName,
      roomNumber: room.roomNumber,
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
  const blockedReason = bootstrappedToday
    ? "Your starter service was created today; normal pacing resumes tomorrow."
    : explainNoAssignment({
        assignedCount: assigned.length,
        requested: newPatientsRequested,
        slots,
        freeRooms: placeableBeds,
        eligibleCount: eligible.length,
        totalCases: cases.length,
        dailyTarget: pacing.dailyTarget,
        remainingPatients: pacing.remainingPatients,
        censusCap: tuning.effectiveCensusCap,
        activePanelSize,
      });

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
    totalCaseCount: cases.length,
    eligibleCaseCount: eligible.length,
    excludedCaseCount: cases.length - eligible.length,
    availableBeds: freeRooms,
    censusCap: tuning.effectiveCensusCap,
    physicalRoomCap: tuning.physicalRoomCap,
    blockedReason,
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
    totalCaseCount: 0,
    eligibleCaseCount: 0,
    excludedCaseCount: 0,
    availableBeds: 0,
    censusCap: 0,
    physicalRoomCap: 0,
    blockedReason: null,
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
