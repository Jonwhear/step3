/**
 * Case validation (spec §11).
 *
 * This is the gate that keeps broken content out of a learner's service. It
 * runs against the *database*, not against an authoring object, so it catches
 * the failures that only appear once content is stored — a prompt referencing
 * a concept that was later deleted, an action rule whose result nothing can
 * reveal, a lab code that no longer exists in the library.
 *
 * Errors block publication. Warnings do not: they are things an author should
 * probably look at, and refusing to publish over them would make the editor
 * hostile to normal iterative work.
 */

import { asc, eq, inArray } from "drizzle-orm";
import { answerConfigSchema } from "@/content/schema";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { listCaseProblems, listProblemOptions } from "@/domain/chart";

export type ValidationSeverity = "ERROR" | "WARNING";

export interface ValidationIssue {
  severity: ValidationSeverity;
  /** Short machine-readable code, useful for tests. */
  code: string;
  message: string;
  /** Where in the case the problem is, when it can be localised. */
  location?: string;
}

export interface ValidationResult {
  caseId: string;
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const REQUIRED_STAGES_WITH_PROMPTS = ["ROUNDS"] as const;

export function validateCase(db: Db, caseId: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const error = (code: string, message: string, location?: string) =>
    issues.push({ severity: "ERROR", code, message, location });
  const warn = (code: string, message: string, location?: string) =>
    issues.push({ severity: "WARNING", code, message, location });

  const template = db
    .select()
    .from(t.caseTemplate)
    .where(eq(t.caseTemplate.id, caseId))
    .get();

  if (!template) {
    return {
      caseId,
      ok: false,
      errors: [{ severity: "ERROR", code: "CASE_MISSING", message: "Case not found." }],
      warnings: [],
    };
  }

  /* ------------------------------ basics --------------------------------- */
  if (!template.specialty.trim()) error("NO_SPECIALTY", "The case has no primary specialty.");
  if (!template.primaryDiagnosis.trim()) {
    error("NO_DIAGNOSIS", "The case has no primary diagnosis.");
  }
  if (template.patientAgeYears !== null && (template.patientAgeYears < 0 || template.patientAgeYears > 120)) {
    error("BAD_AGE", `Patient age ${template.patientAgeYears} is not plausible.`);
  }
  if (template.patientSex && !["M", "F"].includes(template.patientSex)) {
    error("BAD_SEX", `Patient sex "${template.patientSex}" is not a recognised value.`);
  }

  /* ----------------------------- concepts -------------------------------- */
  const caseConceptIds = db
    .select({ conceptId: t.caseConcept.conceptId })
    .from(t.caseConcept)
    .where(eq(t.caseConcept.caseId, caseId))
    .all()
    .map((r) => r.conceptId);

  if (caseConceptIds.length === 0) {
    error("NO_CONCEPTS", "The case is not linked to any concept.");
  }

  const knownConceptIds = new Set(
    db.select({ id: t.concept.id }).from(t.concept).all().map((r) => r.id),
  );
  for (const conceptId of caseConceptIds) {
    if (!knownConceptIds.has(conceptId)) {
      error("MISSING_CONCEPT", `Case references concept "${conceptId}", which does not exist.`);
    }
  }

  /* ------------------------------ findings -------------------------------- */
  const findings = db
    .select()
    .from(t.caseFinding)
    .where(eq(t.caseFinding.caseId, caseId))
    .all();

  const actionRules = db
    .select()
    .from(t.caseActionRule)
    .where(eq(t.caseActionRule.caseId, caseId))
    .all();
  const ruleCodes = new Set(actionRules.map((r) => r.actionCode));
  const knownActionCodes = new Set(
    db
      .select({ code: t.actionDefinition.actionCode })
      .from(t.actionDefinition)
      .all()
      .map((r) => r.code),
  );

  const vitals = findings.filter((f) => f.category === "VITAL");
  if (vitals.length === 0) {
    warn("NO_VITALS", "The case defines no vital signs, so rounds will show an empty bedside.");
  }
  for (const vital of vitals) {
    if (!vital.value.trim()) {
      error("EMPTY_VITAL", `Vital sign "${vital.label}" has no value.`, vital.label);
    }
  }

  // Reachability is about the *action library*, not this case's rules: taking
  // an action the case has no rule for still reveals its findings, using the
  // generic "no case-specific abnormality" result. A trigger naming an action
  // that does not exist anywhere, though, can never fire.
  for (const finding of findings) {
    if (!finding.triggerActionCode) continue;
    if (!knownActionCodes.has(finding.triggerActionCode)) {
      error(
        "UNREACHABLE_FINDING",
        `Finding "${finding.label}" is revealed by "${finding.triggerActionCode}", which is not in the action library.`,
        finding.label,
      );
    } else if (!ruleCodes.has(finding.triggerActionCode)) {
      warn(
        "GENERIC_TRIGGER_RESULT",
        `Finding "${finding.label}" is revealed by "${finding.triggerActionCode}", but the case defines no rule for it, so the learner sees the generic result text.`,
        finding.label,
      );
    }
  }

  /* -------------------------------- labs ---------------------------------- */
  const labResults = db
    .select()
    .from(t.caseLabResult)
    .where(eq(t.caseLabResult.caseId, caseId))
    .all();

  if (labResults.length > 0) {
    const definitionIds = new Set(
      db
        .select({ id: t.labDefinition.id })
        .from(t.labDefinition)
        .where(inArray(t.labDefinition.id, [...new Set(labResults.map((l) => l.labDefinitionId))]))
        .all()
        .map((r) => r.id),
    );
    for (const lab of labResults) {
      if (!definitionIds.has(lab.labDefinitionId)) {
        error(
          "MISSING_LAB_DEFINITION",
          `Lab result references "${lab.labDefinitionId}", which is not in the lab library.`,
        );
      }
      if (!lab.value.trim()) {
        error("EMPTY_LAB_VALUE", `Lab "${lab.labDefinitionId}" has no value.`);
      }
      if (lab.triggerActionCode && !knownActionCodes.has(lab.triggerActionCode)) {
        error(
          "UNREACHABLE_LAB",
          `Lab "${lab.labDefinitionId}" is revealed by "${lab.triggerActionCode}", which is not in the action library.`,
        );
      }
    }
  }

  const imaging = db
    .select()
    .from(t.caseImagingResult)
    .where(eq(t.caseImagingResult.caseId, caseId))
    .all();
  for (const study of imaging) {
    if (!study.impression.trim()) {
      error("EMPTY_IMPRESSION", `Imaging study "${study.studyName}" has no impression.`);
    }
    if (study.triggerActionCode && !knownActionCodes.has(study.triggerActionCode)) {
      error(
        "UNREACHABLE_IMAGING",
        `Imaging study "${study.studyName}" is revealed by "${study.triggerActionCode}", which is not in the action library.`,
      );
    }
  }

  /* ---------------------------- action rules ------------------------------ */
  for (const rule of actionRules) {
    if (!knownActionCodes.has(rule.actionCode)) {
      error(
        "MISSING_ACTION",
        `Action rule references "${rule.actionCode}", which is not in the action library.`,
        rule.actionCode,
      );
    }
    if (!rule.feedbackText.trim()) {
      warn(
        "NO_ACTION_FEEDBACK",
        `Action "${rule.actionCode}" has no feedback, so taking it teaches nothing.`,
        rule.actionCode,
      );
    }
    if (rule.conceptId && !knownConceptIds.has(rule.conceptId)) {
      error(
        "MISSING_RULE_CONCEPT",
        `Action "${rule.actionCode}" references concept "${rule.conceptId}", which does not exist.`,
        rule.actionCode,
      );
    }
  }

  const requiredRules = actionRules.filter((r) => r.classification === "REQUIRED");
  if (actionRules.length > 0 && requiredRules.length === 0) {
    warn("NO_REQUIRED_ACTION", "No action is classified REQUIRED, so the workup cannot be scored.");
  }

  /* ------------------------------- prompts -------------------------------- */
  const prompts = db
    .select()
    .from(t.casePrompt)
    .where(eq(t.casePrompt.caseId, caseId))
    .orderBy(asc(t.casePrompt.sequence))
    .all();

  if (prompts.length === 0) error("NO_PROMPTS", "The case has no prompts.");

  for (const stage of REQUIRED_STAGES_WITH_PROMPTS) {
    if (!prompts.some((p) => p.stage === stage)) {
      error("MISSING_STAGE_PROMPT", `The case has no ${stage} prompt, so it generates no work.`);
    }
  }

  // Discharge is offered whenever the case can reach DISCHARGE_ELIGIBLE.
  if (
    template.minimumRoundsBeforeDischarge > 0 &&
    !prompts.some((p) => p.stage === "DISCHARGE")
  ) {
    warn(
      "NO_DISCHARGE_PROMPT",
      "The case becomes discharge-eligible but defines no discharge prompt.",
    );
  }

  const seenSequences = new Map<string, Set<number>>();
  for (const prompt of prompts) {
    const stageSet = seenSequences.get(prompt.stage) ?? new Set<number>();
    if (stageSet.has(prompt.sequence)) {
      error(
        "DUPLICATE_SEQUENCE",
        `Two ${prompt.stage} prompts share sequence ${prompt.sequence}.`,
        prompt.id,
      );
    }
    stageSet.add(prompt.sequence);
    seenSequences.set(prompt.stage, stageSet);

    if (prompt.conceptId && !knownConceptIds.has(prompt.conceptId)) {
      error(
        "MISSING_PROMPT_CONCEPT",
        `Prompt references concept "${prompt.conceptId}", which does not exist.`,
        prompt.id,
      );
    }

    validateAnswerConfig(prompt, knownActionCodes, error, warn);
  }

  /* ------------------------------- problems ------------------------------- */
  for (const problem of listCaseProblems(db, caseId)) {
    const options = listProblemOptions(db, problem.id);
    if (options.length < 2) {
      error(
        "THIN_PROBLEM",
        `Problem "${problem.label}" has fewer than two plan options.`,
        problem.label,
      );
    }
    if (!options.some((o) => o.classification === "REQUIRED")) {
      warn(
        "NO_REQUIRED_OPTION",
        `Problem "${problem.label}" has no REQUIRED option, so it cannot be scored.`,
        problem.label,
      );
    }
    for (const option of options) {
      if (option.actionCode && !knownActionCodes.has(option.actionCode)) {
        error(
          "MISSING_OPTION_ACTION",
          `Plan option "${option.label}" references unknown action "${option.actionCode}".`,
          problem.label,
        );
      }
    }
  }

  /* --------------------------- learning points ---------------------------- */
  const mappings = db
    .select()
    .from(t.learningPointMapping)
    .where(eq(t.learningPointMapping.caseId, caseId))
    .all();

  const knownPointIds = new Set(
    db.select({ id: t.learningPoint.id }).from(t.learningPoint).all().map((r) => r.id),
  );
  for (const mapping of mappings) {
    if (!knownPointIds.has(mapping.learningPointId)) {
      error(
        "ORPHAN_MAPPING",
        `A learning-point mapping points at "${mapping.learningPointId}", which no longer exists.`,
      );
    }
  }

  /* ------------------------------- sources -------------------------------- */
  const knownSourceIds = new Set(
    db.select({ id: t.contentSource.id }).from(t.contentSource).all().map((r) => r.id),
  );
  const evidence = db
    .select()
    .from(t.evidenceLink)
    .where(eq(t.evidenceLink.entityId, caseId))
    .all();
  for (const link of evidence) {
    if (!knownSourceIds.has(link.contentSourceId)) {
      error(
        "MISSING_SOURCE",
        `Evidence link references source "${link.contentSourceId}", which does not exist.`,
      );
    }
  }

  const errors = issues.filter((i) => i.severity === "ERROR");
  const warnings = issues.filter((i) => i.severity === "WARNING");
  return { caseId, ok: errors.length === 0, errors, warnings };
}

/**
 * Checks the stored answer config. The single most important rule here is that
 * a choice-type prompt has exactly one defined correct answer — a correctKey
 * that matches no choice makes the question permanently unanswerable.
 */
function validateAnswerConfig(
  prompt: t.CasePromptRow,
  knownActionCodes: ReadonlySet<string>,
  error: (code: string, message: string, location?: string) => void,
  warn: (code: string, message: string, location?: string) => void,
): void {
  let config;
  try {
    config = answerConfigSchema.parse(JSON.parse(prompt.answerConfigJson));
  } catch {
    error("BAD_ANSWER_CONFIG", "The prompt's answer configuration is malformed.", prompt.id);
    return;
  }

  switch (config.kind) {
    case "MULTIPLE_CHOICE":
    case "DIAGNOSIS":
    case "DISPOSITION": {
      const matching = config.choices.filter((c) => c.key === config.correctKey);
      if (matching.length === 0) {
        error(
          "NO_CORRECT_ANSWER",
          `Correct key "${config.correctKey}" does not match any choice.`,
          prompt.id,
        );
      } else if (matching.length > 1) {
        error(
          "AMBIGUOUS_CORRECT_ANSWER",
          `Correct key "${config.correctKey}" matches ${matching.length} choices.`,
          prompt.id,
        );
      }
      const keys = new Set<string>();
      for (const choice of config.choices) {
        if (keys.has(choice.key)) {
          error("DUPLICATE_CHOICE_KEY", `Choice key "${choice.key}" is used twice.`, prompt.id);
        }
        keys.add(choice.key);
      }
      break;
    }

    case "ACTION": {
      for (const code of config.correctActionCodes) {
        if (!config.options.includes(code)) {
          error(
            "CORRECT_ACTION_NOT_OFFERED",
            `Correct action "${code}" is not among the offered options.`,
            prompt.id,
          );
        }
        if (!knownActionCodes.has(code)) {
          error("MISSING_PROMPT_ACTION", `Prompt references unknown action "${code}".`, prompt.id);
        }
      }
      break;
    }

    case "SHORT_TEXT": {
      if (config.acceptedAnswers.length === 0) {
        error("NO_ACCEPTED_ANSWER", "Short-text prompt accepts no answers.", prompt.id);
      }
      if (config.suggestions.length === 0) {
        warn(
          "NO_SUGGESTIONS",
          "Short-text prompt offers no suggestions, so it cannot be answered without a keyboard.",
          prompt.id,
        );
      }
      break;
    }
  }

  if (!prompt.correctFeedback.trim() && !prompt.whyCorrect.trim()) {
    warn("NO_CORRECT_FEEDBACK", "The prompt gives no feedback for a correct answer.", prompt.id);
  }
  if (!prompt.incorrectFeedback.trim() && !prompt.whyCorrect.trim()) {
    warn(
      "NO_INCORRECT_FEEDBACK",
      "The prompt gives no feedback for an incorrect answer.",
      prompt.id,
    );
  }
}

/** Validates every case in the library. Used by the content library screen. */
export function validateAllCases(db: Db): ValidationResult[] {
  return db
    .select({ id: t.caseTemplate.id })
    .from(t.caseTemplate)
    .all()
    .map((row) => validateCase(db, row.id));
}
