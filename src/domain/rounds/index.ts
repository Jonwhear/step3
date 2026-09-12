/**
 * The daily rounds encounter (spec V3 §10-16).
 *
 * Everything one patient needs for one hospital day is assembled here, so the
 * patient chart and the service-wide walker render the same encounter from the
 * same data rather than two screens that drift apart.
 *
 * Two ideas carry most of the weight:
 *
 *  - **A rounds task is something that actually exists.** A patient is only
 *    "rounds due" when there is real work on them today — an unanswered
 *    question, or a plan to write. A case that authors neither is reported as
 *    having no task rather than as perpetually overdue.
 *  - **Prior values are recorded, never derived.** Case content holds one value
 *    per vital and lab, so the trend disclosure shows what the learner was
 *    shown on earlier days, written at sign-off. Where there is no history
 *    there is no disclosure.
 */

import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { caseHasRoundsTask, getCaseFindings, getCasePrompts, promptChoices } from "@/domain/cases";
import { buildChart, type ProblemView } from "@/domain/chart";
import { buildImagingViews, buildLabPanels, type ImagingResultView, type LabPanelView } from "@/domain/labs";
import {
  hasAnsweredPromptOn,
  hospitalDayOn,
  listPatientActions,
  listPromptResponses,
} from "@/domain/patients";
import { nowIso, todayIso, type IsoDate } from "@/lib/date";

/**
 * Where this patient stands today.
 *
 * `NO_TASK` is a real answer, not a failure: it keeps the app from telling the
 * learner that rounds are due on a patient it has nothing to ask them about.
 */
export type RoundsStatus = "DUE" | "COMPLETED_TODAY" | "NO_TASK";

export function roundsStatusFor(
  db: Db,
  patient: t.PatientInstanceRow,
  today: IsoDate = todayIso(),
): RoundsStatus {
  const onService = patient.state === "ON_SERVICE" || patient.state === "DISCHARGE_ELIGIBLE";
  if (!onService) return "NO_TASK";
  if (patient.lastRoundsDate === today) return "COMPLETED_TODAY";
  return caseHasRoundsTask(db, patient.caseId) ? "DUE" : "NO_TASK";
}

/* ------------------------------ observations ------------------------------ */

export interface ObservationPoint {
  hospitalDay: number;
  value: string;
}

export type ObservationHistory = Map<string, ObservationPoint[]>;

export function observationKeyForVital(label: string): string {
  return `VITAL:${label}`;
}

export function observationKeyForLab(code: string): string {
  return `LAB:${code}`;
}

/** Every recorded value for this patient, oldest hospital day first. */
export function listObservationHistory(db: Db, patientId: string): ObservationHistory {
  const rows = db
    .select()
    .from(t.patientObservation)
    .where(eq(t.patientObservation.patientInstanceId, patientId))
    .orderBy(asc(t.patientObservation.hospitalDay))
    .all();

  const history: ObservationHistory = new Map();
  for (const row of rows) {
    const list = history.get(row.observationKey) ?? [];
    list.push({ hospitalDay: row.hospitalDay, value: row.value });
    history.set(row.observationKey, list);
  }
  return history;
}

/**
 * Writes today's vitals and labs against the current hospital day.
 *
 * Write-once per day by primary key: signing off twice records one day, and a
 * value the learner already saw is never rewritten after the fact.
 */
export function recordObservations(
  db: Db,
  patient: t.PatientInstanceRow,
  today: IsoDate = todayIso(),
): number {
  const day = hospitalDayOn(patient, today);
  const rows: {
    observationKey: string;
    label: string;
    value: string;
    units: string | null;
  }[] = [];

  for (const finding of getCaseFindings(db, patient.caseId)) {
    if (finding.category !== "VITAL") continue;
    rows.push({
      observationKey: observationKeyForVital(finding.label),
      label: finding.label,
      value: finding.value,
      units: finding.units,
    });
  }

  const takenCodes = new Set(listPatientActions(db, patient.id).map((a) => a.actionCode));
  const unlocked = patient.entryMode === "HANDOFF" ? null : takenCodes;
  for (const panel of buildLabPanels(db, patient.caseId, { takenActionCodes: unlocked })) {
    for (const result of panel.results) {
      rows.push({
        observationKey: observationKeyForLab(result.code),
        label: result.displayName,
        value: result.value,
        units: result.units || null,
      });
    }
  }

  let written = 0;
  for (const row of rows) {
    const result = db
      .insert(t.patientObservation)
      .values({
        patientInstanceId: patient.id,
        observationKey: row.observationKey,
        label: row.label,
        value: row.value,
        units: row.units,
        hospitalDay: day,
        recordedAt: nowIso(),
      })
      .onConflictDoNothing()
      .run();
    written += result.changes;
  }
  return written;
}

/**
 * The prior values worth offering behind a disclosure.
 *
 * Only days *before* the one on screen count, and only when they say something
 * the current value does not — a column of identical numbers is not a trend,
 * and opening a control to find one wastes the learner's attention.
 */
export function priorValuesFor(
  history: ObservationHistory,
  key: string,
  currentValue: string,
  currentDay: number,
): ObservationPoint[] {
  const points = (history.get(key) ?? []).filter((p) => p.hospitalDay < currentDay);
  if (points.length === 0) return [];
  const values = new Set([...points.map((p) => p.value), currentValue]);
  return values.size > 1 ? points : [];
}

/* ------------------------------ the encounter ----------------------------- */

export interface EncounterVital {
  label: string;
  value: string;
  observationKey: string;
  prior: ObservationPoint[];
}

export interface EncounterLabResult {
  id: string;
  displayName: string;
  value: string;
  units: string;
  flagLabel: string;
  flag: string;
  referenceRange: string;
  observationKey: string;
  prior: ObservationPoint[];
}

