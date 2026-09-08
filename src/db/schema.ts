/**
 * Drizzle schema for the whole application.
 *
 * Design notes:
 *  - Content tables (concept, caseTemplate, lecture, ...) carry the demo
 *    markers so synthetic content can be deleted without touching the profile.
 *  - Progress tables (patientInstance, userConceptState, studyEvent) reference
 *    content, so demo deletion cascades through them by content id.
 *  - studyEvent is append-only: aggregates may be recomputed from it later.
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

/* ------------------------------------------------------------------ */
/* Profile & schedule                                                   */
/* ------------------------------------------------------------------ */

export const userProfile = sqliteTable("user_profile", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  degree: text("degree").notNull(),
  specialty: text("specialty").notNull(),
  /** ISO date (YYYY-MM-DD). */
  step3Date: text("step3_date").notNull(),
  targetPatientCount: integer("target_patient_count").notNull(),
  /** ISO date the study window opened; used for pace calculations. */
  studyStartDate: text("study_start_date").notNull(),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

export const rotationBlock = sqliteTable(
  "rotation_block",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    specialty: text("specialty").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("rotation_block_user_idx").on(t.userId, t.startDate)],
);

/** Small key/value store for preferences (TTS rate, voice, auto-read, ...). */
export const userSetting = sqliteTable(
  "user_setting",
  {
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

/* ------------------------------------------------------------------ */
/* Content                                                              */
/* ------------------------------------------------------------------ */

export const concept = sqliteTable(
  "concept",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    specialty: text("specialty").notNull(),
    topic: text("topic").notNull(),
    description: text("description").notNull().default(""),
    /** 1 (peripheral) .. 5 (core Step 3). */
    importance: integer("importance").notNull().default(3),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    contentOrigin: text("content_origin").notNull().default("AUTHORED"),
    demoSeedVersion: text("demo_seed_version"),
  },
  (t) => [index("concept_specialty_idx").on(t.specialty, t.topic)],
);

export const caseTemplate = sqliteTable(
  "case_template",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    specialty: text("specialty").notNull(),
    topic: text("topic").notNull(),
    primaryDiagnosis: text("primary_diagnosis").notNull(),
    /** 1 (straightforward) .. 5 (hard). */
    difficulty: integer("difficulty").notNull().default(3),
    /** 1 .. 5, how central this is to Step 3. */
    step3Importance: integer("step3_importance").notNull().default(3),
    /** Narrative sign-out read at morning handoff. */
    handoffScript: text("handoff_script").notNull(),
    /** One-liner the learner sees when the case arrives as an admission. */
    admissionOpening: text("admission_opening").notNull(),
    /** Teaching point shown after a handoff is accepted. */
    teachingPoint: text("teaching_point").notNull().default(""),
    /** Concise daily sign-out used for patients already on service. */
    dailySignout: text("daily_signout").notNull().default(""),
    minimumRoundsBeforeDischarge: integer("minimum_rounds_before_discharge")
      .notNull()
      .default(2),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    contentOrigin: text("content_origin").notNull().default("AUTHORED"),
    demoSeedVersion: text("demo_seed_version"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("case_template_specialty_idx").on(t.specialty, t.topic)],
);

export const caseConcept = sqliteTable(
  "case_concept",
  {
    caseId: text("case_id").notNull(),
    conceptId: text("concept_id").notNull(),
    /** Relative contribution of this concept to the case, 0..1. */
    weight: real("weight").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.caseId, t.conceptId] })],
);

/**
 * A discrete piece of case data. `initiallyVisible` rows are shown up-front;
 * everything else is revealed by ordering the matching `triggerActionCode`.
 */
export const caseFinding = sqliteTable(
  "case_finding",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    /** HISTORY | EXAM | VITAL | LAB | IMAGING | ECG | OTHER */
    category: text("category").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    units: text("units"),
    referenceRange: text("reference_range"),
    triggerActionCode: text("trigger_action_code"),
    initiallyVisible: integer("initially_visible", { mode: "boolean" })
      .notNull()
      .default(false),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [index("case_finding_case_idx").on(t.caseId, t.displayOrder)],
);

