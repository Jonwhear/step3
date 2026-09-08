/** Scheduler behaviour (spec §51). */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SCHEDULER_CONFIG } from "@/config/scheduler";
import { getCaseById } from "@/domain/cases";
import { completeLecture, listLectures } from "@/domain/lectures";
import { updateConceptMastery } from "@/domain/mastery";
import { listActivePanel } from "@/domain/patients";
import {
  calculateCatchUpAdjustment,
  calculateDailyPatientTarget,
  chooseEntryMode,
  rankCandidates,
  rotationRelevanceFactor,
  runDailyScheduler,
  scoreCandidateCase,
  type CandidateCase,
  type ScoringContext,
} from "@/domain/scheduler";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

let ctx: TestContext;
beforeEach(() => {
  ctx = createTestDb();
});
afterEach(() => closeTestDb(ctx));

function baseScoringContext(overrides: Partial<ScoringContext> = {}): ScoringContext {
  return {
    userId: "user-local",
    today: "2026-09-08",
    rotationSpecialty: "Internal Medicine",
    dueConceptIds: new Set(),
    weakConceptIds: new Set(),
    topicCaseCounts: new Map(),
    recentLectureConceptIds: new Set(),
    lastAssignedByCase: new Map(),
    ...overrides,
  };
}

const candidate = (over: Partial<CandidateCase> = {}): CandidateCase => ({
  id: "case:X",
  code: "X",
  title: "Case X",
  specialty: "Internal Medicine",
  topic: "Cardiology",
  step3Importance: 3,
  conceptIds: ["c1", "c2"],
  ...over,
});

describe("pacing", () => {
  it("spreads the remaining patients evenly when on plan", () => {
    const result = calculateDailyPatientTarget({
      studyStartDate: "2026-09-01",
      step3Date: "2026-12-30",
      targetPatientCount: 120,
      patientsAssigned: 7,
      today: "2026-09-08",
    });
    // 113 patients over 114 days ≈ 1/day.
    expect(result.dailyTarget).toBe(1);
    expect(result.deficit).toBeLessThan(1);
    expect(result.catchUpAdjustment).toBe(0);
  });

  it("increases catch-up gently after missed days rather than dumping a backlog", () => {
    const behind = calculateDailyPatientTarget({
      studyStartDate: "2026-01-01",
      step3Date: "2026-12-31",
      targetPatientCount: 365,
      patientsAssigned: 100, // ~150 expected by early June
      today: "2026-06-01",
    });
    expect(behind.deficit).toBeGreaterThan(10);
    // A large deficit must never translate into a large day.
    expect(behind.catchUpAdjustment).toBeLessThanOrEqual(SCHEDULER_CONFIG.CATCHUP_CAP);
    expect(behind.dailyTarget).toBeLessThanOrEqual(SCHEDULER_CONFIG.MAX_NEW_PATIENTS_PER_DAY);
  });

  it("caps catch-up at CATCHUP_CAP however large the deficit", () => {
    expect(calculateCatchUpAdjustment(0)).toBe(0);
    expect(calculateCatchUpAdjustment(2)).toBeCloseTo(2 / SCHEDULER_CONFIG.CATCHUP_SPREAD_DAYS);
    expect(calculateCatchUpAdjustment(400)).toBe(SCHEDULER_CONFIG.CATCHUP_CAP);
  });

  it("never exceeds the daily maximum", () => {
    const result = calculateDailyPatientTarget({
      studyStartDate: "2026-09-01",
      step3Date: "2026-09-10",
      targetPatientCount: 500,
      patientsAssigned: 0,
      today: "2026-09-09",
    });
    expect(result.dailyTarget).toBe(SCHEDULER_CONFIG.MAX_NEW_PATIENTS_PER_DAY);
  });

  it("asks for nothing once the target is met", () => {
    const result = calculateDailyPatientTarget({
      studyStartDate: "2026-09-01",
      step3Date: "2026-12-01",
      targetPatientCount: 50,
      patientsAssigned: 50,
      today: "2026-10-01",
    });
    expect(result.dailyTarget).toBe(0);
    expect(result.remainingPatients).toBe(0);
  });
});

