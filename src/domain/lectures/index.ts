/**
 * Teaching Conference: lecture content, completion, and daily selection.
 *
 * Lectures are a parallel curriculum that does not compete with patient pacing
 * (spec §32). Completing one introduces its concepts and boosts related cases
 * for the next few days (spec §33).
 */

import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { SCHEDULER_CONFIG, LECTURE_PRIORITY } from "@/config/scheduler";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { LECTURE_TYPE_LABELS, type LectureStatus, type LectureType } from "@/domain/constants";
import { introduceConcepts, listConceptStates } from "@/domain/mastery";
import { USER_ID } from "@/domain/profile";
import { recordStudyEvent } from "@/domain/patients";
import { addDays, nowIso, todayIso, type IsoDate } from "@/lib/date";
import { seededUnit } from "@/lib/seededRandom";
import { MASTERY_LEVELS } from "@/config/scheduler";

export interface LectureView {
  id: string;
  code: string;
  title: string;
  specialty: string;
  topic: string;
  lectureType: LectureType;
  lectureTypeLabel: string;
  summary: string;
  sections: string[];
  keyPoints: string[];
  estimatedMinutes: number;
  status: LectureStatus;
  completedAt: string | null;
}

export function parseLecture(row: t.LectureRow, status: LectureStatus = "NOT_STARTED", completedAt: string | null = null): LectureView {
  const parseArray = (json: string): string[] => {
    try {
      const parsed: unknown = JSON.parse(json);
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
      return [];
    }
  };
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    specialty: row.specialty,
    topic: row.topic,
    lectureType: row.lectureType as LectureType,
    lectureTypeLabel: LECTURE_TYPE_LABELS[row.lectureType as LectureType] ?? "Teaching Conference",
    summary: row.summary,
    sections: parseArray(row.audioScript),
    keyPoints: parseArray(row.keyPointsJson),
    estimatedMinutes: row.estimatedMinutes,
    status,
    completedAt,
  };
}

export function listLectures(db: Db): LectureView[] {
  const states = new Map(
    db
      .select()
      .from(t.userLectureState)
      .where(eq(t.userLectureState.userId, USER_ID))
      .all()
      .map((s) => [s.lectureId, s]),
  );
  return db
    .select()
    .from(t.lecture)
    .all()
    .map((row) => {
      const state = states.get(row.id);
      return parseLecture(
        row,
        (state?.status as LectureStatus) ?? "NOT_STARTED",
        state?.completedAt ?? null,
      );
    });
}

export function getLecture(db: Db, lectureId: string): LectureView | null {
  const row = db.select().from(t.lecture).where(eq(t.lecture.id, lectureId)).get();
  if (!row) return null;
  const state = db
    .select()
    .from(t.userLectureState)
    .where(
      and(eq(t.userLectureState.userId, USER_ID), eq(t.userLectureState.lectureId, lectureId)),
    )
    .get();
  return parseLecture(row, (state?.status as LectureStatus) ?? "NOT_STARTED", state?.completedAt ?? null);
}

export function getLectureConceptIds(db: Db, lectureId: string): string[] {
  return db
    .select({ conceptId: t.lectureConcept.conceptId })
    .from(t.lectureConcept)
    .where(eq(t.lectureConcept.lectureId, lectureId))
    .all()
    .map((r) => r.conceptId);
}

function upsertLectureState(
  db: Db,
  lectureId: string,
  patch: Partial<t.UserLectureStateRow>,
): void {
  db.insert(t.userLectureState)
    .values({
      id: `uls_${USER_ID}_${lectureId}`,
      userId: USER_ID,
      lectureId,
      status: patch.status ?? "NOT_STARTED",
      startedAt: patch.startedAt ?? null,
      completedAt: patch.completedAt ?? null,
      scheduledDate: patch.scheduledDate ?? null,
    })
    .onConflictDoUpdate({
      target: [t.userLectureState.userId, t.userLectureState.lectureId],
      set: patch,
    })
    .run();
}

export function startLecture(db: Db, lectureId: string, today: IsoDate = todayIso()): void {
  const existing = db
    .select()
    .from(t.userLectureState)
    .where(
      and(eq(t.userLectureState.userId, USER_ID), eq(t.userLectureState.lectureId, lectureId)),
    )
    .get();
  if (existing?.status === "COMPLETED") return;
  upsertLectureState(db, lectureId, { status: "IN_PROGRESS", startedAt: nowIso() });
  recordStudyEvent(db, { eventType: "LECTURE_STARTED", lectureId, date: today });
}

/**
 * Marks a lecture complete. Its concepts are introduced (not graded), which is
 * what later makes related cases score higher.
 */
