/**
 * Concept mastery and spaced repetition.
 *
 * Deliberately transparent (spec §22): mastery moves one level per graded
 * response, and the next review date comes from a lookup table in
 * config/scheduler.ts. No hidden psychometrics.
 */

import { and, eq, inArray, lte, or, isNull } from "drizzle-orm";
import {
  INCORRECT_REVIEW_INTERVAL_DAYS,
  MASTERY_LEVELS,
  MAX_MASTERY,
  MIN_MASTERY_AFTER_INTRODUCTION,
  SPACED_REPETITION_INTERVALS,
} from "@/config/scheduler";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { USER_ID } from "@/domain/profile";
import { getReviewIntervals } from "@/domain/settings";
import { addDays, nowIso, todayIso, type IsoDate } from "@/lib/date";

export function getConceptState(
  db: Db,
  conceptId: string,
): t.UserConceptStateRow | null {
  return (
    db
      .select()
      .from(t.userConceptState)
      .where(
        and(
          eq(t.userConceptState.userId, USER_ID),
          eq(t.userConceptState.conceptId, conceptId),
        ),
      )
      .get() ?? null
  );
}

export function listConceptStates(db: Db): t.UserConceptStateRow[] {
  return db
    .select()
    .from(t.userConceptState)
    .where(eq(t.userConceptState.userId, USER_ID))
    .all();
}

function ensureState(db: Db, conceptId: string): t.UserConceptStateRow {
  const existing = getConceptState(db, conceptId);
  if (existing) return existing;
  db.insert(t.userConceptState)
    .values({
      id: `ucs_${USER_ID}_${conceptId}`,
      userId: USER_ID,
      conceptId,
      exposures: 0,
      correctCount: 0,
      incorrectCount: 0,
      consecutiveCorrect: 0,
      masteryLevel: MASTERY_LEVELS.UNSEEN,
      lastSeenAt: null,
      nextDueAt: null,
    })
    .onConflictDoNothing()
    .run();
  return getConceptState(db, conceptId) as t.UserConceptStateRow;
}

/**
 * Days until a concept at `masteryLevel` should be reviewed again.
 *
 * The schedule is a learner preference, so callers that have a database hand in
 * the resolved map; the shipped defaults are used otherwise. Level 0 has no
 * interval at all — an unseen concept needs an introduction, not a review.
 */
export function intervalForMastery(
  masteryLevel: number,
  intervals: Record<number, number | null> = SPACED_REPETITION_INTERVALS,
): number | null {
  return intervals[masteryLevel] ?? null;
}

/**
 * Pure mastery transition, exported for tests and for the developer inspector.
 * Correct: +1 level (capped). Incorrect: -1 level, floored at INTRODUCED once
 * the concept has been seen at all.
 */
export function nextMasteryLevel(current: number, correct: boolean): number {
  if (correct) return Math.min(MAX_MASTERY, current + 1);
  if (current <= MASTERY_LEVELS.UNSEEN) return MASTERY_LEVELS.INTRODUCED;
  return Math.max(MIN_MASTERY_AFTER_INTRODUCTION, current - 1);
}

export interface MasteryUpdate {
  conceptId: string;
  previousLevel: number;
  newLevel: number;
  nextDueAt: IsoDate | null;
}

/** Records a graded response against a concept and reschedules it. */
export function updateConceptMastery(
  db: Db,
  conceptId: string,
  correct: boolean,
  today: IsoDate = todayIso(),
): MasteryUpdate {
  const state = ensureState(db, conceptId);
  const previousLevel = state.masteryLevel;
  const newLevel = nextMasteryLevel(previousLevel, correct);

  // An incorrect answer always comes back tomorrow, whatever the level says.
  const interval = correct
    ? intervalForMastery(newLevel, getReviewIntervals(db))
    : INCORRECT_REVIEW_INTERVAL_DAYS;
  const nextDueAt = interval === null ? null : addDays(today, interval);

  db.update(t.userConceptState)
    .set({
      exposures: state.exposures + 1,
      correctCount: state.correctCount + (correct ? 1 : 0),
      incorrectCount: state.incorrectCount + (correct ? 0 : 1),
      consecutiveCorrect: correct ? state.consecutiveCorrect + 1 : 0,
      masteryLevel: newLevel,
      lastSeenAt: nowIso(),
      nextDueAt,
    })
    .where(eq(t.userConceptState.id, state.id))
    .run();

  return { conceptId, previousLevel, newLevel, nextDueAt };
}

/**
 * Marks concepts as introduced without grading them — used by handoff
 * acceptance and lecture completion, which teach rather than test.
 */
export function introduceConcepts(
  db: Db,
  conceptIds: readonly string[],
  today: IsoDate = todayIso(),
): void {
  for (const conceptId of conceptIds) {
    const state = ensureState(db, conceptId);
    if (state.masteryLevel > MASTERY_LEVELS.UNSEEN) {
      // Already known: just record the exposure, keep the existing schedule.
      db.update(t.userConceptState)
        .set({ exposures: state.exposures + 1, lastSeenAt: nowIso() })
        .where(eq(t.userConceptState.id, state.id))
        .run();
      continue;
    }
    const interval = intervalForMastery(MASTERY_LEVELS.INTRODUCED);
    db.update(t.userConceptState)
      .set({
        exposures: state.exposures + 1,
        masteryLevel: MASTERY_LEVELS.INTRODUCED,
        lastSeenAt: nowIso(),
        nextDueAt: interval === null ? null : addDays(today, interval),
      })
      .where(eq(t.userConceptState.id, state.id))
      .run();
  }
}

/** Concept ids due for review on or before `today`. */
export function getDueConcepts(db: Db, today: IsoDate = todayIso()): string[] {
  return db
    .select({ conceptId: t.userConceptState.conceptId })
    .from(t.userConceptState)
    .where(
      and(
        eq(t.userConceptState.userId, USER_ID),
        lte(t.userConceptState.nextDueAt, today),
      ),
    )
    .all()
    .map((r) => r.conceptId);
}

/** Concept ids the learner has answered incorrectly more than correctly. */
export function getWeakConcepts(db: Db): string[] {
  return listConceptStates(db)
    .filter((s) => s.incorrectCount > 0 && s.masteryLevel <= MASTERY_LEVELS.WEAK)
    .map((s) => s.conceptId);
}

/** Concept ids with no recorded exposure at all. */
export function getUnseenConceptIds(db: Db): string[] {
  const seen = new Set(
    listConceptStates(db)
      .filter((s) => s.masteryLevel > MASTERY_LEVELS.UNSEEN)
      .map((s) => s.conceptId),
  );
  return db
    .select({ id: t.concept.id })
    .from(t.concept)
    .all()
    .filter((r) => !seen.has(r.id))
    .map((r) => r.id);
}

void inArray;
void or;
void isNull;
