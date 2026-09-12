/**
 * The V3 chart and rounds workflow.
 *
 * These cover the behaviours the workflow rests on: the narrative clock, what
 * counts as work owed today, what a sign-off does, and where the header arrows
 * go. The presentation rules they serve — concepts collapsed, teaching point
 * hidden, no Results tab — are asserted where they are decided rather than by
 * rendering, since the suite runs without a DOM.
 */

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { caseHasRoundsTask, getCaseById, getCasePrompts } from "@/domain/cases";
import { buildHospitalCourse, planSnapshot, buildChart, addProblem, togglePlanSelection } from "@/domain/chart";
import {
  acceptHandoffPatient,
  advancePatientAfterRounds,
  getPatient,
  hospitalDay,
  hospitalDayOn,
  listActivePanel,
  listRoundsDue,
  recordStudyEvent,
  touchPatient,
} from "@/domain/patients";
import { serviceNeighbours } from "@/domain/rooms";
import {
  buildRoundsEncounter,
  listObservationHistory,
  observationKeyForVital,
  priorValuesFor,
  recordObservations,
  roundsStatusFor,
} from "@/domain/rounds";
import { runDailyScheduler } from "@/domain/scheduler";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

const DAY_1 = "2026-09-08";
const DAY_2 = "2026-09-09";
/** A week later in the real world; the patient has not been touched since. */
const MUCH_LATER = "2026-09-16";

let ctx: TestContext;

function acceptFirstPatient() {
  runDailyScheduler(ctx.db, { today: DAY_1 });
  const pending = listActivePanel(ctx.db).find((p) => p.state === "PENDING_HANDOFF");
  if (!pending) throw new Error("fixture: no handoff patient was scheduled");
  acceptHandoffPatient(ctx.db, pending, DAY_1);
  const patient = getPatient(ctx.db, pending.id);
  if (!patient) throw new Error("fixture: patient vanished");
  return patient;
}

function signOff(patientId: string, today: string) {
  const patient = getPatient(ctx.db, patientId);
  if (!patient) throw new Error("fixture: patient vanished");
  const template = getCaseById(ctx.db, patient.caseId);
  if (!template) throw new Error("fixture: case vanished");
  recordObservations(ctx.db, patient, today);
  advancePatientAfterRounds(
    ctx.db,
    patient,
    getCasePrompts(ctx.db, patient.caseId, "ROUNDS").length,
    template.minimumRoundsBeforeDischarge,
    today,
  );
}

beforeEach(() => {
  ctx = createTestDb();
  seedProfile(ctx, { studyStartDate: DAY_1 });
});

afterEach(() => {
  closeTestDb(ctx);
});

describe("the narrative clock", () => {
  it("does not advance across real-world days the learner skips", () => {
    const patient = acceptFirstPatient();
    touchPatient(ctx.db, patient, DAY_2);

    const afterTwoDays = getPatient(ctx.db, patient.id);
    if (!afterTwoDays) throw new Error("patient vanished");
    expect(hospitalDay(afterTwoDays)).toBe(2);

    // A week passes with the app closed. Nothing happened to the patient, so
    // nothing happened to their hospital day.
    expect(hospitalDay(afterTwoDays)).toBe(2);
    expect(hospitalDayOn(afterTwoDays, MUCH_LATER)).toBe(3);
    // …and resuming adds exactly one day, not the days that were skipped.
    touchPatient(ctx.db, afterTwoDays, MUCH_LATER);
    const resumed = getPatient(ctx.db, patient.id);
    if (!resumed) throw new Error("patient vanished");
    expect(hospitalDay(resumed)).toBe(3);
  });

  it("reports the day being worked, stably, from before the first interaction", () => {
    const patient = acceptFirstPatient();
    // Accepting counted day 1; day 2 has not been touched yet.
    expect(hospitalDayOn(patient, DAY_2)).toBe(2);
    touchPatient(ctx.db, patient, DAY_2);
    const touched = getPatient(ctx.db, patient.id);
    if (!touched) throw new Error("patient vanished");
    // The number does not jump the moment work starts.
    expect(hospitalDayOn(touched, DAY_2)).toBe(2);
  });
});

