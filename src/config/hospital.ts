/**
 * Physical hospital layout (spec §26-29).
 *
 * Deliberately small and declarative: a 2D schematic, not a simulation. The
 * inpatient floor defines the real ceiling on the census, so the scheduler
 * reads its size from here rather than from a separate magic number.
 */

export const INPATIENT_UNIT = "Floor 4";
export const EMERGENCY_UNIT = "Emergency Department";

export interface RoomSpec {
  unit: string;
  roomNumber: string;
  roomType: "INPATIENT" | "ED" | "TRAUMA" | "BOARDING" | "HALLWAY";
}

/** Rooms 401–410 on the default inpatient floor. */
export const INPATIENT_ROOMS: RoomSpec[] = Array.from({ length: 10 }, (_, i) => ({
  unit: INPATIENT_UNIT,
  roomNumber: String(401 + i),
  roomType: "INPATIENT" as const,
}));

export const ED_ROOMS: RoomSpec[] = [
  { unit: EMERGENCY_UNIT, roomNumber: "TRAUMA 1", roomType: "TRAUMA" },
  { unit: EMERGENCY_UNIT, roomNumber: "TRAUMA 2", roomType: "TRAUMA" },
  { unit: EMERGENCY_UNIT, roomNumber: "ED 1", roomType: "ED" },
  { unit: EMERGENCY_UNIT, roomNumber: "ED 2", roomType: "ED" },
  { unit: EMERGENCY_UNIT, roomNumber: "ED 3", roomType: "ED" },
  { unit: EMERGENCY_UNIT, roomNumber: "ED 4", roomType: "ED" },
  { unit: EMERGENCY_UNIT, roomNumber: "BOARDING 1", roomType: "BOARDING" },
  { unit: EMERGENCY_UNIT, roomNumber: "BOARDING 2", roomType: "BOARDING" },
  { unit: EMERGENCY_UNIT, roomNumber: "HALL A", roomType: "HALLWAY" },
  { unit: EMERGENCY_UNIT, roomNumber: "HALL B", roomType: "HALLWAY" },
];

export const HOSPITAL_ROOMS: RoomSpec[] = [...INPATIENT_ROOMS, ...ED_ROOMS];

/** Physical inpatient capacity. The user's census cap may be lower, never higher. */
export const INPATIENT_ROOM_COUNT = INPATIENT_ROOMS.length;

/**
 * Overflow beds (411, 412, …).
 *
 * A learner who admits several patients from the ED can fill Floor 4 and leave
 * no bed for the next morning's scheduled patient. Rather than refusing the
 * admission — or silently dropping tomorrow's patient — the hospital opens an
 * overflow bed, the way a real ward flexes when it is full. Bounded, so the
 * ward cannot grow without limit.
 */
export const FIRST_OVERFLOW_ROOM_NUMBER = INPATIENT_ROOM_COUNT + 401;
export const MAX_OVERFLOW_ROOMS = 6;

export function overflowRoomSpec(index: number): RoomSpec {
  return {
    unit: INPATIENT_UNIT,
    roomNumber: String(FIRST_OVERFLOW_ROOM_NUMBER + index),
    roomType: "INPATIENT",
  };
}

/** Ceiling on the ward once every overflow bed has been opened. */
export const MAX_INPATIENT_ROOM_COUNT = INPATIENT_ROOM_COUNT + MAX_OVERFLOW_ROOMS;

export const ROOM_TYPE_LABELS: Record<RoomSpec["roomType"], string> = {
  INPATIENT: "Inpatient",
  ED: "Emergency",
  TRAUMA: "Trauma bay",
  BOARDING: "Boarding",
  HALLWAY: "Hallway",
};
