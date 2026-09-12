/**
 * Hospital rooms and census (spec §27-30, §55, §69).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INPATIENT_ROOM_COUNT, INPATIENT_UNIT } from "@/config/hospital";
import {
  buildFloorMap,
  composeCensus,
  countAvailableInpatientRooms,
  findAvailableRoom,
  getOccupancy,
  initialsFor,
  listInpatientRooms,
  reconcilePatientRooms,
  seedHospitalRooms,
  sortByRoomOrder,
  surnameFor,
} from "@/domain/rooms";
import {
  createPatientInstance,
  dischargePatient,
  getPatient,
  listRoundsDue,
} from "@/domain/patients";
import { listCases } from "@/domain/cases";
import { setSetting } from "@/domain/profile";
import { runDailyScheduler } from "@/domain/scheduler";
import { getPreferences, resolveSchedulerTuning, SETTINGS_KEYS } from "@/domain/settings";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

const TODAY = "2026-04-01";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb();
  seedProfile(ctx, { studyStartDate: TODAY });
  seedHospitalRooms(ctx.db);
});

afterEach(() => closeTestDb(ctx));

function admit(index: number, roomId?: string) {
  const template = listCases(ctx.db)[index];
  if (!template) throw new Error("not enough demo cases for this test");
  const room = roomId ? { id: roomId, roomNumber: roomId } : findAvailableRoom(ctx.db, "INPATIENT");
  if (!room) throw new Error("no room available");
  return createPatientInstance(ctx.db, {
    caseId: template.id,
    patientName: `Patient ${index}`,
    roomNumber: "roomNumber" in room ? String(room.roomNumber) : "",
    roomId: room.id,
    locationType: "INPATIENT",
    entryMode: "HANDOFF",
    assignedDate: TODAY,
  });
}

describe("hospital rooms", () => {
  it("seeds the inpatient floor 401-410", () => {
    const rooms = listInpatientRooms(ctx.db);
    expect(rooms.length).toBe(INPATIENT_ROOM_COUNT);
    expect(rooms.map((r) => r.roomNumber)).toEqual([
      "401", "402", "403", "404", "405", "406", "407", "408", "409", "410",
    ]);
    expect(rooms.every((r) => r.unit === INPATIENT_UNIT)).toBe(true);
  });

  it("is idempotent when seeded twice", () => {
    seedHospitalRooms(ctx.db);
    seedHospitalRooms(ctx.db);
    expect(listInpatientRooms(ctx.db).length).toBe(INPATIENT_ROOM_COUNT);
  });

  it("never assigns the same room to two active patients", () => {
    for (let i = 0; i < 5; i += 1) admit(i);

    const occupancy = getOccupancy(ctx.db);
    expect(occupancy.size).toBe(5);
    // One patient per room is enforced structurally: occupancy is keyed by room.
    const patients = [...occupancy.values()].map((p) => p.id);
    expect(new Set(patients).size).toBe(5);
  });

  it("hands out the lowest free room first", () => {
    admit(0);
    admit(1);
    const next = findAvailableRoom(ctx.db, "INPATIENT");
    expect(next?.roomNumber).toBe("403");
  });

  it("frees the room on discharge", () => {
    const patientId = admit(0);
    expect(countAvailableInpatientRooms(ctx.db)).toBe(INPATIENT_ROOM_COUNT - 1);

    const patient = getPatient(ctx.db, patientId);
    if (!patient) throw new Error("patient missing");
    dischargePatient(ctx.db, patient, TODAY);

    expect(countAvailableInpatientRooms(ctx.db)).toBe(INPATIENT_ROOM_COUNT);
    expect(getOccupancy(ctx.db).size).toBe(0);
    expect(getPatient(ctx.db, patientId)?.roomId).toBeNull();
  });

  it("returns null when the ward is full", () => {
    for (let i = 0; i < INPATIENT_ROOM_COUNT; i += 1) admit(i);
    expect(countAvailableInpatientRooms(ctx.db)).toBe(0);
    expect(findAvailableRoom(ctx.db, "INPATIENT")).toBeNull();
  });

  it("reserves rooms within a single assignment pass", () => {
    const reserved = new Set<string>();
    const first = findAvailableRoom(ctx.db, "INPATIENT", reserved);
    if (first) reserved.add(first.id);
    const second = findAvailableRoom(ctx.db, "INPATIENT", reserved);

    expect(first?.id).not.toBe(second?.id);
  });

  it("walks rounds in ascending room order", () => {
    // Deliberately admit into a high room first.
    const rooms = listInpatientRooms(ctx.db);
    const high = rooms[7];
    const low = rooms[1];
    if (!high || !low) throw new Error("rooms missing");

    const cases = listCases(ctx.db);
    for (const [roomIndex, room] of [high, low].entries()) {
      const template = cases[roomIndex];
      if (!template) throw new Error("case missing");
      const id = createPatientInstance(ctx.db, {
        caseId: template.id,
        patientName: `Patient ${room.roomNumber}`,
        roomNumber: room.roomNumber,
        roomId: room.id,
        locationType: "INPATIENT",
        entryMode: "HANDOFF",
        assignedDate: TODAY,
      });
      ctx.db
        .update(schema.patientInstance)
        .set({ state: "ON_SERVICE" })
        .where(eq(schema.patientInstance.id, id))
        .run();
    }

    const due = listRoundsDue(ctx.db, TODAY);
    expect(due.map((p) => p.roomNumber)).toEqual(["402", "408"]);
  });

  it("sorts patients without a room to the end", () => {
    const sorted = sortByRoomOrder(ctx.db, [
      { roomId: null, roomNumber: "999" },
      { roomId: "room:Floor_4:401", roomNumber: "401" },
    ]);
    expect(sorted[0]?.roomNumber).toBe("401");
  });

  it("backfills rooms for patients created before the map existed", () => {
    const template = listCases(ctx.db)[0];
    if (!template) throw new Error("case missing");
    const id = createPatientInstance(ctx.db, {
      caseId: template.id,
      patientName: "Legacy Patient",
      roomNumber: "404",
      entryMode: "HANDOFF",
      assignedDate: TODAY,
    });
    // Simulate a V1 row: a room number but no room id.
    ctx.db
      .update(schema.patientInstance)
      .set({ roomId: null })
      .where(eq(schema.patientInstance.id, id))
      .run();

    const assigned = reconcilePatientRooms(ctx.db);
    expect(assigned).toBe(1);
    // The legacy room number is honoured where the room is free.
    expect(getPatient(ctx.db, id)?.roomNumber).toBe("404");
    expect(getPatient(ctx.db, id)?.roomId).toBeTruthy();
  });

  it("builds a floor map covering every room", () => {
    admit(0);
    const map = buildFloorMap(ctx.db, { today: TODAY });

    expect(map.length).toBe(INPATIENT_ROOM_COUNT);
    expect(map.filter((r) => r.patient).length).toBe(1);
    expect(map.filter((r) => r.status === "EMPTY").length).toBe(INPATIENT_ROOM_COUNT - 1);
  });
});

/*
 * The service screen shows one board rather than a patient list above a floor
 * map, so the join between the two has to be exact: every panel patient must
 * appear exactly once, whether or not the floor knows where they are.
 */
