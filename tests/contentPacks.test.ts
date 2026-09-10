/**
 * Portable content packs, including backward compatibility (spec §42-44, §69).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import {
  CURRENT_PACK_SCHEMA_VERSION,
  exportPack,
  importPack,
  migratePackToCurrent,
  PACK_FORMAT,
  summarisePack,
} from "@/domain/content/packs";
import { DEMO_PACK_ID } from "@/db/seed";
import { closeTestDb, createTestDb, type TestContext } from "./helpers";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb();
});

afterEach(() => closeTestDb(ctx));

/** A minimal but complete case, valid against the authoring schema. */
function samplePackCase(code = "PACK-CASE-001") {
  return {
    code,
    title: "Imported Test Case",
    specialty: "Internal Medicine",
    topic: "Cardiology",
    primaryDiagnosis: "Test diagnosis",
    handoffScript:
      "This is a synthetic handoff script written purely to exercise the import path end to end.",
    dailySignout: "Synthetic daily sign-out.",
    admissionOpening:
      "A synthetic patient presents for the purpose of exercising the pack import path.",
    concepts: [{ code: "CARD.AF.01", weight: 1 }],
    prompts: [
      {
        stage: "ROUNDS",
        promptText: "What is the next best step in this synthetic case?",
        responseType: "MULTIPLE_CHOICE",
        answerConfig: {
          kind: "MULTIPLE_CHOICE",
          choices: [
            { key: "a", text: "The correct option" },
            { key: "b", text: "An incorrect option" },
          ],
          correctKey: "a",
        },
        correctFeedback: "Correct.",
        incorrectFeedback: "Not quite.",
      },
    ],
  };
}

function packV2(cases = [samplePackCase()]) {
  return {
    manifest: {
      format: PACK_FORMAT,
      schemaVersion: 2,
      packId: "custom-test-pack",
      name: "Custom Test Pack",
      version: "1.0.0",
      author: "Tests",
      description: "",
    },
    content: {
      concepts: [],
      actions: [],
      labDefinitions: [],
      cases,
      lectures: [],
      sources: [],
      learningPoints: [],
    },
  };
}

/** A v1 pack: the older shape, with none of the v2 collections. */
function packV1() {
  return {
    manifest: {
      format: PACK_FORMAT,
      schemaVersion: 1,
      packId: "legacy-pack",
      name: "Legacy Pack",
      version: "0.9.0",
      author: "Tests",
    },
    content: {
      concepts: [],
      actions: [],
      cases: [samplePackCase("LEGACY-CASE-001")],
      lectures: [],
    },
  };
}

describe("pack migration", () => {
  it("accepts a current-version pack unchanged", () => {
    const result = migratePackToCurrent(packV2());
    expect(result.ok).toBe(true);
    expect(result.pack?.manifest.schemaVersion).toBe(CURRENT_PACK_SCHEMA_VERSION);
    expect(result.notes).toEqual([]);
  });

  it("migrates a version 1 pack forward and says what it did", () => {
    const result = migratePackToCurrent(packV1());

    expect(result.ok).toBe(true);
    expect(result.pack?.manifest.schemaVersion).toBe(CURRENT_PACK_SCHEMA_VERSION);
    expect(result.pack?.content.cases.length).toBe(1);
    // The collections v1 never had are initialised, not invented.
    expect(result.pack?.content.labDefinitions).toEqual([]);
    expect(result.pack?.content.learningPoints).toEqual([]);
    expect(result.notes.length).toBe(1);
    expect(result.notes[0]?.from).toBe(1);
  });

  it("rejects a pack from a newer build with a clear explanation", () => {
    const future = packV2();
    future.manifest.schemaVersion = CURRENT_PACK_SCHEMA_VERSION + 5;

    const result = migratePackToCurrent(future);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/newer than this build/i);
  });

  it("rejects a file that is not a content pack", () => {
    const result = migratePackToCurrent({ manifest: { format: "something-else" } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not a General Hospital content pack/i);
  });

  it("rejects malformed content rather than importing part of it", () => {
    const broken = packV2();
    // A case with no prompts cannot satisfy the authoring schema.
    (broken.content.cases[0] as { prompts: unknown[] }).prompts = [];

    const result = migratePackToCurrent(broken);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Pack content is invalid/i);
  });
});

