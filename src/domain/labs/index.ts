/**
 * Laboratory results (spec §14-15).
 *
 * Two rules shape this module:
 *
 *  - The abnormal flag is computed from the central reference range, not
 *    authored per case. Authors can still override it for analytes where
 *    "abnormal" is not a numeric comparison, but the default is derived so a
 *    case cannot drift out of agreement with its own range.
 *  - The reference-range preference controls *display only*. Turning ranges off
 *    never hides a flag (spec §14), because the flag is the clinically load
 *    bearing part.
 */

import { asc, eq, inArray } from "drizzle-orm";
import {
  LAB_CATEGORY_LABELS,
  LAB_CATEGORY_ORDER,
  type LabCategory,
} from "@/content/labs";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";

export type LabFlag =
  | "NORMAL"
  | "LOW"
  | "HIGH"
  | "CRITICAL_LOW"
  | "CRITICAL_HIGH"
  | "ABNORMAL";

export const LAB_FLAG_LABELS: Record<LabFlag, string> = {
  NORMAL: "",
  LOW: "LOW",
  HIGH: "HIGH",
  CRITICAL_LOW: "CRITICAL LOW",
  CRITICAL_HIGH: "CRITICAL HIGH",
  ABNORMAL: "ABNORMAL",
};

export interface SexSpecificRange {
  male: { low: number; high: number };
  female: { low: number; high: number };
}

/** The range that applies to this patient, honouring sex-specific values. */
export function effectiveRange(
  definition: Pick<
    t.LabDefinitionRow,
    "referenceLow" | "referenceHigh" | "sexSpecificRangeJson"
  >,
  sex?: "M" | "F" | null,
): { low: number | null; high: number | null } {
  if (sex && definition.sexSpecificRangeJson) {
    try {
      const parsed = JSON.parse(definition.sexSpecificRangeJson) as SexSpecificRange;
      const range = sex === "M" ? parsed.male : parsed.female;
      if (range && typeof range.low === "number" && typeof range.high === "number") {
        return { low: range.low, high: range.high };
      }
    } catch {
      // Fall through to the general range rather than failing the whole panel.
    }
  }
  return { low: definition.referenceLow, high: definition.referenceHigh };
}

/**
 * Derives the flag from the value and range.
 *
 * A value that is not numeric (e.g. "Trace", "Positive") cannot be compared,
 * so it is reported NORMAL unless the author flagged it explicitly — guessing
 * would be worse than deferring to the author.
 */
export function deriveFlag(
  value: string,
  range: { low: number | null; high: number | null },
): LabFlag {
  const numeric = Number.parseFloat(value.replace(/[<>,]/g, "").trim());
  if (!Number.isFinite(numeric)) return "NORMAL";
  if (range.low !== null && numeric < range.low) return "LOW";
  if (range.high !== null && numeric > range.high) return "HIGH";
  return "NORMAL";
}

export function formatReferenceRange(
  definition: Pick<t.LabDefinitionRow, "referenceText">,
  range: { low: number | null; high: number | null },
): string {
  if (definition.referenceText) return definition.referenceText;
  if (range.low !== null && range.high !== null) return `${range.low}–${range.high}`;
  if (range.high !== null) return `< ${range.high}`;
  if (range.low !== null) return `> ${range.low}`;
  return "";
}

export interface LabResultView {
  id: string;
  code: string;
  displayName: string;
  value: string;
  units: string;
  flag: LabFlag;
  flagLabel: string;
  referenceRange: string;
  collectedLabel: string;
  category: LabCategory;
}

export interface LabPanelView {
  category: LabCategory;
  label: string;
  results: LabResultView[];
  abnormalCount: number;
}

export function listLabDefinitions(db: Db): t.LabDefinitionRow[] {
  return db
    .select()
    .from(t.labDefinition)
    .orderBy(asc(t.labDefinition.category), asc(t.labDefinition.displayOrder))
    .all();
}

