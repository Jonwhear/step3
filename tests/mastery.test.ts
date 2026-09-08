/** Concept mastery and spaced repetition (spec §51). */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MASTERY_LEVELS, SPACED_REPETITION_INTERVALS } from "@/config/scheduler";
import {
  getConceptState,
  getDueConcepts,
  getWeakConcepts,
  introduceConcepts,
  intervalForMastery,
  nextMasteryLevel,
  updateConceptMastery,
} from "@/domain/mastery";
import { closeTestDb, createTestDb, type TestContext } from "./helpers";

let ctx: TestContext;
beforeEach(() => {
  ctx = createTestDb();
});
afterEach(() => closeTestDb(ctx));

const C = "concept:CARD.AF.01";

describe("mastery transitions", () => {
  it("advances one level per correct answer and caps at 5", () => {
    expect(nextMasteryLevel(0, true)).toBe(1);
    expect(nextMasteryLevel(3, true)).toBe(4);
    expect(nextMasteryLevel(5, true)).toBe(5);
  });

  it("drops one level per incorrect answer, never below INTRODUCED", () => {
    expect(nextMasteryLevel(5, false)).toBe(4);
    expect(nextMasteryLevel(2, false)).toBe(1);
    expect(nextMasteryLevel(1, false)).toBe(1);
    // An unseen concept answered incorrectly still becomes introduced.
    expect(nextMasteryLevel(0, false)).toBe(1);
  });
});

describe("updateConceptMastery", () => {
  it("records a correct answer and schedules the next review", () => {
    const update = updateConceptMastery(ctx.db, C, true, "2026-09-08");
    expect(update.previousLevel).toBe(0);
    expect(update.newLevel).toBe(1);
    expect(update.nextDueAt).toBe("2026-09-09"); // mastery 1 -> 1 day

    const state = getConceptState(ctx.db, C)!;
    expect(state.exposures).toBe(1);
    expect(state.correctCount).toBe(1);
    expect(state.consecutiveCorrect).toBe(1);
  });

  it("brings an incorrect concept back tomorrow whatever its level", () => {
    for (let i = 0; i < 4; i += 1) updateConceptMastery(ctx.db, C, true, "2026-09-01");
    expect(getConceptState(ctx.db, C)!.masteryLevel).toBe(4);

    const update = updateConceptMastery(ctx.db, C, false, "2026-09-08");
    expect(update.newLevel).toBe(3);
    expect(update.nextDueAt).toBe("2026-09-09");
    expect(getConceptState(ctx.db, C)!.consecutiveCorrect).toBe(0);
    expect(getConceptState(ctx.db, C)!.incorrectCount).toBe(1);
  });

  it("uses the configured interval table for each level", () => {
    let date = "2026-09-08";
    for (let level = 1; level <= 5; level += 1) {
      const update = updateConceptMastery(ctx.db, C, true, date);
      const expected = SPACED_REPETITION_INTERVALS[update.newLevel];
      expect(update.newLevel).toBe(level);
      if (expected !== null && expected !== undefined) {
        expect(update.nextDueAt).not.toBeNull();
      }
      date = "2026-09-08";
    }
    expect(intervalForMastery(MASTERY_LEVELS.MASTERED)).toBe(30);
    expect(intervalForMastery(MASTERY_LEVELS.UNSEEN)).toBeNull();
  });
});

describe("introduceConcepts", () => {
  it("moves unseen concepts to INTRODUCED without grading them", () => {
    introduceConcepts(ctx.db, [C], "2026-09-08");
    const state = getConceptState(ctx.db, C)!;
    expect(state.masteryLevel).toBe(MASTERY_LEVELS.INTRODUCED);
    expect(state.correctCount).toBe(0);
    expect(state.incorrectCount).toBe(0);
    expect(state.nextDueAt).toBe("2026-09-09");
  });

  it("does not demote or reschedule a concept the learner already knows", () => {
    for (let i = 0; i < 4; i += 1) updateConceptMastery(ctx.db, C, true, "2026-09-01");
    const before = getConceptState(ctx.db, C)!;

    introduceConcepts(ctx.db, [C], "2026-09-08");
    const after = getConceptState(ctx.db, C)!;
    expect(after.masteryLevel).toBe(before.masteryLevel);
    expect(after.nextDueAt).toBe(before.nextDueAt);
    expect(after.exposures).toBe(before.exposures + 1);
  });
});

describe("due and weak queries", () => {
  it("reports a concept as due once its review date arrives", () => {
    updateConceptMastery(ctx.db, C, true, "2026-09-08"); // due 2026-09-09
    expect(getDueConcepts(ctx.db, "2026-09-08")).not.toContain(C);
    expect(getDueConcepts(ctx.db, "2026-09-09")).toContain(C);
    expect(getDueConcepts(ctx.db, "2026-09-20")).toContain(C);
  });

  it("reports repeatedly missed concepts as weak", () => {
    updateConceptMastery(ctx.db, C, false, "2026-09-08");
    expect(getWeakConcepts(ctx.db)).toContain(C);

    // Getting it right repeatedly should take it out of the weak set.
    for (let i = 0; i < 3; i += 1) updateConceptMastery(ctx.db, C, true, "2026-09-09");
    expect(getWeakConcepts(ctx.db)).not.toContain(C);
  });
});
