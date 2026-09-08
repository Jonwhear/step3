/**
 * Persistence and progress (spec §51).
 *
 * These tests exercise the full patient lifecycle against a real file-backed
 * database, closing and reopening it to prove state survives a restart.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDbHandle, setDbHandle, type DbHandle } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { deleteDemoContent, resetDemoContent, seedDemoContent } from "@/db/seed";
import { getCaseById, getCasePrompts, gradePromptResponse, parseAnswerConfig } from "@/domain/cases";
import { updateConceptMastery } from "@/domain/mastery";
import {
  acceptHandoffPatient,
  advancePatientAfterRounds,
  dischargePatient,
  getPatient,
  hospitalDay,
  listActivePanel,
  listAllPatients,
  listDischarged,
  listStudyEvents,
} from "@/domain/patients";
import { buildProgressSummary } from "@/domain/progress";
import {
  getProfile,
  listRotations,
  SETTING_KEYS,
  setSetting,
  getSettings,
  upsertProfile,
  addRotation,
} from "@/domain/profile";
import { runDailyScheduler } from "@/domain/scheduler";

let dir: string;
let dbPath: string;
let handle: DbHandle;

function open(): DbHandle {
  const h = createDbHandle(dbPath);
  setDbHandle(h);
  runMigrations(h.db);
  return h;
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "step3-test-"));
  dbPath = path.join(dir, "test.sqlite");
  handle = open();
  seedDemoContent(handle.db);
  upsertProfile(handle.db, {
    name: "Test Resident",
    degree: "MD",
    specialty: "Internal Medicine",
    step3Date: "2026-12-31",
    targetPatientCount: 60,
  });
  addRotation(handle.db, {
    name: "Internal Medicine",
    specialty: "Internal Medicine",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  });
  setSetting(handle.db, SETTING_KEYS.onboarded, "true");
});

afterEach(() => {
  try {
    handle.sqlite.close();
  } catch {
    /* already closed by the test */
  }
  setDbHandle(null);
  fs.rmSync(dir, { recursive: true, force: true });
});

/** Closes and reopens the database file, simulating a server restart. */
function restart(): void {
  handle.sqlite.close();
  handle = open();
}

describe("panel persistence", () => {
  it("keeps the active panel across a database restart", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const before = listActivePanel(handle.db).map((p) => p.id).sort();
    expect(before.length).toBeGreaterThan(0);

    restart();

    const after = listActivePanel(handle.db).map((p) => p.id).sort();
    expect(after).toEqual(before);
  });

  it("does not reassign patients when the scheduler reruns the same day", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const count = listAllPatients(handle.db).length;
    restart();
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    expect(listAllPatients(handle.db).length).toBe(count);
  });

  it("persists the rounds prompt cursor and rounds count", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const patient = listActivePanel(handle.db).find((p) => p.state === "PENDING_HANDOFF")!;
    acceptHandoffPatient(handle.db, patient, "2026-09-08");

    const accepted = getPatient(handle.db, patient.id)!;
    const template = getCaseById(handle.db, accepted.caseId)!;
    const prompts = getCasePrompts(handle.db, accepted.caseId, "ROUNDS");
    advancePatientAfterRounds(
      handle.db,
      accepted,
      prompts.length,
      template.minimumRoundsBeforeDischarge,
      "2026-09-08",
    );

    restart();

    const reloaded = getPatient(handle.db, patient.id)!;
    expect(reloaded.roundsCompleted).toBe(1);
    expect(reloaded.currentRoundPromptIndex).toBe(1 % prompts.length);
    expect(reloaded.lastRoundsDate).toBe("2026-09-08");
  });

  it("persists discharge and keeps the patient in history", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const patient = listActivePanel(handle.db)[0]!;
    dischargePatient(handle.db, patient, "2026-09-08");

    restart();

    expect(listActivePanel(handle.db).map((p) => p.id)).not.toContain(patient.id);
    expect(listDischarged(handle.db).map((p) => p.id)).toContain(patient.id);
    expect(getPatient(handle.db, patient.id)!.state).toBe("DISCHARGED");
  });

  it("counts hospital day by distinct interaction dates, not elapsed days", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const patient = listActivePanel(handle.db).find((p) => p.state === "PENDING_HANDOFF")!;
    acceptHandoffPatient(handle.db, patient, "2026-09-08");
    expect(hospitalDay(getPatient(handle.db, patient.id)!)).toBe(1);

    const template = getCaseById(handle.db, patient.caseId)!;
    // A week passes with no interaction, then one encounter.
    advancePatientAfterRounds(
      handle.db,
      getPatient(handle.db, patient.id)!,
      getCasePrompts(handle.db, patient.caseId, "ROUNDS").length,
      template.minimumRoundsBeforeDischarge,
      "2026-09-15",
    );
    expect(hospitalDay(getPatient(handle.db, patient.id)!)).toBe(2);
  });
});