describe("candidate scoring", () => {
  it("favours the current rotation", () => {
    expect(rotationRelevanceFactor("Internal Medicine", "Internal Medicine")).toBe(1);
    expect(rotationRelevanceFactor("Neurology", "Internal Medicine")).toBe(0.5);
    expect(rotationRelevanceFactor("OB/GYN", "Psychiatry")).toBe(0);

    const ctxScore = baseScoringContext();
    const onService = scoreCandidateCase(candidate({ id: "a" }), ctxScore);
    const offService = scoreCandidateCase(
      candidate({ id: "a", specialty: "OB/GYN" }),
      ctxScore,
    );
    expect(onService.rotationRelevance).toBeGreaterThan(offService.rotationRelevance);
    expect(onService.total).toBeGreaterThan(offService.total);
  });

  it("favours cases whose concepts are due for review", () => {
    const plain = scoreCandidateCase(candidate(), baseScoringContext());
    const due = scoreCandidateCase(
      candidate(),
      baseScoringContext({ dueConceptIds: new Set(["c1", "c2"]) }),
    );
    expect(due.spacedRepetitionDue).toBeGreaterThan(plain.spacedRepetitionDue);
    expect(due.total).toBeGreaterThan(plain.total);
  });

  it("favours weak concepts and curriculum gaps", () => {
    const covered = scoreCandidateCase(
      candidate(),
      baseScoringContext({ topicCaseCounts: new Map([["Cardiology", 10]]) }),
    );
    const gap = scoreCandidateCase(candidate(), baseScoringContext());
    expect(gap.curriculumGap).toBeGreaterThan(covered.curriculumGap);

    const weak = scoreCandidateCase(
      candidate(),
      baseScoringContext({ weakConceptIds: new Set(["c1", "c2"]) }),
    );
    expect(weak.weakness).toBeGreaterThan(gap.weakness);
  });

  it("penalises recently seen cases", () => {
    const fresh = scoreCandidateCase(candidate(), baseScoringContext());
    const recent = scoreCandidateCase(
      candidate(),
      baseScoringContext({ lastAssignedByCase: new Map([["case:X", "2026-09-07"]]) }),
    );
    expect(recent.recentlySeen).toBeGreaterThan(0);
    expect(recent.total).toBeLessThan(fresh.total);
  });

  it("boosts cases related to a recently completed lecture", () => {
    const plain = scoreCandidateCase(candidate(), baseScoringContext());
    const boosted = scoreCandidateCase(
      candidate(),
      baseScoringContext({ recentLectureConceptIds: new Set(["c1", "c2"]) }),
    );
    expect(boosted.recentLecture).toBeGreaterThan(0);
    expect(boosted.total).toBeGreaterThan(plain.total);
  });

  it("is deterministic for the same seed", () => {
    const c = baseScoringContext();
    const a = rankCandidates([candidate({ id: "a" }), candidate({ id: "b" })], c);
    const b = rankCandidates([candidate({ id: "a" }), candidate({ id: "b" })], c);
    expect(a.map((s) => s.caseId)).toEqual(b.map((s) => s.caseId));
    expect(a[0]?.total).toBe(b[0]?.total);
  });

  it("produces different jitter on different dates", () => {
    const day1 = scoreCandidateCase(candidate(), baseScoringContext({ today: "2026-09-08" }));
    const day2 = scoreCandidateCase(candidate(), baseScoringContext({ today: "2026-09-09" }));
    expect(day1.jitter).not.toBe(day2.jitter);
    expect(day1.jitter).toBeLessThanOrEqual(SCHEDULER_CONFIG.JITTER_MAX);
  });
});

describe("entry mode", () => {
  it("prefers handoff when most concepts are unseen", () => {
    const decision = chooseEntryMode({
      conceptMasteryLevels: [0, 0, 0, 1],
      alternationIndex: 0,
    });
    expect(decision.entryMode).toBe("HANDOFF");
  });

  it("prefers admission when concepts are well established", () => {
    const decision = chooseEntryMode({
      conceptMasteryLevels: [4, 5, 4, 3],
      alternationIndex: 0,
    });
    expect(decision.entryMode).toBe("ADMISSION");
  });

  it("alternates deterministically in the introduced-but-weak band", () => {
    const levels = [1, 2, 2, 1];
    expect(chooseEntryMode({ conceptMasteryLevels: levels, alternationIndex: 0 }).entryMode).toBe(
      "HANDOFF",
    );
    expect(chooseEntryMode({ conceptMasteryLevels: levels, alternationIndex: 1 }).entryMode).toBe(
      "ADMISSION",
    );
    // Repeating the same call gives the same answer.
    expect(chooseEntryMode({ conceptMasteryLevels: levels, alternationIndex: 1 }).entryMode).toBe(
      "ADMISSION",
    );
  });
});

