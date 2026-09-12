/**
 * Hospital room occupancy (spec §27-30).
 *
 * Occupancy is *derived*, never stored twice: a room is occupied when an active
 * patient row points at it. That makes double-booking impossible to represent
 * and means discharging a patient frees their room with no separate bookkeeping
 * step that could be missed.
 */

import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  HOSPITAL_ROOMS,
  INPATIENT_ROOM_COUNT,
  INPATIENT_UNIT,
  MAX_OVERFLOW_ROOMS,
  overflowRoomSpec,
} from "@/config/hospital";
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

/** One bed on the floor, with whoever is in it. */
export interface CensusBed<P> {
  roomId: string;
  roomNumber: string;
  status: RoomView["status"];
  patient: P | null;
}

/**
 * Joins the floor map to the active panel, so a single card can carry both the
 * bed and its occupant instead of the screen showing a list and a map of the
 * same people.
 *
 * Panel patients with no bed on this floor come back separately rather than
 * being dropped: they are still the learner's patients, and a board that
 * silently omits one is worse than a board that says where it is.
 */
export function composeCensus<P extends { id: string }>(
  rooms: readonly RoomView[],
  panel: readonly P[],
): { beds: CensusBed<P>[]; offFloor: P[] } {
  const byId = new Map(panel.map((patient) => [patient.id, patient]));
  const beds = rooms.map((room) => ({
    roomId: room.id,
    roomNumber: room.roomNumber,
    status: room.status,
    patient: room.patient ? (byId.get(room.patient.id) ?? null) : null,
  }));

  const placed = new Set(beds.flatMap((bed) => (bed.patient ? [bed.patient.id] : [])));
  return { beds, offFloor: panel.filter((patient) => !placed.has(patient.id)) };
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

/* --------------------------------- overflow -------------------------------- */

/** Overflow beds already opened, whether or not anyone is in them. */
export function countOpenOverflowRooms(db: Db): number {
  return Math.max(0, listInpatientRooms(db).length - INPATIENT_ROOM_COUNT);
}

/** Overflow beds that could still be opened. */
export function remainingOverflowCapacity(db: Db): number {
  return Math.max(0, MAX_OVERFLOW_ROOMS - countOpenOverflowRooms(db));
}

/**
 * Every bed that could hold a new inpatient — free beds now, plus overflow
 * beds the ward would open if asked. This is the number capacity decisions
 * should use, so a full floor never silently drops a patient.
 */
export function countPlaceableInpatientBeds(db: Db): number {
  return countAvailableInpatientRooms(db) + remainingOverflowCapacity(db);
}

/**
 * Opens the next overflow bed, or returns null once the ward has flexed as far
 * as it will go. Numbering continues the floor (411, 412, …) and is stable, so
 * a reopened bed keeps its identity.
 */
export function openOverflowRoom(db: Db): t.HospitalRoomRow | null {
  const opened = countOpenOverflowRooms(db);
  if (opened >= MAX_OVERFLOW_ROOMS) return null;

  const spec = overflowRoomSpec(opened);
  const id = roomId(spec.unit, spec.roomNumber);
  db.insert(t.hospitalRoom)
    .values({
      id,
      unit: spec.unit,
      roomNumber: spec.roomNumber,
      roomType: spec.roomType,
      // Sorted after the standard floor so rounds still walk 401 → 410 → 411.
      displayOrder: INPATIENT_ROOM_COUNT + opened,
      isActive: true,
    })
    .onConflictDoNothing()
    .run();

  return getRoom(db, id);
}

/**
 * A free bed, opening an overflow bed if the floor is full. Callers that must
 * place a patient use this; callers that merely want to know whether the ward
 * is full use `findAvailableRoom`.
 */
export function findOrOpenRoom(
  db: Db,
  locationType: LocationType,
  reserved: ReadonlySet<string> = new Set(),
): { room: t.HospitalRoomRow; openedOverflow: boolean } | null {
  const existing = findAvailableRoom(db, locationType, reserved);
  if (existing) return { room: existing, openedOverflow: false };
  if (locationType !== "INPATIENT") return null;

  const overflow = openOverflowRoom(db);
  return overflow ? { room: overflow, openedOverflow: true } : null;
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

/**
 * The patients either side of this one on the service, in walking order.
 *
 * Empty rooms are not in the list at all — occupancy is what the list is built
 * from — so stepping forward from 401 lands on whoever is next, 403 or 406.
 * The ends are null rather than wrapping: the ward has a first and a last room.
 */
export function serviceNeighbours<T extends { id: string; roomId: string | null; roomNumber: string }>(
  db: Db,
  patients: readonly T[],
  patientId: string,
): { previous: T | null; next: T | null } {
  const ordered = sortByRoomOrder(db, patients);
  const index = ordered.findIndex((p) => p.id === patientId);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
  };
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
