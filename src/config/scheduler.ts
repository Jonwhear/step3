/**
 * Scheduler tuning values.
 *
 * Every number the scheduler uses to make a decision lives here so the
 * behaviour can be tuned in one place and the developer inspector can display
 * the same constants the engine actually used.
 */

export const SCHEDULER_CONFIG = {
  /** Hard ceiling on how many patients may sit on the service at once. */
  MAX_ACTIVE_PANEL_SIZE: 7,

  /** Hard ceiling on new patients created on any single study date. */
  MAX_NEW_PATIENTS_PER_DAY: 5,

  /** Pace deficit is repaid over this many days rather than all at once. */
  CATCHUP_SPREAD_DAYS: 4,

  /** Most extra patients per day that catch-up may add on top of baseline. */
  CATCHUP_CAP: 1,

  /** Floor for the baseline rate once study has started and work remains. */
  MIN_NEW_PATIENTS_PER_DAY: 1,

  /**
   * Target mix of new cases. Used as soft weighting inside candidate scoring,
   * not as a hard quota, so a thin content library still schedules something.
   */
  MIX: {
    currentRotation: 0.6,
    dueOrWeak: 0.25,
    coverageGap: 0.15,
  },

  /** Weights for scoreCandidateCase(). All terms are inspectable. */
  WEIGHTS: {
    rotationRelevance: 4,
    spacedRepetitionDue: 5,
    curriculumGap: 3,
    weakness: 3,
    recentLecture: 2,
    step3Importance: 2,
    recentlySeen: 4,
  },

  /** Rotation relevance factors, multiplied by WEIGHTS.rotationRelevance. */
  ROTATION_RELEVANCE: {
    sameSpecialty: 1.0,
    relatedSpecialty: 0.5,
    unrelated: 0,
  },

  /** A lecture boosts related cases for this many days after completion. */
  RECENT_LECTURE_WINDOW_DAYS: 7,

  /** A case counts as "recently seen" for this many days after assignment. */
  RECENTLY_SEEN_WINDOW_DAYS: 21,

  /** Jitter is bounded so it breaks ties without overriding real signal. */
  JITTER_MAX: 0.5,

  /** A topic with fewer than this many encountered cases counts as a gap. */
  CURRICULUM_GAP_THRESHOLD: 2,

  /** Cases whose concepts are unseen are introduced via handoff first. */
  ENTRY_MODE: {
    /** Mastery at or below this counts as "weak/introduced" for entry mode. */
    weakMasteryCeiling: 2,
  },
} as const;

/**
 * Spaced repetition intervals, in days, indexed by resulting mastery level.
 * Level 0 (UNSEEN) is not scheduled — it needs an introduction first.
 */
export const SPACED_REPETITION_INTERVALS: Record<number, number | null> = {
  0: null,
  1: 1,
  2: 2,
  3: 5,
  4: 12,
  5: 30,
};

/** An incorrect answer always brings the concept back the next day. */
export const INCORRECT_REVIEW_INTERVAL_DAYS = 1;

export const MASTERY_LEVELS = {
  UNSEEN: 0,
  INTRODUCED: 1,
  WEAK: 2,
  DEVELOPING: 3,
  COMPETENT: 4,
  MASTERED: 5,
} as const;

export const MASTERY_LABELS: Record<number, string> = {
  0: "Unseen",
  1: "Introduced",
  2: "Weak",
  3: "Developing",
  4: "Competent",
  5: "Mastered",
};

export const MAX_MASTERY = MASTERY_LEVELS.MASTERED;
/** Once introduced a concept never falls back to UNSEEN. */
export const MIN_MASTERY_AFTER_INTRODUCTION = MASTERY_LEVELS.INTRODUCED;

/** Lecture selection priority. Lower number = considered first. */
export const LECTURE_PRIORITY = {
  currentRotationTopic: 1,
  uintroducedTopic: 2,
  weakTopic: 3,
  recentPatientTopic: 4,
  review: 5,
} as const;
