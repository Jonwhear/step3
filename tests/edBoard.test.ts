/**
 * Learner-initiated admissions and overflow beds.
 *
 * The ED board is the counterpart to the scheduler: the scheduler decides what
 * the learner *should* see, this lets them choose. The capacity rules are the
 * interesting part — self-admission is bounded by beds rather than by the
 * census cap, and a full ward flexes rather than refusing.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INPATIENT_ROOM_COUNT, MAX_OVERFLOW_ROOMS } from "@/config/hospital";
import {
  admitFromEd,
  getEdCapacity,
  listEdBoard,
  toOneLiner,
} from "@/domain/admissions";
import { listCases } from "@/domain/cases";
import { dischargePatient, getPatient, listActivePanel } from "@/domain/patients";
import { setSetting } from "@/domain/profile";
import {
  countOpenOverflowRooms,
  listInpatientRooms,
  remainingOverflowCapacity,
  seedHospitalRooms,
} from "@/domain/rooms";
import { runDailyScheduler } from "@/domain/scheduler";
import { SETTINGS_KEYS } from "@/domain/settings";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

const TODAY = "2026-06-01";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb();
  seedProfile(ctx, { studyStartDate: TODAY });
  seedHospitalRooms(ctx.db);
});

afterEach(() => closeTestDb(ctx));

/** Admits `count` distinct cases straight from the board. */
function admitMany(count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const next = listEdBoard(ctx.db, { today: TODAY })[0];
    if (!next) break;
    const result = admitFromEd(ctx.db, next.caseId, TODAY);
    if (!result.ok || !result.patientId) break;
    ids.push(result.patientId);
  }
  return ids;
}

describe("ED board", () => {
  it("lists published cases that are not already on service", () => {
    const board = listEdBoard(ctx.db, { today: TODAY });

    expect(board.length).toBeGreaterThan(0);
    expect(board.every((e) => !e.alreadyOnService)).toBe(true);
    expect(board.every((e) => e.diagnosis.length > 0)).toBe(true);
    expect(board.every((e) => e.oneLiner.length > 0)).toBe(true);
  });

  it("drops a case from the board once it is admitted", () => {
    const first = listEdBoard(ctx.db, { today: TODAY })[0];
    if (!first) throw new Error("empty board");

    admitFromEd(ctx.db, first.caseId, TODAY);

    const after = listEdBoard(ctx.db, { today: TODAY });
    expect(after.some((e) => e.caseId === first.caseId)).toBe(false);
  });

  it("searches across diagnosis, specialty and topic", () => {
    const byDiagnosis = listEdBoard(ctx.db, { today: TODAY, query: "ketoacidosis" });
    expect(byDiagnosis.length).toBe(1);
    expect(byDiagnosis[0]?.diagnosis).toMatch(/ketoacidosis/i);

    const bySpecialty = listEdBoard(ctx.db, { today: TODAY, query: "surgery" });
    expect(bySpecialty.length).toBeGreaterThan(0);
    expect(bySpecialty.every((e) => /surgery/i.test(`${e.specialty} ${e.topic} ${e.title}`))).toBe(
      true,
    );
  });

  it("narrows rather than widens with multiple terms", () => {
    const broad = listEdBoard(ctx.db, { today: TODAY, query: "pneumonia" });
    const narrow = listEdBoard(ctx.db, { today: TODAY, query: "pneumonia community" });
    expect(narrow.length).toBeLessThanOrEqual(broad.length);
    expect(narrow.length).toBeGreaterThan(0);
  });

  it("returns nothing for a diagnosis the library does not have", () => {
    expect(listEdBoard(ctx.db, { today: TODAY, query: "zzzznotarealdiagnosis" })).toEqual([]);
  });

  it("returns the whole library by default, so a search can reach any case", () => {
    // The UI paginates on the client. If the server trimmed the list here, a
    // search would only ever reach the trimmed slice.
    const unfiltered = listEdBoard(ctx.db, { today: TODAY });
    expect(unfiltered.length).toBe(20);
    expect(unfiltered.some((e) => e.diagnosis.match(/ketoacidosis/i))).toBe(true);
  });

  it("trims only when a limit is asked for", () => {
    expect(listEdBoard(ctx.db, { today: TODAY, limit: 5 }).length).toBe(5);
  });

  it("is deterministic for the same user and date", () => {
    const first = listEdBoard(ctx.db, { today: TODAY }).map((e) => e.caseId);
    const second = listEdBoard(ctx.db, { today: TODAY }).map((e) => e.caseId);
    expect(second).toEqual(first);
  });

  it("builds a one-liner from structured demographics when the case has them", () => {
    const dka = listCases(ctx.db).find((c) => c.code === "DEMO-ENDO-001");
    if (!dka) throw new Error("case missing");
    expect(toOneLiner(dka)).toBe("24 F — Vomiting, abdominal pain and polyuria");
  });

  it("falls back to the first sentence of the opening line", () => {
    const withoutDemographics = listCases(ctx.db).find((c) => !c.chiefComplaint.trim());
    if (!withoutDemographics) throw new Error("expected a case without a chief complaint");
    const line = toOneLiner(withoutDemographics);
    expect(line.length).toBeGreaterThan(0);
    expect(line.length).toBeLessThanOrEqual(160);
  });
});