export const actionDefinition = sqliteTable("action_definition", {
  id: text("id").primaryKey(),
  actionCode: text("action_code").notNull().unique(),
  /** ORDER | TREATMENT | CONSULT | DISPOSITION | HISTORY | EXAM */
  category: text("category").notNull(),
  displayName: text("display_name").notNull(),
  /** JSON array of lowercase spoken/typed synonyms. */
  synonymsJson: text("synonyms_json").notNull().default("[]"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  contentOrigin: text("content_origin").notNull().default("AUTHORED"),
  demoSeedVersion: text("demo_seed_version"),
});

export const caseActionRule = sqliteTable(
  "case_action_rule",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    actionCode: text("action_code").notNull(),
    /** REQUIRED | APPROPRIATE | OPTIONAL | UNNECESSARY | CONTRAINDICATED */
    classification: text("classification").notNull(),
    /** Deterministic result text revealed when the action is taken. */
    resultText: text("result_text").notNull().default(""),
    feedbackText: text("feedback_text").notNull().default(""),
    conceptId: text("concept_id"),
  },
  (t) => [
    uniqueIndex("case_action_rule_case_action_idx").on(t.caseId, t.actionCode),
  ],
);

export const casePrompt = sqliteTable(
  "case_prompt",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    /** HANDOFF | ADMISSION | ROUNDS | DISCHARGE */
    stage: text("stage").notNull(),
    sequence: integer("sequence").notNull(),
    promptText: text("prompt_text").notNull(),
    /** MULTIPLE_CHOICE | ACTION | SHORT_TEXT | DIAGNOSIS | DISPOSITION */
    responseType: text("response_type").notNull(),
    /** JSON: options / correct keys / accepted synonyms. See domain/prompts. */
    answerConfigJson: text("answer_config_json").notNull(),
    correctFeedback: text("correct_feedback").notNull().default(""),
    incorrectFeedback: text("incorrect_feedback").notNull().default(""),
    conceptId: text("concept_id"),
  },
  (t) => [index("case_prompt_case_stage_idx").on(t.caseId, t.stage, t.sequence)],
);

export const lecture = sqliteTable(
  "lecture",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    specialty: text("specialty").notNull(),
    topic: text("topic").notNull(),
    /** NOON_CONFERENCE | MORNING_REPORT | GRAND_ROUNDS | CORE_LECTURE */
    lectureType: text("lecture_type").notNull(),
    summary: text("summary").notNull(),
    /** JSON array of section strings, read aloud one at a time. */
    audioScript: text("audio_script").notNull(),
    /** JSON array of concise key points. */
    keyPointsJson: text("key_points_json").notNull().default("[]"),
    estimatedMinutes: integer("estimated_minutes").notNull().default(5),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    contentOrigin: text("content_origin").notNull().default("AUTHORED"),
    demoSeedVersion: text("demo_seed_version"),
  },
  (t) => [index("lecture_specialty_idx").on(t.specialty, t.topic)],
);

export const lectureConcept = sqliteTable(
  "lecture_concept",
  {
    lectureId: text("lecture_id").notNull(),
    conceptId: text("concept_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.lectureId, t.conceptId] })],
);

/* ------------------------------------------------------------------ */
/* Learner state                                                        */
/* ------------------------------------------------------------------ */

export const patientInstance = sqliteTable(
  "patient_instance",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    caseId: text("case_id").notNull(),
    patientName: text("patient_name").notNull(),
    roomNumber: text("room_number").notNull(),
    /** HANDOFF | ADMISSION */
    entryMode: text("entry_mode").notNull(),
    /** PENDING_HANDOFF | PENDING_ADMISSION | ON_SERVICE | DISCHARGE_ELIGIBLE | DISCHARGED | ARCHIVED */
    state: text("state").notNull(),
    /** ISO date the scheduler created this instance. */
    assignedDate: text("assigned_date").notNull(),
    assignedAt: text("assigned_at").notNull().default(now),
    acceptedAt: text("accepted_at"),
    dischargedAt: text("discharged_at"),
    roundsCompleted: integer("rounds_completed").notNull().default(0),
    currentRoundPromptIndex: integer("current_round_prompt_index")
      .notNull()
      .default(0),
    /** JSON array of distinct ISO dates on which the learner interacted. */
    activeDatesJson: text("active_dates_json").notNull().default("[]"),
    /** ISO date of the last completed rounds encounter (one per day). */
    lastRoundsDate: text("last_rounds_date"),
    lastInteractedAt: text("last_interacted_at"),
    /** Set once the admission workup is finished. */
    admissionCompletedAt: text("admission_completed_at"),
  },
  (t) => [
    index("patient_instance_user_state_idx").on(t.userId, t.state),
    index("patient_instance_case_idx").on(t.caseId),
  ],
);

/** Actions the learner has taken during an admission, with revealed results. */
export const patientAction = sqliteTable(
  "patient_action",
  {
    id: text("id").primaryKey(),
    patientInstanceId: text("patient_instance_id").notNull(),
    actionCode: text("action_code").notNull(),
    classification: text("classification").notNull(),
    resultText: text("result_text").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("patient_action_patient_idx").on(t.patientInstanceId)],
);

/** Case findings the learner has legitimately uncovered. */
export const patientRevealedFinding = sqliteTable(
  "patient_revealed_finding",
  {
    patientInstanceId: text("patient_instance_id").notNull(),
    findingId: text("finding_id").notNull(),
    revealedAt: text("revealed_at").notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.patientInstanceId, t.findingId] })],
);

