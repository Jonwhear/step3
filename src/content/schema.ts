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

/**
 * How a finding functions in the case (spec §12). Authoring/debugging metadata:
 * it drives validation and the case-review screen, and is never shown to the
 * learner — a labelled distractor would stop being a distractor.
 */
export const CLINICAL_ROLE_ENUM = z.enum([
  "KEY_POSITIVE",
  "KEY_NEGATIVE",
  "CONTEXT",
  "DISTRACTOR",
]);
export type ClinicalRole = z.infer<typeof CLINICAL_ROLE_ENUM>;

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
  clinicalRole: CLINICAL_ROLE_ENUM.default("CONTEXT"),
});
export type CaseFindingInput = z.input<typeof caseFindingSchema>;

/* ------------------------- laboratory & imaging --------------------------- */

const rangeSchema = z.object({ low: z.number(), high: z.number() });

export const labDefinitionSchema = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  displayName: z.string().min(1),
  units: z.string().default(""),
  referenceLow: z.number().optional(),
  referenceHigh: z.number().optional(),
  /** For analytes where a numeric range is meaningless ("Negative"). */
  referenceText: z.string().optional(),
  sexSpecificRange: z.object({ male: rangeSchema, female: rangeSchema }).optional(),
  category: z.enum(["CBC", "BMP", "LIVER", "COAGULATION", "CARDIAC", "URINALYSIS", "OTHER"]),
  displayOrder: z.number().int().min(0).default(0),
});
export type LabDefinitionInput = z.input<typeof labDefinitionSchema>;

export const caseLabResultSchema = z.object({
  /** Must match a code in the central lab library. */
  labCode: z.string().min(1),
  value: z.string().min(1),
  /** Omit to have the seeder derive the flag from the reference range. */
  flag: z
    .enum(["NORMAL", "LOW", "HIGH", "CRITICAL_LOW", "CRITICAL_HIGH", "ABNORMAL"])
    .optional(),
  triggerActionCode: z.string().optional(),
  collectedLabel: z.string().default(""),
  clinicalRole: CLINICAL_ROLE_ENUM.default("CONTEXT"),
});
export type CaseLabResultInput = z.input<typeof caseLabResultSchema>;

export const caseImagingResultSchema = z.object({
  studyName: z.string().min(3),
  modality: z.enum(["CT", "XRAY", "US", "MRI", "ECHO", "NUCLEAR", "OTHER"]).default("OTHER"),
  performedLabel: z.string().default(""),
  impression: z.string().min(5),
  findingsText: z.string().default(""),
  triggerActionCode: z.string().optional(),
  /** Reserved for future attached media; text-only studies leave these unset. */
  imageAssetPath: z.string().optional(),
  thumbnailAssetPath: z.string().optional(),
  clinicalRole: CLINICAL_ROLE_ENUM.default("CONTEXT"),
});
export type CaseImagingResultInput = z.input<typeof caseImagingResultSchema>;

/* ------------------------- assessment & plan ------------------------------ */

export const caseProblemOptionSchema = z.object({
  label: z.string().min(2),
  classification: z.enum(CLASSIFICATIONS),
  actionCode: z.string().optional(),
  feedbackText: z.string().default(""),
  conceptCode: z.string().optional(),
});
export type CaseProblemOptionInput = z.input<typeof caseProblemOptionSchema>;

