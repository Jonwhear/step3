/**
 * First-day service bootstrap (spec §35, §69).
 *
 * The V1 failure this guards against: finishing onboarding and being handed an
 * empty hospital because the daily scheduler had already run or pacing asked
 * for zero patients.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bootstrapNewUserService,
  clearBootstrapMarker,
  hasBootstrapped,
  planEntryModes,
  runDailyScheduler,
} from "@/domain/scheduler";
import { listActivePanel, listAllPatients } from "@/domain/patients";
import { setSetting } from "@/domain/profile";
import { SETTINGS_KEYS } from "@/domain/settings";
import { countAvailableInpatientRooms, getOccupancy } from "@/domain/rooms";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

const TODAY = "2026-03-02";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb();
  seedProfile(ctx, { studyStartDate: TODAY });
});

afterEach(() => closeTestDb(ctx));

describe("bootstrapNewUserService", () => {
  it("gives a brand-new profile a usable service immediately", () => {
    const result = bootstrapNewUserService(ctx.db, { today: TODAY });

    expect(result.ran).toBe(true);
    expect(result.patientIds.length).toBeGreaterThanOrEqual(2);
    expect(listActivePanel(ctx.db).length).toBe(result.patientIds.length);
  });

  it("includes at least one handoff and one admission", () => {
    const result = bootstrapNewUserService(ctx.db, { today: TODAY });

    expect(result.handoffCount).toBeGreaterThanOrEqual(1);
    expect(result.admissionCount).toBeGreaterThanOrEqual(1);
  });

  it("runs only once per profile", () => {
    const first = bootstrapNewUserService(ctx.db, { today: TODAY });
    const second = bootstrapNewUserService(ctx.db, { today: TODAY });

    expect(first.ran).toBe(true);
    expect(second.ran).toBe(false);
    expect(listAllPatients(ctx.db).length).toBe(first.patientIds.length);
    expect(hasBootstrapped(ctx.db)).toBe(true);
  });

  it("does not duplicate an existing panel", () => {
    bootstrapNewUserService(ctx.db, { today: TODAY });
    const before = listAllPatients(ctx.db).length;

    // Simulate a returning V1 user whose marker was never written.
    clearBootstrapMarker(ctx.db);
    const second = bootstrapNewUserService(ctx.db, { today: TODAY });

    expect(second.ran).toBe(false);
    expect(listAllPatients(ctx.db).length).toBe(before);
    // The marker is still set, so it will not try again on the next page load.
    expect(hasBootstrapped(ctx.db)).toBe(true);
  });

  it("respects a census cap lower than the starter panel size", () => {
    setSetting(ctx.db, SETTINGS_KEYS.maxCensus, "1");
    const result = bootstrapNewUserService(ctx.db, { today: TODAY });

    expect(result.patientIds.length).toBe(1);
    expect(listActivePanel(ctx.db).length).toBe(1);
  });

  it("assigns each starter patient a distinct room", () => {
    bootstrapNewUserService(ctx.db, { today: TODAY });

    const panel = listActivePanel(ctx.db);
    const roomIds = panel.map((p) => p.roomId);
    expect(roomIds.every(Boolean)).toBe(true);
    expect(new Set(roomIds).size).toBe(panel.length);
    expect(getOccupancy(ctx.db).size).toBe(panel.length);
  });

  it("leaves the rest of the ward free", () => {
    const result = bootstrapNewUserService(ctx.db, { today: TODAY });
    expect(countAvailableInpatientRooms(ctx.db)).toBe(10 - result.patientIds.length);
  });

  it("stops the daily scheduler from topping up the panel on the same day", () => {
    // Without this the first day stacks bootstrap *and* a normal scheduler run,
    // filling the ward on day one instead of easing the learner in.
    const bootstrapped = bootstrapNewUserService(ctx.db, { today: TODAY });
    const run = runDailyScheduler(ctx.db, { today: TODAY });

    expect(run.newPatientIds.length).toBe(0);
    expect(listAllPatients(ctx.db).length).toBe(bootstrapped.patientIds.length);
    expect(run.debug.blockedReason).toMatch(/starter service was created today/i);
  });

  it("still schedules a teaching conference on the first day", () => {
    bootstrapNewUserService(ctx.db, { today: TODAY });
    const run = runDailyScheduler(ctx.db, { today: TODAY });

    expect(run.lectureId).toBeTruthy();
  });

  it("resumes normal pacing the next day", () => {
    bootstrapNewUserService(ctx.db, { today: TODAY });
    runDailyScheduler(ctx.db, { today: TODAY });

    const tomorrow = "2026-03-03";
    const next = runDailyScheduler(ctx.db, { today: tomorrow });
    expect(next.newPatientIds.length).toBeGreaterThan(0);
  });

  it("explains itself when there is no published content", () => {
    const empty = createTestDb(false);
    seedProfile(empty, { studyStartDate: TODAY });

    const result = bootstrapNewUserService(empty.db, { today: TODAY });
    expect(result.ran).toBe(false);
    expect(result.reason).toMatch(/no published cases/i);

    closeTestDb(empty);
  });

  it("is deterministic for the same profile and date", () => {
    const first = bootstrapNewUserService(ctx.db, { today: TODAY });
    const firstCases = listActivePanel(ctx.db).map((p) => p.caseId).sort();

    const other = createTestDb();
    seedProfile(other, { studyStartDate: TODAY });
    bootstrapNewUserService(other.db, { today: TODAY });
    const secondCases = listActivePanel(other.db).map((p) => p.caseId).sort();

    expect(secondCases).toEqual(firstCases);
    expect(first.ran).toBe(true);
    closeTestDb(other);
  });
});

describe("planEntryModes", () => {
  it("always leads with a handoff", () => {
    expect(planEntryModes(1)).toEqual(["HANDOFF"]);
    expect(planEntryModes(2)[0]).toBe("HANDOFF");
    expect(planEntryModes(3)[0]).toBe("HANDOFF");
  });

  it("adds an admission once there is room for both", () => {
    expect(planEntryModes(2)).toEqual(["HANDOFF", "ADMISSION"]);
    expect(planEntryModes(3)).toEqual(["HANDOFF", "HANDOFF", "ADMISSION"]);
  });

  it("never returns more entries than the capacity allows", () => {
    for (const capacity of [1, 2, 3, 4]) {
      expect(planEntryModes(capacity).length).toBe(capacity);
    }
  });
});
