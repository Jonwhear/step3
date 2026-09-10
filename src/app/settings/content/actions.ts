"use server";

/**
 * Content-authoring server actions.
 *
 * Kept separate from the main action file because these mutate *content*
 * rather than learner progress, and they are only reachable from advanced
 * settings. Every one of them delegates the actual rule enforcement to the
 * domain layer — none of these functions decide whether something is allowed.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteCasePermanently,
  duplicateCase,
  markCaseReviewed,
  setCaseStatus,
  updateCase,
  type CaseStatus,
} from "@/domain/content/cases";
import { importPack, summarisePack } from "@/domain/content/packs";
import {
  refreshAllLearningPointStatuses,
  setLearningPointReview,
  type ReviewStatus,
} from "@/domain/content/provenance";
import { db } from "@/server/db";

function revalidateContent(caseId?: string): void {
  revalidatePath("/settings/content");
  revalidatePath("/settings/content/coverage");
  revalidatePath("/settings/content/packs");
  revalidatePath("/settings/developer");
  revalidatePath("/");
  if (caseId) revalidatePath(`/settings/content/cases/${caseId}`);
}

export interface ContentActionState {
  ok: boolean;
  message?: string;
  error?: string;
}

export async function saveCaseAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) return { ok: false, error: "Missing case id." };

  const number = (key: string, fallback: number) => {
    const value = Number(formData.get(key));
    return Number.isFinite(value) ? value : fallback;
  };
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const ageRaw = text("patientAgeYears");
  const sexRaw = text("patientSex");

  const result = updateCase(db(), caseId, {
    title: text("title"),
    specialty: text("specialty"),
    topic: text("topic"),
    primaryDiagnosis: text("primaryDiagnosis"),
    difficulty: number("difficulty", 3),
    step3Importance: number("step3Importance", 3),
    handoffScript: text("handoffScript"),
    dailySignout: text("dailySignout"),
    admissionOpening: text("admissionOpening"),
    teachingPoint: text("teachingPoint"),
    minimumRoundsBeforeDischarge: number("minimumRoundsBeforeDischarge", 2),
    patientAgeYears: ageRaw ? Number(ageRaw) : null,
    patientSex: sexRaw || null,
    chiefComplaint: text("chiefComplaint"),
    codeStatus: text("codeStatus"),
    allergies: text("allergies"),
  });

  if (!result.ok) return { ok: false, error: result.error };
  revalidateContent(caseId);
  return { ok: true, message: "Saved." };
}

export async function duplicateCaseAction(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const newCode = String(formData.get("newCode") ?? "");
  if (!caseId) return;
  const result = duplicateCase(db(), caseId, newCode || undefined);
  revalidateContent();
  if (result.ok && result.caseId) {
    redirect(`/settings/content/cases/${encodeURIComponent(result.caseId)}`);
  }
}

export async function setCaseStatusAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const caseId = String(formData.get("caseId") ?? "");
  const status = String(formData.get("status") ?? "") as CaseStatus;
  if (!caseId || !status) return { ok: false, error: "Missing case or status." };

  const result = setCaseStatus(db(), caseId, status);
  revalidateContent(caseId);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, message: `Status set to ${status.toLowerCase()}.` };
}

export async function markReviewedAction(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const notes = String(formData.get("reviewNotes") ?? "");
  if (!caseId) return;
  markCaseReviewed(db(), caseId, notes);
  revalidateContent(caseId);
}

export async function deleteCaseAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) return { ok: false, error: "Missing case id." };
  const result = deleteCasePermanently(db(), caseId);
  revalidateContent();
  if (!result.ok) return { ok: false, error: result.error };
  redirect("/settings/content");
}

export async function setLearningPointReviewAction(formData: FormData): Promise<void> {
  const pointId = String(formData.get("pointId") ?? "");
  const status = String(formData.get("reviewStatus") ?? "") as ReviewStatus;
  if (!pointId || !status) return;
  setLearningPointReview(db(), pointId, status);
  revalidateContent();
}

export async function refreshCoverageAction(): Promise<void> {
  refreshAllLearningPointStatuses(db());
  revalidateContent();
}

/* --------------------------------- packs ---------------------------------- */

export interface PackImportState {
  status: "idle" | "inspected" | "imported";
  error?: string;
  /** Echoed back so Confirm import does not need the file re-selected. */
  payload?: string;
  summary?: {
    name: string;
    version: string;
    author: string;
    schemaVersion: number;
    counts: Record<string, number>;
    conflicts: { kind: string; code: string }[];
    migrationNotes: string[];
  };
  imported?: Record<string, number>;
}

/**
 * Inspect-then-confirm import (spec §43). This step writes nothing: it parses,
 * migrates, validates and reports, so the user always sees what they are about
 * to add before anything lands.
 */
export async function inspectPackAction(
  _prev: PackImportState,
  formData: FormData,
): Promise<PackImportState> {
  const payload = String(formData.get("payload") ?? "").trim();
  if (!payload) return { status: "idle", error: "Paste a pack file first." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { status: "idle", error: "That is not valid JSON." };
  }

  const inspection = summarisePack(db(), parsed);
  if (!inspection.ok) return { status: "idle", error: inspection.error };

  const { summary } = inspection;
  return {
    status: "inspected",
    payload,
    summary: {
      name: summary.manifest.name,
      version: summary.manifest.version,
      author: summary.manifest.author,
      schemaVersion: summary.manifest.schemaVersion,
      counts: summary.counts,
      conflicts: summary.conflicts,
      migrationNotes: summary.migrationNotes.map((n) => n.message),
    },
  };
}

export async function confirmPackImportAction(
  _prev: PackImportState,
  formData: FormData,
): Promise<PackImportState> {
  const payload = String(formData.get("payload") ?? "").trim();
  if (!payload) return { status: "idle", error: "Nothing to import." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { status: "idle", error: "That is not valid JSON." };
  }

  const result = importPack(db(), parsed);
  revalidateContent();
  if (!result.ok) return { status: "idle", error: result.error };

  return { status: "imported", imported: result.imported };
}