describe("what counts as rounds due", () => {
  it("is due when the case has a question and the day's round is unfinished", () => {
    const patient = acceptFirstPatient();
    expect(roundsStatusFor(ctx.db, patient, DAY_2)).toBe("DUE");
    expect(listRoundsDue(ctx.db, DAY_2).some((p) => p.id === patient.id)).toBe(true);
  });

  it("reports no task at all when the case authors neither question nor problems", () => {
    const patient = acceptFirstPatient();
    ctx.handle.sqlite.prepare("DELETE FROM case_prompt WHERE case_id = ?").run(patient.caseId);
    ctx.handle.sqlite.prepare("DELETE FROM case_problem WHERE case_id = ?").run(patient.caseId);

    expect(caseHasRoundsTask(ctx.db, patient.caseId)).toBe(false);
    expect(roundsStatusFor(ctx.db, patient, DAY_2)).toBe("NO_TASK");
    // The workload must not claim a patient is overdue for work that does not exist.
    expect(listRoundsDue(ctx.db, DAY_2).some((p) => p.id === patient.id)).toBe(false);
  });

  it("is completed, not due, once the day is signed off", () => {
    const patient = acceptFirstPatient();
    signOff(patient.id, DAY_2);

    const signed = getPatient(ctx.db, patient.id);
    if (!signed) throw new Error("patient vanished");
    expect(roundsStatusFor(ctx.db, signed, DAY_2)).toBe("COMPLETED_TODAY");
    expect(listRoundsDue(ctx.db, DAY_2).some((p) => p.id === patient.id)).toBe(false);
    // Reopening the chart later the same day must not make them due again.
    expect(roundsStatusFor(ctx.db, signed, DAY_2)).toBe("COMPLETED_TODAY");
    // Tomorrow is a new day of work.
    expect(roundsStatusFor(ctx.db, signed, MUCH_LATER)).toBe("DUE");
  });

  it("leaves discharge to the case engine's own count", () => {
    const patient = acceptFirstPatient();
    const template = getCaseById(ctx.db, patient.caseId);
    if (!template) throw new Error("case vanished");

    for (let round = 1; round < template.minimumRoundsBeforeDischarge; round += 1) {
      signOff(patient.id, `2026-10-0${round}`);
      expect(getPatient(ctx.db, patient.id)?.state).toBe("ON_SERVICE");
    }
    signOff(patient.id, "2026-10-20");
    expect(getPatient(ctx.db, patient.id)?.state).toBe("DISCHARGE_ELIGIBLE");
  });
});

describe("recorded observations", () => {
  it("writes one record per hospital day and never rewrites it", () => {
    const patient = acceptFirstPatient();
    const written = recordObservations(ctx.db, patient, DAY_1);
    expect(written).toBeGreaterThan(0);
    // Signing off twice on the same day records the day once.
    expect(recordObservations(ctx.db, patient, DAY_1)).toBe(0);

    const history = listObservationHistory(ctx.db, patient.id);
    expect([...history.values()].every((points) => points.length === 1)).toBe(true);
  });

  it("offers prior values only when a stored earlier value differs", () => {
    const key = observationKeyForVital("Heart rate");
    const history = new Map([
      [key, [{ hospitalDay: 1, value: "112" }, { hospitalDay: 2, value: "104" }]],
    ]);

    // A real trend: earlier days are on record and they differ from today.
    expect(priorValuesFor(history, key, "96", 3)).toHaveLength(2);
    // Nothing has changed, so there is nothing to disclose.
    expect(priorValuesFor(new Map([[key, [{ hospitalDay: 1, value: "96" }]]]), key, "96", 2)).toEqual(
      [],
    );
    // Nothing was ever recorded.
    expect(priorValuesFor(new Map(), key, "96", 2)).toEqual([]);
    // Days at or after the one on screen are not "prior".
    expect(priorValuesFor(history, key, "96", 1)).toEqual([]);
  });

  it("surfaces the trend on the encounter once the values actually differ", () => {
    const patient = acceptFirstPatient();
    const template = getCaseById(ctx.db, patient.caseId);
    if (!template) throw new Error("case vanished");

    const vital = ctx.handle.sqlite
      .prepare("SELECT label, value FROM case_finding WHERE case_id = ? AND category = 'VITAL' LIMIT 1")
      .get(patient.caseId) as { label: string; value: string } | undefined;
    if (!vital) throw new Error("fixture: case has no vitals");

    recordObservations(ctx.db, patient, DAY_1);
    // The patient improves overnight: the content value changes, so day 1's
    // record and today's value no longer agree.
    ctx.handle.sqlite
      .prepare("UPDATE case_finding SET value = ? WHERE case_id = ? AND label = ?")
      .run("55", patient.caseId, vital.label);
    touchPatient(ctx.db, patient, DAY_2);

    const onDayTwo = getPatient(ctx.db, patient.id);
    if (!onDayTwo) throw new Error("patient vanished");
    const encounter = buildRoundsEncounter(ctx.db, onDayTwo, template, { today: DAY_2 });
    const row = encounter.vitals.find((v) => v.label === vital.label);
    expect(row?.prior).toEqual([{ hospitalDay: 1, value: vital.value }]);
  });
});

describe("the rounds encounter", () => {
  it("carries today's results, so nothing has to be read on another screen", () => {
    const patient = acceptFirstPatient();
    const template = getCaseById(ctx.db, patient.caseId);
    if (!template) throw new Error("case vanished");

    const encounter = buildRoundsEncounter(ctx.db, patient, template, { today: DAY_1 });
    expect(encounter.vitals.length).toBeGreaterThan(0);
    expect(encounter.prompt).not.toBeNull();
    // Whatever the case defines is here: labs, imaging and narrative findings.
    const anyResults =
      encounter.labPanels.length + encounter.imaging.length + encounter.findings.length;
    expect(anyResults).toBeGreaterThan(0);
  });

  it("reports prior answers for the collapsed performance history", () => {
    const patient = acceptFirstPatient();
    const template = getCaseById(ctx.db, patient.caseId);
    if (!template) throw new Error("case vanished");

    expect(buildRoundsEncounter(ctx.db, patient, template, { today: DAY_1 }).priorAnswers).toEqual(
      [],
    );
  });
});

