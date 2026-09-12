"use client";

/**
 * The service walker: the same encounter as the patient chart, once per
 * patient, in room order.
 *
 * The only thing this adds to `RoundsEncounter` is the walk — where you are in
 * the list, and moving to the next room when a patient is signed off. Keeping
 * the encounter itself in one component is what stops the chart and the walker
 * from becoming two subtly different ways to round.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/patient/Avatar";
import { RoundsEncounter } from "@/components/emr/RoundsEncounter";
import type { RoundsEncounterProps } from "@/components/emr/RoundsEncounter";
import { resolvePatientVisual } from "@/lib/assets";

export interface RoundsStop extends Omit<RoundsEncounterProps, "audio" | "showReferenceRanges"> {
  initials: string;
  roomNumber: string;
  age: string;
  diagnosis: string;
  roundsCompleted: number;
  minimumRounds: number;
}

export function RoundsRunner({
  stops,
  audio,
  showReferenceRanges,
}: {
  stops: RoundsStop[];
  audio: { rate: number; voiceUri: string | null };
  showReferenceRanges: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  // The walking order is fixed on mount, but each stop is read from live props:
  // ticking a plan item revalidates the page, and the learner must see their
  // own tick. Signing off removes the patient from props, which is why the
  // order is remembered separately.
  const [order] = useState(() => stops.map((stop) => stop.patientId));
  const byId = new Map(stops.map((stop) => [stop.patientId, stop]));

  if (stops.length === 0) {
    return (
      <EmptyState
        title="Rounds complete"
        body="Every patient on your service has been seen today. New questions become available tomorrow."
      />
    );
  }

  // Skip past anyone signed off elsewhere — a second tab, a refresh mid-save.
  const cursor = order.findIndex((id, i) => i >= index && byId.has(id));
  const stop = cursor === -1 ? undefined : byId.get(order[cursor] as string);
  if (!stop) return null;

  const isLast = !order.slice(cursor + 1).some((id) => byId.has(id));

  const advance = () => {
    if (isLast) {
      router.push("/");
      router.refresh();
    } else {
      setIndex(cursor + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums text-ink-500">
          Patient {cursor + 1} of {order.length}
        </span>
        <Badge tone="neutral">
          Round {stop.roundsCompleted + 1} of at least {stop.minimumRounds}
        </Badge>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-ink-200 bg-surface p-4">
        <Avatar
          visual={resolvePatientVisual({
            patientName: stop.patientName,
            fallbackInitials: stop.initials,
          })}
          size="md"
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.12em] text-ink-500">
            Room {stop.roomNumber}
          </p>
          <p className="mt-0.5 text-base font-semibold text-ink-900">
            {stop.patientName}
            {stop.age ? <span className="font-normal text-ink-500">, {stop.age}</span> : null}
          </p>
          <p className="mt-0.5 text-sm text-ink-600">{stop.diagnosis}</p>
          <p className="mt-0.5 text-xs text-ink-400">Hospital day {stop.hospitalDay}</p>
        </div>
        <Link
          href={`/patients/${stop.patientId}`}
          className="tap ml-auto shrink-0 self-center text-xs font-medium text-clinical-600"
        >
          Chart ›
        </Link>
      </div>

      <RoundsEncounter
        key={stop.patientId}
        {...stop}
        audio={audio}
        showReferenceRanges={showReferenceRanges}
        onSignedOff={advance}
        signOffLabel={
          isLast
            ? `Sign off ${stop.patientName} and end rounds`
            : `Sign off ${stop.patientName} ›`
        }
      />
    </div>
  );
}