export const caseProblemSchema = z.object({
  label: z.string().min(2),
  assessmentText: z.string().default(""),
  isPrimary: z.boolean().default(false),
  /** False for problems offered as plausible but incorrect additions. */
  isExpected: z.boolean().default(true),
  conceptCode: z.string().optional(),
  options: z.array(caseProblemOptionSchema).min(2),
});
export type CaseProblemInput = z.input<typeof caseProblemSchema>;

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
  /* Layered explanation (spec §24); each is optional. */
  whyCorrect: z.string().default(""),
  whyOthersWrong: z.string().default(""),
  caseEvidence: z.string().default(""),
  detailedExplanation: z.string().default(""),
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
  /* --- EMR structure (spec §13-16, §21) --------------------------------- */
  labs: z.array(caseLabResultSchema).default([]),
  imaging: z.array(caseImagingResultSchema).default([]),
  problems: z.array(caseProblemSchema).default([]),
  /* --- chart header demographics (spec §53) ----------------------------- */
  patientAgeYears: z.number().int().min(0).max(120).optional(),
  patientSex: z.enum(["M", "F"]).optional(),
  chiefComplaint: z.string().default(""),
  codeStatus: z.string().default(""),
  allergies: z.string().default(""),
});
export type CaseTemplateInput = z.input<typeof caseTemplateSchema>;

/**
 * A headed lecture section (spec §17).
 *
 * `body` uses a constrained markdown subset — paragraphs, `- ` bullets and
 * `**bold**` — never raw HTML, so it can be rendered safely on screen and
 * re-rendered separately as plain text for speech (spec §60).
 */
export const lectureSectionSchema = z.object({
  heading: z.string().min(2),
  body: z.string().min(20),
  /** Reserved for future figures; text-only sections omit these. */
  mediaType: z.enum(["IMAGE", "DIAGRAM", "TABLE"]).optional(),
  mediaAssetPath: z.string().optional(),
  caption: z.string().optional(),
  altText: z.string().optional(),
});
export type LectureSectionInput = z.input<typeof lectureSectionSchema>;

export const lectureSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  specialty: z.enum(CONTENT_SPECIALTIES),
  topic: z.string().min(2),
  lectureType: z.enum(LECTURE_TYPES),
  summary: z.string().min(20),
  /**
   * Flat script, read one paragraph at a time. Retained because most bundled
   * lectures still use it; a lecture that supplies `sections` overrides it.
   */
  audioScript: z.array(z.string().min(20)).min(2),
  /** Structured, headed body. Preferred for new content. */
  sections: z.array(lectureSectionSchema).optional(),
  keyPoints: z.array(z.string().min(5)).min(2),
  estimatedMinutes: z.number().int().min(1).max(20).default(5),
  conceptCodes: z.array(z.string()).min(1),
});
export type LectureInput = z.input<typeof lectureSchema>;

export const learningPointContentSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(5),
  description: z.string().default(""),
  specialty: z.string().default(""),
  topic: z.string().default(""),
  importance: z.number().int().min(1).max(5).default(3),
  /** Identifier of the source this was extracted from, if any. */
  sourceCode: z.string().optional(),
  sourceFragmentIndex: z.number().int().min(0).optional(),
  /** Where this point is tested. Case codes and lecture codes. */
  caseCodes: z.array(z.string()).default([]),
  lectureCodes: z.array(z.string()).default([]),
});
export type LearningPointContentInput = z.input<typeof learningPointContentSchema>;

export const contentSourceSchema = z.object({
  code: z.string().min(3),
  sourceType: z.enum(["DEMO", "UWORLD", "FIRST_AID", "GUIDELINE", "CUSTOM", "OTHER"]),
  title: z.string().min(3),
  sourceIdentifier: z.string().default(""),
  section: z.string().default(""),
  subsection: z.string().default(""),
  notes: z.string().default(""),
  version: z.string().default(""),
  /** Raw material, split into persisted fragments at seed time. */
  fragments: z.array(z.object({ label: z.string().default(""), rawText: z.string().min(1) })).default([]),
});
export type ContentSourceInputContent = z.input<typeof contentSourceSchema>;

export const demoContentSchema = z.object({
  concepts: z.array(conceptSchema).min(1),
  actions: z.array(actionDefinitionSchema).min(1),
  cases: z.array(caseTemplateSchema).min(1),
  lectures: z.array(lectureSchema).min(1),
  labDefinitions: z.array(labDefinitionSchema).default([]),
  sources: z.array(contentSourceSchema).default([]),
  learningPoints: z.array(learningPointContentSchema).default([]),
});
export type DemoContent = z.output<typeof demoContentSchema>;
