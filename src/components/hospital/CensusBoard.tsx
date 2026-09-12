/**
 * The service board (spec §28, §30, §33).
 *
 * One representation of the census, not two. This screen used to carry a list
 * of patients *and* a floor map underneath it, which meant reading the same
 * six patients twice and mentally joining them on room number. The bed is now
 * the card: it holds everything the list held — who is in it, what for, how
 * long, and what is owed today.
 *
 * Empty beds carry exactly one fact, that they are free, so they are drawn as
 * a compact row of numbers rather than full-height boxes of nothing.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar } from "@/components/patient/Avatar";
import { Badge, SectionHeading, type Tone } from "@/components/ui";
import { resolvePatientVisual } from "@/lib/assets";
import type { CensusBed } from "@/domain/rooms";
import type { PanelPatient } from "@/server/session";

/**
 * State worth a badge. `ON_SERVICE` is deliberately absent: a patient in a bed
 * is on service by definition, so saying so on every card is noise.
 */
const STATE_BADGE: Record<string, { label: string; tone: Tone }> = {
  PENDING_HANDOFF: { label: "New overnight", tone: "info" },
  PENDING_ADMISSION: { label: "Admission waiting", tone: "warn" },
  DISCHARGE_ELIGIBLE: { label: "Discharge ready", tone: "good" },
};

/** Colour marks clinical state, never decoration. */
function bedTint(patient: PanelPatient): string {
  if (patient.state === "DISCHARGE_ELIGIBLE") return "border-good-200 bg-good-50";
  if (patient.state === "PENDING_HANDOFF" || patient.state === "PENDING_ADMISSION") {
    return "border-clinical-200 bg-clinical-50";
  }
  return "border-ink-200 bg-surface";
}

export function BedCard({
  roomNumber,
  patient,
}: {
  roomNumber: string;
  patient: PanelPatient;
}) {
  const state = STATE_BADGE[patient.state];

  return (
    <Link
      href={`/patients/${patient.id}`}
      className={`tap flex h-full flex-col rounded-xl border p-3 transition-colors hover:border-clinical-200 ${bedTint(patient)}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tabular-nums text-ink-500">
          {roomNumber}
        </span>
        <span className="flex flex-wrap justify-end gap-1">
          {state ? <Badge tone={state.tone}>{state.label}</Badge> : null}
          {patient.roundsDueToday ? <Badge tone="warn">Rounds due</Badge> : null}
        </span>
      </div>

      <div className="mt-2 flex items-start gap-3">
        <Avatar
          visual={resolvePatientVisual({ patientName: patient.patientName })}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">
            {patient.patientName}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-ink-600">
            {patient.diagnosis ?? "Undifferentiated — admission workup pending"}
          </p>
        </div>
      </div>

      <p className="mt-auto pt-2 text-xs text-ink-400">
        {/* The round count is implied by the day: there is one round per day. */}
        Hospital day {patient.hospitalDay}
        {!state && !patient.roundsDueToday ? " · Seen today" : ""}
      </p>
    </Link>
  );
}

export function CensusBoard({
  beds,
  offFloor,
  unitLabel,
  action,
}: {
  beds: readonly CensusBed<PanelPatient>[];
  offFloor: readonly PanelPatient[];
  unitLabel: string;
  action?: ReactNode;
}) {
  const occupied = beds.filter((bed) => bed.patient !== null);
  const open = beds.filter((bed) => bed.patient === null);

  return (
    <div>
      <SectionHeading action={action}>
        {unitLabel} — {occupied.length} of {beds.length} bed
        {beds.length === 1 ? "" : "s"} filled
      </SectionHeading>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {occupied.map((bed) =>
          bed.patient ? (
            <li key={bed.roomId}>
              <BedCard roomNumber={bed.roomNumber} patient={bed.patient} />
            </li>
          ) : null,
        )}
      </ul>

      {open.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
            Open
          </span>
          {open.map((bed) => (
            <span
              key={bed.roomId}
              className="rounded-md border border-dashed border-ink-200 px-1.5 py-0.5 text-[11px] tabular-nums text-ink-400"
            >
              {bed.roomNumber}
            </span>
          ))}
        </div>
      ) : null}

      {offFloor.length > 0 ? (
        <div className="mt-4">
          <SectionHeading>Elsewhere in the hospital</SectionHeading>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {offFloor.map((patient) => (
              <li key={patient.id}>
                <BedCard roomNumber={patient.roomNumber} patient={patient} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