describe("the hospital course", () => {
  it("records the plan as it was signed, per problem", () => {
    const patient = acceptFirstPatient();
    // Use a case that actually has a problem list.
    const withProblems = ctx.handle.sqlite
      .prepare("SELECT case_id FROM case_problem LIMIT 1")
      .get() as { case_id: string } | undefined;
    if (!withProblems) throw new Error("fixture: no case defines problems");
    ctx.db
      .update(schema.patientInstance)
      .set({ caseId: withProblems.case_id })
      .where(eq(schema.patientInstance.id, patient.id))
      .run();

    const chart = buildChart(ctx.db, patient.id, withProblems.case_id);
    const problem = chart[0];
    if (!problem?.options[0]) throw new Error("fixture: problem has no options");
    addProblem(ctx.db, patient.id, problem.id);
    togglePlanSelection(ctx.db, patient.id, problem.id, problem.options[0].id);

    recordStudyEvent(ctx.db, {
      eventType: "PLAN_SIGNED",
      patientInstanceId: patient.id,
      caseId: withProblems.case_id,
      metadata: {
        hospitalDay: 1,
        problems: planSnapshot(buildChart(ctx.db, patient.id, withProblems.case_id)),
      },
      date: DAY_1,
    });

    const course = buildHospitalCourse(ctx.db, patient.id, withProblems.case_id);
    expect(course.active).toHaveLength(1);
    expect(course.active[0]?.planItems).toEqual([problem.options[0].label]);
    expect(course.active[0]?.hospitalDay).toBe(1);
    expect(course.resolved).toEqual([]);
  });

  it("moves a problem taken off the list into resolved, keeping its plan", () => {
    const patient = acceptFirstPatient();
    const withProblems = ctx.handle.sqlite
      .prepare("SELECT case_id FROM case_problem LIMIT 1")
      .get() as { case_id: string } | undefined;
    if (!withProblems) throw new Error("fixture: no case defines problems");

    const chart = buildChart(ctx.db, patient.id, withProblems.case_id);
    const problem = chart[0];
    if (!problem) throw new Error("fixture: no problem");
    addProblem(ctx.db, patient.id, problem.id);
    recordStudyEvent(ctx.db, {
      eventType: "PLAN_SIGNED",
      patientInstanceId: patient.id,
      caseId: withProblems.case_id,
      metadata: {
        hospitalDay: 1,
        problems: planSnapshot(buildChart(ctx.db, patient.id, withProblems.case_id)),
      },
      date: DAY_1,
    });

    ctx.handle.sqlite
      .prepare("DELETE FROM patient_problem WHERE patient_instance_id = ? AND problem_id = ?")
      .run(patient.id, problem.id);

    const course = buildHospitalCourse(ctx.db, patient.id, withProblems.case_id);
    expect(course.active).toEqual([]);
    expect(course.resolved.map((p) => p.problemId)).toEqual([problem.id]);
  });
});

describe("walking the ward", () => {
  it("steps to the next and previous occupied rooms, skipping the empty ones", () => {
    runDailyScheduler(ctx.db, { today: DAY_1 });
    const panel = listActivePanel(ctx.db);
    expect(panel.length).toBeGreaterThan(2);

    const ordered = [...panel].sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
    );
    const first = ordered[0];
    const second = ordered[1];
    const last = ordered[ordered.length - 1];
    if (!first || !second || !last) throw new Error("fixture: not enough patients");

    // Empty rooms are simply not in the list, so "next" is the next occupant.
    expect(serviceNeighbours(ctx.db, panel, first.id).next?.id).toBe(second.id);
    expect(serviceNeighbours(ctx.db, panel, second.id).previous?.id).toBe(first.id);

    // The ward does not wrap around at either end.
    expect(serviceNeighbours(ctx.db, panel, first.id).previous).toBeNull();
    expect(serviceNeighbours(ctx.db, panel, last.id).next).toBeNull();
  });
});

describe("what the chart offers", () => {
  it("has no Results tab: results live in rounds", () => {
    const source = readFileSync("src/components/emr/ChartTabs.tsx", "utf8");
    const labels = source.slice(source.indexOf("CHART_TAB_LABELS"), source.indexOf("export function"));
    expect(labels).toContain("summary:");
    expect(labels).toContain("rounds:");
    expect(labels).not.toContain("results:");
    expect(labels).not.toContain("chart:");
  });

  it("collapses concepts and hides the teaching point until asked for", () => {
    const page = readFileSync("src/app/patients/[id]/page.tsx", "utf8");
    // Concepts are inside a Disclosure rather than an always-open card.
    expect(page).toMatch(/<Disclosure summary=\{`Concepts encountered/);
    // The teaching point is an affordance, not a rendered paragraph.
    expect(page).toContain("<TeachingPoint text={template.teachingPoint} />");
    expect(page).not.toMatch(/\{template\.teachingPoint\}\s*<\/p>/);
  });
});
