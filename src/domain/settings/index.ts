/**
 * User preferences (spec §47-50).
 *
 * Everything lives in the existing key/value `user_setting` table, so adding a
 * preference never needs a migration. The important design rule is §49: the
 * learner is given a handful of meaningful choices, and *this module* is the
 * only place that translates them into internal scheduler coefficients. The
 * scheduler itself never reads a raw preference string.
 */

import { INPATIENT_ROOM_COUNT } from "@/config/hospital";
import { SCHEDULER_CONFIG, SPACED_REPETITION_INTERVALS } from "@/config/scheduler";
import type { Db } from "@/db/client";
import { getSettings, setSetting } from "@/domain/profile";

export const SETTINGS_KEYS = {
  theme: "appearance.theme",
  fontSize: "appearance.fontSize",
  density: "appearance.density",
  accent: "appearance.accent",
  showLabReferenceRanges: "labs.showReferenceRanges",
  workloadIntensity: "scheduler.workloadIntensity",
  maxCensus: "scheduler.maxCensus",
  catchUpIntensity: "scheduler.catchUpIntensity",
  rotationEmphasis: "scheduler.rotationEmphasis",
  reviewIntervals: "scheduler.reviewIntervals",
  bootstrapCompleted: "onboarding.bootstrapCompleted",
  /** Date the starter service was created; the scheduler defers to it. */
  bootstrapDate: "onboarding.bootstrapDate",
} as const;

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const FONT_SIZES = ["compact", "standard", "large"] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const DENSITIES = ["compact", "comfortable"] as const;
export type Density = (typeof DENSITIES)[number];

export const ACCENTS = ["clinical", "teal", "indigo", "slate"] as const;
export type Accent = (typeof ACCENTS)[number];

export const INTENSITIES = ["light", "standard", "high"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const CATCHUP_INTENSITIES = ["gentle", "standard", "aggressive"] as const;
export type CatchUpIntensity = (typeof CATCHUP_INTENSITIES)[number];

export const EMPHASES = ["low", "standard", "high"] as const;
export type Emphasis = (typeof EMPHASES)[number];

export interface AppearancePreferences {
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  accent: Accent;
}

export interface LabPreferences {
  /** Spec §14: on by default, to mirror how exam labs are presented. */
  showReferenceRanges: boolean;
}

/**
 * Days until a concept at each mastery level comes back, keyed by level.
 * Level 0 is absent by construction: an unseen concept needs an introduction,
 * not a review, so it is never scheduled.
 */
export type ReviewIntervals = Record<number, number>;

export interface SchedulerPreferences {
  workloadIntensity: Intensity;
  /** Learner ceiling; the effective cap is min(this, physical rooms). */
  maxCensus: number;
  catchUpIntensity: CatchUpIntensity;
  rotationEmphasis: Emphasis;
  /** Learner-adjustable spaced-repetition schedule (spec §49). */
  reviewIntervals: ReviewIntervals;
}

/** Levels the learner can retune. Level 0 is not a reviewable state. */
export const REVIEWABLE_LEVELS = [1, 2, 3, 4, 5] as const;

/** Bounds on a review interval, so a typo cannot disable review entirely. */
export const MIN_REVIEW_INTERVAL_DAYS = 1;
export const MAX_REVIEW_INTERVAL_DAYS = 365;

export const DEFAULT_REVIEW_INTERVALS: ReviewIntervals = Object.fromEntries(
  REVIEWABLE_LEVELS.map((level) => [level, SPACED_REPETITION_INTERVALS[level] ?? 1]),
);

/**
 * Parses the stored override map, ignoring anything malformed or out of range
 * rather than letting it reach the scheduler. Missing levels fall back to the
 * shipped default, so a partially written value still yields a usable schedule.
 */
export function parseReviewIntervals(raw: string | undefined): ReviewIntervals {
  const merged: ReviewIntervals = { ...DEFAULT_REVIEW_INTERVALS };
  if (!raw) return merged;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return merged;
  }
  // An array must be rejected explicitly: it is an object, and indexing it by
  // "1" would silently read element 1 as the level-1 interval.
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return merged;

  for (const level of REVIEWABLE_LEVELS) {
    const value = (parsed as Record<string, unknown>)[String(level)];
    const days = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(days)) continue;
    const rounded = Math.round(days);
    if (rounded < MIN_REVIEW_INTERVAL_DAYS || rounded > MAX_REVIEW_INTERVAL_DAYS) continue;
    merged[level] = rounded;
  }
  return merged;
}

export interface UserPreferences {
  appearance: AppearancePreferences;
  labs: LabPreferences;
  scheduler: SchedulerPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  appearance: {
    theme: "system",
    fontSize: "standard",
    density: "comfortable",
    accent: "clinical",
  },
  labs: { showReferenceRanges: true },
  scheduler: {
    workloadIntensity: "standard",
    maxCensus: SCHEDULER_CONFIG.MAX_ACTIVE_PANEL_SIZE,
    catchUpIntensity: "gentle",
    rotationEmphasis: "standard",
    reviewIntervals: DEFAULT_REVIEW_INTERVALS,
  },
};

