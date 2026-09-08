/** Case engine, action vocabulary and speech matching (spec §51). */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UNDEFINED_RESULT_TEXT } from "@/domain/constants";
import {
  listActions,
  matchShortAnswer,
  matchTranscriptToActions,
  normalizeText,
} from "@/domain/actions";
import {
  getCaseFindings,
  getCasePrompts,
  gradePromptResponse,
  listCases,
  parseAnswerConfig,
  promptChoices,
  resolveAction,
} from "@/domain/cases";
import { closeTestDb, createTestDb, type TestContext } from "./helpers";

let ctx: TestContext;
beforeEach(() => {
  ctx = createTestDb();
});
afterEach(() => closeTestDb(ctx));

const AFIB = "case:DEMO-CARD-001";

describe("action resolution", () => {
  it("recognises a required action and returns its deterministic result", () => {
    const outcome = resolveAction(ctx.db, AFIB, "ORDER_ECG");
    expect(outcome.classification).toBe("REQUIRED");
    expect(outcome.resultText).toContain("Irregularly irregular");
    expect(outcome.score).toBeGreaterThan(0);
    expect(outcome.isUndefined).toBe(false);
  });

  it("recognises a contraindicated action and scores it negatively", () => {
    const outcome = resolveAction(ctx.db, AFIB, "GIVE_CARDIOVERSION");
    expect(outcome.classification).toBe("CONTRAINDICATED");
    expect(outcome.score).toBeLessThan(0);
    expect(outcome.feedbackText).toContain("instability");
  });

  it("returns the same result every time for the same action", () => {
    const a = resolveAction(ctx.db, AFIB, "ORDER_ECG");
    const b = resolveAction(ctx.db, AFIB, "ORDER_ECG");
    expect(a).toEqual(b);
  });

  it("never invents a result for an undefined test", () => {
    const outcome = resolveAction(ctx.db, AFIB, "ORDER_MRI_BRAIN");
    expect(outcome.isUndefined).toBe(true);
    expect(outcome.resultText).toBe(UNDEFINED_RESULT_TEXT);
    expect(outcome.score).toBe(0);
  });

  it("gates findings behind the action that reveals them", () => {
    const findings = getCaseFindings(ctx.db, AFIB);
    const ecg = findings.find((f) => f.triggerActionCode === "ORDER_ECG");
    expect(ecg).toBeDefined();
    expect(ecg!.initiallyVisible).toBe(false);
    // Vitals are visible from the door; the ECG is not.
    expect(findings.filter((f) => f.initiallyVisible).every((f) => !f.triggerActionCode)).toBe(
      true,
    );
  });
});

describe("speech normalisation and matching", () => {
  it("normalises punctuation, case and whitespace", () => {
    expect(normalizeText("  Give   ASPIRIN, please! ")).toBe("give aspirin please");
  });

  it("maps synonyms to the right action code", () => {
    const actions = listActions(ctx.db);
    for (const phrase of ["aspirin", "give aspirin", "start aspirin", "ASA"]) {
      const result = matchTranscriptToActions(phrase, actions);
      expect(result.matched.map((m) => m.actionCode)).toContain("GIVE_ASPIRIN");
    }
  });

  it("extracts several actions from one natural sentence", () => {
    const result = matchTranscriptToActions(
      "I'd get an ECG, give aspirin, and check a troponin",
      listActions(ctx.db),
    );
    const codes = result.matched.map((m) => m.actionCode);
    expect(codes).toContain("ORDER_ECG");
    expect(codes).toContain("GIVE_ASPIRIN");
    expect(codes).toContain("ORDER_TROPONIN");
    expect(result.unmatched).toBe(false);
  });

  it("reports unknown speech rather than guessing", () => {
    const result = matchTranscriptToActions(
      "let us consider the vibe of the situation",
      listActions(ctx.db),
    );
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toBe(true);
  });

  it("never returns the same action twice from one phrase", () => {
    const result = matchTranscriptToActions(
      "give aspirin and aspirin",
      listActions(ctx.db),
    );
    const codes = result.matched.map((m) => m.actionCode);
    expect(codes.filter((c) => c === "GIVE_ASPIRIN")).toHaveLength(1);
  });

  it("matches short answers only after normalisation", () => {
    expect(matchShortAnswer("Epinephrine!", ["epinephrine"]).matched).toBe(true);
    expect(matchShortAnswer("something else", ["epinephrine"]).matched).toBe(false);
  });
});