export function completeLecture(db: Db, lectureId: string, today: IsoDate = todayIso()): void {
  upsertLectureState(db, lectureId, { status: "COMPLETED", completedAt: nowIso() });
  const conceptIds = getLectureConceptIds(db, lectureId);
  introduceConcepts(db, conceptIds, today);
  recordStudyEvent(db, {
    eventType: "LECTURE_COMPLETED",
    lectureId,
    metadata: { conceptCount: conceptIds.length },
    date: today,
  });
}

/**
 * Concepts taught by a lecture completed inside the boost window. Cases that
 * share these concepts receive `recentLectureBonus` (spec §33).
 */
export function getRecentLectureConceptIds(db: Db, today: IsoDate = todayIso()): Set<string> {
  const since = addDays(today, -SCHEDULER_CONFIG.RECENT_LECTURE_WINDOW_DAYS);
  const recent = db
    .select()
    .from(t.userLectureState)
    .where(
      and(
        eq(t.userLectureState.userId, USER_ID),
        eq(t.userLectureState.status, "COMPLETED"),
        gte(t.userLectureState.completedAt, since),
      ),
    )
    .all();
  if (recent.length === 0) return new Set();
  const ids = db
    .select({ conceptId: t.lectureConcept.conceptId })
    .from(t.lectureConcept)
    .where(
      inArray(
        t.lectureConcept.lectureId,
        recent.map((r) => r.lectureId),
      ),
    )
    .all()
    .map((r) => r.conceptId);
  return new Set(ids);
}

export interface LectureSelection {
  lectureId: string | null;
  reason: string;
  priority: number;
}

/**
 * Chooses today's teaching conference (spec §32).
 *
 * Priority order: current rotation topic, then an untaught topic, then a weak
 * topic, then a topic matching a recent patient, then review. Ties are broken
 * with a seeded value so the same day always yields the same lecture.
 */
export function selectDailyLecture(
  db: Db,
  options: {
    rotationSpecialty: string;
    recentPatientTopics: readonly string[];
    today: IsoDate;
  },
): LectureSelection {
  const lectures = listLectures(db);
  const incomplete = lectures.filter((l) => l.status !== "COMPLETED");
  if (incomplete.length === 0) {
    // Everything is done: offer the oldest completed lecture as review.
    const review = [...lectures].sort((a, b) =>
      (a.completedAt ?? "").localeCompare(b.completedAt ?? ""),
    )[0];
    return review
      ? { lectureId: review.id, reason: "Review — all conferences completed.", priority: LECTURE_PRIORITY.review }
      : { lectureId: null, reason: "No lectures available.", priority: LECTURE_PRIORITY.review };
  }

  const conceptStates = new Map(listConceptStates(db).map((s) => [s.conceptId, s]));
  const weakTopics = new Set<string>();
  const introducedTopics = new Set<string>();
  for (const lecture of lectures) {
    const conceptIds = getLectureConceptIds(db, lecture.id);
    for (const conceptId of conceptIds) {
      const state = conceptStates.get(conceptId);
      if (!state || state.masteryLevel <= MASTERY_LEVELS.UNSEEN) continue;
      introducedTopics.add(lecture.topic);
      if (state.masteryLevel <= MASTERY_LEVELS.WEAK) weakTopics.add(lecture.topic);
    }
  }
  const recentTopics = new Set(options.recentPatientTopics);

  const scored = incomplete.map((lecture) => {
    let priority: number = LECTURE_PRIORITY.review;
    let reason = "Rounding out Step 3 coverage.";
    if (lecture.specialty === options.rotationSpecialty) {
      priority = LECTURE_PRIORITY.currentRotationTopic;
      reason = `Matches the current rotation (${options.rotationSpecialty}).`;
    } else if (!introducedTopics.has(lecture.topic)) {
      priority = LECTURE_PRIORITY.uintroducedTopic;
      reason = `Introduces a topic not yet covered (${lecture.topic}).`;
    } else if (weakTopics.has(lecture.topic)) {
      priority = LECTURE_PRIORITY.weakTopic;
      reason = `Reinforces a weak topic (${lecture.topic}).`;
    } else if (recentTopics.has(lecture.topic)) {
      priority = LECTURE_PRIORITY.recentPatientTopic;
      reason = `Relates to a patient currently on service (${lecture.topic}).`;
    }
    const tiebreak = seededUnit(USER_ID, options.today, lecture.id);
    return { lecture, priority, reason, tiebreak };
  });

  scored.sort((a, b) => a.priority - b.priority || b.tiebreak - a.tiebreak);
  const best = scored[0];
  if (!best) return { lectureId: null, reason: "No lectures available.", priority: LECTURE_PRIORITY.review };

  return { lectureId: best.lecture.id, reason: best.reason, priority: best.priority };
}

export function markLectureScheduled(db: Db, lectureId: string, date: IsoDate): void {
  upsertLectureState(db, lectureId, { scheduledDate: date });
}

void desc;