describe("runDailyScheduler", () => {
  it("honours the maximum panel size", () => {
    seedProfile(ctx, {
      targetPatientCount: 500,
      step3Date: "2026-09-20",
      studyStartDate: "2026-09-01",
    });
    for (let day = 8; day <= 18; day += 1) {
      runDailyScheduler(ctx.db, { today: `2026-09-${String(day).padStart(2, "0")}` });
    }
    expect(listActivePanel(ctx.db).length).toBeLessThanOrEqual(
      SCHEDULER_CONFIG.MAX_ACTIVE_PANEL_SIZE,
    );
  });

  it("runs once per study date", () => {
    seedProfile(ctx);
    const first = runDailyScheduler(ctx.db, { today: "2026-09-08" });
    const second = runDailyScheduler(ctx.db, { today: "2026-09-08" });
    expect(first.ranNow).toBe(true);
    expect(second.ranNow).toBe(false);
    expect(second.newPatientIds).toHaveLength(0);
  });

  it("does not create a backlog after missed days", () => {
    seedProfile(ctx, {
      targetPatientCount: 100,
      step3Date: "2026-12-31",
      studyStartDate: "2026-09-01",
    });
    runDailyScheduler(ctx.db, { today: "2026-09-01" });
    // Learner disappears for three weeks.
    const after = runDailyScheduler(ctx.db, { today: "2026-09-22" });
    expect(after.debug.newPatientsAssigned).toBeLessThanOrEqual(
      SCHEDULER_CONFIG.MAX_NEW_PATIENTS_PER_DAY,
    );
    expect(listActivePanel(ctx.db).length).toBeLessThanOrEqual(
      SCHEDULER_CONFIG.MAX_ACTIVE_PANEL_SIZE,
    );
  });

  it("favours the current rotation when choosing new patients", () => {
    seedProfile(ctx, { rotationSpecialty: "Psychiatry" });
    const result = runDailyScheduler(ctx.db, { today: "2026-09-08" });
    const specialties = result.newPatientIds
      .map((id) => listActivePanel(ctx.db).find((p) => p.id === id))
      .map((p) => (p ? getCaseById(ctx.db, p.caseId)?.specialty : null));
    expect(specialties).toContain("Psychiatry");
  });

  it("boosts related cases after a lecture is completed", () => {
    seedProfile(ctx, { rotationSpecialty: "Surgery" });
    const strokeLecture = listLectures(ctx.db).find((l) => l.topic === "Stroke");
    expect(strokeLecture).toBeDefined();
    completeLecture(ctx.db, strokeLecture!.id, "2026-09-08");

    const result = runDailyScheduler(ctx.db, { today: "2026-09-08" });
    const strokeScore = result.debug.candidateScores.find((s) => s.code === "DEMO-NEURO-001");
    expect(strokeScore).toBeDefined();
    expect(strokeScore!.recentLecture).toBeGreaterThan(0);
  });

  it("does not reassign a case already on the panel", () => {
    seedProfile(ctx, { targetPatientCount: 500, step3Date: "2026-09-30" });
    runDailyScheduler(ctx.db, { today: "2026-09-08" });
    runDailyScheduler(ctx.db, { today: "2026-09-09" });
    const caseIds = listActivePanel(ctx.db).map((p) => p.caseId);
    expect(new Set(caseIds).size).toBe(caseIds.length);
  });

  it("gives every active patient a distinct room and name", () => {
    seedProfile(ctx, { targetPatientCount: 500, step3Date: "2026-09-30" });
    for (let day = 8; day <= 14; day += 1) {
      runDailyScheduler(ctx.db, { today: `2026-09-${String(day).padStart(2, "0")}` });
    }
    const panel = listActivePanel(ctx.db);
    expect(new Set(panel.map((p) => p.roomNumber)).size).toBe(panel.length);
    expect(new Set(panel.map((p) => p.patientName)).size).toBe(panel.length);
  });

  it("prefers due concepts once mastery has been recorded", () => {
    seedProfile(ctx, { rotationSpecialty: "Surgery" });

    // Answer a psychiatry concept incorrectly a week ago: it is now overdue,
    // so its case should gain a spaced-repetition bonus despite being
    // off-service for a Surgery rotation.
    updateConceptMastery(ctx.db, "concept:PSYCH.SS.01", false, "2026-09-01");

    const result = runDailyScheduler(ctx.db, { today: "2026-09-08" });
    const psychScore = result.debug.candidateScores.find(
      (s) => s.code === "DEMO-PSYCH-001",
    );
    expect(psychScore).toBeDefined();
    expect(psychScore!.spacedRepetitionDue).toBeGreaterThan(0);
    expect(psychScore!.weakness).toBeGreaterThan(0);
  });
});
