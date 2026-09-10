/**
 * Source material, learning points and provenance (spec §4-5, §10).
 *
 * The V2 problem this exists to solve: consolidating ~1,000 source questions
 * into a much smaller library of clinically coherent patients is only safe if
 * you can *prove* nothing was dropped. So the pipeline is stored, not inferred:
 *
 *     ContentSource → SourceFragment → LearningPoint → mapping → case / lecture
 *
 * Every step persists. Nothing here depends on a model remembering an earlier
 * batch, which is precisely what makes incremental ingestion safe (spec §8).
 */

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { nowIso } from "@/lib/date";

export const SOURCE_TYPES = [
  "DEMO",
  "UWORLD",
  "FIRST_AID",
  "GUIDELINE",
  "CUSTOM",
  "OTHER",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const LEARNING_POINT_STATUSES = [
  "UNPROCESSED",
  "MAPPED",
  "PARTIALLY_MAPPED",
  "FULLY_MAPPED",
  "EXCLUDED",
] as const;
export type LearningPointStatus = (typeof LEARNING_POINT_STATUSES)[number];

export const REVIEW_STATUSES = ["UNREVIEWED", "REVIEWED", "NEEDS_CORRECTION"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const MAPPING_ENTITY_TYPES = [
  "CASE",
  "CASE_PROMPT",
  "CASE_ACTION_RULE",
  "CASE_PROBLEM_OPTION",
  "LECTURE",
] as const;
export type MappingEntityType = (typeof MAPPING_ENTITY_TYPES)[number];

/* --------------------------------- sources -------------------------------- */

export interface ContentSourceInput {
  id?: string;
  sourceType: SourceType;
  title: string;
  sourceIdentifier?: string;
  section?: string;
  subsection?: string;
  notes?: string;
  version?: string;
  isDemo?: boolean;
  packId?: string | null;
}

export function upsertContentSource(db: Db, input: ContentSourceInput): string {
  const id = input.id ?? `src_${crypto.randomUUID()}`;
  db.insert(t.contentSource)
    .values({
      id,
      sourceType: input.sourceType,
      title: input.title,
      sourceIdentifier: input.sourceIdentifier ?? "",
      section: input.section ?? "",
      subsection: input.subsection ?? "",
      notes: input.notes ?? "",
      version: input.version ?? "",
      isDemo: input.isDemo ?? false,
      packId: input.packId ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .onConflictDoUpdate({
      target: t.contentSource.id,
      set: {
        sourceType: input.sourceType,
        title: input.title,
        sourceIdentifier: input.sourceIdentifier ?? "",
        section: input.section ?? "",
        subsection: input.subsection ?? "",
        notes: input.notes ?? "",
        version: input.version ?? "",
        updatedAt: nowIso(),
      },
    })
    .run();
  return id;
}

export function listContentSources(db: Db): t.ContentSourceRow[] {
  return db.select().from(t.contentSource).orderBy(asc(t.contentSource.title)).all();
}

export function getContentSource(db: Db, id: string): t.ContentSourceRow | null {
  return db.select().from(t.contentSource).where(eq(t.contentSource.id, id)).get() ?? null;
}

/* -------------------------------- fragments ------------------------------- */

/** Normalisation is only for search/dedup; `rawText` is never modified. */
export function normalizeFragmentText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export interface SourceFragmentInput {
  contentSourceId: string;
  fragmentIndex: number;
  label?: string;
  rawText: string;
}

export function upsertSourceFragment(db: Db, input: SourceFragmentInput): string {
  const id = `frg_${input.contentSourceId}_${input.fragmentIndex}`;
  db.insert(t.sourceFragment)
    .values({
      id,
      contentSourceId: input.contentSourceId,
      fragmentIndex: input.fragmentIndex,
      label: input.label ?? "",
      rawText: input.rawText,
      normalizedText: normalizeFragmentText(input.rawText),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .onConflictDoUpdate({
      target: t.sourceFragment.id,
      set: {
        label: input.label ?? "",
        rawText: input.rawText,
        normalizedText: normalizeFragmentText(input.rawText),
        updatedAt: nowIso(),
      },
    })
    .run();
  return id;
}

export function listFragments(db: Db, contentSourceId: string): t.SourceFragmentRow[] {
  return db
    .select()
    .from(t.sourceFragment)
    .where(eq(t.sourceFragment.contentSourceId, contentSourceId))
    .orderBy(asc(t.sourceFragment.fragmentIndex))
    .all();
}

/**
 * Splits a large document into deterministic chunks on paragraph boundaries.
 * Batching happens here, in the database, rather than by feeding a whole corpus
 * to anything at once (spec §8).
 */
export function chunkSourceText(text: string, maxChars = 2000): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > maxChars) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/* ----------------------------- learning points ---------------------------- */

export interface LearningPointInput {
  code: string;
  title: string;
  description?: string;
  specialty?: string;
  topic?: string;
  importance?: number;
  contentSourceId?: string | null;
  sourceFragmentId?: string | null;
  status?: LearningPointStatus;
  reviewStatus?: ReviewStatus;
  packId?: string | null;
  isDemo?: boolean;
}

export function upsertLearningPoint(db: Db, input: LearningPointInput): string {
  const id = `lp:${input.code}`;
  db.insert(t.learningPoint)
    .values({
      id,
      code: input.code,
      title: input.title,
      description: input.description ?? "",
      specialty: input.specialty ?? "",
      topic: input.topic ?? "",
      importance: input.importance ?? 3,
      contentSourceId: input.contentSourceId ?? null,
      sourceFragmentId: input.sourceFragmentId ?? null,
      status: input.status ?? "UNPROCESSED",
      reviewStatus: input.reviewStatus ?? "UNREVIEWED",
      canonicalLearningPointId: null,
      isCanonical: true,
      packId: input.packId ?? null,
      isDemo: input.isDemo ?? false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .onConflictDoUpdate({
      target: t.learningPoint.id,
      set: {
        title: input.title,
        description: input.description ?? "",
        specialty: input.specialty ?? "",
        topic: input.topic ?? "",
        importance: input.importance ?? 3,
        contentSourceId: input.contentSourceId ?? null,
        sourceFragmentId: input.sourceFragmentId ?? null,
        updatedAt: nowIso(),
      },
    })
    .run();
  return id;
}

export function listLearningPoints(db: Db): t.LearningPointRow[] {
  return db.select().from(t.learningPoint).orderBy(asc(t.learningPoint.code)).all();
}

export function getLearningPoint(db: Db, id: string): t.LearningPointRow | null {
  return db.select().from(t.learningPoint).where(eq(t.learningPoint.id, id)).get() ?? null;
}

export function setLearningPointReview(
  db: Db,
  id: string,
  reviewStatus: ReviewStatus,
): void {
  db.update(t.learningPoint)
    .set({ reviewStatus, updatedAt: nowIso() })
    .where(eq(t.learningPoint.id, id))
    .run();
}

/**
 * Merges a duplicate into a canonical point (spec §9).
 *
 * Deliberately manual and deliberately non-destructive: the duplicate keeps its
 * row and its provenance, and its mappings are re-pointed at the canonical
 * point so coverage still counts them. Nothing is merged automatically.
 */
export function mergeLearningPoint(db: Db, duplicateId: string, canonicalId: string): void {
  if (duplicateId === canonicalId) return;
  db.transaction((tx) => {
    tx.update(t.learningPoint)
      .set({
        canonicalLearningPointId: canonicalId,
        isCanonical: false,
        status: "EXCLUDED",
        updatedAt: nowIso(),
      })
      .where(eq(t.learningPoint.id, duplicateId))
      .run();

    const mappings = tx
      .select()
      .from(t.learningPointMapping)
      .where(eq(t.learningPointMapping.learningPointId, duplicateId))
      .all();

    for (const mapping of mappings) {
      tx.insert(t.learningPointMapping)
        .values({
          id: `lpm_${crypto.randomUUID()}`,
          learningPointId: canonicalId,
          entityType: mapping.entityType,
          entityId: mapping.entityId,
          caseId: mapping.caseId,
          lectureId: mapping.lectureId,
          notes: mapping.notes,
          createdAt: nowIso(),
        })
        .onConflictDoNothing()
        .run();
    }
  });
}

/* --------------------------------- mappings ------------------------------- */

export interface MappingInput {
  learningPointId: string;
  entityType: MappingEntityType;
  entityId: string;
  caseId?: string | null;
  lectureId?: string | null;
  notes?: string;
}

export function mapLearningPoint(db: Db, input: MappingInput): void {
  db.insert(t.learningPointMapping)
    .values({
      id: `lpm_${crypto.randomUUID()}`,
      learningPointId: input.learningPointId,
      entityType: input.entityType,
      entityId: input.entityId,
      caseId: input.caseId ?? null,
      lectureId: input.lectureId ?? null,
      notes: input.notes ?? "",
      createdAt: nowIso(),
    })
    .onConflictDoNothing()
    .run();
  refreshLearningPointStatus(db, input.learningPointId);
}

export function unmapLearningPoint(
  db: Db,
  learningPointId: string,
  entityType: string,
  entityId: string,
): void {
  db.delete(t.learningPointMapping)
    .where(
      and(
        eq(t.learningPointMapping.learningPointId, learningPointId),
        eq(t.learningPointMapping.entityType, entityType),
        eq(t.learningPointMapping.entityId, entityId),
      ),
    )
    .run();
  refreshLearningPointStatus(db, learningPointId);
}

export function listMappingsForLearningPoint(
  db: Db,
  learningPointId: string,
): t.LearningPointMappingRow[] {
  return db
    .select()
    .from(t.learningPointMapping)
    .where(eq(t.learningPointMapping.learningPointId, learningPointId))
    .all();
}

export function listMappingsForCase(db: Db, caseId: string): t.LearningPointMappingRow[] {
  return db
    .select()
    .from(t.learningPointMapping)
    .where(eq(t.learningPointMapping.caseId, caseId))
    .all();
}

/**
 * Derives a learning point's mapping status from its mappings.
 *
 * The distinction that matters for the audit: being *attached to a case* is not
 * the same as being *tested*. A point mapped only at case level is
 * PARTIALLY_MAPPED — it is present in a patient but nothing actually asks the
 * learner about it. FULLY_MAPPED requires a graded interaction or a lecture.
 */
export function refreshLearningPointStatus(db: Db, learningPointId: string): LearningPointStatus {
  const point = getLearningPoint(db, learningPointId);
  if (!point) return "UNPROCESSED";
  if (point.status === "EXCLUDED") return "EXCLUDED";

  const mappings = listMappingsForLearningPoint(db, learningPointId);
  const tested = mappings.some((m) =>
    ["CASE_PROMPT", "CASE_ACTION_RULE", "CASE_PROBLEM_OPTION", "LECTURE"].includes(m.entityType),
  );

  const status: LearningPointStatus =
    mappings.length === 0 ? "UNPROCESSED" : tested ? "FULLY_MAPPED" : "PARTIALLY_MAPPED";

  db.update(t.learningPoint)
    .set({ status, updatedAt: nowIso() })
    .where(eq(t.learningPoint.id, learningPointId))
    .run();
  return status;
}

export function refreshAllLearningPointStatuses(db: Db): number {
  const points = listLearningPoints(db);
  for (const point of points) refreshLearningPointStatus(db, point.id);
  return points.length;
}

/* ------------------------------ evidence links ---------------------------- */

export interface EvidenceInput {
  entityType: string;
  entityId: string;
  contentSourceId: string;
  sourceFragmentId?: string | null;
  notes?: string;
}

export function addEvidenceLink(db: Db, input: EvidenceInput): void {
  db.insert(t.evidenceLink)
    .values({
      id: `ev_${crypto.randomUUID()}`,
      entityType: input.entityType,
      entityId: input.entityId,
      contentSourceId: input.contentSourceId,
      sourceFragmentId: input.sourceFragmentId ?? null,
      notes: input.notes ?? "",
      createdAt: nowIso(),
    })
    .run();
}

export function listEvidence(
  db: Db,
  entityType: string,
  entityId: string,
): t.EvidenceLinkRow[] {
  return db
    .select()
    .from(t.evidenceLink)
    .where(and(eq(t.evidenceLink.entityType, entityType), eq(t.evidenceLink.entityId, entityId)))
    .all();
}

/**
 * Human-readable "why is this correct?" citations for one entity (spec §10).
 * Returns undefined rather than an empty array so callers can omit the section.
 */
export function describeEvidence(
  db: Db,
  entityType: string,
  entityId: string,
): string[] | undefined {
  const links = listEvidence(db, entityType, entityId);
  if (links.length === 0) return undefined;

  const sourceIds = [...new Set(links.map((l) => l.contentSourceId))];
  const sources = new Map(
    db
      .select()
      .from(t.contentSource)
      .where(inArray(t.contentSource.id, sourceIds))
      .all()
      .map((s) => [s.id, s]),
  );

  return links.map((link) => {
    const source = sources.get(link.contentSourceId);
    if (!source) return link.notes || "Unknown source";
    const parts = [source.title, source.sourceIdentifier, source.section, link.notes].filter(
      Boolean,
    );
    return parts.join(" · ");
  });
}

/* ------------------------------ coverage audit ---------------------------- */

export interface CoverageTotals {
  total: number;
  fullyMapped: number;
  partiallyMapped: number;
  unmapped: number;
  excluded: number;
  reviewed: number;
  needsCorrection: number;
  /** Percentage of non-excluded points reachable through a patient case. */
  patientCoveragePercent: number;
  /** Percentage reachable through a lecture. */
  lectureCoveragePercent: number;
  unmappedPercent: number;
}

export function buildCoverageTotals(db: Db): CoverageTotals {
  const points = listLearningPoints(db);
  const mappings = db.select().from(t.learningPointMapping).all();

  const byPoint = new Map<string, t.LearningPointMappingRow[]>();
  for (const mapping of mappings) {
    const list = byPoint.get(mapping.learningPointId) ?? [];
    list.push(mapping);
    byPoint.set(mapping.learningPointId, list);
  }

  const totals: CoverageTotals = {
    total: points.length,
    fullyMapped: 0,
    partiallyMapped: 0,
    unmapped: 0,
    excluded: 0,
    reviewed: 0,
    needsCorrection: 0,
    patientCoveragePercent: 0,
    lectureCoveragePercent: 0,
    unmappedPercent: 0,
  };

  let inScope = 0;
  let inPatient = 0;
  let inLecture = 0;

  for (const point of points) {
    if (point.reviewStatus === "REVIEWED") totals.reviewed += 1;
    if (point.reviewStatus === "NEEDS_CORRECTION") totals.needsCorrection += 1;

    if (point.status === "EXCLUDED") {
      totals.excluded += 1;
      continue;
    }
    inScope += 1;

    const list = byPoint.get(point.id) ?? [];
    if (list.some((m) => m.caseId)) inPatient += 1;
    if (list.some((m) => m.lectureId || m.entityType === "LECTURE")) inLecture += 1;

    if (point.status === "FULLY_MAPPED") totals.fullyMapped += 1;
    else if (point.status === "PARTIALLY_MAPPED") totals.partiallyMapped += 1;
    else totals.unmapped += 1;
  }

  const pct = (n: number) => (inScope === 0 ? 0 : Math.round((n / inScope) * 100));
  totals.patientCoveragePercent = pct(inPatient);
  totals.lectureCoveragePercent = pct(inLecture);
  totals.unmappedPercent = pct(totals.unmapped);
  return totals;
}

export interface LearningPointCoverage {
  point: t.LearningPointRow;
  source: { title: string; identifier: string; section: string } | null;
  fragmentLabel: string | null;
  cases: { id: string; code: string; title: string }[];
  lectures: { id: string; code: string; title: string }[];
  testedBy: string[];
}

/** Full drill-down for one learning point: where it came from, where it is tested. */
export function describeLearningPointCoverage(
  db: Db,
  learningPointId: string,
): LearningPointCoverage | null {
  const point = getLearningPoint(db, learningPointId);
  if (!point) return null;

  const mappings = listMappingsForLearningPoint(db, learningPointId);
  const source = point.contentSourceId ? getContentSource(db, point.contentSourceId) : null;
  const fragment = point.sourceFragmentId
    ? (db
        .select()
        .from(t.sourceFragment)
        .where(eq(t.sourceFragment.id, point.sourceFragmentId))
        .get() ?? null)
    : null;

  const caseIds = [...new Set(mappings.map((m) => m.caseId).filter((id): id is string => !!id))];
  const cases = caseIds.length
    ? db
        .select({
          id: t.caseTemplate.id,
          code: t.caseTemplate.code,
          title: t.caseTemplate.title,
        })
        .from(t.caseTemplate)
        .where(inArray(t.caseTemplate.id, caseIds))
        .all()
    : [];

  const lectureIds = [
    ...new Set(
      mappings
        .map((m) => m.lectureId ?? (m.entityType === "LECTURE" ? m.entityId : null))
        .filter((id): id is string => !!id),
    ),
  ];
  const lectures = lectureIds.length
    ? db
        .select({ id: t.lecture.id, code: t.lecture.code, title: t.lecture.title })
        .from(t.lecture)
        .where(inArray(t.lecture.id, lectureIds))
        .all()
    : [];

  const testedBy = mappings
    .filter((m) => m.entityType !== "CASE")
    .map((m) => `${m.entityType.replace(/_/g, " ").toLowerCase()}${m.notes ? ` — ${m.notes}` : ""}`);

  return {
    point,
    source: source
      ? {
          title: source.title,
          identifier: source.sourceIdentifier,
          section: source.section,
        }
      : null,
    fragmentLabel: fragment ? fragment.label || `Fragment ${fragment.fragmentIndex + 1}` : null,
    cases,
    lectures,
    testedBy,
  };
}

/** Learning points attached to a case but never actually tested inside it. */
export function findUntestedMappings(db: Db, caseId: string): t.LearningPointRow[] {
  const mappings = listMappingsForCase(db, caseId);
  const byPoint = new Map<string, t.LearningPointMappingRow[]>();
  for (const mapping of mappings) {
    const list = byPoint.get(mapping.learningPointId) ?? [];
    list.push(mapping);
    byPoint.set(mapping.learningPointId, list);
  }

  const untested = [...byPoint.entries()]
    .filter(([, list]) => list.every((m) => m.entityType === "CASE"))
    .map(([pointId]) => pointId);

  if (untested.length === 0) return [];
  return db
    .select()
    .from(t.learningPoint)
    .where(inArray(t.learningPoint.id, untested))
    .orderBy(asc(t.learningPoint.code))
    .all();
}

export function listRecentSources(db: Db, limit = 20): t.ContentSourceRow[] {
  return db
    .select()
    .from(t.contentSource)
    .orderBy(desc(t.contentSource.updatedAt))
    .limit(limit)
    .all();
}
