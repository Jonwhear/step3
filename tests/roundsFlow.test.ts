/**
 * The daily rounds encounter (spec §23).
 *
 * Rounds now close on an explicit "Finish with …" rather than on answering the
 * question, so a patient stays on the list through the whole encounter. Two
 * facts make that safe, and they are what this file pins down: a question
 * cannot be answered twice in a day, and a plan already on file does not have
 * to be rewritten to get through the day.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCaseById, getCasePrompts } from "@/domain/cases";
import { lastPlanSignedDate } from "@/domain/chart";
import {
  acceptHandoffPatient,
  advancePatientAfterRounds,
  getPatient,
  hasAnsweredPromptOn,
  listRoundsDue,
  recordPromptResponse,
  recordStudyEvent,
} from "@/domain/patients";
import { runDailyScheduler } from "@/domain/scheduler";
import { listActivePanel } from "@/domain/patients";
import { todayIso } from "@/lib/date";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

const TODAY = "2026-09-08";
const TOMORROW = "2026-09-09";

let ctx: TestContext;

/** An accepted patient with a rounds prompt, ready to be rounded on. */
function onService() {
  runDailyScheduler(ctx.db, { today: TODAY });
  const pending = listActivePanel(ctx.db).find((p) => p.state === "PENDING_HANDOFF");
  if (!pending) throw new Error("fixture: no handoff patient was scheduled");
  acceptHandoffPatient(ctx.db, pending, TODAY);
  const patient = getPatient(ctx.db, pending.id);
  if (!patient) throw new Error("fixture: patient vanished");
  const prompts = getCasePrompts(ctx.db, patient.caseId, "ROUNDS");
  return { patient, prompts };
}

beforeEach(() => {
  ctx = createTestDb();
  seedProfile(ctx, { studyStartDate: TODAY });
});

afterEach(() => {
  closeTestDb(ctx);
});

describe("answering today's question", () => {
  it("is recognised as answered only for that patient, prompt and day", () => {
    const { patient, prompts } = onService();
    const prompt = prompts[0];
    if (!prompt) throw new Error("fixture: case has no rounds prompt");

    // A response is stamped with the real clock, so the day asked about is the
    // real one — the scheduler's study dates are a separate calendar.
    const realToday = todayIso();
    expect(hasAnsweredPromptOn(ctx.db, patient.id, prompt.id, realToday)).toBe(false);

    recordPromptResponse(ctx.db, patient.id, prompt.id, "ROUNDS", "A", true);

    expect(hasAnsweredPromptOn(ctx.db, patient.id, prompt.id, realToday)).toBe(true);
    // Another day is a fresh encounter, and another prompt a different question.
    expect(hasAnsweredPromptOn(ctx.db, patient.id, prompt.id, "2020-01-01")).toBe(false);
    expect(
      hasAnsweredPromptOn(ctx.db, patient.id, "prompt-that-does-not-exist", realToday),
    ).toBe(false);
    expect(hasAnsweredPromptOn(ctx.db, "other-patient", prompt.id, realToday)).toBe(false);
  });

  it("leaves the patient on the rounds list until the round is finished", () => {
    const { patient, prompts } = onService();
    const prompt = prompts[0];
    if (!prompt) throw new Error("fixture: case has no rounds prompt");
    const template = getCaseById(ctx.db, patient.caseId);
    if (!template) throw new Error("fixture: case vanished");

    recordPromptResponse(ctx.db, patient.id, prompt.id, "ROUNDS", "A", true);
    expect(listRoundsDue(ctx.db, TODAY).some((p) => p.id === patient.id)).toBe(true);

    advancePatientAfterRounds(
      ctx.db,
      patient,
      prompts.length,
      template.minimumRoundsBeforeDischarge,
      TODAY,
    );
    expect(listRoundsDue(ctx.db, TODAY).some((p) => p.id === patient.id)).toBe(false);
    // …and is due again tomorrow, with the cursor moved on to a new question.
    expect(listRoundsDue(ctx.db, TOMORROW).some((p) => p.id === patient.id)).toBe(true);
    expect(getPatient(ctx.db, patient.id)?.currentRoundPromptIndex).toBe(
      1 % prompts.length,
    );
  });
});

describe("the plan on file", () => {
  it("is absent until the note is signed", () => {
    const { patient } = onService();
    expect(lastPlanSignedDate(ctx.db, patient.id)).toBeNull();
  });

  it("reports the most recent signing, so a carried-forward plan is dated", () => {
    const { patient } = onService();

    recordStudyEvent(ctx.db, {
      eventType: "PLAN_SIGNED",
      patientInstanceId: patient.id,
      caseId: patient.caseId,
      date: TODAY,
    });
    expect(lastPlanSignedDate(ctx.db, patient.id)).toBe(TODAY);

    recordStudyEvent(ctx.db, {
      eventType: "PLAN_SIGNED",
      patientInstanceId: patient.id,
      caseId: patient.caseId,
      date: TOMORROW,
    });
    expect(lastPlanSignedDate(ctx.db, patient.id)).toBe(TOMORROW);
  });

  it("belongs to one patient only", () => {
    const { patient } = onService();
    recordStudyEvent(ctx.db, {
      eventType: "PLAN_SIGNED",
      patientInstanceId: patient.id,
      caseId: patient.caseId,
      date: TODAY,
    });

    const other = listActivePanel(ctx.db).find((p) => p.id !== patient.id);
    if (!other) throw new Error("fixture: expected more than one patient");
    expect(lastPlanSignedDate(ctx.db, other.id)).toBeNull();
  });
});