describe("admitting from the board", () => {
  it("puts the patient in a room as a pending admission", () => {
    const entry = listEdBoard(ctx.db, { today: TODAY })[0];
    if (!entry) throw new Error("empty board");

    const result = admitFromEd(ctx.db, entry.caseId, TODAY);
    expect(result.ok).toBe(true);
    expect(result.roomNumber).toBe("401");

    const patient = getPatient(ctx.db, result.patientId ?? "");
    expect(patient?.state).toBe("PENDING_ADMISSION");
    expect(patient?.entryMode).toBe("ADMISSION");
    expect(patient?.roomId).toBeTruthy();
  });

  it("refuses a case already on the service", () => {
    const entry = listEdBoard(ctx.db, { today: TODAY })[0];
    if (!entry) throw new Error("empty board");

    admitFromEd(ctx.db, entry.caseId, TODAY);
    const second = admitFromEd(ctx.db, entry.caseId, TODAY);

    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already on your service/i);
  });

  it("refuses an unknown case", () => {
    expect(admitFromEd(ctx.db, "case:NOPE", TODAY).ok).toBe(false);
  });

  it("gives each admission a distinct room and name", () => {
    admitMany(4);
    const panel = listActivePanel(ctx.db);

    expect(panel.length).toBe(4);
    expect(new Set(panel.map((p) => p.roomId)).size).toBe(4);
    expect(new Set(panel.map((p) => p.patientName)).size).toBe(4);
  });
});

describe("census cap and overflow", () => {
  it("lets the learner admit past their own census cap", () => {
    setSetting(ctx.db, SETTINGS_KEYS.maxCensus, "5");
    admitMany(5);

    const capacity = getEdCapacity(ctx.db);
    expect(capacity.overCap).toBe(true);
    // The cap paces the scheduler; it is not a refusal for the learner.
    expect(capacity.admissionsRemaining).toBeGreaterThan(0);
    expect(capacity.capWarning).toMatch(/census cap/i);
    expect(capacity.blockedReason).toBeNull();

    const entry = listEdBoard(ctx.db, { today: TODAY })[0];
    expect(entry).toBeTruthy();
    expect(admitFromEd(ctx.db, entry!.caseId, TODAY).ok).toBe(true);
  });

  it("opens an overflow bed once Floor 4 is full", () => {
    admitMany(INPATIENT_ROOM_COUNT);
    expect(countOpenOverflowRooms(ctx.db)).toBe(0);

    const capacity = getEdCapacity(ctx.db);
    expect(capacity.freeBeds).toBe(0);
    expect(capacity.willOpenOverflow).toBe(true);

    const entry = listEdBoard(ctx.db, { today: TODAY })[0];
    if (!entry) throw new Error("empty board");
    const result = admitFromEd(ctx.db, entry.caseId, TODAY);

    expect(result.ok).toBe(true);
    expect(result.openedOverflow).toBe(true);
    expect(result.roomNumber).toBe("411");
    expect(countOpenOverflowRooms(ctx.db)).toBe(1);
  });

  it("numbers overflow beds in sequence and keeps them after the main floor", () => {
    admitMany(INPATIENT_ROOM_COUNT + 3);

    const numbers = listInpatientRooms(ctx.db).map((r) => r.roomNumber);
    expect(numbers.slice(0, INPATIENT_ROOM_COUNT)).toEqual([
      "401", "402", "403", "404", "405", "406", "407", "408", "409", "410",
    ]);
    expect(numbers.slice(INPATIENT_ROOM_COUNT)).toEqual(["411", "412", "413"]);
  });

  it("stops flexing once every overflow bed is open", () => {
    admitMany(INPATIENT_ROOM_COUNT + MAX_OVERFLOW_ROOMS);

    expect(remainingOverflowCapacity(ctx.db)).toBe(0);
    const capacity = getEdCapacity(ctx.db);
    expect(capacity.admissionsRemaining).toBe(0);
    expect(capacity.blockedReason).toMatch(/including overflow/i);

    const entry = listEdBoard(ctx.db, { today: TODAY })[0];
    if (!entry) throw new Error("empty board");
    const refused = admitFromEd(ctx.db, entry.caseId, TODAY);
    expect(refused.ok).toBe(false);
  });

  it("reuses a freed overflow bed rather than opening another", () => {
    const ids = admitMany(INPATIENT_ROOM_COUNT + 1);
    expect(countOpenOverflowRooms(ctx.db)).toBe(1);

    const inOverflow = ids
      .map((id) => getPatient(ctx.db, id))
      .find((p) => p?.roomNumber === "411");
    if (!inOverflow) throw new Error("nobody in overflow");
    dischargePatient(ctx.db, inOverflow, TODAY);

    const entry = listEdBoard(ctx.db, { today: TODAY })[0];
    if (!entry) throw new Error("empty board");
    const result = admitFromEd(ctx.db, entry.caseId, TODAY);

    expect(result.roomNumber).toBe("411");
    expect(countOpenOverflowRooms(ctx.db)).toBe(1);
  });

  it("keeps the scheduler working after the learner fills Floor 4", () => {
    // The point of overflow: self-admissions must not silently cost the
    // learner tomorrow's scheduled patient.
    setSetting(ctx.db, SETTINGS_KEYS.maxCensus, "10");
    admitMany(INPATIENT_ROOM_COUNT);
    // Discharge one so the census cap leaves headroom, but no bed is free
    // until the ward flexes.
    const panel = listActivePanel(ctx.db);
    const first = panel[0];
    if (!first) throw new Error("empty panel");

    const run = runDailyScheduler(ctx.db, { today: TODAY, force: true });
    // At the cap, the scheduler correctly assigns nothing and explains itself.
    expect(run.debug.blockedReason).toBeTruthy();

    dischargePatient(ctx.db, first, TODAY);
    const after = runDailyScheduler(ctx.db, { today: "2026-06-02" });
    expect(after.newPatientIds.length).toBeGreaterThan(0);
  });
});
