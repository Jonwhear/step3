/**
 * Date helpers.
 *
 * The app distinguishes two clocks (spec §59):
 *  - the *real study date* (ISO YYYY-MM-DD) drives pacing, spaced repetition
 *    and the Step 3 countdown;
 *  - the *narrative hospital day* is a per-patient counter and never touches
 *    these functions.
 *
 * All dates are handled as plain ISO strings in local time to avoid the
 * timezone drift that UTC parsing of "YYYY-MM-DD" introduces.
 */

export type IsoDate = string; // YYYY-MM-DD

export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const a = parseIsoDate(from).getTime();
  const b = parseIsoDate(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function isOnOrBefore(a: IsoDate, b: IsoDate): boolean {
  return a <= b;
}

export function isWithin(iso: IsoDate, start: IsoDate, end: IsoDate): boolean {
  return iso >= start && iso <= end;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** e.g. "Tuesday, September 8". */
export function formatLongDate(iso: IsoDate): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** e.g. "Tue, Sep 8" — the long date where there is no room for it. */
export function formatCompactDate(iso: IsoDate): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS[d.getDay()]?.slice(0, 3)}, ${MONTHS[d.getMonth()]?.slice(0, 3)} ${d.getDate()}`;
}

/** e.g. "Sep 8, 2026". */
export function formatShortDate(iso: IsoDate): string {
  const d = parseIsoDate(iso);
  return `${MONTHS[d.getMonth()]?.slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
