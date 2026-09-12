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
    /** DRAFT | NEEDS_REVIEW | REVIEWED | PUBLISHED | ARCHIVED (spec §62). */
    status: text("status").notNull().default("PUBLISHED"),
    reviewStatus: text("review_status").notNull().default("UNREVIEWED"),
    reviewedAt: text("reviewed_at"),
    reviewNotes: text("review_notes").notNull().default(""),
    /** Owning content pack; builtin demo content belongs to the demo pack. */
    packId: text("pack_id"),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by").notNull().default("system"),
    /** Set when this case was duplicated from a bundled one. */
    derivedFromCaseId: text("derived_from_case_id"),
    /* Demographics kept structured so the chart header never parses prose. */
    patientAgeYears: integer("patient_age_years"),
    patientSex: text("patient_sex"),
    chiefComplaint: text("chief_complaint").notNull().default(""),
    codeStatus: text("code_status").notNull().default(""),
    allergies: text("allergies").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    index("case_template_specialty_idx").on(t.specialty, t.topic),
    index("case_template_status_idx").on(t.status),
  ],
);

/** Snapshot taken before each custom-case edit so a bad edit can be reverted. */
export const caseRevision = sqliteTable(
  "case_revision",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    version: integer("version").notNull(),
    snapshotJson: text("snapshot_json").notNull(),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("case_revision_case_idx").on(t.caseId, t.version)],
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
    /**
     * KEY_POSITIVE | KEY_NEGATIVE | CONTEXT | DISTRACTOR (spec §12).
     * Authoring/debugging metadata — never surfaced to the learner.
     */
    clinicalRole: text("clinical_role").notNull().default("CONTEXT"),
  },
  (t) => [index("case_finding_case_idx").on(t.caseId, t.displayOrder)],
);

/* ------------------------------------------------------------------ */
/* Laboratory library (spec §14)                                        */
/* ------------------------------------------------------------------ */

/**
 * Central reference-range library. Normal ranges live here once rather than
 * being repeated in every case file, so a range correction lands everywhere.
 */
export const labDefinition = sqliteTable(
  "lab_definition",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    displayName: text("display_name").notNull(),
    units: text("units").notNull().default(""),
    referenceLow: real("reference_low"),
    referenceHigh: real("reference_high"),
    /** Used when a numeric range is meaningless ("negative", "clear"). */
    referenceText: text("reference_text"),
    /** JSON: { male: {low, high}, female: {low, high} } when sex matters. */
    sexSpecificRangeJson: text("sex_specific_range_json"),
    /** CBC | BMP | LIVER | COAGULATION | CARDIAC | URINALYSIS | OTHER */
    category: text("category").notNull().default("OTHER"),
    displayOrder: integer("display_order").notNull().default(0),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    contentOrigin: text("content_origin").notNull().default("AUTHORED"),
    demoSeedVersion: text("demo_seed_version"),
  },
  (t) => [index("lab_definition_category_idx").on(t.category, t.displayOrder)],
);

