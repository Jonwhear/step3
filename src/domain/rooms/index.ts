/**
 * Hospital room occupancy (spec §27-30).
 *
 * Occupancy is *derived*, never stored twice: a room is occupied when an active
 * patient row points at it. That makes double-booking impossible to represent
 * and means discharging a patient frees their room with no separate bookkeeping
 * step that could be missed.
 */

import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { HOSPITAL_ROOMS, INPATIENT_UNIT } from "@/config/hospital";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { ACTIVE_PANEL_STATES } from "@/domain/constants";
import { USER_ID } from "@/domain/profile";

export type RoomType = "INPATIENT" | "ED" | "TRAUMA" | "BOARDING" | "HALLWAY";
export type LocationType = "ED" | "INPATIENT" | "DISCHARGED";

/** Stable ids so re-seeding never duplicates a room. */
export function roomId(unit: string, roomNumber: string): string {
  return `room:${unit}:${roomNumber}`.replace(/\s+/g, "_");
}

/** Idempotent: seeds the fixed layout, leaving any occupancy untouched. */
export function seedHospitalRooms(db: Db): number {
  let count = 0;
  for (const [index, spec] of HOSPITAL_ROOMS.entries()) {
    db.insert(t.hospitalRoom)
      .values({
        id: roomId(spec.unit, spec.roomNumber),
        unit: spec.unit,
        roomNumber: spec.roomNumber,
        roomType: spec.roomType,
        displayOrder: index,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: t.hospitalRoom.id,
        set: { roomType: spec.roomType, displayOrder: index, unit: spec.unit },
      })
      .run();
    count += 1;
  }
  return count;
}

export function listRooms(db: Db, types?: readonly RoomType[]): t.HospitalRoomRow[] {
  const rows = db
    .select()
    .from(t.hospitalRoom)
    .where(eq(t.hospitalRoom.isActive, true))
    .orderBy(asc(t.hospitalRoom.displayOrder))
    .all();
  if (!types) return rows;
  const wanted = new Set<string>(types);
  return rows.filter((r) => wanted.has(r.roomType));
}

export function listInpatientRooms(db: Db): t.HospitalRoomRow[] {
  return listRooms(db).filter((r) => r.unit === INPATIENT_UNIT);
}

export function getRoom(db: Db, id: string): t.HospitalRoomRow | null {
  return db.select().from(t.hospitalRoom).where(eq(t.hospitalRoom.id, id)).get() ?? null;
}

/** roomId -> the active patient holding it. */
export function getOccupancy(db: Db): Map<string, t.PatientInstanceRow> {
  const rows = db
    .select()
    .from(t.patientInstance)
    .where(
      and(
        eq(t.patientInstance.userId, USER_ID),
        inArray(t.patientInstance.state, [...ACTIVE_PANEL_STATES]),
        isNotNull(t.patientInstance.roomId),
      ),
    )
    .all();
  const map = new Map<string, t.PatientInstanceRow>();
  for (const row of rows) {
    if (row.roomId) map.set(row.roomId, row);
  }
  return map;
}

export interface RoomView {
  id: string;
  unit: string;
  roomNumber: string;
  roomType: string;
  /** EMPTY | OCCUPIED | DISCHARGE_PENDING | NEW_PATIENT */
  status: "EMPTY" | "OCCUPIED" | "DISCHARGE_PENDING" | "NEW_PATIENT";
  patient: {
    id: string;
    name: string;
    surname: string;
    initials: string;
    state: string;
    roundsDue: boolean;
  } | null;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "??";
}

export function surnameFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? (parts[parts.length - 1] as string) : (parts[0] ?? "");
}

