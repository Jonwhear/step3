/**
 * Deterministic pool of fictional patient names and room numbers for synthetic
 * demo patients. Names are assigned by seeded index so the same profile on the
 * same date always produces the same roster.
 */

export const DEMO_PATIENT_NAMES: readonly string[] = [
  "Margaret Lewis",
  "Robert Hill",
  "Teresa Moore",
  "James Carter",
  "Linda Parker",
  "Michael Evans",
  "Sarah Reed",
  "Daniel Brooks",
  "Patricia Nguyen",
  "Anthony Rivera",
  "Emily Foster",
  "David Morgan",
  "Rachel Kim",
  "Samuel Wright",
  "Karen Bell",
  "Thomas Price",
  "Olivia Harris",
  "Joseph Clark",
  "Maria Lopez",
  "William Adams",
];

/** Room numbers are drawn deterministically from roughly 301-699. */
export const DEMO_ROOM_MIN = 301;
export const DEMO_ROOM_MAX = 699;