export const caseLabResult = sqliteTable(
  "case_lab_result",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    labDefinitionId: text("lab_definition_id").notNull(),
    value: text("value").notNull(),
    /** NORMAL | LOW | HIGH | CRITICAL_LOW | CRITICAL_HIGH | ABNORMAL */
    flag: text("flag").notNull().default("NORMAL"),
    /** Null means available from the start; otherwise this order reveals it. */
    triggerActionCode: text("trigger_action_code"),
    /** Narrative collection time, e.g. "Hospital day 1, 06:20". */
    collectedLabel: text("collected_label").notNull().default(""),
    clinicalRole: text("clinical_role").notNull().default("CONTEXT"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [index("case_lab_result_case_idx").on(t.caseId, t.displayOrder)],
);

export const caseImagingResult = sqliteTable(
  "case_imaging_result",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    studyName: text("study_name").notNull(),
    /** CT | XRAY | US | MRI | ECHO | NUCLEAR | OTHER */
    modality: text("modality").notNull().default("OTHER"),
    performedLabel: text("performed_label").notNull().default(""),
    impression: text("impression").notNull(),
    findingsText: text("findings_text").notNull().default(""),
    triggerActionCode: text("trigger_action_code"),
    /** Reserved for future attached media; null for text-only studies. */
    imageAssetPath: text("image_asset_path"),
    thumbnailAssetPath: text("thumbnail_asset_path"),
    clinicalRole: text("clinical_role").notNull().default("CONTEXT"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [index("case_imaging_result_case_idx").on(t.caseId, t.displayOrder)],
);

/* ------------------------------------------------------------------ */
/* Assessment & Plan (spec §20-21)                                      */
/* ------------------------------------------------------------------ */

/** A named problem on the case's problem list, e.g. "Upper GI Bleed". */
export const caseProblem = sqliteTable(
  "case_problem",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    label: text("label").notNull(),
    /** Shown once the learner adds the problem; never invented at runtime. */
    assessmentText: text("assessment_text").notNull().default(""),
    /** True when the learner is expected to identify this problem. */
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    isExpected: integer("is_expected", { mode: "boolean" }).notNull().default(true),
    conceptId: text("concept_id"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [index("case_problem_case_idx").on(t.caseId, t.displayOrder)],
);

/** One selectable plan item under a problem. Deterministically scored. */
export const caseProblemOption = sqliteTable(
  "case_problem_option",
  {
    id: text("id").primaryKey(),
    problemId: text("problem_id").notNull(),
    label: text("label").notNull(),
    /** REQUIRED | APPROPRIATE | OPTIONAL | UNNECESSARY | CONTRAINDICATED */
    classification: text("classification").notNull(),
    /** Optional link to the shared action library. */
    actionCode: text("action_code"),
    feedbackText: text("feedback_text").notNull().default(""),
    conceptId: text("concept_id"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [index("case_problem_option_problem_idx").on(t.problemId, t.displayOrder)],
);

/** What this learner actually selected on this patient's plan. */
export const patientPlanSelection = sqliteTable(
  "patient_plan_selection",
  {
    patientInstanceId: text("patient_instance_id").notNull(),
    optionId: text("option_id").notNull(),
    problemId: text("problem_id").notNull(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.patientInstanceId, t.optionId] })],
);

/** Problems the learner has added to this patient's problem list. */
export const patientProblem = sqliteTable(
  "patient_problem",
  {
    patientInstanceId: text("patient_instance_id").notNull(),
    problemId: text("problem_id").notNull(),
    addedAt: text("added_at").notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.patientInstanceId, t.problemId] })],
);

/**
 * A numeric observation as it stood on one hospital day (spec V3 §13).
 *
 * Case content carries one value per vital and lab, so the only honest source
 * of a *prior* value is what the learner was actually shown on an earlier day.
 * Rounds sign-off writes that day's values here; the trend disclosure then
 * reports history rather than inventing one. The primary key makes a day's
 * record write-once, so re-signing cannot duplicate or rewrite it.
 */
export const patientObservation = sqliteTable(
  "patient_observation",
  {
    patientInstanceId: text("patient_instance_id").notNull(),
    /** Stable identity across days, e.g. "VITAL:Heart rate" or "LAB:BMP-K". */
    observationKey: text("observation_key").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    units: text("units"),
    /** The narrative day this value belongs to, never a calendar date. */
    hospitalDay: integer("hospital_day").notNull(),
    recordedAt: text("recorded_at").notNull().default(now),
  },
  (t) => [
    primaryKey({
      columns: [t.patientInstanceId, t.observationKey, t.hospitalDay],
    }),
    index("patient_observation_patient_idx").on(t.patientInstanceId, t.observationKey),
  ],
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
    /* Richer feedback (spec §24). All optional; blanks are simply not shown. */
    whyCorrect: text("why_correct").notNull().default(""),
    whyOthersWrong: text("why_others_wrong").notNull().default(""),
    caseEvidence: text("case_evidence").notNull().default(""),
    detailedExplanation: text("detailed_explanation").notNull().default(""),
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

/**
 * Structured lecture body (spec §17). `body` holds a constrained markdown
 * subset (paragraphs, `- ` bullets, `**bold**`) — never arbitrary HTML — and a
 * separate plain-text rendering is produced for speech so markup is never read
 * aloud (spec §60).
 */
export const lectureSection = sqliteTable(
  "lecture_section",
  {
    id: text("id").primaryKey(),
    lectureId: text("lecture_id").notNull(),
    heading: text("heading").notNull(),
    body: text("body").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    ttsOrder: integer("tts_order").notNull().default(0),
    /** IMAGE | DIAGRAM | TABLE — reserved; null for text-only sections. */
    mediaType: text("media_type"),
    mediaAssetPath: text("media_asset_path"),
    caption: text("caption"),
    altText: text("alt_text"),
  },
  (t) => [index("lecture_section_lecture_idx").on(t.lectureId, t.displayOrder)],
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
    /** ED | INPATIENT | DISCHARGED (spec §56). */
    locationType: text("location_type").notNull().default("INPATIENT"),
    /** Physical room occupied, once the hospital map is in play. */
    roomId: text("room_id"),
  },
  (t) => [
    index("patient_instance_user_state_idx").on(t.userId, t.state),
    index("patient_instance_case_idx").on(t.caseId),
    index("patient_instance_room_idx").on(t.roomId),
  ],
);