export function getLabDefinitionByCode(db: Db, code: string): t.LabDefinitionRow | null {
  return db.select().from(t.labDefinition).where(eq(t.labDefinition.code, code)).get() ?? null;
}

export function getCaseLabResults(db: Db, caseId: string): t.CaseLabResultRow[] {
  return db
    .select()
    .from(t.caseLabResult)
    .where(eq(t.caseLabResult.caseId, caseId))
    .orderBy(asc(t.caseLabResult.displayOrder))
    .all();
}

/**
 * Builds the grouped panels for a case, restricted to results the learner has
 * actually unlocked. A result with a `triggerActionCode` stays hidden until
 * that order is placed, exactly like the finding-reveal rules.
 */
export function buildLabPanels(
  db: Db,
  caseId: string,
  options: {
    /** Action codes the learner has taken; null means "reveal everything". */
    takenActionCodes: ReadonlySet<string> | null;
    patientSex?: "M" | "F" | null;
  },
): LabPanelView[] {
  const rows = getCaseLabResults(db, caseId);
  if (rows.length === 0) return [];

  const definitionIds = [...new Set(rows.map((r) => r.labDefinitionId))];
  const definitions = new Map(
    db
      .select()
      .from(t.labDefinition)
      .where(inArray(t.labDefinition.id, definitionIds))
      .all()
      .map((d) => [d.id, d]),
  );

  const byCategory = new Map<LabCategory, LabResultView[]>();

  for (const row of rows) {
    if (
      options.takenActionCodes &&
      row.triggerActionCode &&
      !options.takenActionCodes.has(row.triggerActionCode)
    ) {
      continue;
    }

    const definition = definitions.get(row.labDefinitionId);
    if (!definition) continue;

    const range = effectiveRange(definition, options.patientSex);
    // An explicitly authored flag wins; otherwise derive it from the range.
    const flag =
      row.flag && row.flag !== "NORMAL"
        ? (row.flag as LabFlag)
        : deriveFlag(row.value, range);

    const category = (definition.category as LabCategory) ?? "OTHER";
    const list = byCategory.get(category) ?? [];
    list.push({
      id: row.id,
      code: definition.code,
      displayName: definition.displayName,
      value: row.value,
      units: definition.units,
      flag,
      flagLabel: LAB_FLAG_LABELS[flag],
      referenceRange: formatReferenceRange(definition, range),
      collectedLabel: row.collectedLabel,
      category,
    });
    byCategory.set(category, list);
  }

  return LAB_CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => {
    const results = byCategory.get(category) ?? [];
    return {
      category,
      label: LAB_CATEGORY_LABELS[category],
      results,
      abnormalCount: results.filter((r) => r.flag !== "NORMAL").length,
    };
  });
}

/* --------------------------------- imaging -------------------------------- */

export interface ImagingResultView {
  id: string;
  studyName: string;
  modality: string;
  performedLabel: string;
  impression: string;
  findingsText: string;
  imageAssetPath: string | null;
  thumbnailAssetPath: string | null;
}

export function getCaseImaging(db: Db, caseId: string): t.CaseImagingResultRow[] {
  return db
    .select()
    .from(t.caseImagingResult)
    .where(eq(t.caseImagingResult.caseId, caseId))
    .orderBy(asc(t.caseImagingResult.displayOrder))
    .all();
}

export function buildImagingViews(
  db: Db,
  caseId: string,
  takenActionCodes: ReadonlySet<string> | null,
): ImagingResultView[] {
  return getCaseImaging(db, caseId)
    .filter(
      (row) =>
        !takenActionCodes ||
        !row.triggerActionCode ||
        takenActionCodes.has(row.triggerActionCode),
    )
    .map((row) => ({
      id: row.id,
      studyName: row.studyName,
      modality: row.modality,
      performedLabel: row.performedLabel,
      impression: row.impression,
      findingsText: row.findingsText,
      imageAssetPath: row.imageAssetPath,
      thumbnailAssetPath: row.thumbnailAssetPath,
    }));
}
