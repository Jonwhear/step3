/**
 * Patient pacing: how many new patients the learner should receive today.
 *
 * The design goal (spec §25, §26) is that missing days makes the service feel
 * "a little busier" for a few days rather than producing a punitive backlog.
 * Deficit is spread over CATCHUP_SPREAD_DAYS and capped at CATCHUP_CAP.
 */

import { SCHEDULER_CONFIG } from "@/config/scheduler";
import { clamp, daysBetween, type IsoDate } from "@/lib/date";

export interface PacingInputs {
  studyStartDate: IsoDate;
  step3Date: IsoDate;
  targetPatientCount: number;
  /** Unique patient instances ever assigned (active + discharged). */
  patientsAssigned: number;
  today: IsoDate;
}

export interface PacingResult {
  /** Days from today to the exam, floored at 0. */
  daysRemaining: number;
  /** Total length of the study window in days. */
  windowDays: number;
  /** 0..1 fraction of the study window that has elapsed. */
  fractionElapsed: number;
  /** How many patients the plan expects by now. */
  expectedProgress: number;
  actualProgress: number;
  /** Patients still to assign. */
  remainingPatients: number;
  /** Even rate needed over the remaining days. */
  baselineRate: number;
  /** Shortfall against plan, never negative. */
  deficit: number;
  /** Extra patients today to repay the deficit gently. */
  catchUpAdjustment: number;
  /** baselineRate + catchUp, before panel capacity is applied. */
  rawTarget: number;
  /** Final target after MAX_NEW_PATIENTS_PER_DAY. */
  dailyTarget: number;
}

/**
 * Computes today's new-patient target from the study plan and actual progress.
 * Pure: no database access, so it is trivially testable.
 */
export function calculateDailyPatientTarget(inputs: PacingInputs): PacingResult {
  const { studyStartDate, step3Date, targetPatientCount, patientsAssigned, today } = inputs;

  const windowDays = Math.max(1, daysBetween(studyStartDate, step3Date));
  const elapsedDays = clamp(daysBetween(studyStartDate, today), 0, windowDays);
  const daysRemaining = Math.max(0, daysBetween(today, step3Date));
  const fractionElapsed = windowDays === 0 ? 1 : elapsedDays / windowDays;

  const remainingPatients = Math.max(0, targetPatientCount - patientsAssigned);

  // Baseline: spread whatever is left evenly across the days that remain.
  // Include today in the denominator so the last day is not asked for zero.
  const baselineRate = remainingPatients === 0 ? 0 : remainingPatients / Math.max(1, daysRemaining + 1);

  const expectedProgress = targetPatientCount * fractionElapsed;
  const actualProgress = patientsAssigned;
  const deficit = Math.max(0, expectedProgress - actualProgress);

  const catchUpAdjustment =
    deficit === 0
      ? 0
      : Math.min(deficit / SCHEDULER_CONFIG.CATCHUP_SPREAD_DAYS, SCHEDULER_CONFIG.CATCHUP_CAP);

  const rawTarget = baselineRate + catchUpAdjustment;

  // Round up so a fractional baseline still produces a patient most days, then
  // apply the floor (while work remains) and the hard daily ceiling.
  let dailyTarget = Math.ceil(rawTarget);
  if (remainingPatients > 0) {
    dailyTarget = Math.max(SCHEDULER_CONFIG.MIN_NEW_PATIENTS_PER_DAY, dailyTarget);
  }
  dailyTarget = Math.min(dailyTarget, SCHEDULER_CONFIG.MAX_NEW_PATIENTS_PER_DAY, remainingPatients);
  dailyTarget = Math.max(0, dailyTarget);

  return {
    daysRemaining,
    windowDays,
    fractionElapsed,
    expectedProgress,
    actualProgress,
    remainingPatients,
    baselineRate,
    deficit,
    catchUpAdjustment,
    rawTarget,
    dailyTarget,
  };
}

/** Extra patients today attributable purely to missed days. */
export function calculateCatchUpAdjustment(deficit: number): number {
  if (deficit <= 0) return 0;
  return Math.min(deficit / SCHEDULER_CONFIG.CATCHUP_SPREAD_DAYS, SCHEDULER_CONFIG.CATCHUP_CAP);
}

/** Panel slots available before MAX_ACTIVE_PANEL_SIZE is reached. */
export function availablePanelSlots(activePanelSize: number): number {
  return Math.max(0, SCHEDULER_CONFIG.MAX_ACTIVE_PANEL_SIZE - activePanelSize);
}

export type PaceStatus = "ahead" | "on_pace" | "behind";

export interface PaceSummary {
  status: PaceStatus;
  /** Whole patients ahead or behind plan. */
  delta: number;
  /** Neutral, non-punitive wording (spec §26). */
  label: string;
}

export function describePace(result: PacingResult): PaceSummary {
  const delta = Math.round(result.actualProgress - result.expectedProgress);
  if (delta >= 2) {
    return { status: "ahead", delta, label: `${delta} patients ahead of plan` };
  }
  if (delta <= -2) {
    return {
      status: "behind",
      delta,
      label: `${Math.abs(delta)} patients behind planned pace`,
    };
  }
  return { status: "on_pace", delta, label: "On pace" };
}
