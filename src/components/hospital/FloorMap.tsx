/**
 * Inpatient floor schematic (spec §28, §33).
 *
 * A glanceable 2D grid, deliberately not a game: room number, avatar, surname
 * and one status word. The learner should be able to read their whole census
 * in a second without parsing a list.
 */

import Link from "next/link";
import { Avatar } from "@/components/patient/Avatar";
import type { RoomView } from "@/domain/rooms";
import { resolvePatientVisual } from "@/lib/assets";

const STATUS_LABEL: Record<RoomView["status"], string> = {
  EMPTY: "Empty",
  OCCUPIED: "On service",
  DISCHARGE_PENDING: "Discharge ready",
  NEW_PATIENT: "New",
};

/** Restrained: colour marks clinical state, never decoration. */
const STATUS_CLASS: Record<RoomView["status"], string> = {
  EMPTY: "border-dashed border-ink-200 bg-surface-muted",
  OCCUPIED: "border-ink-200 bg-surface",
  DISCHARGE_PENDING: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30",
  NEW_PATIENT: "border-clinical-300 bg-clinical-50",
};

export function FloorMap({ rooms, unitLabel }: { rooms: RoomView[]; unitLabel: string }) {
  const occupied = rooms.filter((r) => r.patient).length;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          {unitLabel}
        </h2>
        <span className="text-xs tabular-nums text-ink-500">
          {occupied} of {rooms.length} beds
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {rooms.map((room) => (
          <li key={room.id}>
            {room.patient ? (
              <Link
                href={`/patients/${room.patient.id}`}
                className={`tap flex h-28 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center ${STATUS_CLASS[room.status]}`}
              >
                <span className="self-start text-[11px] font-semibold tabular-nums text-ink-500">
                  {room.roomNumber}
                </span>
                <Avatar
                  visual={resolvePatientVisual({
                    patientName: room.patient.name,
                    fallbackInitials: room.patient.initials,
                  })}
                  size="md"
                />
                <span className="w-full truncate text-xs font-medium text-ink-900">
                  {room.patient.surname}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wide ${
                    room.patient.roundsDue ? "text-clinical-600" : "text-ink-400"
                  }`}
                >
                  {room.patient.roundsDue ? "Rounds due" : STATUS_LABEL[room.status]}
                </span>
              </Link>
            ) : (
              <div
                className={`flex h-28 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center ${STATUS_CLASS[room.status]}`}
              >
                <span className="self-start text-[11px] font-semibold tabular-nums text-ink-400">
                  {room.roomNumber}
                </span>
                <span className="mt-auto mb-auto text-[10px] uppercase tracking-wide text-ink-300">
                  Empty
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
