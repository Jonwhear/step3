"use client";

/**
 * The service walker: today's list, one patient at a time, in room order.
 *
 * The list holds everyone on service today — those still owed work and those
 * already finished — so a patient does not vanish out from under the learner
 * the moment they sign the note, and the grading they just asked for stays on
 * screen until they choose to move on.
 *
 * The encounter itself is the same component the chart uses. All this adds is
 * the walk.
 */

import Link from "next/link";
import { useState } from "react";
import { Badge, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/patient/Avatar";
import { DailyNote, type ProblemProp } from "@/components/emr/DailyNote";
import { RoundsEncounter } from "@/components/emr/RoundsEncounter";
import type { RoundsEncounterProps } from "@/components/emr/RoundsEncounter";
import { resolvePatientVisual } from "@/lib/assets";

export interface RoundsStop
  extends Omit<RoundsEncounterProps, "audio" | "showReferenceRanges" | "note"> {
  initials: string;
  roomNumber: string;
  age: string;
  diagnosis: string;
  roundsCompleted: number;
  minimumRounds: number;
  problems: ProblemProp[];
  noteSignedToday: boolean;
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
  // Start on the first patient who is actually owed work, so re-entering the
  // screen later in the day does not walk back through finished patients.
  const [index, setIndex] = useState(() => {
    const firstDue = stops.findIndex((stop) => stop.status === "DUE");
    return firstDue === -1 ? 0 : firstDue;
  });

  if (stops.length === 0) {
    return (
      <EmptyState
        title="Nothing to round on"
        body="No patient on your service has work outstanding today."
      />
    );
  }

  const stop = stops[Math.min(index, stops.length - 1)];
  if (!stop) return null;

  const isLast = index >= stops.length - 1;
  const done = stop.status === "COMPLETED_TODAY";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums text-ink-500">
          Patient {index + 1} of {stops.length}
        </span>
        <Badge tone={done ? "good" : "neutral"}>
          {done
            ? "Finished today"
            : `Round ${stop.roundsCompleted + 1} of at least ${stop.minimumRounds}`}
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
        note={
          stop.problems.length > 0 ? (
            <DailyNote
              patientId={stop.patientId}
              patientName={stop.patientName}
              hospitalDay={stop.hospitalDay}
              problems={stop.problems}
              signedToday={stop.noteSignedToday}
            />
          ) : null
        }
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="tap h-11 flex-1 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 disabled:opacity-40"
        >
          ‹ Previous patient
        </button>
        <Link
          href={isLast ? "/" : "#"}
          onClick={(event) => {
            if (isLast) return;
            event.preventDefault();
            setIndex((i) => Math.min(stops.length - 1, i + 1));
          }}
          className="tap flex h-11 flex-1 items-center justify-center rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
        >
          {isLast ? "Back to service" : "Next patient ›"}
        </Link>
      </div>
    </div>
  );
}
