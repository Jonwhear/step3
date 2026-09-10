/**
 * Assessment & Plan (spec §20-21).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addProblem,
  buildChart,
  listCaseProblems,
  removeProblem,
  renderPlanAsNote,
  scorePlan,
  togglePlanSelection,
} from "@/domain/chart";
import { createPatientInstance } from "@/domain/patients";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

const CASE_ID = "case:DEMO-ENDO-001";
const TODAY = "2026-05-01";

let ctx: TestContext;
let patientId: string;

beforeEach(() => {
  ctx = createTestDb();
  seedProfile(ctx, { studyStartDate: TODAY });
  patientId = createPatientInstance(ctx.db, {
    caseId: CASE_ID,
    patientName: "Test Patient",
    roomNumber: "401",
    entryMode: "HANDOFF",
    assignedDate: TODAY,
  });
});

afterEach(() => closeTestDb(ctx));

describe("assessment and plan", () => {
  it("offers the case's problem list, none added yet", () => {
    const chart = buildChart(ctx.db, patientId, CASE_ID);

    expect(chart.length).toBeGreaterThan(0);
    expect(chart.every((p) => !p.added)).toBe(true);
    expect(chart.some((p) => p.isPrimary)).toBe(true);
    expect(chart.every((p) => p.options.length >= 2)).toBe(true);
  });

  it("adds and removes problems", () => {
    const problem = listCaseProblems(ctx.db, CASE_ID)[0];
    if (!problem) throw new Error("no problem");

    addProblem(ctx.db, patientId, problem.id);
    expect(buildChart(ctx.db, patientId, CASE_ID)[0]?.added).toBe(true);

    removeProblem(ctx.db, patientId, problem.id);
    expect(buildChart(ctx.db, patientId, CASE_ID)[0]?.added).toBe(false);
  });

  it("toggles a plan selection on and off", () => {
    const problem = listCaseProblems(ctx.db, CASE_ID)[0];
    if (!problem) throw new Error("no problem");
    addProblem(ctx.db, patientId, problem.id);

    const option = buildChart(ctx.db, patientId, CASE_ID)[0]?.options[0];
    if (!option) throw new Error("no option");

    expect(togglePlanSelection(ctx.db, patientId, problem.id, option.id)).toBe(true);
    expect(buildChart(ctx.db, patientId, CASE_ID)[0]?.options[0]?.selected).toBe(true);

    expect(togglePlanSelection(ctx.db, patientId, problem.id, option.id)).toBe(false);
    expect(buildChart(ctx.db, patientId, CASE_ID)[0]?.options[0]?.selected).toBe(false);
  });

  it("discards selections when its problem is removed", () => {
    const problem = listCaseProblems(ctx.db, CASE_ID)[0];
    if (!problem) throw new Error("no problem");
    addProblem(ctx.db, patientId, problem.id);

    const option = buildChart(ctx.db, patientId, CASE_ID)[0]?.options[0];
    if (!option) throw new Error("no option");
    togglePlanSelection(ctx.db, patientId, problem.id, option.id);

    removeProblem(ctx.db, patientId, problem.id);
    addProblem(ctx.db, patientId, problem.id);

    // Re-adding the problem must not silently restore an old plan.
    expect(buildChart(ctx.db, patientId, CASE_ID)[0]?.options[0]?.selected).toBe(false);
  });

  it("scores required items and flags missed ones", () => {
    const problem = listCaseProblems(ctx.db, CASE_ID)[0];
    if (!problem) throw new Error("no problem");
    addProblem(ctx.db, patientId, problem.id);

    const chart = buildChart(ctx.db, patientId, CASE_ID);
    const required = chart[0]?.options.filter((o) => o.classification === "REQUIRED") ?? [];
    expect(required.length).toBeGreaterThan(0);

    const first = required[0];
    if (!first) throw new Error("no required option");
    togglePlanSelection(ctx.db, patientId, problem.id, first.id);

    const score = scorePlan(ctx.db, patientId, CASE_ID);
    expect(score.requiredSelected).toBe(1);
    expect(score.score).toBeGreaterThan(0);
    expect(score.missedRequired.length).toBe(required.length - 1);
  });

  it("penalises a contraindicated selection", () => {
    const problem = listCaseProblems(ctx.db, CASE_ID)[0];
    if (!problem) throw new Error("no problem");
    addProblem(ctx.db, patientId, problem.id);

    const contraindicated = buildChart(ctx.db, patientId, CASE_ID)[0]?.options.find(
      (o) => o.classification === "CONTRAINDICATED",
    );
    if (!contraindicated) throw new Error("no contraindicated option");

    togglePlanSelection(ctx.db, patientId, problem.id, contraindicated.id);
    const score = scorePlan(ctx.db, patientId, CASE_ID);

    expect(score.score).toBeLessThan(0);
    expect(score.harmful.length).toBe(1);
  });

  it("reports expected problems that were never added", () => {
    const score = scorePlan(ctx.db, patientId, CASE_ID);
    expect(score.missedProblems.length).toBeGreaterThan(0);
    // Nothing added means nothing scored, but also nothing penalised.
    expect(score.selectedCount).toBe(0);
  });

  it("renders the plan as a note", () => {
    const problem = listCaseProblems(ctx.db, CASE_ID)[0];
    if (!problem) throw new Error("no problem");
    addProblem(ctx.db, patientId, problem.id);

    const option = buildChart(ctx.db, patientId, CASE_ID)[0]?.options[0];
    if (!option) throw new Error("no option");
    togglePlanSelection(ctx.db, patientId, problem.id, option.id);

    const note = renderPlanAsNote(buildChart(ctx.db, patientId, CASE_ID));
    expect(note).toContain(`# ${problem.label}`);
    expect(note).toContain(`- ${option.label}`);
  });

  it("omits problems that were never added from the note", () => {
    const note = renderPlanAsNote(buildChart(ctx.db, patientId, CASE_ID));
    expect(note).toBe("");
  });
});
