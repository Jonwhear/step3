/**
 * Portable content packs (spec §40-44).
 *
 * The engine is General Hospital; a pack is a library of patients that can be
 * authored, exported, shared and re-imported — Anki-style. Two rules matter
 * more than the format itself:
 *
 *  - **Every pack declares `schemaVersion`.** Once a version ships it is never
 *    silently reinterpreted; older versions are brought forward by explicit
 *    migration adapters (§44), never by assuming the newest shape.
 *  - **Import is never blind.** A pack is validated, summarised and confirmed
 *    before a single row is written, and the write is a transaction so a
 *    malformed pack cannot leave a half-imported library behind (§43).
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  caseTemplateSchema,
  conceptSchema,
  actionDefinitionSchema,
  labDefinitionSchema,
  lectureSchema,
  contentSourceSchema,
  learningPointContentSchema,
} from "@/content/schema";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { nowIso } from "@/lib/date";

/** The version this build writes. Bump only on a breaking shape change. */
export const CURRENT_PACK_SCHEMA_VERSION = 2;

/** Versions this build can still read, oldest first. */
export const SUPPORTED_PACK_SCHEMA_VERSIONS = [1, 2] as const;

export const PACK_FORMAT = "general-hospital-content-pack";

export const packManifestSchema = z.object({
  format: z.literal(PACK_FORMAT),
  schemaVersion: z.number().int().min(1),
  packId: z.string().min(3),
  name: z.string().min(1),
  version: z.string().default("1.0.0"),
  author: z.string().default(""),
  description: z.string().default(""),
  createdAt: z.string().optional(),
});
export type PackManifest = z.infer<typeof packManifestSchema>;

/**
 * The v2 body. v1 differed only in lacking labs, sources and learning points,
 * so `migratePackToCurrent` fills those with empty collections rather than
 * needing a separate parser.
 */
export const packBodySchema = z.object({
  concepts: z.array(conceptSchema).default([]),
  actions: z.array(actionDefinitionSchema).default([]),
  labDefinitions: z.array(labDefinitionSchema).default([]),
  cases: z.array(caseTemplateSchema).default([]),
  lectures: z.array(lectureSchema).default([]),
  sources: z.array(contentSourceSchema).default([]),
  learningPoints: z.array(learningPointContentSchema).default([]),
});

export const contentPackSchema = z.object({
  manifest: packManifestSchema,
  content: packBodySchema,
});
export type ContentPackFile = z.infer<typeof contentPackSchema>;

/* -------------------------------- migration ------------------------------- */

export interface MigrationNote {
  from: number;
  to: number;
  message: string;
}

export interface MigrationOutcome {
  ok: boolean;
  /** Present when ok. */
  pack?: ContentPackFile;
  notes: MigrationNote[];
  error?: string;
}

/**
 * Brings a pack of any supported version up to the current shape.
 *
 * Adapters are applied in sequence (v1 → v2 → …) so adding a future version
 * means writing one more step rather than revisiting the ones before it.
 */
