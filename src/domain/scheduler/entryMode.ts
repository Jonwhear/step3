/**
 * Handoff vs admission selection (spec §30).
 *
 * Handoff introduces, rounds retrieve, admission tests. So a case whose
 * concepts the learner has never met arrives as a teaching handoff; a case
 * built on concepts they already know arrives as an active admission.
 */

import { MASTERY_LEVELS, SCHEDULER_CONFIG } from "@/config/scheduler";
import type { EntryMode } from "@/domain/constants";

export interface EntryModeInputs {
  /** Mastery level per concept attached to the case (0..5). */
  conceptMasteryLevels: number[];
  /**
   * Deterministic alternator for the middle band — pass the index of this
   * assignment within the day so consecutive picks alternate rather than
   * calling Math.random().
   */
  alternationIndex: number;
}

export interface EntryModeDecision {
  entryMode: EntryMode;
  reason: string;
  unseenFraction: number;
  weakFraction: number;
}

/**
 * Deterministic: the same inputs always produce the same mode.
 *
 *   majority unseen                  -> HANDOFF (introduce it)
 *   majority introduced or weak      -> alternate HANDOFF / ADMISSION
 *   otherwise                        -> ADMISSION (test it)
 */
export function chooseEntryMode(inputs: EntryModeInputs): EntryModeDecision {
  const levels = inputs.conceptMasteryLevels;
  if (levels.length === 0) {
    return {
      entryMode: "HANDOFF",
      reason: "Case has no linked concepts; introducing it via handoff.",
      unseenFraction: 1,
      weakFraction: 0,
    };
  }

  const unseen = levels.filter((l) => l <= MASTERY_LEVELS.UNSEEN).length;
  const weak = levels.filter(
    (l) => l > MASTERY_LEVELS.UNSEEN && l <= SCHEDULER_CONFIG.ENTRY_MODE.weakMasteryCeiling,
  ).length;

  const unseenFraction = unseen / levels.length;
  const weakFraction = weak / levels.length;

  if (unseenFraction > 0.5) {
    return {
      entryMode: "HANDOFF",
      reason: "Most concepts are unseen, so this case introduces them at handoff.",
      unseenFraction,
      weakFraction,
    };
  }

  if (unseenFraction + weakFraction > 0.5) {
    const entryMode: EntryMode = inputs.alternationIndex % 2 === 0 ? "HANDOFF" : "ADMISSION";
    return {
      entryMode,
      reason:
        "Concepts are introduced but not yet solid, so entry mode alternates between reinforcement and testing.",
      unseenFraction,
      weakFraction,
    };
  }

  return {
    entryMode: "ADMISSION",
    reason: "Concepts are reasonably well established, so this case arrives as an active admission.",
    unseenFraction,
    weakFraction,
  };
}
