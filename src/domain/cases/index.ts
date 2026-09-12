/**
 * Case engine: reading case content and grading responses deterministically.
 *
 * Nothing here consults a model. Every classification, result string and
 * correct answer is read from the database exactly as it was authored.
 */

import { and, asc, eq } from "drizzle-orm";
import { answerConfigSchema, type AnswerConfig } from "@/content/schema";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import {
  CLASSIFICATION_SCORE,
  UNDEFINED_RESULT_TEXT,
  type CaseStage,
  type Classification,
} from "@/domain/constants";
import { matchShortAnswer } from "@/domain/actions";

/**
 * Whether this case authors any daily work at all — a rounds question or a
 * problem list to plan against.
 *
 * A case with neither has nothing to ask on rounds, and reporting such a
 * patient as "rounds due" every day is how the workload screen ends up lying
 * to the learner.
 */
export function caseHasRoundsTask(db: Db, caseId: string): boolean {
  const hasPrompt =
    db
      .select({ id: t.casePrompt.id })
      .from(t.casePrompt)
      .where(and(eq(t.casePrompt.caseId, caseId), eq(t.casePrompt.stage, "ROUNDS")))
      .limit(1)
      .get() !== undefined;
  if (hasPrompt) return true;

  return (
    db
      .select({ id: t.caseProblem.id })
      .from(t.caseProblem)
      .where(eq(t.caseProblem.caseId, caseId))
      .limit(1)
      .get() !== undefined
  );
}

export function getCaseById(db: Db, caseId: string): t.CaseTemplateRow | null {
  return db.select().from(t.caseTemplate).where(eq(t.caseTemplate.id, caseId)).get() ?? null;
}

export function listCases(db: Db): t.CaseTemplateRow[] {
  return db.select().from(t.caseTemplate).all();
}

export function getCaseConceptIds(db: Db, caseId: string): string[] {
  return db
    .select({ conceptId: t.caseConcept.conceptId })
    .from(t.caseConcept)
    .where(eq(t.caseConcept.caseId, caseId))
    .all()
    .map((r) => r.conceptId);
}

export function getCaseFindings(db: Db, caseId: string): t.CaseFindingRow[] {
  return db
    .select()
    .from(t.caseFinding)
    .where(eq(t.caseFinding.caseId, caseId))
    .orderBy(asc(t.caseFinding.displayOrder))
    .all();
}

export function getCaseActionRules(db: Db, caseId: string): t.CaseActionRuleRow[] {
  return db.select().from(t.caseActionRule).where(eq(t.caseActionRule.caseId, caseId)).all();
}

export function getCasePrompts(db: Db, caseId: string, stage: CaseStage): t.CasePromptRow[] {
  return db
    .select()
    .from(t.casePrompt)
    .where(and(eq(t.casePrompt.caseId, caseId), eq(t.casePrompt.stage, stage)))
    .orderBy(asc(t.casePrompt.sequence))
    .all();
}

export function parseAnswerConfig(prompt: t.CasePromptRow): AnswerConfig {
  return answerConfigSchema.parse(JSON.parse(prompt.answerConfigJson));
}

/* --------------------------------- actions -------------------------------- */

export interface ActionOutcome {
  actionCode: string;
  classification: Classification;
  resultText: string;
  feedbackText: string;
  conceptId: string | null;
  score: number;
  /** True when the case defines no rule and the generic fallback was used. */
  isUndefined: boolean;
}

/**
 * Resolves what happens when the learner takes an action on a case.
 *
 * When a case defines no rule, the result is the explicit fallback string —
 * never an invented finding (spec §19).
 */
export function resolveAction(
  db: Db,
  caseId: string,
  actionCode: string,
): ActionOutcome {
  const rule = db
    .select()
    .from(t.caseActionRule)
    .where(and(eq(t.caseActionRule.caseId, caseId), eq(t.caseActionRule.actionCode, actionCode)))
    .get();

  if (!rule) {
    return {
      actionCode,
      classification: "OPTIONAL",
      resultText: UNDEFINED_RESULT_TEXT,
      feedbackText: "",
      conceptId: null,
      score: 0,
      isUndefined: true,
    };
  }

  const classification = rule.classification as Classification;
  return {
    actionCode,
    classification,
    resultText: rule.resultText || UNDEFINED_RESULT_TEXT,
    feedbackText: rule.feedbackText,
    conceptId: rule.conceptId,
    score: CLASSIFICATION_SCORE[classification] ?? 0,
    isUndefined: false,
  };
}

/* --------------------------------- prompts -------------------------------- */

export interface GradeResult {
  correct: boolean;
  feedback: string;
  /** Human-readable form of what the learner answered. */
  answerLabel: string;
  /** The correct answer, shown after an incorrect response. */
  correctLabel: string;
}

/**
 * Grades a prompt response against its stored answer configuration.
 *
 * `response` is a choice key for choice-type prompts, a comma-separated list
 * of action codes for ACTION prompts, or free text for SHORT_TEXT.
 */
export function gradePromptResponse(
  prompt: t.CasePromptRow,
  response: string,
): GradeResult {
  const config = parseAnswerConfig(prompt);

  switch (config.kind) {
    case "MULTIPLE_CHOICE":
    case "DIAGNOSIS":
    case "DISPOSITION": {
      const correct = response === config.correctKey;
      const chosen = config.choices.find((c) => c.key === response);
      const answer = config.choices.find((c) => c.key === config.correctKey);
      return {
        correct,
        feedback: correct ? prompt.correctFeedback : prompt.incorrectFeedback,
        answerLabel: chosen?.text ?? response,
        correctLabel: answer?.text ?? config.correctKey,
      };
    }

    case "ACTION": {
      const selected = response
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const required = new Set(config.correctActionCodes);
      // Correct means every required action selected and nothing extra.
      const correct =
        selected.length === required.size && selected.every((code) => required.has(code));
      return {
        correct,
        feedback: correct ? prompt.correctFeedback : prompt.incorrectFeedback,
        answerLabel: selected.join(", ") || "(nothing selected)",
        correctLabel: config.correctActionCodes.join(", "),
      };
    }

    case "SHORT_TEXT": {
      const { matched } = matchShortAnswer(response, config.acceptedAnswers);
      return {
        correct: matched,
        feedback: matched ? prompt.correctFeedback : prompt.incorrectFeedback,
        answerLabel: response,
        correctLabel: config.acceptedAnswers[0] ?? "",
      };
    }
  }
}

/** Choice options for rendering, regardless of the underlying kind. */
export function promptChoices(prompt: t.CasePromptRow): { key: string; text: string }[] {
  const config = parseAnswerConfig(prompt);
  if (config.kind === "SHORT_TEXT") {
    return config.suggestions.map((s) => ({ key: s, text: s }));
  }
  if (config.kind === "ACTION") {
    return config.options.map((o) => ({ key: o, text: o }));
  }
  return config.choices.map((c) => ({ key: c.key, text: c.text }));
}
