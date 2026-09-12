/**
 * Assessment & Plan (spec §20-23).
 *
 * The learner builds a note by selecting from case-authored options rather than
 * typing prose. That is a deliberate constraint: it keeps the app free of
 * free-text clinical interpretation, keeps scoring deterministic, and still
 * exercises the real decision — which problems exist and what belongs under
 * each one.
 *
 * Nothing here is graded until the learner signs the note, so a half-built plan
 * carries no penalty.
 */

import { and, asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { CLASSIFICATION_SCORE, type Classification } from "@/domain/constants";
import { nowIso, type IsoDate } from "@/lib/date";

export interface PlanOptionView {
  id: string;
  label: string;
  classification: Classification;
  actionCode: string | null;
  feedbackText: string;
  selected: boolean;
}

export interface ProblemView {
  id: string;
  label: string;
  assessmentText: string;
  isPrimary: boolean;
  isExpected: boolean;
  /** True once the learner has added it to this patient's problem list. */
  added: boolean;
  options: PlanOptionView[];
}

export function listCaseProblems(db: Db, caseId: string): t.CaseProblemRow[] {
  return db
    .select()
    .from(t.caseProblem)
    .where(eq(t.caseProblem.caseId, caseId))
    .orderBy(asc(t.caseProblem.displayOrder))
    .all();
}

export function listProblemOptions(db: Db, problemId: string): t.CaseProblemOptionRow[] {
  return db
    .select()
    .from(t.caseProblemOption)
    .where(eq(t.caseProblemOption.problemId, problemId))
    .orderBy(asc(t.caseProblemOption.displayOrder))
    .all();
}

export function listAddedProblemIds(db: Db, patientId: string): Set<string> {
  return new Set(
    db
      .select({ problemId: t.patientProblem.problemId })
      .from(t.patientProblem)
      .where(eq(t.patientProblem.patientInstanceId, patientId))
      .all()
      .map((r) => r.problemId),
  );
}

export function listSelectedOptionIds(db: Db, patientId: string): Set<string> {
  return new Set(
    db
      .select({ optionId: t.patientPlanSelection.optionId })
      .from(t.patientPlanSelection)
      .where(eq(t.patientPlanSelection.patientInstanceId, patientId))
      .all()
      .map((r) => r.optionId),
  );
}

/** The whole A&P for one patient, with the learner's current selections. */
export function buildChart(db: Db, patientId: string, caseId: string): ProblemView[] {
  const added = listAddedProblemIds(db, patientId);
  const selected = listSelectedOptionIds(db, patientId);

  return listCaseProblems(db, caseId).map((problem) => ({
    id: problem.id,
    label: problem.label,
    assessmentText: problem.assessmentText,
    isPrimary: problem.isPrimary,
    isExpected: problem.isExpected,
    added: added.has(problem.id),
    options: listProblemOptions(db, problem.id).map((option) => ({
      id: option.id,
      label: option.label,
      classification: option.classification as Classification,
      actionCode: option.actionCode,
      feedbackText: option.feedbackText,
      selected: selected.has(option.id),
    })),
  }));
}

/**
 * The day this patient's plan was last signed, or null if it never has been.
 *
 * Read from the study-event log rather than a column on the patient: signing is
 * already recorded there, and a derived answer cannot drift from the audit
 * trail the way a duplicated flag would.
 *
 * Rounds uses this to decide whether the learner *has* to write a note. A plan
 * already on file is carried forward silently; only a patient with no plan at
 * all is asked for one, so charting stays a response to a decision rather than
 * a daily toll.
 */
export function lastPlanSignedDate(db: Db, patientId: string): IsoDate | null {
  const row = db
    .select({ eventDate: t.studyEvent.eventDate })
    .from(t.studyEvent)
    .where(
      and(
        eq(t.studyEvent.patientInstanceId, patientId),
        eq(t.studyEvent.eventType, "PLAN_SIGNED"),
      ),
    )
    .orderBy(desc(t.studyEvent.eventDate))
    .limit(1)
    .get();
  return row?.eventDate ?? null;
}

export function addProblem(db: Db, patientId: string, problemId: string): void {
  db.insert(t.patientProblem)
    .values({ patientInstanceId: patientId, problemId, addedAt: nowIso() })
    .onConflictDoNothing()
    .run();
}

export function removeProblem(db: Db, patientId: string, problemId: string): void {
  db.transaction((tx) => {
    tx.delete(t.patientProblem)
      .where(
        and(
          eq(t.patientProblem.patientInstanceId, patientId),
          eq(t.patientProblem.problemId, problemId),
        ),
      )
      .run();
    // Selections under a removed problem would otherwise keep scoring.
    tx.delete(t.patientPlanSelection)
      .where(
        and(
          eq(t.patientPlanSelection.patientInstanceId, patientId),
          eq(t.patientPlanSelection.problemId, problemId),
        ),
      )
      .run();
  });
}

export function togglePlanSelection(
  db: Db,
  patientId: string,
  problemId: string,
  optionId: string,
): boolean {
  const existing = db
    .select()
    .from(t.patientPlanSelection)
    .where(
      and(
        eq(t.patientPlanSelection.patientInstanceId, patientId),
        eq(t.patientPlanSelection.optionId, optionId),
      ),
    )
    .get();

  if (existing) {
    db.delete(t.patientPlanSelection)
      .where(
        and(
          eq(t.patientPlanSelection.patientInstanceId, patientId),
          eq(t.patientPlanSelection.optionId, optionId),
        ),
      )
      .run();
    return false;
  }

  db.insert(t.patientPlanSelection)
    .values({
      patientInstanceId: patientId,
      optionId,
      problemId,
      createdAt: nowIso(),
    })
    .run();
  return true;
}

/* --------------------------------- scoring -------------------------------- */

export interface PlanScoreLine {
  problemLabel: string;
  optionLabel: string;
  classification: Classification;
  feedbackText: string;
  /** True when the option was expected but the learner did not select it. */
  missed: boolean;
}

export interface PlanScore {
  score: number;
  maxScore: number;
  selectedCount: number;
  requiredSelected: number;
  requiredTotal: number;
  missedRequired: PlanScoreLine[];
  harmful: PlanScoreLine[];
  strong: PlanScoreLine[];
  /** Expected problems the learner never added to the list. */
  missedProblems: string[];
}

/**
 * Scores the signed plan with the same classification weights the admission
 * workup uses, so a REQUIRED order is worth the same wherever it is placed.
 */
export function scorePlan(db: Db, patientId: string, caseId: string): PlanScore {
  const chart = buildChart(db, patientId, caseId);

  const result: PlanScore = {
    score: 0,
    maxScore: 0,
    selectedCount: 0,
    requiredSelected: 0,
    requiredTotal: 0,
    missedRequired: [],
    harmful: [],
    strong: [],
    missedProblems: [],
  };

  for (const problem of chart) {
    if (problem.isExpected && !problem.added) {
      result.missedProblems.push(problem.label);
    }

    for (const option of problem.options) {
      const weight = CLASSIFICATION_SCORE[option.classification] ?? 0;
      if (option.classification === "REQUIRED") {
        result.requiredTotal += 1;
        result.maxScore += weight;
      }

      if (!option.selected) {
        if (option.classification === "REQUIRED" && problem.added) {
          result.missedRequired.push({
            problemLabel: problem.label,
            optionLabel: option.label,
            classification: option.classification,
            feedbackText: option.feedbackText,
            missed: true,
          });
        }
        continue;
      }

      result.selectedCount += 1;
      result.score += weight;
      if (option.classification === "REQUIRED") result.requiredSelected += 1;

      const line: PlanScoreLine = {
        problemLabel: problem.label,
        optionLabel: option.label,
        classification: option.classification,
        feedbackText: option.feedbackText,
        missed: false,
      };
      if (option.classification === "CONTRAINDICATED" || option.classification === "UNNECESSARY") {
        result.harmful.push(line);
      } else if (option.classification === "REQUIRED") {
        result.strong.push(line);
      }
    }
  }

  return result;
}

/** Renders the current plan as note-like text (spec §20). */
export function renderPlanAsNote(chart: ProblemView[]): string {
  const lines: string[] = [];
  for (const problem of chart) {
    if (!problem.added) continue;
    lines.push(`# ${problem.label}`);
    if (problem.assessmentText) lines.push(problem.assessmentText);
    for (const option of problem.options) {
      if (option.selected) lines.push(`- ${option.label}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
