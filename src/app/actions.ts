"use server";

/**
 * Server actions.
 *
 * Every mutation the UI performs goes through here, so scoring, mastery
 * updates and audit events all happen in one place on the server. Nothing is
 * graded on the client.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteDemoContent, resetDemoContent, seedDemoContent } from "@/db/seed";
import { listActions, matchTranscriptToActions } from "@/domain/actions";
import {
  getCaseActionRules,
  getCaseById,
  getCaseConceptIds,
  getCaseFindings,
  getCasePrompts,
  gradePromptResponse,
  resolveAction,
} from "@/domain/cases";
import {
  addProblem,
  buildChart,
  removeProblem,
  renderPlanAsNote,
  scorePlan,
  togglePlanSelection,
} from "@/domain/chart";
import { describeEvidence } from "@/domain/content/provenance";
import { completeLecture, getLectureConceptIds, startLecture } from "@/domain/lectures";
import { introduceConcepts, updateConceptMastery } from "@/domain/mastery";
import {
  acceptHandoffPatient,
  advancePatientAfterRounds,
  completeAdmission,
  dischargePatient,
  getPatient,
  listPatientActions,
  recordPatientAction,
  recordPromptResponse,
  recordStudyEvent,
  revealFindings,
  touchPatient,
} from "@/domain/patients";
import {
  addRotation,
  deleteRotation,
  SETTING_KEYS,
  setSetting,
  updateRotation,
  upsertProfile,
} from "@/domain/profile";
import { bootstrapNewUserService } from "@/domain/scheduler";
import { resetPreferences, setPreference } from "@/domain/settings";
import { db } from "@/server/db";
import { todayIso } from "@/lib/date";

const REVALIDATE_PATHS = [
  "/",
  "/handoff",
  "/rounds",
  "/admissions",
  "/conference",
  "/progress",
  "/patients",
  "/settings",
  "/settings/developer",
];

function revalidateAll(): void {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

/* -------------------------------- onboarding ------------------------------ */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  degree: z.string().min(1),
  specialty: z.string().min(1),
  step3Date: isoDate,
  targetPatientCount: z.coerce.number().int().min(1).max(5000),
});

export interface ActionState {
  ok: boolean;
  error?: string;
}

export async function saveProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    degree: formData.get("degree"),
    specialty: formData.get("specialty"),
    step3Date: formData.get("step3Date"),
    targetPatientCount: formData.get("targetPatientCount"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  upsertProfile(db(), parsed.data);
  revalidateAll();
  return { ok: true };
}

const rotationSchema = z
  .object({
    name: z.string().min(1, "Rotation name is required"),
    specialty: z.string().min(1),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((r) => r.startDate <= r.endDate, {
    message: "End date must be on or after the start date",
  });

export async function addRotationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = rotationSchema.safeParse({
    name: formData.get("name"),
    specialty: formData.get("specialty"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rotation" };
  }
  addRotation(db(), parsed.data);
  revalidateAll();
  return { ok: true };
}

export async function updateRotationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = rotationSchema.safeParse({
    name: formData.get("name"),
    specialty: formData.get("specialty"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!id) return { ok: false, error: "Missing rotation id" };
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rotation" };
  }
  updateRotation(db(), id, parsed.data);
  revalidateAll();
  return { ok: true };
}

export async function deleteRotationAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) deleteRotation(db(), id);
  revalidateAll();
}

export async function finishOnboardingAction(): Promise<void> {
  const database = db();
  setSetting(database, SETTING_KEYS.onboarded, "true");
  // Hand the learner a service immediately rather than an empty hospital that
  // fills in tomorrow (spec §35). Runs once; the marker prevents repeats.
  bootstrapNewUserService(database, { today: todayIso() });
  revalidateAll();
  redirect("/");
}

/* -------------------------------- preferences ----------------------------- */

export async function saveAudioPreferenceAction(prefs: {
  rate?: number;
  voiceUri?: string | null;
}): Promise<void> {
  const database = db();
  if (typeof prefs.rate === "number") {
    setSetting(database, SETTING_KEYS.ttsRate, String(prefs.rate));
  }
  if (prefs.voiceUri !== undefined) {
    setSetting(database, SETTING_KEYS.ttsVoice, prefs.voiceUri ?? "");
  }
}

/** Appearance, lab display and scheduler preferences all share this action. */
export async function savePreferenceAction(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "");
  if (!key.trim()) return;
  setPreference(db(), key, value);
  revalidateAll();
}