describe("composeCensus", () => {
  const room = (id: string, patientId: string | null) => ({
    id,
    unit: INPATIENT_UNIT,
    roomNumber: id.slice(-3),
    roomType: "INPATIENT",
    status: (patientId ? "OCCUPIED" : "EMPTY") as "OCCUPIED" | "EMPTY",
    patient: patientId
      ? {
          id: patientId,
          name: "Test Patient",
          surname: "Patient",
          initials: "TP",
          state: "ON_SERVICE",
          roundsDue: false,
        }
      : null,
  });

  it("puts each panel patient in their own bed", () => {
    const panel = [{ id: "p1" }, { id: "p2" }];
    const { beds, offFloor } = composeCensus(
      [room("r401", "p1"), room("r402", null), room("r403", "p2")],
      panel,
    );

    expect(beds.map((b) => b.patient?.id ?? null)).toEqual(["p1", null, "p2"]);
    expect(offFloor).toEqual([]);
  });

  it("keeps the number and order of beds, so the floor still reads as a floor", () => {
    const { beds } = composeCensus([room("r401", null), room("r402", null)], []);
    expect(beds.map((b) => b.roomNumber)).toEqual(["401", "402"]);
    expect(beds.every((b) => b.patient === null)).toBe(true);
  });

  it("surfaces a panel patient who holds no bed on this floor", () => {
    // An ED bay, for instance: the floor map only covers the inpatient unit.
    const { beds, offFloor } = composeCensus([room("r401", "p1")], [
      { id: "p1" },
      { id: "p2" },
    ]);

    expect(beds).toHaveLength(1);
    expect(offFloor.map((p) => p.id)).toEqual(["p2"]);
  });

  it("leaves a bed empty when its occupant is not on the active panel", () => {
    // Defensive: a stale occupancy row must not render a card with no data.
    const { beds, offFloor } = composeCensus([room("r401", "ghost")], []);
    expect(beds[0]?.patient).toBeNull();
    expect(offFloor).toEqual([]);
  });
});

describe("census capacity", () => {
  it("caps at the smaller of the ward and the user preference", () => {
    setSetting(ctx.db, SETTINGS_KEYS.maxCensus, "6");
    const tuning = resolveSchedulerTuning(getPreferences(ctx.db).scheduler);

    expect(tuning.physicalRoomCap).toBe(INPATIENT_ROOM_COUNT);
    expect(tuning.userCensusCap).toBe(6);
    expect(tuning.effectiveCensusCap).toBe(6);
  });

  it("never exceeds the physical ward even if the preference is higher", () => {
    setSetting(ctx.db, SETTINGS_KEYS.maxCensus, "50");
    const tuning = resolveSchedulerTuning(getPreferences(ctx.db).scheduler);
    expect(tuning.effectiveCensusCap).toBeLessThanOrEqual(INPATIENT_ROOM_COUNT);
  });

  it("stops assigning when the ward is full and says why", () => {
    for (let i = 0; i < INPATIENT_ROOM_COUNT; i += 1) admit(i);

    const result = runDailyScheduler(ctx.db, { today: TODAY, force: true });
    expect(result.newPatientIds.length).toBe(0);
    expect(result.debug.availableBeds).toBe(0);
    expect(result.debug.blockedReason).toBeTruthy();
  });
});

describe("name helpers", () => {
  it("derives initials from a full name", () => {
    expect(initialsFor("Margaret Lewis")).toBe("ML");
    expect(initialsFor("Prince")).toBe("P");
    expect(initialsFor("  ")).toBe("??");
  });

  it("derives a surname for the floor map", () => {
    expect(surnameFor("Margaret Lewis")).toBe("Lewis");
    expect(surnameFor("Prince")).toBe("Prince");
  });
});
