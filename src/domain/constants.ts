/** Shared enums / literal unions used across the domain layer. */

export const PATIENT_STATES = [
  "PENDING_HANDOFF",
  "PENDING_ADMISSION",
  "ON_SERVICE",
  "DISCHARGE_ELIGIBLE",
  "DISCHARGED",
  "ARCHIVED",
] as const;
export type PatientState = (typeof PATIENT_STATES)[number];

/** States that occupy a slot on the active panel. */
export const ACTIVE_PANEL_STATES: readonly PatientState[] = [
  "PENDING_HANDOFF",
  "PENDING_ADMISSION",
  "ON_SERVICE",
  "DISCHARGE_ELIGIBLE",
];

export const ENTRY_MODES = ["HANDOFF", "ADMISSION"] as const;
export type EntryMode = (typeof ENTRY_MODES)[number];

export const CASE_STAGES = ["HANDOFF", "ADMISSION", "ROUNDS", "DISCHARGE"] as const;
export type CaseStage = (typeof CASE_STAGES)[number];

export const RESPONSE_TYPES = [
  "MULTIPLE_CHOICE",
  "ACTION",
  "SHORT_TEXT",
  "DIAGNOSIS",
  "DISPOSITION",
] as const;
export type ResponseType = (typeof RESPONSE_TYPES)[number];

export const FINDING_CATEGORIES = [
  "HISTORY",
  "EXAM",
  "VITAL",
  "LAB",
  "IMAGING",
  "ECG",
  "OTHER",
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const ACTION_CATEGORIES = [
  "HISTORY",
  "EXAM",
  "ORDER",
  "TREATMENT",
  "CONSULT",
  "DISPOSITION",
] as const;
export type ActionCategory = (typeof ACTION_CATEGORIES)[number];

export const CLASSIFICATIONS = [
  "REQUIRED",
  "APPROPRIATE",
  "OPTIONAL",
  "UNNECESSARY",
  "CONTRAINDICATED",
] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

/** Points awarded per classification when scoring an admission. */
export const CLASSIFICATION_SCORE: Record<Classification, number> = {
  REQUIRED: 2,
  APPROPRIATE: 1,
  OPTIONAL: 0,
  UNNECESSARY: -1,
  CONTRAINDICATED: -3,
};

export const CLASSIFICATION_TONE: Record<Classification, "good" | "neutral" | "warn" | "bad"> = {
  REQUIRED: "good",
  APPROPRIATE: "good",
  OPTIONAL: "neutral",
  UNNECESSARY: "warn",
  CONTRAINDICATED: "bad",
};

export const LECTURE_TYPES = [
  "NOON_CONFERENCE",
  "MORNING_REPORT",
  "GRAND_ROUNDS",
  "CORE_LECTURE",
] as const;
export type LectureType = (typeof LECTURE_TYPES)[number];

export const LECTURE_TYPE_LABELS: Record<LectureType, string> = {
  NOON_CONFERENCE: "Noon Conference",
  MORNING_REPORT: "Morning Report",
  GRAND_ROUNDS: "Grand Rounds",
  CORE_LECTURE: "Core Lecture",
};

export const LECTURE_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export type LectureStatus = (typeof LECTURE_STATUSES)[number];

export const STUDY_EVENT_TYPES = [
  "HANDOFF_COMPLETED",
  "PATIENT_ACCEPTED",
  "ROUND_COMPLETED",
  "ADMISSION_ACTION",
  "ADMISSION_COMPLETED",
  "PROMPT_CORRECT",
  "PROMPT_INCORRECT",
  "PATIENT_DISCHARGED",
  "LECTURE_STARTED",
  "LECTURE_COMPLETED",
  "PATIENT_ASSIGNED",
] as const;
export type StudyEventType = (typeof STUDY_EVENT_TYPES)[number];

/** Fallback result when a case defines no outcome for an ordered test. */
export const UNDEFINED_RESULT_TEXT =
  "No case-specific abnormality is defined for this test.";
