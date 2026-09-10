/**
 * Case validation and the publish gate (spec §11, §69).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { duplicateCase, publishCase, setCaseStatus } from "@/domain/content/cases";
import { validateAllCases, validateCase } from "@/domain/content/validation";
import { closeTestDb, createTestDb, type TestContext } from "./helpers";

const CASE_ID = "case:DEMO-ENDO-001";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb();
});

afterEach(() => closeTestDb(ctx));

/** Most tests need an editable case; bundled ones are deliberately read-only. */
function editableCopy(code = "TEST-COPY"): string {
  const result = duplicateCase(ctx.db, CASE_ID, code);
  if (!result.ok || !result.caseId) throw new Error(result.error ?? "duplicate failed");
  return result.caseId;
}

function codesOf(issues: { code: string }[]): string[] {
  return issues.map((i) => i.code);
}

describe("validateCase", () => {
  it("passes every bundled demo case", () => {
    const results = validateAllCases(ctx.db);
    const failing = results.filter((r) => !r.ok);
    expect(failing.map((f) => `${f.caseId}: ${codesOf(f.errors).join(",")}`)).toEqual([]);
  });

  it("reports a missing case rather than throwing", () => {
    const result = validateCase(ctx.db, "case:DOES-NOT-EXIST");
    expect(result.ok).toBe(false);
    expect(codesOf(result.errors)).toContain("CASE_MISSING");
  });

  it("rejects a prompt whose correct key matches no choice", () => {
    const caseId = editableCopy();
    const prompt = ctx.db
      .select()
      .from(schema.casePrompt)
      .where(eq(schema.casePrompt.caseId, caseId))
      .get();
    if (!prompt) throw new Error("no prompt");

    const config = JSON.parse(prompt.answerConfigJson) as { correctKey: string };
    config.correctKey = "not-a-real-key";
    ctx.db
      .update(schema.casePrompt)
      .set({ answerConfigJson: JSON.stringify(config) })
      .where(eq(schema.casePrompt.id, prompt.id))
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(result.ok).toBe(false);
    expect(codesOf(result.errors)).toContain("NO_CORRECT_ANSWER");
  });

  it("rejects duplicate prompt sequence numbers within a stage", () => {
    const caseId = editableCopy();
    const prompts = ctx.db
      .select()
      .from(schema.casePrompt)
      .where(eq(schema.casePrompt.caseId, caseId))
      .all()
      .filter((p) => p.stage === "ROUNDS");
    if (prompts.length < 2) throw new Error("need two rounds prompts");

    ctx.db
      .update(schema.casePrompt)
      .set({ sequence: prompts[0]!.sequence })
      .where(eq(schema.casePrompt.id, prompts[1]!.id))
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(codesOf(result.errors)).toContain("DUPLICATE_SEQUENCE");
  });

  it("rejects a reference to a concept that does not exist", () => {
    const caseId = editableCopy();
    // Point one link at a concept that does not exist; the composite primary
    // key means only a single row can be repointed at any given ghost id.
    const link = ctx.db
      .select()
      .from(schema.caseConcept)
      .where(eq(schema.caseConcept.caseId, caseId))
      .get();
    if (!link) throw new Error("no concept link");

    ctx.db
      .update(schema.caseConcept)
      .set({ conceptId: "concept:GHOST.01" })
      .where(
        and(
          eq(schema.caseConcept.caseId, caseId),
          eq(schema.caseConcept.conceptId, link.conceptId),
        ),
      )
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(codesOf(result.errors)).toContain("MISSING_CONCEPT");
  });

  it("rejects a lab result whose definition is gone from the library", () => {
    const caseId = editableCopy();
    const lab = ctx.db
      .select()
      .from(schema.caseLabResult)
      .where(eq(schema.caseLabResult.caseId, caseId))
      .get();
    if (!lab) throw new Error("no lab result");

    ctx.db
      .update(schema.caseLabResult)
      .set({ labDefinitionId: "lab:NOT_REAL" })
      .where(eq(schema.caseLabResult.id, lab.id))
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(codesOf(result.errors)).toContain("MISSING_LAB_DEFINITION");
  });

  it("rejects a finding revealed by an action that is not in the library", () => {
    const caseId = editableCopy();
    const finding = ctx.db
      .select()
      .from(schema.caseFinding)
      .where(eq(schema.caseFinding.caseId, caseId))
      .all()
      .find((f) => f.triggerActionCode);
    if (!finding) throw new Error("no triggered finding");

    ctx.db
      .update(schema.caseFinding)
      .set({ triggerActionCode: "NOT_A_REAL_ACTION" })
      .where(eq(schema.caseFinding.id, finding.id))
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(codesOf(result.errors)).toContain("UNREACHABLE_FINDING");
  });

  it("rejects a case with no rounds prompt", () => {
    const caseId = editableCopy();
    ctx.db
      .delete(schema.casePrompt)
      .where(eq(schema.casePrompt.caseId, caseId))
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(codesOf(result.errors)).toContain("NO_PROMPTS");
    expect(codesOf(result.errors)).toContain("MISSING_STAGE_PROMPT");
  });

  it("rejects an orphaned learning-point mapping", () => {
    const caseId = editableCopy();
    ctx.db
      .insert(schema.learningPointMapping)
      .values({
        id: "lpm_orphan",
        learningPointId: "lp:GHOST",
        entityType: "CASE",
        entityId: caseId,
        caseId,
        lectureId: null,
        notes: "",
        createdAt: new Date().toISOString(),
      })
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(codesOf(result.errors)).toContain("ORPHAN_MAPPING");
  });

  it("treats missing action feedback as a warning, not an error", () => {
    const caseId = editableCopy();
    ctx.db
      .update(schema.caseActionRule)
      .set({ feedbackText: "" })
      .where(eq(schema.caseActionRule.caseId, caseId))
      .run();

    const result = validateCase(ctx.db, caseId);
    expect(result.ok).toBe(true);
    expect(codesOf(result.warnings)).toContain("NO_ACTION_FEEDBACK");
  });
});