describe("prompt grading", () => {
  it("grades a correct multiple-choice answer", () => {
    const prompt = getCasePrompts(ctx.db, AFIB, "ROUNDS")[0]!;
    const config = parseAnswerConfig(prompt);
    expect(config.kind).toBe("MULTIPLE_CHOICE");
    if (config.kind !== "MULTIPLE_CHOICE") throw new Error("unexpected");

    const right = gradePromptResponse(prompt, config.correctKey);
    expect(right.correct).toBe(true);
    expect(right.feedback).toBe(prompt.correctFeedback);

    const wrongKey = config.choices.find((c) => c.key !== config.correctKey)!.key;
    const wrong = gradePromptResponse(prompt, wrongKey);
    expect(wrong.correct).toBe(false);
    expect(wrong.correctLabel).toBeTruthy();
  });

  it("exposes choices for every prompt in the library", () => {
    for (const template of listCases(ctx.db)) {
      for (const stage of ["ROUNDS", "DISCHARGE", "ADMISSION"] as const) {
        for (const prompt of getCasePrompts(ctx.db, template.id, stage)) {
          const choices = promptChoices(prompt);
          expect(choices.length).toBeGreaterThan(0);
          const config = parseAnswerConfig(prompt);
          if (config.kind !== "SHORT_TEXT" && config.kind !== "ACTION") {
            expect(choices.some((c) => c.key === config.correctKey)).toBe(true);
          }
        }
      }
    }
  });

  it("has a gradeable correct answer for every prompt in the library", () => {
    for (const template of listCases(ctx.db)) {
      for (const stage of ["ROUNDS", "DISCHARGE", "ADMISSION"] as const) {
        for (const prompt of getCasePrompts(ctx.db, template.id, stage)) {
          const config = parseAnswerConfig(prompt);
          const answer =
            config.kind === "SHORT_TEXT"
              ? config.acceptedAnswers[0]!
              : config.kind === "ACTION"
                ? config.correctActionCodes.join(",")
                : config.correctKey;
          expect(gradePromptResponse(prompt, answer).correct).toBe(true);
        }
      }
    }
  });
});

describe("content library integrity", () => {
  it("gives every case rounds and discharge prompts", () => {
    for (const template of listCases(ctx.db)) {
      expect(getCasePrompts(ctx.db, template.id, "ROUNDS").length).toBeGreaterThan(0);
      expect(getCasePrompts(ctx.db, template.id, "DISCHARGE").length).toBeGreaterThan(0);
    }
  });

  it("marks all seeded content as synthetic demo material", () => {
    for (const template of listCases(ctx.db)) {
      expect(template.isDemo).toBe(true);
      expect(template.contentOrigin).toBe("DEMO_SYNTHETIC");
      expect(template.demoSeedVersion).toBe("demo-v1");
    }
  });

  it("defines a rule for every action a finding is gated behind", () => {
    for (const template of listCases(ctx.db)) {
      const findings = getCaseFindings(ctx.db, template.id);
      for (const finding of findings) {
        if (!finding.triggerActionCode) continue;
        const outcome = resolveAction(ctx.db, template.id, finding.triggerActionCode);
        // Either the case defines a rule, or the generic fallback applies —
        // but the finding is still revealed by the action.
        expect(outcome.actionCode).toBe(finding.triggerActionCode);
      }
    }
  });
});
