/**
 * Adjustable spaced-repetition intervals.
 *
 * These numbers used to be displayed read-only, which implied they could be
 * changed without offering any way to change them. They are now a preference,
 * and the rules that matter are that a bad value can never reach the scheduler
 * and that a saved value actually changes when a concept comes back.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SPACED_REPETITION_INTERVALS } from "@/config/scheduler";
import { intervalForMastery, updateConceptMastery } from "@/domain/mastery";
import { setSetting } from "@/domain/profile";
import {
  DEFAULT_REVIEW_INTERVALS,
  getPreferences,
  getReviewIntervals,
  MAX_REVIEW_INTERVAL_DAYS,
  MIN_REVIEW_INTERVAL_DAYS,
  parseReviewIntervals,
  resetPreferences,
  REVIEWABLE_LEVELS,
  setReviewIntervals,
  SETTINGS_KEYS,
} from "@/domain/settings";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

const TODAY = "2026-07-01";
const CONCEPT = "concept:CARD.AF.01";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb();
  seedProfile(ctx, { studyStartDate: TODAY });
});

afterEach(() => closeTestDb(ctx));

describe("defaults", () => {
  it("matches the shipped schedule", () => {
    for (const level of REVIEWABLE_LEVELS) {
      expect(DEFAULT_REVIEW_INTERVALS[level]).toBe(SPACED_REPETITION_INTERVALS[level]);
    }
  });

  it("is what an unconfigured profile gets", () => {
    expect(getReviewIntervals(ctx.db)).toEqual(DEFAULT_REVIEW_INTERVALS);
    expect(getPreferences(ctx.db).scheduler.reviewIntervals).toEqual(DEFAULT_REVIEW_INTERVALS);
  });

  it("never schedules level 0 — an unseen concept needs an introduction", () => {
    expect(REVIEWABLE_LEVELS).not.toContain(0);
    expect(intervalForMastery(0, getReviewIntervals(ctx.db))).toBeNull();
  });
});

describe("parsing stored values", () => {
  it("falls back to defaults on missing or malformed input", () => {
    expect(parseReviewIntervals(undefined)).toEqual(DEFAULT_REVIEW_INTERVALS);
    expect(parseReviewIntervals("not json")).toEqual(DEFAULT_REVIEW_INTERVALS);
    expect(parseReviewIntervals("null")).toEqual(DEFAULT_REVIEW_INTERVALS);
    expect(parseReviewIntervals("[1,2,3]")).toEqual(DEFAULT_REVIEW_INTERVALS);
  });

  it("keeps the shipped default for any level the stored value omits", () => {
    const parsed = parseReviewIntervals(JSON.stringify({ 3: 9 }));
    expect(parsed[3]).toBe(9);
    expect(parsed[1]).toBe(DEFAULT_REVIEW_INTERVALS[1]);
    expect(parsed[5]).toBe(DEFAULT_REVIEW_INTERVALS[5]);
  });

  it("ignores values outside the allowed range", () => {
    const parsed = parseReviewIntervals(
      JSON.stringify({ 1: 0, 2: -5, 3: MAX_REVIEW_INTERVAL_DAYS + 1, 4: "abc" }),
    );
    expect(parsed[1]).toBe(DEFAULT_REVIEW_INTERVALS[1]);
    expect(parsed[2]).toBe(DEFAULT_REVIEW_INTERVALS[2]);
    expect(parsed[3]).toBe(DEFAULT_REVIEW_INTERVALS[3]);
    expect(parsed[4]).toBe(DEFAULT_REVIEW_INTERVALS[4]);
  });

  it("accepts the boundary values", () => {
    const parsed = parseReviewIntervals(
      JSON.stringify({ 1: MIN_REVIEW_INTERVAL_DAYS, 5: MAX_REVIEW_INTERVAL_DAYS }),
    );
    expect(parsed[1]).toBe(MIN_REVIEW_INTERVAL_DAYS);
    expect(parsed[5]).toBe(MAX_REVIEW_INTERVAL_DAYS);
  });

  it("rounds fractional days", () => {
    expect(parseReviewIntervals(JSON.stringify({ 2: 3.4 }))[2]).toBe(3);
  });
});

describe("saving", () => {
  it("persists a valid schedule", () => {
    setReviewIntervals(ctx.db, { 1: 2, 2: 4, 3: 8, 4: 16, 5: 40 });
    expect(getReviewIntervals(ctx.db)).toEqual({ 1: 2, 2: 4, 3: 8, 4: 16, 5: 40 });
  });

  it("clamps on the way in, so an invalid value is never stored", () => {
    setReviewIntervals(ctx.db, { 1: 999, 2: 3 });
    const stored = getReviewIntervals(ctx.db);
    expect(stored[1]).toBe(DEFAULT_REVIEW_INTERVALS[1]);
    expect(stored[2]).toBe(3);
  });

  it("is restored by resetting preferences", () => {
    setReviewIntervals(ctx.db, { 3: 30 });
    resetPreferences(ctx.db);
    expect(getReviewIntervals(ctx.db)).toEqual(DEFAULT_REVIEW_INTERVALS);
  });

  it("survives a malformed value written directly to the setting", () => {
    setSetting(ctx.db, SETTINGS_KEYS.reviewIntervals, "{oops");
    expect(getReviewIntervals(ctx.db)).toEqual(DEFAULT_REVIEW_INTERVALS);
  });
});

describe("effect on scheduling", () => {
  it("uses the saved interval when a concept is answered correctly", () => {
    setReviewIntervals(ctx.db, { 1: 7 });

    // First correct answer moves an unseen concept to level 1.
    const update = updateConceptMastery(ctx.db, CONCEPT, true, TODAY);
    expect(update.newLevel).toBe(1);
    expect(update.nextDueAt).toBe("2026-07-08");
  });

  it("uses the default when nothing has been configured", () => {
    const update = updateConceptMastery(ctx.db, CONCEPT, true, TODAY);
    // Level 1 ships as one day.
    expect(update.nextDueAt).toBe("2026-07-02");
  });

  it("still brings an incorrect answer back tomorrow whatever the schedule", () => {
    setReviewIntervals(ctx.db, { 1: 90, 2: 90, 3: 90, 4: 90, 5: 90 });

    updateConceptMastery(ctx.db, CONCEPT, true, TODAY);
    const wrong = updateConceptMastery(ctx.db, CONCEPT, false, TODAY);
    expect(wrong.nextDueAt).toBe("2026-07-02");
  });

  it("applies a changed schedule to the next answer, not retroactively", () => {
    const before = updateConceptMastery(ctx.db, CONCEPT, true, TODAY);
    expect(before.nextDueAt).toBe("2026-07-02");

    setReviewIntervals(ctx.db, { 2: 20 });
    const after = updateConceptMastery(ctx.db, CONCEPT, true, TODAY);
    expect(after.newLevel).toBe(2);
    expect(after.nextDueAt).toBe("2026-07-21");
  });
});
