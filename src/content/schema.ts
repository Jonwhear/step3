/**
 * Zod schemas for authored content.
 *
 * Every seed object is validated before it reaches the database, so a typo in
 * a case file fails loudly at seed time rather than producing a broken patient
 * three screens into the app.
 */

import { z } from "zod";
import {
  ACTION_CATEGORIES,
  CASE_STAGES,
  CLASSIFICATIONS,
  FINDING_CATEGORIES,
  LECTURE_TYPES,
  RESPONSE_TYPES,
} from "@/domain/constants";
import { CONTENT_SPECIALTIES } from "@/config/app";

export const conceptSchema = z.object({
  /** Stable dotted code, e.g. "CARD.AF.01". */
  code: z.string().regex(/^[A-Z0-9]+(\.[A-Z0-9]+)+$/),
  name: z.string().min(3),
  specialty: z.enum(CONTENT_SPECIALTIES),
  topic: z.string().min(2),
  description: z.string().default(""),
  importance: z.number().int().min(1).max(5).default(3),
});
export type ConceptInput = z.input<typeof conceptSchema>;

export const actionDefinitionSchema = z.object({
  actionCode: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
  category: z.enum(ACTION_CATEGORIES),
  displayName: z.string().min(2),
  /** Lowercase spoken/typed forms accepted by the speech matcher. */
  synonyms: z.array(z.string().min(1)).default([]),
});
export type ActionDefinitionInput = z.input<typeof actionDefinitionSchema>;

export const caseFindingSchema = z.object({
  category: z.enum(FINDING_CATEGORIES),
  label: z.string().min(1),
  value: z.string().min(1),
  units: z.string().optional(),
  referenceRange: z.string().optional(),
  /** Revealed by this action; omit for findings visible from the start. */
  triggerActionCode: z.string().optional(),
  initiallyVisible: z.boolean().default(false),
});
export type CaseFindingInput = z.input<typeof caseFindingSchema>;

export const caseActionRuleSchema = z.object({
  actionCode: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
  classification: z.enum(CLASSIFICATIONS),
  /** Deterministic result text. Never invented at runtime. */
  resultText: z.string().default(""),
  feedbackText: z.string().default(""),
  conceptCode: z.string().optional(),
});
export type CaseActionRuleInput = z.input<typeof caseActionRuleSchema>;

/*
 * Authoring types are z.input (defaults optional); the seeder consumes the
 * parsed z.output where every default has been filled in.
 */

/* -------------------------- prompt answer configs ------------------------- */

const choiceSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

export const multipleChoiceConfigSchema = z.object({
  kind: z.literal("MULTIPLE_CHOICE"),
  choices: z.array(choiceSchema).min(2),
  correctKey: z.string().min(1),
});

export const actionConfigSchema = z.object({
  kind: z.literal("ACTION"),
  /** Action codes offered as buttons. */
  options: z.array(z.string()).min(2),
  correctActionCodes: z.array(z.string()).min(1),
});

export const shortTextConfigSchema = z.object({
  kind: z.literal("SHORT_TEXT"),
  /** Normalised accepted answers; matching is exact after normalisation. */
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  /** Optional buttons so the prompt still works without a keyboard. */
  suggestions: z.array(z.string()).default([]),
});

export const diagnosisConfigSchema = z.object({
  kind: z.literal("DIAGNOSIS"),
  choices: z.array(choiceSchema).min(2),
  correctKey: z.string().min(1),
});

export const dispositionConfigSchema = z.object({
  kind: z.literal("DISPOSITION"),
  choices: z.array(choiceSchema).min(2),
  correctKey: z.string().min(1),
});

export const answerConfigSchema = z.discriminatedUnion("kind", [
  multipleChoiceConfigSchema,
  actionConfigSchema,
  shortTextConfigSchema,
  diagnosisConfigSchema,
  dispositionConfigSchema,
]);
export type AnswerConfig = z.output<typeof answerConfigSchema>;
export type AnswerConfigInput = z.input<typeof answerConfigSchema>;

export const casePromptSchema = z.object({
  stage: z.enum(CASE_STAGES),
  promptText: z.string().min(5),
  responseType: z.enum(RESPONSE_TYPES),
  answerConfig: answerConfigSchema,
  correctFeedback: z.string().default(""),
  incorrectFeedback: z.string().default(""),
  conceptCode: z.string().optional(),
});
export type CasePromptInput = z.input<typeof casePromptSchema>;

export const caseTemplateSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  specialty: z.enum(CONTENT_SPECIALTIES),
  topic: z.string().min(2),
  primaryDiagnosis: z.string().min(3),
  difficulty: z.number().int().min(1).max(5).default(3),
  step3Importance: z.number().int().min(1).max(5).default(3),
  /** Read aloud at morning handoff when the patient is new. */
  handoffScript: z.string().min(20),
  /** Concise re-sign-out for a patient already on service. */
  dailySignout: z.string().min(10),
  /** The one-liner an active admission opens with. */
  admissionOpening: z.string().min(20),
  teachingPoint: z.string().default(""),
  minimumRoundsBeforeDischarge: z.number().int().min(1).max(6).default(2),
  /** Concept codes with relative weight. */
  concepts: z
    .array(z.object({ code: z.string(), weight: z.number().min(0).max(1).default(1) }))
    .min(1),
  findings: z.array(caseFindingSchema).default([]),
  actionRules: z.array(caseActionRuleSchema).default([]),
  prompts: z.array(casePromptSchema).min(1),
});
export type CaseTemplateInput = z.input<typeof caseTemplateSchema>;

export const lectureSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  specialty: z.enum(CONTENT_SPECIALTIES),
  topic: z.string().min(2),
  lectureType: z.enum(LECTURE_TYPES),
  summary: z.string().min(20),
  /** Sections are read one at a time so audio can advance section-by-section. */
  audioScript: z.array(z.string().min(20)).min(2),
  keyPoints: z.array(z.string().min(5)).min(2),
  estimatedMinutes: z.number().int().min(1).max(20).default(5),
  conceptCodes: z.array(z.string()).min(1),
});
export type LectureInput = z.input<typeof lectureSchema>;

export const demoContentSchema = z.object({
  concepts: z.array(conceptSchema).min(1),
  actions: z.array(actionDefinitionSchema).min(1),
  cases: z.array(caseTemplateSchema).min(1),
  lectures: z.array(lectureSchema).min(1),
});
export type DemoContent = z.output<typeof demoContentSchema>;