export async function resetPreferencesAction(): Promise<void> {
  resetPreferences(db());
  revalidateAll();
}

/* --------------------------------- handoff -------------------------------- */

export async function acceptPatientAction(formData: FormData): Promise<void> {
  const patientId = String(formData.get("patientId") ?? "");
  const database = db();
  const patient = getPatient(database, patientId);
  if (!patient) return;

  const today = todayIso();
  acceptHandoffPatient(database, patient, today);

  // Handoff teaches rather than tests, so concepts are introduced, not graded.
  introduceConcepts(database, getCaseConceptIds(database, patient.caseId), today);

  // A handoff patient arrives with their story already told, so the findings
  // that were part of the sign-out are legitimately known.
  const findings = getCaseFindings(database, patient.caseId);
  revealFindings(
    database,
    patient.id,
    findings.map((f) => f.id),
  );

  recordStudyEvent(database, {
    eventType: "HANDOFF_COMPLETED",
    patientInstanceId: patient.id,
    caseId: patient.caseId,
    date: today,
  });

  revalidateAll();
}

/* --------------------------------- rounds --------------------------------- */

const promptResponseSchema = z.object({
  patientId: z.string().min(1),
  promptId: z.string().min(1),
  response: z.string().min(1),
});

export interface PromptResultState {
  status: "idle" | "graded";
  correct?: boolean;
  feedback?: string;
  answerLabel?: string;
  correctLabel?: string;
  masteryLabel?: string;
  error?: string;
  /* Layered explanation (spec §24). Any of these may be blank. */
  whyCorrect?: string;
  whyOthersWrong?: string;
  caseEvidence?: string;
  detailedExplanation?: string;
  sourceReferences?: string[];
}

/**
 * Grades one prompt, updates mastery, and returns the feedback for display.
 * The patient is not advanced here — that happens when the learner continues,
 * so the feedback stays on screen.
 */
export async function submitPromptAction(
  _prev: PromptResultState,
  formData: FormData,
): Promise<PromptResultState> {
  const parsed = promptResponseSchema.safeParse({
    patientId: formData.get("patientId"),
    promptId: formData.get("promptId"),
    response: formData.get("response"),
  });
  if (!parsed.success) {
    return { status: "idle", error: "Please choose an answer before submitting." };
  }

  const database = db();
  const { patientId, promptId, response } = parsed.data;
  const patient = getPatient(database, patientId);
  if (!patient) return { status: "idle", error: "Patient not found." };

  const template = getCaseById(database, patient.caseId);
  if (!template) return { status: "idle", error: "Case not found." };

  const allPrompts = [
    ...getCasePrompts(database, patient.caseId, "ROUNDS"),
    ...getCasePrompts(database, patient.caseId, "DISCHARGE"),
    ...getCasePrompts(database, patient.caseId, "ADMISSION"),
    ...getCasePrompts(database, patient.caseId, "HANDOFF"),
  ];
  const prompt = allPrompts.find((p) => p.id === promptId);
  if (!prompt) return { status: "idle", error: "Prompt not found." };

  const grade = gradePromptResponse(prompt, response);
  const today = todayIso();

  recordPromptResponse(database, patient.id, prompt.id, prompt.stage, response, grade.correct);
  recordStudyEvent(database, {
    eventType: grade.correct ? "PROMPT_CORRECT" : "PROMPT_INCORRECT",
    patientInstanceId: patient.id,
    caseId: patient.caseId,
    conceptId: prompt.conceptId,
    response,
    correct: grade.correct,
    metadata: { stage: prompt.stage, promptId: prompt.id },
    date: today,
  });

  let masteryLabel: string | undefined;
  if (prompt.conceptId) {
    const update = updateConceptMastery(database, prompt.conceptId, grade.correct, today);
    masteryLabel = `Mastery ${update.previousLevel} → ${update.newLevel}${
      update.nextDueAt ? `, review ${update.nextDueAt}` : ""
    }`;
  }

  // Rounds prompts advance the patient; discharge is a separate action.
  if (prompt.stage === "ROUNDS") {
    const roundsPrompts = getCasePrompts(database, patient.caseId, "ROUNDS");
    advancePatientAfterRounds(
      database,
      patient,
      roundsPrompts.length,
      template.minimumRoundsBeforeDischarge,
      today,
    );
    recordStudyEvent(database, {
      eventType: "ROUND_COMPLETED",
      patientInstanceId: patient.id,
      caseId: patient.caseId,
      date: today,
    });
  } else {
    touchPatient(database, patient, today);
  }

  // Deliberately no revalidate here: the grading is already persisted, and
  // refreshing now would remount this prompt and discard the feedback the
  // learner is reading. The client refreshes when they press Continue.

  return {
    status: "graded",
    correct: grade.correct,
    feedback: grade.feedback,
    answerLabel: grade.answerLabel,
    correctLabel: grade.correctLabel,
    masteryLabel,
    whyCorrect: prompt.whyCorrect || undefined,
    whyOthersWrong: prompt.whyOthersWrong || undefined,
    caseEvidence: prompt.caseEvidence || undefined,
    detailedExplanation: prompt.detailedExplanation || undefined,
    sourceReferences: describeEvidence(database, "CASE_PROMPT", prompt.id),
  };
}