describe("publish gate", () => {
  it("refuses to publish a case with validation errors", () => {
    const caseId = editableCopy();
    ctx.db.delete(schema.casePrompt).where(eq(schema.casePrompt.caseId, caseId)).run();

    const result = publishCase(ctx.db, caseId);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/validation error/i);

    const row = ctx.db
      .select()
      .from(schema.caseTemplate)
      .where(eq(schema.caseTemplate.id, caseId))
      .get();
    expect(row?.status).not.toBe("PUBLISHED");
  });

  it("publishes a valid case", () => {
    const caseId = editableCopy();
    const result = publishCase(ctx.db, caseId);
    expect(result.ok).toBe(true);

    const row = ctx.db
      .select()
      .from(schema.caseTemplate)
      .where(eq(schema.caseTemplate.id, caseId))
      .get();
    expect(row?.status).toBe("PUBLISHED");
  });

  it("routes a PUBLISHED status change through the same gate", () => {
    const caseId = editableCopy();
    ctx.db.delete(schema.casePrompt).where(eq(schema.casePrompt.caseId, caseId)).run();

    expect(setCaseStatus(ctx.db, caseId, "PUBLISHED").ok).toBe(false);
    // Non-publishing transitions are unaffected.
    expect(setCaseStatus(ctx.db, caseId, "ARCHIVED").ok).toBe(true);
  });
});

describe("duplicate before edit", () => {
  it("copies a bundled case into an editable draft", () => {
    const caseId = editableCopy("MY-COPY");
    const row = ctx.db
      .select()
      .from(schema.caseTemplate)
      .where(eq(schema.caseTemplate.id, caseId))
      .get();

    expect(row?.isDemo).toBe(false);
    expect(row?.status).toBe("DRAFT");
    expect(row?.derivedFromCaseId).toBe(CASE_ID);
  });

  it("copies the case's structured content too", () => {
    const caseId = editableCopy();

    const count = (table: typeof schema.casePrompt) =>
      ctx.db.select().from(table).all().filter((r) => "caseId" in r && r.caseId === caseId).length;

    expect(count(schema.casePrompt)).toBeGreaterThan(0);
    expect(
      ctx.db.select().from(schema.caseLabResult).where(eq(schema.caseLabResult.caseId, caseId)).all()
        .length,
    ).toBeGreaterThan(0);
    expect(
      ctx.db.select().from(schema.caseProblem).where(eq(schema.caseProblem.caseId, caseId)).all()
        .length,
    ).toBeGreaterThan(0);
  });

  it("refuses a duplicate code", () => {
    editableCopy("TAKEN");
    const second = duplicateCase(ctx.db, CASE_ID, "TAKEN");
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already exists/i);
  });
});
