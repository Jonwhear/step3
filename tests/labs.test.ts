/**
 * Laboratory display and the reference-range preference (spec §14-15, §69).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import {
  buildImagingViews,
  buildLabPanels,
  deriveFlag,
  effectiveRange,
  formatReferenceRange,
  getLabDefinitionByCode,
  listLabDefinitions,
} from "@/domain/labs";
import { getSettings, setSetting } from "@/domain/profile";
import { getPreferences, SETTINGS_KEYS } from "@/domain/settings";
import { closeTestDb, createTestDb, type TestContext } from "./helpers";

const DKA_CASE_ID = "case:DEMO-ENDO-001";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb();
});

afterEach(() => closeTestDb(ctx));

describe("lab reference library", () => {
  it("seeds a central library rather than per-case ranges", () => {
    const definitions = listLabDefinitions(ctx.db);
    expect(definitions.length).toBeGreaterThan(20);

    const potassium = getLabDefinitionByCode(ctx.db, "K");
    expect(potassium?.referenceLow).toBe(3.5);
    expect(potassium?.referenceHigh).toBe(5);
    expect(potassium?.units).toBe("mEq/L");
  });

  it("uses a sex-specific range when the analyte has one", () => {
    const hgb = getLabDefinitionByCode(ctx.db, "HGB");
    if (!hgb) throw new Error("HGB missing");

    expect(effectiveRange(hgb, "M")).toEqual({ low: 13.5, high: 17.5 });
    expect(effectiveRange(hgb, "F")).toEqual({ low: 12, high: 16 });
    // With no sex given, the general range applies.
    expect(effectiveRange(hgb, null).low).toBe(12);
  });

  it("derives the abnormal flag from the range", () => {
    expect(deriveFlag("2.9", { low: 3.5, high: 5 })).toBe("LOW");
    expect(deriveFlag("6.1", { low: 3.5, high: 5 })).toBe("HIGH");
    expect(deriveFlag("4.0", { low: 3.5, high: 5 })).toBe("NORMAL");
  });

  it("leaves non-numeric values to the author rather than guessing", () => {
    expect(deriveFlag("Trace", { low: 0, high: 1 })).toBe("NORMAL");
    expect(deriveFlag("Negative", { low: null, high: null })).toBe("NORMAL");
  });

  it("formats ranges, including one-sided ones", () => {
    expect(formatReferenceRange({ referenceText: null }, { low: 3.5, high: 5 })).toBe("3.5–5");
    expect(formatReferenceRange({ referenceText: null }, { low: null, high: 0.04 })).toBe("< 0.04");
    expect(formatReferenceRange({ referenceText: "Negative" }, { low: null, high: null })).toBe(
      "Negative",
    );
  });
});

describe("case lab panels", () => {
  it("groups results into EMR panels", () => {
    const panels = buildLabPanels(ctx.db, DKA_CASE_ID, { takenActionCodes: null });
    const categories = panels.map((p) => p.category);

    expect(categories).toContain("CBC");
    expect(categories).toContain("BMP");
    // Panels come back in a fixed clinical order, not insertion order.
    expect(categories.indexOf("CBC")).toBeLessThan(categories.indexOf("BMP"));
  });

  it("flags the abnormal values from the central range", () => {
    const panels = buildLabPanels(ctx.db, DKA_CASE_ID, { takenActionCodes: null });
    const bmp = panels.find((p) => p.category === "BMP");
    const potassium = bmp?.results.find((r) => r.code === "K");
    const bicarbonate = bmp?.results.find((r) => r.code === "HCO3");

    expect(potassium?.flag).toBe("HIGH");
    expect(bicarbonate?.flag).toBe("LOW");
    expect(bmp?.abnormalCount).toBeGreaterThan(0);
  });

  it("hides results until the order that reveals them is placed", () => {
    const locked = buildLabPanels(ctx.db, DKA_CASE_ID, { takenActionCodes: new Set() });
    expect(locked.length).toBe(0);

    const unlocked = buildLabPanels(ctx.db, DKA_CASE_ID, {
      takenActionCodes: new Set(["ORDER_BMP"]),
    });
    const codes = unlocked.flatMap((p) => p.results.map((r) => r.code));
    expect(codes).toContain("K");
    expect(codes).not.toContain("WBC");
  });

  it("always carries the reference range in the view model", () => {
    // Hiding ranges is a rendering decision; the data is present either way, so
    // toggling the preference can never lose the flag (spec §14).
    const panels = buildLabPanels(ctx.db, DKA_CASE_ID, { takenActionCodes: null });
    const results = panels.flatMap((p) => p.results);

    expect(results.every((r) => r.referenceRange !== undefined)).toBe(true);
    const abnormal = results.filter((r) => r.flag !== "NORMAL");
    expect(abnormal.every((r) => r.flagLabel.length > 0)).toBe(true);
  });

  it("returns imaging with impression text", () => {
    const studies = buildImagingViews(ctx.db, DKA_CASE_ID, null);
    expect(studies.length).toBeGreaterThan(0);
    expect(studies[0]?.impression).toBeTruthy();
    // Asset slots exist but are unused today (spec §16).
    expect(studies[0]?.imageAssetPath).toBeNull();
  });

  it("gates imaging behind its trigger order too", () => {
    expect(buildImagingViews(ctx.db, DKA_CASE_ID, new Set()).length).toBe(0);
    expect(buildImagingViews(ctx.db, DKA_CASE_ID, new Set(["ORDER_CXR"])).length).toBe(1);
  });
});

describe("reference-range preference", () => {
  it("defaults to ON", () => {
    expect(getPreferences(ctx.db).labs.showReferenceRanges).toBe(true);
  });

  it("persists when switched off", () => {
    setSetting(ctx.db, SETTINGS_KEYS.showLabReferenceRanges, "false");
    expect(getPreferences(ctx.db).labs.showReferenceRanges).toBe(false);

    // Survives a reload of the settings map.
    expect(getSettings(ctx.db)[SETTINGS_KEYS.showLabReferenceRanges]).toBe("false");
  });

  it("persists when switched back on", () => {
    setSetting(ctx.db, SETTINGS_KEYS.showLabReferenceRanges, "false");
    setSetting(ctx.db, SETTINGS_KEYS.showLabReferenceRanges, "true");
    expect(getPreferences(ctx.db).labs.showReferenceRanges).toBe(true);
  });

  it("does not affect stored results in any way", () => {
    const before = ctx.db
      .select()
      .from(schema.caseLabResult)
      .where(eq(schema.caseLabResult.caseId, DKA_CASE_ID))
      .all();

    setSetting(ctx.db, SETTINGS_KEYS.showLabReferenceRanges, "false");

    const after = ctx.db
      .select()
      .from(schema.caseLabResult)
      .where(eq(schema.caseLabResult.caseId, DKA_CASE_ID))
      .all();

    expect(after).toEqual(before);
  });
});
