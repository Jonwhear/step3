/**
 * Custom case authoring (spec §37-39, §62-64).
 *
 * Two safety rules shape everything here:
 *
 *  - **Bundled content is never edited in place.** Demo cases are duplicated
 *    first (§38), so re-seeding the demo library can never destroy the user's
 *    work and the user can never silently diverge from the bundled library.
 *  - **Publishing is gated on validation.** A case with errors cannot become
 *    PUBLISHED, which is what keeps the scheduler's pool trustworthy.
 *
 * Deletion is soft by default (§64): archiving keeps historical StudyEvents
 * meaningful, since they reference the case id.
 */

import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { nowIso } from "@/lib/date";
import { validateCase } from "./validation";

export const CASE_STATUSES = [
  "DRAFT",
  "NEEDS_REVIEW",
  "REVIEWED",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  DRAFT: "Draft",
  NEEDS_REVIEW: "Needs review",
  REVIEWED: "Reviewed",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export interface CaseSummary {
  id: string;
  code: string;
  title: string;
  specialty: string;
  topic: string;
  status: CaseStatus;
  reviewStatus: string;
  isDemo: boolean;
  packId: string | null;
  version: number;
  errorCount: number;
  warningCount: number;
  updatedAt: string;
}

export function listCaseSummaries(db: Db): CaseSummary[] {
  return db
    .select()
    .from(t.caseTemplate)
    .all()
    .map((row) => {
      const validation = validateCase(db, row.id);
      return {
        id: row.id,
        code: row.code,
        title: row.title,
        specialty: row.specialty,
        topic: row.topic,
        status: row.status as CaseStatus,
        reviewStatus: row.reviewStatus,
        isDemo: row.isDemo,
        packId: row.packId,
        version: row.version,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        updatedAt: row.updatedAt,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function getCaseRow(db: Db, caseId: string): t.CaseTemplateRow | null {
  return db.select().from(t.caseTemplate).where(eq(t.caseTemplate.id, caseId)).get() ?? null;
}

/** Bundled content is read-only; edits go to a duplicate instead (spec §38). */
export function isEditable(row: t.CaseTemplateRow): boolean {
  return !row.isDemo;
}

export interface CaseEditableFields {
  title: string;
  specialty: string;
  topic: string;
  primaryDiagnosis: string;
  difficulty: number;
  step3Importance: number;
  handoffScript: string;
  dailySignout: string;
  admissionOpening: string;
  teachingPoint: string;
  minimumRoundsBeforeDischarge: number;
  patientAgeYears: number | null;
  patientSex: string | null;
  chiefComplaint: string;
  codeStatus: string;
  allergies: string;
  reviewNotes: string;
}

export interface CaseMutationResult {
  ok: boolean;
  error?: string;
  caseId?: string;
}

/** Snapshot before a change, so a bad edit can be reverted (spec §63). */
function snapshotCase(db: Db, row: t.CaseTemplateRow, note: string): void {
  db.insert(t.caseRevision)
    .values({
      id: `rev_${crypto.randomUUID()}`,
      caseId: row.id,
      version: row.version,
      snapshotJson: JSON.stringify(row),
      note,
      createdAt: nowIso(),
    })
    .run();
}

export function updateCase(
  db: Db,
  caseId: string,
  fields: Partial<CaseEditableFields>,
): CaseMutationResult {
  const row = getCaseRow(db, caseId);
  if (!row) return { ok: false, error: "Case not found." };
  if (!isEditable(row)) {
    return {
      ok: false,
      error: "Bundled demo cases cannot be edited directly. Duplicate this case first.",
    };
  }

  snapshotCase(db, row, "Before edit");

  db.update(t.caseTemplate)
    .set({
      ...fields,
      version: row.version + 1,
      updatedAt: nowIso(),
      // Any content change invalidates a previous review.
      reviewStatus: row.reviewStatus === "REVIEWED" ? "UNREVIEWED" : row.reviewStatus,
    })
    .where(eq(t.caseTemplate.id, caseId))
    .run();

  return { ok: true, caseId };
}

/**
 * Copies a case and everything hanging off it into a new editable case.
 * This is the only supported way to modify bundled content.
 */
export function duplicateCase(db: Db, caseId: string, newCode?: string): CaseMutationResult {
  const row = getCaseRow(db, caseId);
  if (!row) return { ok: false, error: "Case not found." };

  const code = (newCode?.trim() || `${row.code}-COPY`).toUpperCase();
  const existing = db
    .select({ id: t.caseTemplate.id })
    .from(t.caseTemplate)
    .where(eq(t.caseTemplate.code, code))
    .get();
  if (existing) {
    return { ok: false, error: `A case with code "${code}" already exists.` };
  }

  const newId = `case:${code}`;

  db.transaction((tx) => {
    tx.insert(t.caseTemplate)
      .values({
        ...row,
        id: newId,
        code,
        title: `${row.title} (copy)`,
        // A copy is always a draft: it has not been reviewed in this form.
        status: "DRAFT",
        reviewStatus: "UNREVIEWED",
        reviewedAt: null,
        reviewNotes: "",
        isDemo: false,
        contentOrigin: "AUTHORED",
        demoSeedVersion: null,
        packId: row.packId,
        version: 1,
        createdBy: "user",
        derivedFromCaseId: row.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .run();

    for (const link of tx
      .select()
      .from(t.caseConcept)
      .where(eq(t.caseConcept.caseId, caseId))
      .all()) {
      tx.insert(t.caseConcept).values({ ...link, caseId: newId }).run();
    }

    const findings = tx
      .select()
      .from(t.caseFinding)
      .where(eq(t.caseFinding.caseId, caseId))
      .all();
    for (const [index, finding] of findings.entries()) {
      tx.insert(t.caseFinding)
        .values({ ...finding, id: `${newId}:finding:${index}`, caseId: newId })
        .run();
    }

    const rules = tx
      .select()
      .from(t.caseActionRule)
      .where(eq(t.caseActionRule.caseId, caseId))
      .all();
    for (const rule of rules) {
      tx.insert(t.caseActionRule)
        .values({ ...rule, id: `${newId}:rule:${rule.actionCode}`, caseId: newId })
        .run();
    }

    const prompts = tx
      .select()
      .from(t.casePrompt)
      .where(eq(t.casePrompt.caseId, caseId))
      .all();
    for (const [index, prompt] of prompts.entries()) {
      tx.insert(t.casePrompt)
        .values({ ...prompt, id: `${newId}:prompt:${index}`, caseId: newId })
        .run();
    }

    const labs = tx
      .select()
      .from(t.caseLabResult)
      .where(eq(t.caseLabResult.caseId, caseId))
      .all();
    for (const [index, lab] of labs.entries()) {
      tx.insert(t.caseLabResult)
        .values({ ...lab, id: `${newId}:lab:${index}`, caseId: newId })
        .run();
    }

    const imaging = tx
      .select()
      .from(t.caseImagingResult)
      .where(eq(t.caseImagingResult.caseId, caseId))
      .all();
    for (const [index, study] of imaging.entries()) {
      tx.insert(t.caseImagingResult)
        .values({ ...study, id: `${newId}:imaging:${index}`, caseId: newId })
        .run();
    }

    const problems = tx
      .select()
      .from(t.caseProblem)
      .where(eq(t.caseProblem.caseId, caseId))
      .all();
    for (const [pIndex, problem] of problems.entries()) {
      const newProblemId = `${newId}:problem:${pIndex}`;
      tx.insert(t.caseProblem)
        .values({ ...problem, id: newProblemId, caseId: newId })
        .run();
      const options = tx
        .select()
        .from(t.caseProblemOption)
        .where(eq(t.caseProblemOption.problemId, problem.id))
        .all();
      for (const [oIndex, option] of options.entries()) {
        tx.insert(t.caseProblemOption)
          .values({
            ...option,
            id: `${newProblemId}:option:${oIndex}`,
            problemId: newProblemId,
          })
          .run();
      }
    }
  });

  return { ok: true, caseId: newId };
}

/** Publishing requires a clean validation run (spec §11). */
export function publishCase(db: Db, caseId: string): CaseMutationResult {
  const row = getCaseRow(db, caseId);
  if (!row) return { ok: false, error: "Case not found." };

  const validation = validateCase(db, caseId);
  if (!validation.ok) {
    return {
      ok: false,
      error: `This case has ${validation.errors.length} validation error${
        validation.errors.length === 1 ? "" : "s"
      } and cannot be published until they are fixed.`,
    };
  }

  db.update(t.caseTemplate)
    .set({ status: "PUBLISHED", updatedAt: nowIso() })
    .where(eq(t.caseTemplate.id, caseId))
    .run();
  return { ok: true, caseId };
}

export function setCaseStatus(db: Db, caseId: string, status: CaseStatus): CaseMutationResult {
  if (status === "PUBLISHED") return publishCase(db, caseId);
  const row = getCaseRow(db, caseId);
  if (!row) return { ok: false, error: "Case not found." };
  if (row.isDemo && status === "ARCHIVED") {
    // Archiving bundled content is allowed — it is reversible and does not
    // destroy anything — but editing it is not.
  }
  db.update(t.caseTemplate)
    .set({ status, updatedAt: nowIso() })
    .where(eq(t.caseTemplate.id, caseId))
    .run();
  return { ok: true, caseId };
}

export function markCaseReviewed(
  db: Db,
  caseId: string,
  notes: string,
): CaseMutationResult {
  const row = getCaseRow(db, caseId);
  if (!row) return { ok: false, error: "Case not found." };
  db.update(t.caseTemplate)
    .set({
      reviewStatus: "REVIEWED",
      reviewedAt: nowIso(),
      reviewNotes: notes,
      updatedAt: nowIso(),
    })
    .where(eq(t.caseTemplate.id, caseId))
    .run();
  return { ok: true, caseId };
}

/**
 * Permanent deletion, offered only from advanced settings (spec §64).
 *
 * Bundled content is refused, and so is any case a learner has actually seen:
 * deleting it would leave StudyEvents pointing at nothing. Archive instead.
 */
export function deleteCasePermanently(db: Db, caseId: string): CaseMutationResult {
  const row = getCaseRow(db, caseId);
  if (!row) return { ok: false, error: "Case not found." };
  if (row.isDemo) {
    return {
      ok: false,
      error: "Bundled demo cases cannot be deleted individually. Use Delete demo content.",
    };
  }

  const usage = db
    .select({ id: t.patientInstance.id })
    .from(t.patientInstance)
    .where(eq(t.patientInstance.caseId, caseId))
    .all();
  if (usage.length > 0) {
    return {
      ok: false,
      error: `This case has ${usage.length} patient encounter${
        usage.length === 1 ? "" : "s"
      } in your history. Archive it instead so that history stays readable.`,
    };
  }

  db.transaction((tx) => {
    const problems = tx
      .select({ id: t.caseProblem.id })
      .from(t.caseProblem)
      .where(eq(t.caseProblem.caseId, caseId))
      .all();
    for (const problem of problems) {
      tx.delete(t.caseProblemOption)
        .where(eq(t.caseProblemOption.problemId, problem.id))
        .run();
    }
    tx.delete(t.caseProblem).where(eq(t.caseProblem.caseId, caseId)).run();
    tx.delete(t.caseLabResult).where(eq(t.caseLabResult.caseId, caseId)).run();
    tx.delete(t.caseImagingResult).where(eq(t.caseImagingResult.caseId, caseId)).run();
    tx.delete(t.casePrompt).where(eq(t.casePrompt.caseId, caseId)).run();
    tx.delete(t.caseActionRule).where(eq(t.caseActionRule.caseId, caseId)).run();
    tx.delete(t.caseFinding).where(eq(t.caseFinding.caseId, caseId)).run();
    tx.delete(t.caseConcept).where(eq(t.caseConcept.caseId, caseId)).run();
    tx.delete(t.learningPointMapping)
      .where(eq(t.learningPointMapping.caseId, caseId))
      .run();
    tx.delete(t.caseRevision).where(eq(t.caseRevision.caseId, caseId)).run();
    tx.delete(t.caseTemplate).where(eq(t.caseTemplate.id, caseId)).run();
  });

  return { ok: true };
}

export function listRevisions(db: Db, caseId: string): t.CaseRevisionRow[] {
  return db
    .select()
    .from(t.caseRevision)
    .where(eq(t.caseRevision.caseId, caseId))
    .all()
    .sort((a, b) => b.version - a.version);
}