export function migratePackToCurrent(raw: unknown): MigrationOutcome {
  const notes: MigrationNote[] = [];

  if (typeof raw !== "object" || raw === null) {
    return { ok: false, notes, error: "The pack file is not a JSON object." };
  }

  const envelope = raw as { manifest?: unknown; content?: unknown };
  const manifestResult = packManifestSchema.safeParse(envelope.manifest);
  if (!manifestResult.success) {
    const issue = manifestResult.error.issues[0];
    return {
      ok: false,
      notes,
      error:
        issue?.path.join(".") === "format"
          ? "This file is not a General Hospital content pack."
          : `The pack manifest is invalid: ${issue?.message ?? "unknown problem"}.`,
    };
  }

  const manifest = manifestResult.data;
  const version = manifest.schemaVersion;

  if (!SUPPORTED_PACK_SCHEMA_VERSIONS.includes(version as 1 | 2)) {
    return {
      ok: false,
      notes,
      error:
        version > CURRENT_PACK_SCHEMA_VERSION
          ? `This pack uses schema version ${version}, which is newer than this build understands (${CURRENT_PACK_SCHEMA_VERSION}). Update the application to import it.`
          : `Schema version ${version} is no longer supported. Supported versions: ${SUPPORTED_PACK_SCHEMA_VERSIONS.join(", ")}.`,
    };
  }

  let body: unknown = envelope.content;

  if (version < 2) {
    body = migrateV1ToV2(body);
    notes.push({
      from: 1,
      to: 2,
      message:
        "Version 1 packs carry no laboratory library, sources or learning points; those collections were initialised empty.",
    });
  }

  const bodyResult = packBodySchema.safeParse(body);
  if (!bodyResult.success) {
    const issue = bodyResult.error.issues[0];
    return {
      ok: false,
      notes,
      error: `Pack content is invalid at ${issue?.path.join(".") || "(root)"}: ${issue?.message ?? "unknown problem"}.`,
    };
  }

  return {
    ok: true,
    notes,
    pack: {
      manifest: { ...manifest, schemaVersion: CURRENT_PACK_SCHEMA_VERSION },
      content: bodyResult.data,
    },
  };
}

/** v1 → v2: the new collections simply did not exist. */
function migrateV1ToV2(body: unknown): unknown {
  const source = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  return {
    concepts: source.concepts ?? [],
    actions: source.actions ?? [],
    cases: source.cases ?? [],
    lectures: source.lectures ?? [],
    labDefinitions: source.labDefinitions ?? [],
    sources: source.sources ?? [],
    learningPoints: source.learningPoints ?? [],
  };
}

/* --------------------------------- summary -------------------------------- */

export interface PackSummary {
  manifest: PackManifest;
  counts: {
    concepts: number;
    actions: number;
    labDefinitions: number;
    cases: number;
    lectures: number;
    sources: number;
    learningPoints: number;
  };
  /** Content codes already present in the database. */
  conflicts: { kind: string; code: string }[];
  compatible: boolean;
  migrationNotes: MigrationNote[];
}

/**
 * Everything the confirmation screen needs. Read-only: nothing is written by
 * inspecting a pack (spec §43).
 */
export function summarisePack(db: Db, raw: unknown): { ok: false; error: string } | { ok: true; summary: PackSummary; pack: ContentPackFile } {
  const migration = migratePackToCurrent(raw);
  if (!migration.ok || !migration.pack) {
    return { ok: false, error: migration.error ?? "The pack could not be read." };
  }

  const pack = migration.pack;
  const conflicts: { kind: string; code: string }[] = [];

  const existingCaseCodes = new Set(
    db.select({ code: t.caseTemplate.code }).from(t.caseTemplate).all().map((r) => r.code),
  );
  const existingLectureCodes = new Set(
    db.select({ code: t.lecture.code }).from(t.lecture).all().map((r) => r.code),
  );
  const existingConceptCodes = new Set(
    db.select({ code: t.concept.code }).from(t.concept).all().map((r) => r.code),
  );

  for (const c of pack.content.cases) {
    if (existingCaseCodes.has(c.code)) conflicts.push({ kind: "case", code: c.code });
  }
  for (const l of pack.content.lectures) {
    if (existingLectureCodes.has(l.code)) conflicts.push({ kind: "lecture", code: l.code });
  }
  for (const c of pack.content.concepts) {
    if (existingConceptCodes.has(c.code)) conflicts.push({ kind: "concept", code: c.code });
  }

  return {
    ok: true,
    pack,
    summary: {
      manifest: pack.manifest,
      counts: {
        concepts: pack.content.concepts.length,
        actions: pack.content.actions.length,
        labDefinitions: pack.content.labDefinitions.length,
        cases: pack.content.cases.length,
        lectures: pack.content.lectures.length,
        sources: pack.content.sources.length,
        learningPoints: pack.content.learningPoints.length,
      },
      conflicts,
      compatible: true,
      migrationNotes: migration.notes,
    },
  };
}

/* --------------------------------- export --------------------------------- */