describe("lifecycle transitions", () => {
  it("becomes discharge eligible only after the minimum rounds", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const start = listActivePanel(handle.db).find((p) => p.state === "PENDING_HANDOFF")!;
    acceptHandoffPatient(handle.db, start, "2026-09-08");

    const template = getCaseById(handle.db, start.caseId)!;
    const promptCount = getCasePrompts(handle.db, start.caseId, "ROUNDS").length;

    for (let round = 1; round <= template.minimumRoundsBeforeDischarge; round += 1) {
      const current = getPatient(handle.db, start.id)!;
      const result = advancePatientAfterRounds(
        handle.db,
        current,
        promptCount,
        template.minimumRoundsBeforeDischarge,
        `2026-09-${String(7 + round).padStart(2, "0")}`,
      );
      expect(result.dischargeEligible).toBe(
        round >= template.minimumRoundsBeforeDischarge,
      );
    }

    expect(getPatient(handle.db, start.id)!.state).toBe("DISCHARGE_ELIGIBLE");
  });

  it("cycles rounds prompts so a long-stay patient keeps generating work", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const start = listActivePanel(handle.db).find((p) => p.state === "PENDING_HANDOFF")!;
    acceptHandoffPatient(handle.db, start, "2026-09-08");
    const promptCount = getCasePrompts(handle.db, start.caseId, "ROUNDS").length;
    const template = getCaseById(handle.db, start.caseId)!;

    for (let i = 0; i < promptCount + 1; i += 1) {
      advancePatientAfterRounds(
        handle.db,
        getPatient(handle.db, start.id)!,
        promptCount,
        template.minimumRoundsBeforeDischarge,
        `2026-10-${String(i + 1).padStart(2, "0")}`,
      );
    }
    // Wrapped back around rather than running off the end.
    expect(getPatient(handle.db, start.id)!.currentRoundPromptIndex).toBe(1 % promptCount);
  });

  it("writes an append-only study event for every meaningful interaction", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const patient = listActivePanel(handle.db).find((p) => p.state === "PENDING_HANDOFF")!;
    acceptHandoffPatient(handle.db, patient, "2026-09-08");
    dischargePatient(handle.db, patient, "2026-09-08");

    const types = listStudyEvents(handle.db).map((e) => e.eventType);
    expect(types).toContain("PATIENT_ASSIGNED");
    expect(types).toContain("PATIENT_ACCEPTED");
    expect(types).toContain("PATIENT_DISCHARGED");
  });
});