describe("pack summary", () => {
  it("counts what would be imported without writing anything", () => {
    const before = ctx.db.select().from(schema.caseTemplate).all().length;
    const inspection = summarisePack(ctx.db, packV2());

    expect(inspection.ok).toBe(true);
    if (!inspection.ok) return;
    expect(inspection.summary.counts.cases).toBe(1);
    expect(ctx.db.select().from(schema.caseTemplate).all().length).toBe(before);
  });

  it("detects a code that already exists", () => {
    const clashing = packV2([samplePackCase("DEMO-CARD-001")]);
    const inspection = summarisePack(ctx.db, clashing);

    expect(inspection.ok).toBe(true);
    if (!inspection.ok) return;
    expect(inspection.summary.conflicts).toContainEqual({
      kind: "case",
      code: "DEMO-CARD-001",
    });
  });
});

describe("pack import", () => {
  it("imports a valid pack", () => {
    const result = importPack(ctx.db, packV2());

    expect(result.ok).toBe(true);
    expect(result.imported.cases).toBe(1);

    const imported = ctx.db
      .select()
      .from(schema.caseTemplate)
      .where(eq(schema.caseTemplate.code, "PACK-CASE-001"))
      .get();
    expect(imported).toBeTruthy();
    expect(imported?.packId).toBe("custom-test-pack");
  });

  it("imports cases as drafts so unreviewed content never reaches a learner", () => {
    importPack(ctx.db, packV2());
    const imported = ctx.db
      .select()
      .from(schema.caseTemplate)
      .where(eq(schema.caseTemplate.code, "PACK-CASE-001"))
      .get();

    expect(imported?.status).toBe("DRAFT");
    expect(imported?.reviewStatus).toBe("UNREVIEWED");
  });

  it("imports a migrated v1 pack", () => {
    const result = importPack(ctx.db, packV1());
    expect(result.ok).toBe(true);

    const imported = ctx.db
      .select()
      .from(schema.caseTemplate)
      .where(eq(schema.caseTemplate.code, "LEGACY-CASE-001"))
      .get();
    expect(imported).toBeTruthy();
  });

  it("writes nothing at all when the pack is malformed", () => {
    const before = ctx.db.select().from(schema.caseTemplate).all().length;
    const packCount = ctx.db.select().from(schema.contentPack).all().length;

    const result = importPack(ctx.db, { manifest: { format: "wrong" }, content: {} });

    expect(result.ok).toBe(false);
    expect(ctx.db.select().from(schema.caseTemplate).all().length).toBe(before);
    expect(ctx.db.select().from(schema.contentPack).all().length).toBe(packCount);
  });

  it("handles a duplicate id safely on re-import", () => {
    importPack(ctx.db, packV2());
    const afterFirst = ctx.db.select().from(schema.caseTemplate).all().length;

    const second = importPack(ctx.db, packV2());
    expect(second.ok).toBe(true);
    // Re-importing updates in place rather than creating a second copy.
    expect(ctx.db.select().from(schema.caseTemplate).all().length).toBe(afterFirst);
  });

  it("does not disturb the demo pack", () => {
    importPack(ctx.db, packV2());

    const demoCases = ctx.db
      .select()
      .from(schema.caseTemplate)
      .where(eq(schema.caseTemplate.packId, DEMO_PACK_ID))
      .all();
    expect(demoCases.length).toBe(20);
    expect(demoCases.every((c) => c.status === "PUBLISHED")).toBe(true);
  });
});

describe("pack export", () => {
  it("exports the builtin pack in the current format", () => {
    const exported = exportPack(ctx.db, { packId: DEMO_PACK_ID });

    expect(exported.manifest.format).toBe(PACK_FORMAT);
    expect(exported.manifest.schemaVersion).toBe(CURRENT_PACK_SCHEMA_VERSION);
    expect(exported.content.cases.length).toBe(20);
  });

  it("round-trips: an export re-imports cleanly", () => {
    const exported = exportPack(ctx.db, { packId: DEMO_PACK_ID });
    // Re-badge it so it does not collide with the builtin pack row.
    exported.manifest.packId = "round-trip-pack";
    exported.manifest.name = "Round Trip";

    const inspection = summarisePack(ctx.db, JSON.parse(JSON.stringify(exported)));
    expect(inspection.ok).toBe(true);
    if (!inspection.ok) return;
    expect(inspection.summary.counts.cases).toBe(20);
  });
});