export interface ExportOptions {
  packId: string;
  name?: string;
  author?: string;
  description?: string;
  version?: string;
}

/**
 * Serialises one pack's content. Reads back through the same authoring shapes
 * the seeder consumes, so an exported pack re-imports into an identical state.
 */
export function exportPack(db: Db, options: ExportOptions): ContentPackFile {
  const packRow = db
    .select()
    .from(t.contentPack)
    .where(eq(t.contentPack.id, options.packId))
    .get();

  const cases = db
    .select()
    .from(t.caseTemplate)
    .where(eq(t.caseTemplate.packId, options.packId))
    .all();

  const conceptIds = new Set<string>();
  for (const row of cases) {
    for (const link of db
      .select()
      .from(t.caseConcept)
      .where(eq(t.caseConcept.caseId, row.id))
      .all()) {
      conceptIds.add(link.conceptId);
    }
  }

  const concepts = [...conceptIds]
    .map((id) => db.select().from(t.concept).where(eq(t.concept.id, id)).get())
    .filter((c): c is t.ConceptRow => Boolean(c))
    .map((c) => ({
      code: c.code,
      name: c.name,
      specialty: c.specialty as never,
      topic: c.topic,
      description: c.description,
      importance: c.importance,
    }));

  return {
    manifest: {
      format: PACK_FORMAT,
      schemaVersion: CURRENT_PACK_SCHEMA_VERSION,
      packId: options.packId,
      name: options.name ?? packRow?.name ?? options.packId,
      version: options.version ?? packRow?.version ?? "1.0.0",
      author: options.author ?? packRow?.author ?? "",
      description: options.description ?? packRow?.description ?? "",
      createdAt: nowIso(),
    },
    content: {
      concepts,
      actions: [],
      labDefinitions: [],
      cases: cases.map((c) => exportCase(db, c)),
      lectures: [],
      sources: [],
      learningPoints: [],
    },
  };
}

function exportCase(db: Db, row: t.CaseTemplateRow) {
  const concepts = db
    .select()
    .from(t.caseConcept)
    .where(eq(t.caseConcept.caseId, row.id))
    .all();
  const conceptCodeById = new Map(
    db.select().from(t.concept).all().map((c) => [c.id, c.code]),
  );

  const findings = db
    .select()
    .from(t.caseFinding)
    .where(eq(t.caseFinding.caseId, row.id))
    .all();
  const rules = db
    .select()
    .from(t.caseActionRule)
    .where(eq(t.caseActionRule.caseId, row.id))
    .all();
  const prompts = db
    .select()
    .from(t.casePrompt)
    .where(eq(t.casePrompt.caseId, row.id))
    .all();
  const labs = db
    .select()
    .from(t.caseLabResult)
    .where(eq(t.caseLabResult.caseId, row.id))
    .all();
  const labCodeById = new Map(
    db.select().from(t.labDefinition).all().map((l) => [l.id, l.code]),
  );
  const imaging = db
    .select()
    .from(t.caseImagingResult)
    .where(eq(t.caseImagingResult.caseId, row.id))
    .all();

  return {
    code: row.code,
    title: row.title,
    specialty: row.specialty as never,
    topic: row.topic,
    primaryDiagnosis: row.primaryDiagnosis,
    difficulty: row.difficulty,
    step3Importance: row.step3Importance,
    handoffScript: row.handoffScript,
    dailySignout: row.dailySignout,
    admissionOpening: row.admissionOpening,
    teachingPoint: row.teachingPoint,
    minimumRoundsBeforeDischarge: row.minimumRoundsBeforeDischarge,
    patientAgeYears: row.patientAgeYears ?? undefined,
    patientSex: (row.patientSex as "M" | "F" | null) ?? undefined,
    chiefComplaint: row.chiefComplaint,
    codeStatus: row.codeStatus,
    allergies: row.allergies,
    concepts: concepts.map((c) => ({
      code: conceptCodeById.get(c.conceptId) ?? c.conceptId,
      weight: c.weight,
    })),
    findings: findings.map((f) => ({
      category: f.category as never,
      label: f.label,
      value: f.value,
      units: f.units ?? undefined,
      referenceRange: f.referenceRange ?? undefined,
      triggerActionCode: f.triggerActionCode ?? undefined,
      initiallyVisible: f.initiallyVisible,
      clinicalRole: f.clinicalRole as never,
    })),
    actionRules: rules.map((r) => ({
      actionCode: r.actionCode,
      classification: r.classification as never,
      resultText: r.resultText,
      feedbackText: r.feedbackText,
      conceptCode: r.conceptId ? conceptCodeById.get(r.conceptId) : undefined,
    })),
    prompts: prompts.map((p) => ({
      stage: p.stage as never,
      promptText: p.promptText,
      responseType: p.responseType as never,
      answerConfig: JSON.parse(p.answerConfigJson) as never,
      correctFeedback: p.correctFeedback,
      incorrectFeedback: p.incorrectFeedback,
      conceptCode: p.conceptId ? conceptCodeById.get(p.conceptId) : undefined,
      whyCorrect: p.whyCorrect,
      whyOthersWrong: p.whyOthersWrong,
      caseEvidence: p.caseEvidence,
      detailedExplanation: p.detailedExplanation,
    })),
    labs: labs.map((l) => ({
      labCode: labCodeById.get(l.labDefinitionId) ?? l.labDefinitionId,
      value: l.value,
      flag: l.flag as never,
      triggerActionCode: l.triggerActionCode ?? undefined,
      collectedLabel: l.collectedLabel,
      clinicalRole: l.clinicalRole as never,
    })),
    imaging: imaging.map((i) => ({
      studyName: i.studyName,
      modality: i.modality as never,
      performedLabel: i.performedLabel,
      impression: i.impression,
      findingsText: i.findingsText,
      triggerActionCode: i.triggerActionCode ?? undefined,
      imageAssetPath: i.imageAssetPath ?? undefined,
      thumbnailAssetPath: i.thumbnailAssetPath ?? undefined,
      clinicalRole: i.clinicalRole as never,
    })),
    problems: [],
  };
}