describe("progress", () => {
  it("counts patients, cases and concepts correctly", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const panel = listActivePanel(handle.db);
    dischargePatient(handle.db, panel[0]!, "2026-09-08");

    const summary = buildProgressSummary(handle.db, "2026-09-08");
    expect(summary.patientsCompleted).toBe(1);
    expect(summary.patientsOnService).toBe(panel.length - 1);
    expect(summary.patientsAssignedTotal).toBe(panel.length);
    expect(summary.casesEncountered).toBe(panel.length);
    expect(summary.targetPatientCount).toBe(60);
    expect(summary.conceptsTotal).toBeGreaterThan(0);
  });

  it("reflects mastery updates in the concept counts", () => {
    const before = buildProgressSummary(handle.db, "2026-09-08");
    expect(before.conceptsIntroduced).toBe(0);

    updateConceptMastery(handle.db, "concept:CARD.AF.01", true, "2026-09-08");
    const after = buildProgressSummary(handle.db, "2026-09-08");
    expect(after.conceptsIntroduced).toBe(1);
  });

  it("uses non-punitive pace language", () => {
    const summary = buildProgressSummary(handle.db, "2026-09-08");
    expect(["ahead", "on_pace", "behind"]).toContain(summary.pace.status);
    expect(summary.pace.label).not.toMatch(/fail|missed|behind schedule|quota/i);
  });
});

describe("demo content management", () => {
  it("is idempotent when seeded twice", () => {
    const first = buildProgressSummary(handle.db, "2026-09-08");
    seedDemoContent(handle.db);
    const second = buildProgressSummary(handle.db, "2026-09-08");
    expect(second.casesAvailable).toBe(first.casesAvailable);
    expect(second.conceptsTotal).toBe(first.conceptsTotal);
    expect(second.lecturesAvailable).toBe(first.lecturesAvailable);
  });

  it("deletes demo content and its progress without touching the profile", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    updateConceptMastery(handle.db, "concept:CARD.AF.01", true, "2026-09-08");
    expect(listAllPatients(handle.db).length).toBeGreaterThan(0);

    deleteDemoContent(handle.db);

    const summary = buildProgressSummary(handle.db, "2026-09-08");
    expect(summary.casesAvailable).toBe(0);
    expect(summary.conceptsTotal).toBe(0);
    expect(summary.lecturesAvailable).toBe(0);
    expect(listAllPatients(handle.db)).toHaveLength(0);

    // Profile, rotations and settings must survive.
    expect(getProfile(handle.db)?.name).toBe("Test Resident");
    expect(listRotations(handle.db)).toHaveLength(1);
    expect(getSettings(handle.db)[SETTING_KEYS.onboarded]).toBe("true");
  });

  it("restores the synthetic dataset on reset", () => {
    const before = buildProgressSummary(handle.db, "2026-09-08");
    resetDemoContent(handle.db);
    const after = buildProgressSummary(handle.db, "2026-09-08");
    expect(after.casesAvailable).toBe(before.casesAvailable);
    expect(after.conceptsTotal).toBe(before.conceptsTotal);
    expect(getProfile(handle.db)?.name).toBe("Test Resident");
  });

  it("survives a restart after deletion", () => {
    deleteDemoContent(handle.db);
    restart();
    expect(getProfile(handle.db)?.name).toBe("Test Resident");
    expect(buildProgressSummary(handle.db, "2026-09-08").casesAvailable).toBe(0);
  });
});

describe("end-to-end grading path", () => {
  it("grades a rounds prompt and moves mastery", () => {
    runDailyScheduler(handle.db, { today: "2026-09-08" });
    const patient = listActivePanel(handle.db).find((p) => p.state === "PENDING_HANDOFF")!;
    acceptHandoffPatient(handle.db, patient, "2026-09-08");

    const prompt = getCasePrompts(handle.db, patient.caseId, "ROUNDS")[0]!;
    const config = parseAnswerConfig(prompt);
    const answer = config.kind === "SHORT_TEXT" ? config.acceptedAnswers[0]! :
      config.kind === "ACTION" ? config.correctActionCodes.join(",") : config.correctKey;

    const grade = gradePromptResponse(prompt, answer);
    expect(grade.correct).toBe(true);

    if (prompt.conceptId) {
      const update = updateConceptMastery(handle.db, prompt.conceptId, true, "2026-09-08");
      expect(update.newLevel).toBeGreaterThan(update.previousLevel);
    }
  });
});
