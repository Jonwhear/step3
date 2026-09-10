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

export const ROOM_TYPE_LABELS: Record<RoomSpec["roomType"], string> = {
  INPATIENT: "Inpatient",
  ED: "Emergency",
  TRAUMA: "Trauma bay",
  BOARDING: "Boarding",
  HALLWAY: "Hallway",
};
