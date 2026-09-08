/**
 * Progress aggregation for the Progress screen.
 *
 * Metrics are deliberately simple and explicitly labelled (spec §34): coverage
 * is "concepts introduced / total concepts" and nothing more clever.
 */

import { eq } from "drizzle-orm";
import { CURRICULUM_TREE } from "@/config/app";
import { MASTERY_LEVELS } from "@/config/scheduler";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { listConceptStates } from "@/domain/mastery";
import { listActivePanel, listAllPatients, listDischarged } from "@/domain/patients";
import { getProfile } from "@/domain/profile";
import { calculateDailyPatientTarget, describePace, type PaceSummary } from "@/domain/scheduler";
import { daysBetween, todayIso, type IsoDate } from "@/lib/date";

export interface TopicProgress {
  topic: string;
  conceptsTotal: number;
  conceptsIntroduced: number;
  conceptsMastered: number;
  casesAvailable: number;
  casesEncountered: number;
  /** Percentage of concepts introduced, 0-100. */
  coveragePercent: number;
}

export interface SpecialtyProgress {
  specialty: string;
  conceptsTotal: number;
  conceptsIntroduced: number;
  conceptsMastered: number;
  casesAvailable: number;
  casesEncountered: number;
  coveragePercent: number;
  topics: TopicProgress[];
}

export interface ProgressSummary {
  patientsCompleted: number;
  patientsOnService: number;
  patientsAssignedTotal: number;
  targetPatientCount: number;
  casesEncountered: number;
  casesAvailable: number;
  conceptsIntroduced: number;
  conceptsMastered: number;
  conceptsTotal: number;
  lecturesCompleted: number;
  lecturesAvailable: number;
  daysUntilStep3: number;
  pace: PaceSummary;
  specialties: SpecialtyProgress[];
}

export function buildProgressSummary(db: Db, today: IsoDate = todayIso()): ProgressSummary {
  const profile = getProfile(db);
  const concepts = db.select().from(t.concept).all();
  const cases = db.select().from(t.caseTemplate).all();
  const lectures = db.select().from(t.lecture).all();
  const states = new Map(listConceptStates(db).map((s) => [s.conceptId, s]));

  const allPatients = listAllPatients(db);
  const discharged = listDischarged(db);
  const onService = listActivePanel(db);
  const encounteredCaseIds = new Set(allPatients.map((p) => p.caseId));

  const lecturesCompleted = db
    .select()
    .from(t.userLectureState)
    .where(eq(t.userLectureState.status, "COMPLETED"))
    .all().length;

  const conceptsIntroduced = concepts.filter(
    (c) => (states.get(c.id)?.masteryLevel ?? 0) > MASTERY_LEVELS.UNSEEN,
  ).length;
  const conceptsMastered = concepts.filter(
    (c) => (states.get(c.id)?.masteryLevel ?? 0) >= MASTERY_LEVELS.MASTERED,
  ).length;

  /* --------------------------- specialty breakdown ------------------------ */
  const specialtyNames = Array.from(
    new Set([
      ...Object.keys(CURRICULUM_TREE),
      ...concepts.map((c) => c.specialty),
      ...cases.map((c) => c.specialty),
    ]),
  ).sort();

  const specialties: SpecialtyProgress[] = specialtyNames.map((specialty) => {
    const specialtyConcepts = concepts.filter((c) => c.specialty === specialty);
    const specialtyCases = cases.filter((c) => c.specialty === specialty);

    const topicNames = Array.from(
      new Set([
        ...(CURRICULUM_TREE[specialty] ?? []),
        ...specialtyConcepts.map((c) => c.topic),
        ...specialtyCases.map((c) => c.topic),
      ]),
    ).sort();

    const topics: TopicProgress[] = topicNames.map((topic) => {
      const topicConcepts = specialtyConcepts.filter((c) => c.topic === topic);
      const topicCases = specialtyCases.filter((c) => c.topic === topic);
      const introduced = topicConcepts.filter(
        (c) => (states.get(c.id)?.masteryLevel ?? 0) > MASTERY_LEVELS.UNSEEN,
      ).length;
      const mastered = topicConcepts.filter(
        (c) => (states.get(c.id)?.masteryLevel ?? 0) >= MASTERY_LEVELS.MASTERED,
      ).length;
      return {
        topic,
        conceptsTotal: topicConcepts.length,
        conceptsIntroduced: introduced,
        conceptsMastered: mastered,
        casesAvailable: topicCases.length,
        casesEncountered: topicCases.filter((c) => encounteredCaseIds.has(c.id)).length,
        coveragePercent: percent(introduced, topicConcepts.length),
      };
    });

    const introduced = specialtyConcepts.filter(
      (c) => (states.get(c.id)?.masteryLevel ?? 0) > MASTERY_LEVELS.UNSEEN,
    ).length;
    const mastered = specialtyConcepts.filter(
      (c) => (states.get(c.id)?.masteryLevel ?? 0) >= MASTERY_LEVELS.MASTERED,
    ).length;

    return {
      specialty,
      conceptsTotal: specialtyConcepts.length,
      conceptsIntroduced: introduced,
      conceptsMastered: mastered,
      casesAvailable: specialtyCases.length,
      casesEncountered: specialtyCases.filter((c) => encounteredCaseIds.has(c.id)).length,
      coveragePercent: percent(introduced, specialtyConcepts.length),
      topics: topics.filter((t2) => t2.conceptsTotal > 0 || t2.casesAvailable > 0),
    };
  });

  /* ---------------------------------- pace -------------------------------- */
  const pacing = calculateDailyPatientTarget({
    studyStartDate: profile?.studyStartDate ?? today,
    step3Date: profile?.step3Date ?? today,
    targetPatientCount: profile?.targetPatientCount ?? 0,
    patientsAssigned: allPatients.length,
    today,
  });

  return {
    patientsCompleted: discharged.length,
    patientsOnService: onService.length,
    patientsAssignedTotal: allPatients.length,
    targetPatientCount: profile?.targetPatientCount ?? 0,
    casesEncountered: encounteredCaseIds.size,
    casesAvailable: cases.length,
    conceptsIntroduced,
    conceptsMastered,
    conceptsTotal: concepts.length,
    lecturesCompleted,
    lecturesAvailable: lectures.length,
    daysUntilStep3: profile ? Math.max(0, daysBetween(today, profile.step3Date)) : 0,
    pace: describePace(pacing),
    specialties: specialties.filter((s) => s.conceptsTotal > 0 || s.casesAvailable > 0),
  };
}

function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/** Counts of today's outstanding work, for the Home screen. */
export interface TodaysWork {
  handoffNew: number;
  handoffExisting: number;
  roundsDue: number;
  admissionsWaiting: number;
  dischargesReady: number;
  lectureAvailable: boolean;
}