function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function getPreferences(db: Db): UserPreferences {
  const s = getSettings(db);
  const censusRaw = Number(s[SETTINGS_KEYS.maxCensus]);
  return {
    appearance: {
      theme: oneOf(s[SETTINGS_KEYS.theme], THEMES, DEFAULT_PREFERENCES.appearance.theme),
      fontSize: oneOf(
        s[SETTINGS_KEYS.fontSize],
        FONT_SIZES,
        DEFAULT_PREFERENCES.appearance.fontSize,
      ),
      density: oneOf(
        s[SETTINGS_KEYS.density],
        DENSITIES,
        DEFAULT_PREFERENCES.appearance.density,
      ),
      accent: oneOf(s[SETTINGS_KEYS.accent], ACCENTS, DEFAULT_PREFERENCES.appearance.accent),
    },
    labs: {
      // Absent means "not set yet", which must read as the ON default.
      showReferenceRanges: s[SETTINGS_KEYS.showLabReferenceRanges] !== "false",
    },
    scheduler: {
      workloadIntensity: oneOf(
        s[SETTINGS_KEYS.workloadIntensity],
        INTENSITIES,
        DEFAULT_PREFERENCES.scheduler.workloadIntensity,
      ),
      maxCensus:
        Number.isFinite(censusRaw) && censusRaw >= 1
          ? Math.min(censusRaw, INPATIENT_ROOM_COUNT)
          : DEFAULT_PREFERENCES.scheduler.maxCensus,
      catchUpIntensity: oneOf(
        s[SETTINGS_KEYS.catchUpIntensity],
        CATCHUP_INTENSITIES,
        DEFAULT_PREFERENCES.scheduler.catchUpIntensity,
      ),
      rotationEmphasis: oneOf(
        s[SETTINGS_KEYS.rotationEmphasis],
        EMPHASES,
        DEFAULT_PREFERENCES.scheduler.rotationEmphasis,
      ),
      reviewIntervals: parseReviewIntervals(s[SETTINGS_KEYS.reviewIntervals]),
    },
  };
}

export function setPreference(db: Db, key: string, value: string): void {
  setSetting(db, key, value);
}

export function resetPreferences(db: Db): void {
  const d = DEFAULT_PREFERENCES;
  setSetting(db, SETTINGS_KEYS.theme, d.appearance.theme);
  setSetting(db, SETTINGS_KEYS.fontSize, d.appearance.fontSize);
  setSetting(db, SETTINGS_KEYS.density, d.appearance.density);
  setSetting(db, SETTINGS_KEYS.accent, d.appearance.accent);
  setSetting(db, SETTINGS_KEYS.showLabReferenceRanges, String(d.labs.showReferenceRanges));
  setSetting(db, SETTINGS_KEYS.workloadIntensity, d.scheduler.workloadIntensity);
  setSetting(db, SETTINGS_KEYS.maxCensus, String(d.scheduler.maxCensus));
  setSetting(db, SETTINGS_KEYS.catchUpIntensity, d.scheduler.catchUpIntensity);
  setSetting(db, SETTINGS_KEYS.rotationEmphasis, d.scheduler.rotationEmphasis);
  setSetting(db, SETTINGS_KEYS.reviewIntervals, JSON.stringify(d.scheduler.reviewIntervals));
}

/** Reads just the review schedule. Used on every graded response. */
export function getReviewIntervals(db: Db): ReviewIntervals {
  return parseReviewIntervals(getSettings(db)[SETTINGS_KEYS.reviewIntervals]);
}

export function setReviewIntervals(db: Db, intervals: ReviewIntervals): ReviewIntervals {
  // Round-trip through the parser so only valid values are ever persisted.
  const clean = parseReviewIntervals(JSON.stringify(intervals));
  setSetting(db, SETTINGS_KEYS.reviewIntervals, JSON.stringify(clean));
  return clean;
}

/* --------------------- preference → engine translation -------------------- */

/**
 * The resolved knobs the scheduler actually runs on. Keeping the translation
 * here (rather than exposing raw coefficients in the UI) is what lets the
 * internal formula change without breaking a user's saved settings.
 */
export interface ResolvedSchedulerTuning {
  /** Multiplier on the daily new-patient target. */
  workloadMultiplier: number;
  /** Effective census cap: never more than the ward physically holds. */
  effectiveCensusCap: number;
  physicalRoomCap: number;
  userCensusCap: number;
  /** Days a pace deficit is spread over. Fewer days = more aggressive. */
  catchUpSpreadDays: number;
  catchUpCap: number;
  /** Weight applied to the rotation-relevance scoring term. */
  rotationRelevanceWeight: number;
}

const WORKLOAD_MULTIPLIER: Record<Intensity, number> = {
  light: 0.6,
  standard: 1,
  high: 1.5,
};

const CATCHUP_SETTINGS: Record<CatchUpIntensity, { spreadDays: number; cap: number }> = {
  gentle: { spreadDays: 6, cap: 1 },
  standard: {
    spreadDays: SCHEDULER_CONFIG.CATCHUP_SPREAD_DAYS,
    cap: SCHEDULER_CONFIG.CATCHUP_CAP,
  },
  aggressive: { spreadDays: 2, cap: 2 },
};

const ROTATION_WEIGHT: Record<Emphasis, number> = {
  low: SCHEDULER_CONFIG.WEIGHTS.rotationRelevance * 0.5,
  standard: SCHEDULER_CONFIG.WEIGHTS.rotationRelevance,
  high: SCHEDULER_CONFIG.WEIGHTS.rotationRelevance * 1.75,
};

export function resolveSchedulerTuning(
  prefs: SchedulerPreferences,
  physicalRoomCap: number = INPATIENT_ROOM_COUNT,
): ResolvedSchedulerTuning {
  const catchUp = CATCHUP_SETTINGS[prefs.catchUpIntensity];
  return {
    workloadMultiplier: WORKLOAD_MULTIPLIER[prefs.workloadIntensity],
    effectiveCensusCap: Math.max(1, Math.min(physicalRoomCap, prefs.maxCensus)),
    physicalRoomCap,
    userCensusCap: prefs.maxCensus,
    catchUpSpreadDays: catchUp.spreadDays,
    catchUpCap: catchUp.cap,
    rotationRelevanceWeight: ROTATION_WEIGHT[prefs.rotationEmphasis],
  };
}