/**
 * Physical hospital geography (spec §26-29). Rooms are seeded deterministically
 * and a room is occupied by at most one active patient at a time.
 */
export const hospitalRoom = sqliteTable(
  "hospital_room",
  {
    id: text("id").primaryKey(),
    unit: text("unit").notNull(),
    roomNumber: text("room_number").notNull(),
    /** INPATIENT | ED | TRAUMA | BOARDING | HALLWAY */
    roomType: text("room_type").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [
    uniqueIndex("hospital_room_unit_number_idx").on(t.unit, t.roomNumber),
    index("hospital_room_type_idx").on(t.roomType, t.displayOrder),
  ],
);

/**
 * Patient thumbnail (spec §31). Initials are used today; the asset fields exist
 * so a generated headshot can be attached later without touching callers.
 */
export const patientVisual = sqliteTable("patient_visual", {
  patientInstanceId: text("patient_instance_id").primaryKey(),
  /** INITIALS | HEADSHOT */
  assetType: text("asset_type").notNull().default("INITIALS"),
  assetPath: text("asset_path"),
  fallbackInitials: text("fallback_initials").notNull(),
});

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

/* ------------------------------------------------------------------ */
/* Content provenance (spec §4-5)                                       */
/* ------------------------------------------------------------------ */

/**
 * Portable content package (spec §41). Cases, lectures, concepts and learning
 * points belong to a pack so a library can be exported, shared and re-imported.
 */
export const contentPack = sqliteTable("content_pack", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  author: text("author").notNull().default(""),
  version: text("version").notNull().default("1.0.0"),
  schemaVersion: integer("schema_version").notNull().default(1),
  isBuiltin: integer("is_builtin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

/**
 * Imported educational material. Only material the developer explicitly
 * provides is ever stored here — nothing is fetched or scraped (spec §71).
 */
export const contentSource = sqliteTable(
  "content_source",
  {
    id: text("id").primaryKey(),
    /** DEMO | UWORLD | FIRST_AID | GUIDELINE | CUSTOM | OTHER */
    sourceType: text("source_type").notNull(),
    title: text("title").notNull(),
    sourceIdentifier: text("source_identifier").notNull().default(""),
    section: text("section").notNull().default(""),
    subsection: text("subsection").notNull().default(""),
    notes: text("notes").notNull().default(""),
    version: text("version").notNull().default(""),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    packId: text("pack_id"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("content_source_type_idx").on(t.sourceType)],
);

/**
 * An explicit chunk of a source. Batching lives in the database rather than in
 * a model's context, so no earlier chunk can be forgotten (spec §8).
 */
export const sourceFragment = sqliteTable(
  "source_fragment",
  {
    id: text("id").primaryKey(),
    contentSourceId: text("content_source_id").notNull(),
    fragmentIndex: integer("fragment_index").notNull(),
    label: text("label").notNull().default(""),
    rawText: text("raw_text").notNull(),
    normalizedText: text("normalized_text").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("source_fragment_source_index_idx").on(t.contentSourceId, t.fragmentIndex),
  ],
);

/**
 * A granular teachable claim extracted from source material. Finer-grained than
 * a case: one case may cover thirty of these, and one may appear in many cases.
 */
export const learningPoint = sqliteTable(
  "learning_point",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    specialty: text("specialty").notNull().default(""),
    topic: text("topic").notNull().default(""),
    importance: integer("importance").notNull().default(3),
    contentSourceId: text("content_source_id"),
    sourceFragmentId: text("source_fragment_id"),
    /** UNPROCESSED | MAPPED | PARTIALLY_MAPPED | FULLY_MAPPED | EXCLUDED */
    status: text("status").notNull().default("UNPROCESSED"),
    /** UNREVIEWED | REVIEWED | NEEDS_CORRECTION */
    reviewStatus: text("review_status").notNull().default("UNREVIEWED"),
    /**
     * Duplicate handling (spec §9): a non-canonical point names the canonical
     * one it merges into. Merging is a manual workflow, never automatic.
     */
    canonicalLearningPointId: text("canonical_learning_point_id"),
    isCanonical: integer("is_canonical", { mode: "boolean" }).notNull().default(true),
    packId: text("pack_id"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    index("learning_point_status_idx").on(t.status),
    index("learning_point_specialty_idx").on(t.specialty, t.topic),
    index("learning_point_canonical_idx").on(t.canonicalLearningPointId),
  ],
);

/**
 * Where a learning point is actually tested or taught. This is what makes the
 * coverage audit answerable rather than guessed (spec §5).
 */
export const learningPointMapping = sqliteTable(
  "learning_point_mapping",
  {
    id: text("id").primaryKey(),
    learningPointId: text("learning_point_id").notNull(),
    /** CASE | CASE_PROMPT | CASE_ACTION_RULE | CASE_PROBLEM_OPTION | LECTURE */
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    /** Denormalised so "which patients test this?" is a single query. */
    caseId: text("case_id"),
    lectureId: text("lecture_id"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("learning_point_mapping_unique_idx").on(
      t.learningPointId,
      t.entityType,
      t.entityId,
    ),
    index("learning_point_mapping_entity_idx").on(t.entityType, t.entityId),
    index("learning_point_mapping_case_idx").on(t.caseId),
  ],
);

/**
 * "Why is this correct?" — ties any structured clinical claim back to the
 * source that supports it (spec §10).
 */
export const evidenceLink = sqliteTable(
  "evidence_link",
  {
    id: text("id").primaryKey(),
    /** CONCEPT | LEARNING_POINT | CASE | CASE_FINDING | CASE_LAB_RESULT | ... */
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    contentSourceId: text("content_source_id").notNull(),
    sourceFragmentId: text("source_fragment_id"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    index("evidence_link_entity_idx").on(t.entityType, t.entityId),
    index("evidence_link_source_idx").on(t.contentSourceId),
  ],
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
export type HospitalRoomRow = typeof hospitalRoom.$inferSelect;
export type PatientVisualRow = typeof patientVisual.$inferSelect;
export type LabDefinitionRow = typeof labDefinition.$inferSelect;
export type CaseLabResultRow = typeof caseLabResult.$inferSelect;
export type CaseImagingResultRow = typeof caseImagingResult.$inferSelect;
export type CaseProblemRow = typeof caseProblem.$inferSelect;
export type CaseProblemOptionRow = typeof caseProblemOption.$inferSelect;
export type LectureSectionRow = typeof lectureSection.$inferSelect;
export type ContentPackRow = typeof contentPack.$inferSelect;
export type ContentSourceRow = typeof contentSource.$inferSelect;
export type SourceFragmentRow = typeof sourceFragment.$inferSelect;
export type LearningPointRow = typeof learningPoint.$inferSelect;
export type LearningPointMappingRow = typeof learningPointMapping.$inferSelect;
export type EvidenceLinkRow = typeof evidenceLink.$inferSelect;
export type CaseRevisionRow = typeof caseRevision.$inferSelect;
export type PatientObservationRow = typeof patientObservation.$inferSelect;