/* -------------------------------- admission ------------------------------- */

export interface AdmissionActionState {
  status: "idle" | "resolved";
  actionCode?: string;
  displayName?: string;
  classification?: string;
  resultText?: string;
  feedbackText?: string;
  error?: string;
}

/** Takes one admission action and reveals its deterministic result. */
export async function takeAdmissionActionAction(
  _prev: AdmissionActionState,
  formData: FormData,
): Promise<AdmissionActionState> {
  const patientId = String(formData.get("patientId") ?? "");
  const actionCode = String(formData.get("actionCode") ?? "");
  if (!patientId || !actionCode) return { status: "idle", error: "Missing action." };

  const database = db();
  const patient = getPatient(database, patientId);
  if (!patient) return { status: "idle", error: "Patient not found." };

  const already = listPatientActions(database, patient.id).some(
    (a) => a.actionCode === actionCode,
  );

  const outcome = resolveAction(database, patient.caseId, actionCode);
  const today = todayIso();

  if (!already) {
    recordPatientAction(
      database,
      patient.id,
      actionCode,
      outcome.classification,
      outcome.resultText,
    );
    recordStudyEvent(database, {
      eventType: "ADMISSION_ACTION",
      patientInstanceId: patient.id,
      caseId: patient.caseId,
      conceptId: outcome.conceptId,
      response: actionCode,
      metadata: { classification: outcome.classification, score: outcome.score },
      date: today,
    });
  }

  // Reveal any findings this action unlocks.
  const findings = getCaseFindings(database, patient.caseId).filter(
    (f) => f.triggerActionCode === actionCode,
  );
  if (findings.length) {
    revealFindings(
      database,
      patient.id,
      findings.map((f) => f.id),
    );
  }

  touchPatient(database, patient, today);
  revalidateAll();

  const actionDef = listActions(database).find((a) => a.actionCode === actionCode);
  return {
    status: "resolved",
    actionCode,
    displayName: actionDef?.displayName ?? actionCode,
    classification: outcome.classification,
    resultText: outcome.resultText,
    feedbackText: outcome.feedbackText,
  };
}

/** Ends the admission workup; the patient joins the service. */
export async function completeAdmissionAction(formData: FormData): Promise<void> {
  const patientId = String(formData.get("patientId") ?? "");
  const database = db();
  const patient = getPatient(database, patientId);
  if (!patient) return;

  completeAdmission(database, patient, todayIso());
  introduceConcepts(database, getCaseConceptIds(database, patient.caseId), todayIso());
  revalidateAll();
}

/**
 * Interprets a spoken or typed phrase against the action vocabulary.
 * Returns matches for confirmation — it never applies them.
 */
export async function interpretTranscriptAction(
  transcript: string,
): Promise<{ matched: { code: string; label: string }[]; unmatched: boolean }> {
  const result = matchTranscriptToActions(transcript, listActions(db()));
  return {
    matched: result.matched.map((m) => ({ code: m.actionCode, label: m.displayName })),
    unmatched: result.unmatched,
  };
}

/**
 * Restricts interpretation to the actions a given case actually defines plus
 * the shared library, so the admission screen never confirms something the
 * case cannot respond to meaningfully.
 */
export async function interpretForCaseAction(
  caseId: string,
  transcript: string,
): Promise<{ matched: { code: string; label: string }[]; unmatched: boolean }> {
  const database = db();
  const relevant = new Set(getCaseActionRules(database, caseId).map((r) => r.actionCode));
  const all = listActions(database);
  const scoped = all.filter((a) => relevant.has(a.actionCode));
  const result = matchTranscriptToActions(transcript, scoped.length > 0 ? scoped : all);
  return {
    matched: result.matched.map((m) => ({ code: m.actionCode, label: m.displayName })),
    unmatched: result.unmatched,
  };
}