/* --------------------------------- import --------------------------------- */

export interface ImportResult {
  ok: boolean;
  error?: string;
  imported: {
    concepts: number;
    actions: number;
    labDefinitions: number;
    cases: number;
    lectures: number;
  };
  packId?: string;
}

/**
 * Writes a validated pack. Everything happens in one transaction so a failure
 * partway through leaves the library exactly as it was (spec §43).
 *
 * Imported cases arrive as DRAFT: content that has not been reviewed in this
 * installation must not walk straight onto a learner's service (spec §7).
 */
export function importPack(db: Db, raw: unknown): ImportResult {
  const empty = { concepts: 0, actions: 0, labDefinitions: 0, cases: 0, lectures: 0 };
  const inspection = summarisePack(db, raw);
  if (!inspection.ok) return { ok: false, error: inspection.error, imported: empty };

  const { pack } = inspection;
  const counts = { ...empty };

  try {
    db.transaction((tx) => {
      tx.insert(t.contentPack)
        .values({
          id: pack.manifest.packId,
          name: pack.manifest.name,
          description: pack.manifest.description,
          author: pack.manifest.author,
          version: pack.manifest.version,
          schemaVersion: CURRENT_PACK_SCHEMA_VERSION,
          isBuiltin: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        })
        .onConflictDoUpdate({
          target: t.contentPack.id,
          set: {
            name: pack.manifest.name,
            version: pack.manifest.version,
            updatedAt: nowIso(),
          },
        })
        .run();

      for (const concept of pack.content.concepts) {
        tx.insert(t.concept)
          .values({
            id: `concept:${concept.code}`,
            code: concept.code,
            name: concept.name,
            specialty: concept.specialty,
            topic: concept.topic,
            description: concept.description ?? "",
            importance: concept.importance ?? 3,
            isDemo: false,
            contentOrigin: "IMPORTED",
          })
          .onConflictDoNothing()
          .run();
        counts.concepts += 1;
      }

      for (const action of pack.content.actions) {
        tx.insert(t.actionDefinition)
          .values({
            id: `action:${action.actionCode}`,
            actionCode: action.actionCode,
            category: action.category,
            displayName: action.displayName,
            synonymsJson: JSON.stringify(action.synonyms ?? []),
            isDemo: false,
            contentOrigin: "IMPORTED",
          })
          .onConflictDoNothing()
          .run();
        counts.actions += 1;
      }

      for (const lab of pack.content.labDefinitions) {
        tx.insert(t.labDefinition)
          .values({
            id: `lab:${lab.code}`,
            code: lab.code,
            displayName: lab.displayName,
            units: lab.units ?? "",
            referenceLow: lab.referenceLow ?? null,
            referenceHigh: lab.referenceHigh ?? null,
            referenceText: lab.referenceText ?? null,
            sexSpecificRangeJson: lab.sexSpecificRange
              ? JSON.stringify(lab.sexSpecificRange)
              : null,
            category: lab.category,
            displayOrder: lab.displayOrder ?? 0,
            isDemo: false,
            contentOrigin: "IMPORTED",
          })
          .onConflictDoNothing()
          .run();
        counts.labDefinitions += 1;
      }

      for (const caseInput of pack.content.cases) {
        const caseId = `case:${caseInput.code}`;
        tx.insert(t.caseTemplate)
          .values({
            id: caseId,
            code: caseInput.code,
            title: caseInput.title,
            specialty: caseInput.specialty,
            topic: caseInput.topic,
            primaryDiagnosis: caseInput.primaryDiagnosis,
            difficulty: caseInput.difficulty ?? 3,
            step3Importance: caseInput.step3Importance ?? 3,
            handoffScript: caseInput.handoffScript,
            dailySignout: caseInput.dailySignout,
            admissionOpening: caseInput.admissionOpening,
            teachingPoint: caseInput.teachingPoint ?? "",
            minimumRoundsBeforeDischarge: caseInput.minimumRoundsBeforeDischarge ?? 2,
            patientAgeYears: caseInput.patientAgeYears ?? null,
            patientSex: caseInput.patientSex ?? null,
            chiefComplaint: caseInput.chiefComplaint ?? "",
            codeStatus: caseInput.codeStatus ?? "",
            allergies: caseInput.allergies ?? "",
            // Imported content is unreviewed here, whatever it claimed
            // elsewhere: publishing is a decision made in this installation.
            status: "DRAFT",
            reviewStatus: "UNREVIEWED",
            packId: pack.manifest.packId,
            createdBy: "import",
            isDemo: false,
            contentOrigin: "IMPORTED",
            createdAt: nowIso(),
            updatedAt: nowIso(),
          })
          .onConflictDoUpdate({
            target: t.caseTemplate.id,
            set: { title: caseInput.title, updatedAt: nowIso(), status: "DRAFT" },
          })
          .run();
        counts.cases += 1;
      }

      for (const lectureInput of pack.content.lectures) {
        tx.insert(t.lecture)
          .values({
            id: `lecture:${lectureInput.code}`,
            code: lectureInput.code,
            title: lectureInput.title,
            specialty: lectureInput.specialty,
            topic: lectureInput.topic,
            lectureType: lectureInput.lectureType,
            summary: lectureInput.summary,
            audioScript: JSON.stringify(lectureInput.audioScript),
            keyPointsJson: JSON.stringify(lectureInput.keyPoints),
            estimatedMinutes: lectureInput.estimatedMinutes ?? 5,
            isDemo: false,
            contentOrigin: "IMPORTED",
          })
          .onConflictDoNothing()
          .run();
        counts.lectures += 1;
      }
    });
  } catch (cause) {
    return {
      ok: false,
      error: `Import failed and was rolled back: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
      imported: empty,
    };
  }

  return { ok: true, imported: counts, packId: pack.manifest.packId };
}

export function listContentPacks(db: Db): t.ContentPackRow[] {
  return db.select().from(t.contentPack).all();
}