/** One row per answered prompt; drives the rounds history on the chart. */
export const patientPromptResponse = sqliteTable(
  "patient_prompt_response",
  {
    id: text("id").primaryKey(),
    patientInstanceId: text("patient_instance_id").notNull(),
    promptId: text("prompt_id").notNull(),
    stage: text("stage").notNull(),
    response: text("response").notNull(),
    correct: integer("correct", { mode: "boolean" }).notNull(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("patient_prompt_response_patient_idx").on(t.patientInstanceId)],
);

export const userConceptState = sqliteTable(
  "user_concept_state",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    conceptId: text("concept_id").notNull(),
    exposures: integer("exposures").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    incorrectCount: integer("incorrect_count").notNull().default(0),
    consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
    masteryLevel: integer("mastery_level").notNull().default(0),
    lastSeenAt: text("last_seen_at"),
    /** ISO date this concept next becomes due for review. */
    nextDueAt: text("next_due_at"),
  },
  (t) => [
    uniqueIndex("user_concept_state_unique_idx").on(t.userId, t.conceptId),
    index("user_concept_state_due_idx").on(t.userId, t.nextDueAt),
  ],
);

/** Append-only audit log of every meaningful learner interaction. */
export const studyEvent = sqliteTable(
  "study_event",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    patientInstanceId: text("patient_instance_id"),
    caseId: text("case_id"),
    conceptId: text("concept_id"),
    lectureId: text("lecture_id"),
    eventType: text("event_type").notNull(),
    response: text("response"),
    correct: integer("correct", { mode: "boolean" }),
    metadataJson: text("metadata_json").notNull().default("{}"),
    /** ISO date, denormalised so daily queries stay trivial. */
    eventDate: text("event_date").notNull(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    index("study_event_user_date_idx").on(t.userId, t.eventDate),
    index("study_event_type_idx").on(t.userId, t.eventType),
  ],
);

export const userLectureState = sqliteTable(
  "user_lecture_state",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    lectureId: text("lecture_id").notNull(),
    /** NOT_STARTED | IN_PROGRESS | COMPLETED */
    status: text("status").notNull().default("NOT_STARTED"),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    /** ISO date the scheduler suggested this lecture, if it did. */
    scheduledDate: text("scheduled_date"),
  },
  (t) => [uniqueIndex("user_lecture_state_unique_idx").on(t.userId, t.lectureId)],
);

/**
 * One row per study date recording what the scheduler decided, so the panel is
 * rebuilt from persistent state rather than recomputed non-deterministically.
 */
export const schedulerRun = sqliteTable(
  "scheduler_run",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    runDate: text("run_date").notNull(),
    /** JSON snapshot of inputs, scores and decisions for the debug page. */
    debugJson: text("debug_json").notNull().default("{}"),
    newPatientsAssigned: integer("new_patients_assigned").notNull().default(0),
    lectureId: text("lecture_id"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [uniqueIndex("scheduler_run_unique_idx").on(t.userId, t.runDate)],
);

export type UserProfileRow = typeof userProfile.$inferSelect;
export type RotationBlockRow = typeof rotationBlock.$inferSelect;
export type ConceptRow = typeof concept.$inferSelect;
export type CaseTemplateRow = typeof caseTemplate.$inferSelect;
export type CaseFindingRow = typeof caseFinding.$inferSelect;
export type CaseActionRuleRow = typeof caseActionRule.$inferSelect;
export type CasePromptRow = typeof casePrompt.$inferSelect;
export type ActionDefinitionRow = typeof actionDefinition.$inferSelect;
export type LectureRow = typeof lecture.$inferSelect;
export type PatientInstanceRow = typeof patientInstance.$inferSelect;
export type UserConceptStateRow = typeof userConceptState.$inferSelect;
export type StudyEventRow = typeof studyEvent.$inferSelect;
export type UserLectureStateRow = typeof userLectureState.$inferSelect;
export type SchedulerRunRow = typeof schedulerRun.$inferSelect;
export type PatientActionRow = typeof patientAction.$inferSelect;
export type PatientPromptResponseRow = typeof patientPromptResponse.$inferSelect;