export interface EncounterLabPanel {
  category: string;
  label: string;
  abnormalCount: number;
  results: EncounterLabResult[];
}

export interface EncounterFinding {
  category: string;
  label: string;
  value: string;
}

export interface PriorAnswer {
  id: string;
  promptText: string;
  stage: string;
  correct: boolean;
  date: string;
}

export interface RoundsEncounterData {
  patientId: string;
  patientName: string;
  roomNumber: string;
  diagnosis: string | null;
  hospitalDay: number;
  status: RoundsStatus;
  roundsCompleted: number;
  minimumRounds: number;
  dischargeEligible: boolean;
  /** Today's question, or null when the case authors none. */
  prompt: {
    id: string;
    promptText: string;
    responseType: string;
    choices: { key: string; text: string }[];
    allowsFreeText: boolean;
  } | null;
  answeredToday: boolean;
  vitals: EncounterVital[];
  labPanels: EncounterLabPanel[];
  imaging: ImagingResultView[];
  findings: EncounterFinding[];
  problems: ProblemView[];
  planSignedOn: string | null;
  priorAnswers: PriorAnswer[];
}

/**
 * Assembles one patient's encounter. Read-only: nothing here records that the
 * learner looked, so opening a chart can never change what is owed.
 */
export function buildRoundsEncounter(
  db: Db,
  patient: t.PatientInstanceRow,
  template: t.CaseTemplateRow,
  options: { today?: IsoDate; planSignedOn?: string | null } = {},
): RoundsEncounterData {
  const today = options.today ?? todayIso();
  const day = hospitalDayOn(patient, today);
  const history = listObservationHistory(db, patient.id);

  const prompts = getCasePrompts(db, patient.caseId, "ROUNDS");
  // The cursor cycles, so a long-stay patient keeps generating questions.
  const prompt = prompts.length
    ? prompts[patient.currentRoundPromptIndex % prompts.length]
    : undefined;

  const takenCodes = new Set(listPatientActions(db, patient.id).map((a) => a.actionCode));
  const unlocked = patient.entryMode === "HANDOFF" ? null : takenCodes;

  const allFindings = getCaseFindings(db, patient.caseId);
  const vitals: EncounterVital[] = allFindings
    .filter((f) => f.category === "VITAL")
    .map((finding) => {
      const value = finding.units ? `${finding.value} ${finding.units}` : finding.value;
      const key = observationKeyForVital(finding.label);
      return {
        label: finding.label,
        value,
        observationKey: key,
        prior: priorValuesFor(history, key, finding.value, day),
      };
    });

  const labPanels: EncounterLabPanel[] = buildLabPanels(db, patient.caseId, {
    takenActionCodes: unlocked,
    patientSex: (template.patientSex as "M" | "F" | null) ?? null,
  }).map((panel: LabPanelView) => ({
    category: panel.category,
    label: panel.label,
    abnormalCount: panel.abnormalCount,
    results: panel.results.map((result) => {
      const key = observationKeyForLab(result.code);
      return {
        id: result.id,
        displayName: result.displayName,
        value: result.value,
        units: result.units,
        flag: result.flag,
        flagLabel: result.flagLabel,
        referenceRange: result.referenceRange,
        observationKey: key,
        prior: priorValuesFor(history, key, result.value, day),
      };
    }),
  }));

  const revealed = new Set(
    db
      .select({ findingId: t.patientRevealedFinding.findingId })
      .from(t.patientRevealedFinding)
      .where(eq(t.patientRevealedFinding.patientInstanceId, patient.id))
      .all()
      .map((r) => r.findingId),
  );

  const findings: EncounterFinding[] = allFindings
    .filter((f) => f.category !== "VITAL")
    .filter((f) => f.initiallyVisible || revealed.has(f.id) || patient.entryMode === "HANDOFF")
    .map((f) => ({
      category: f.category,
      label: f.label,
      value: f.units ? `${f.value} ${f.units}` : f.value,
    }));

  const promptsById = new Map(
    (["ROUNDS", "DISCHARGE", "ADMISSION", "HANDOFF"] as const)
      .flatMap((stage) => getCasePrompts(db, patient.caseId, stage))
      .map((p) => [p.id, p]),
  );

  const priorAnswers: PriorAnswer[] = listPromptResponses(db, patient.id).map((response) => ({
    id: response.id,
    promptText: promptsById.get(response.promptId)?.promptText ?? "Question",
    stage: response.stage,
    correct: response.correct,
    date: response.createdAt.slice(0, 10),
  }));

  return {
    patientId: patient.id,
    patientName: patient.patientName,
    roomNumber: patient.roomNumber,
    diagnosis: patient.state === "PENDING_ADMISSION" ? null : template.primaryDiagnosis,
    hospitalDay: day,
    status: roundsStatusFor(db, patient, today),
    roundsCompleted: patient.roundsCompleted,
    minimumRounds: template.minimumRoundsBeforeDischarge,
    dischargeEligible: patient.state === "DISCHARGE_ELIGIBLE",
    prompt: prompt
      ? {
          id: prompt.id,
          promptText: prompt.promptText,
          responseType: prompt.responseType,
          choices: promptChoices(prompt),
          allowsFreeText: prompt.responseType === "SHORT_TEXT",
        }
      : null,
    answeredToday: prompt ? hasAnsweredPromptOn(db, patient.id, prompt.id, today) : false,
    vitals,
    labPanels,
    imaging: buildImagingViews(db, patient.caseId, unlocked),
    findings,
    problems: buildChart(db, patient.id, patient.caseId),
    planSignedOn: options.planSignedOn ?? null,
    priorAnswers,
  };
}