/** The floor map, in room order, with whoever currently occupies each room. */
export function buildFloorMap(
  db: Db,
  options: { unit?: string; today: string },
): RoomView[] {
  const occupancy = getOccupancy(db);
  const rooms = options.unit
    ? listRooms(db).filter((r) => r.unit === options.unit)
    : listInpatientRooms(db);

  return rooms.map((room) => {
    const patient = occupancy.get(room.id) ?? null;
    if (!patient) {
      return {
        id: room.id,
        unit: room.unit,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        status: "EMPTY" as const,
        patient: null,
      };
    }

    const roundsDue =
      (patient.state === "ON_SERVICE" || patient.state === "DISCHARGE_ELIGIBLE") &&
      patient.lastRoundsDate !== options.today;

    const status =
      patient.state === "DISCHARGE_ELIGIBLE"
        ? ("DISCHARGE_PENDING" as const)
        : patient.state === "PENDING_HANDOFF" || patient.state === "PENDING_ADMISSION"
          ? ("NEW_PATIENT" as const)
          : ("OCCUPIED" as const);

    return {
      id: room.id,
      unit: room.unit,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      status,
      patient: {
        id: patient.id,
        name: patient.patientName,
        surname: surnameFor(patient.patientName),
        initials: initialsFor(patient.patientName),
        state: patient.state,
        roundsDue,
      },
    };
  });
}

/**
 * Lowest-numbered free room of the requested kind, or null when the unit is
 * full. Deterministic by construction — no jitter, no randomness — so the same
 * panel always produces the same floor.
 */
export function findAvailableRoom(
  db: Db,
  locationType: LocationType,
  reserved: ReadonlySet<string> = new Set(),
): t.HospitalRoomRow | null {
  const occupancy = getOccupancy(db);
  const candidates =
    locationType === "ED"
      ? listRooms(db, ["ED", "TRAUMA", "BOARDING", "HALLWAY"])
      : listInpatientRooms(db);

  return (
    candidates.find((room) => !occupancy.has(room.id) && !reserved.has(room.id)) ?? null
  );
}

export function countAvailableInpatientRooms(db: Db): number {
  const occupancy = getOccupancy(db);
  return listInpatientRooms(db).filter((r) => !occupancy.has(r.id)).length;
}

/**
 * Sorts patients into walking order — ascending room number (spec §30).
 *
 * Ordering by the room's `displayOrder` rather than by the room number string
 * keeps ED bays ("ED 2", "TRAUMA 1") in their laid-out order too, where a
 * lexicographic sort would scatter them.
 */
export function sortByRoomOrder<T extends { roomId: string | null; roomNumber: string }>(
  db: Db,
  patients: readonly T[],
): T[] {
  const order = new Map(listRooms(db).map((room) => [room.id, room.displayOrder]));
  return [...patients].sort((a, b) => {
    const aOrder = a.roomId ? (order.get(a.roomId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const bOrder = b.roomId ? (order.get(b.roomId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
  });
}

/** Frees the room a patient is holding. Called on discharge. */
export function releaseRoom(db: Db, patientId: string): void {
  db.update(t.patientInstance)
    .set({ roomId: null, locationType: "DISCHARGED" })
    .where(eq(t.patientInstance.id, patientId))
    .run();
}

/**
 * Backfills rooms for patients created before the map existed, matching on the
 * legacy free-text room number where possible so a V1 panel keeps its layout.
 */
export function reconcilePatientRooms(db: Db): number {
  const patients = db
    .select()
    .from(t.patientInstance)
    .where(
      and(
        eq(t.patientInstance.userId, USER_ID),
        inArray(t.patientInstance.state, [...ACTIVE_PANEL_STATES]),
      ),
    )
    .orderBy(asc(t.patientInstance.assignedAt))
    .all();

  const taken = new Set<string>();
  for (const patient of patients) {
    if (patient.roomId) taken.add(patient.roomId);
  }

  let assigned = 0;
  for (const patient of patients) {
    if (patient.roomId) continue;

    const byNumber = listInpatientRooms(db).find(
      (r) => r.roomNumber === patient.roomNumber && !taken.has(r.id),
    );
    const room = byNumber ?? findAvailableRoom(db, "INPATIENT", taken);
    if (!room) continue;

    taken.add(room.id);
    db.update(t.patientInstance)
      .set({ roomId: room.id, roomNumber: room.roomNumber, locationType: "INPATIENT" })
      .where(eq(t.patientInstance.id, patient.id))
      .run();
    assigned += 1;
  }
  return assigned;
}