/* ---------------------------- assessment & plan --------------------------- */

export async function addProblemAction(formData: FormData): Promise<void> {
  const patientId = String(formData.get("patientId") ?? "");
  const problemId = String(formData.get("problemId") ?? "");
  if (!patientId || !problemId) return;
  addProblem(db(), patientId, problemId);
  revalidateAll();
}

export async function removeProblemAction(formData: FormData): Promise<void> {
  const patientId = String(formData.get("patientId") ?? "");
  const problemId = String(formData.get("problemId") ?? "");
  if (!patientId || !problemId) return;
  removeProblem(db(), patientId, problemId);
  revalidateAll();
}

export async function togglePlanSelectionAction(formData: FormData): Promise<void> {
  const patientId = String(formData.get("patientId") ?? "");
  const problemId = String(formData.get("problemId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  if (!patientId || !problemId || !optionId) return;
  togglePlanSelection(db(), patientId, problemId, optionId);
  revalidateAll();
}

export interface PlanSignState {
  status: "idle" | "signed";
  score?: number;
  maxScore?: number;
  requiredSelected?: number;
  requiredTotal?: number;
  missedRequired?: { problemLabel: string; optionLabel: string; feedbackText: string }[];
  harmful?: { problemLabel: string; optionLabel: string; feedbackText: string }[];
  missedProblems?: string[];
  note?: string;
  error?: string;
}

/**
 * Signs the plan: this is the moment it is graded. Selections themselves are
 * free to change until now, so an unfinished plan is never penalised.
 */
export async function signPlanAction(
  _prev: PlanSignState,
  formData: FormData,
): Promise<PlanSignState> {
  const patientId = String(formData.get("patientId") ?? "");
  const database = db();
  const patient = getPatient(database, patientId);
  if (!patient) return { status: "idle", error: "Patient not found." };

  const score = scorePlan(database, patient.id, patient.caseId);
  const today = todayIso();

  recordStudyEvent(database, {
    eventType: "PLAN_SIGNED",
    patientInstanceId: patient.id,
    caseId: patient.caseId,
    metadata: {
      score: score.score,
      maxScore: score.maxScore,
      requiredSelected: score.requiredSelected,
      requiredTotal: score.requiredTotal,
      harmfulCount: score.harmful.length,
    },
    date: today,
  });
  touchPatient(database, patient, today);
  revalidateAll();

  return {
    status: "signed",
    score: score.score,
    maxScore: score.maxScore,
    requiredSelected: score.requiredSelected,
    requiredTotal: score.requiredTotal,
    missedRequired: score.missedRequired.map((l) => ({
      problemLabel: l.problemLabel,
      optionLabel: l.optionLabel,
      feedbackText: l.feedbackText,
    })),
    harmful: score.harmful.map((l) => ({
      problemLabel: l.problemLabel,
      optionLabel: l.optionLabel,
      feedbackText: l.feedbackText,
    })),
    missedProblems: score.missedProblems,
    note: renderPlanAsNote(buildChart(database, patient.id, patient.caseId)),
  };
}

/* -------------------------------- discharge ------------------------------- */

export async function dischargePatientAction(formData: FormData): Promise<void> {
  const patientId = String(formData.get("patientId") ?? "");
  const database = db();
  const patient = getPatient(database, patientId);
  if (!patient) return;
  dischargePatient(database, patient, todayIso());
  revalidateAll();
}

/* -------------------------------- lectures -------------------------------- */

export async function startLectureAction(formData: FormData): Promise<void> {
  const lectureId = String(formData.get("lectureId") ?? "");
  if (lectureId) startLecture(db(), lectureId, todayIso());
  revalidateAll();
}

export async function completeLectureAction(formData: FormData): Promise<void> {
  const lectureId = String(formData.get("lectureId") ?? "");
  if (!lectureId) return;
  const database = db();
  completeLecture(database, lectureId, todayIso());
  void getLectureConceptIds(database, lectureId);
  revalidateAll();
}

/* ------------------------------- demo content ----------------------------- */

export async function deleteDemoContentAction(): Promise<void> {
  deleteDemoContent(db());
  revalidateAll();
}

export async function resetDemoContentAction(): Promise<void> {
  resetDemoContent(db());
  revalidateAll();
}

export async function seedDemoContentAction(): Promise<void> {
  seedDemoContent(db());
  revalidateAll();
}
