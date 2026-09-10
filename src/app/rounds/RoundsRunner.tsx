"use client";

/**
 * Rounds: one patient at a time, bedside data then a single prompt.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/patient/Avatar";
import { PromptCard, type PromptView } from "@/components/patient/PromptCard";
import { resolvePatientVisual } from "@/lib/assets";

export interface RoundsStop {
  patientId: string;
  patientName: string;
  initials: string;
  roomNumber: string;
  age: string;
  diagnosis: string;
  hospitalDay: number;
  roundsCompleted: number;
  minimumRounds: number;
  vitals: { label: string; value: string }[];
  /** Overnight results worth looking at before answering (spec §23). */
  abnormalLabs: { label: string; value: string; flag: string }[];
  hasChart: boolean;
  prompt: PromptView | null;
}

export function RoundsRunner({
  stops: initialStops,
  audio,
}: {
  stops: RoundsStop[];
  audio: { rate: number; voiceUri: string | null };
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  // The queue is snapshotted on mount. Answering a prompt removes the patient
  // from the server-side "rounds due" list, and we do not want the list the
  // learner is walking through to shift underneath them.
  const [stops] = useState(initialStops);

  if (stops.length === 0) {
    return (
      <EmptyState
        title="Rounds complete"
        body="Every patient on your service has been seen today. New questions become available tomorrow."
      />
    );
  }

  const stop = stops[index];
  if (!stop) return null;

  const isLast = index >= stops.length - 1;

  const advance = () => {
    if (isLast) {
      router.push("/");
      router.refresh();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums text-ink-500">
          Patient {index + 1} of {stops.length}
        </span>
        <Badge tone="neutral">
          Round {stop.roundsCompleted + 1} of at least {stop.minimumRounds}
        </Badge>
      </div>

      <Card className="p-4">
        <div className="flex items-start gap-3">
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
              {stop.age ? (
                <span className="font-normal text-ink-500">, {stop.age}</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-sm text-ink-600">{stop.diagnosis}</p>
            <p className="mt-0.5 text-xs text-ink-400">Hospital day {stop.hospitalDay}</p>
          </div>
        </div>

        {stop.vitals.length > 0 ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-ink-100 pt-3 sm:grid-cols-3">
            {stop.vitals.map((v) => (
              <div key={v.label} className="text-sm">
                <dt className="text-xs text-ink-400">{v.label}</dt>
                <dd className="tabular-nums text-ink-800">{v.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {stop.abnormalLabs.length > 0 ? (
          <div className="mt-3 border-t border-ink-100 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Abnormal results
            </p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {stop.abnormalLabs.map((lab) => (
                <li key={lab.label} className="text-sm text-ink-800">
                  {lab.label}{" "}
                  <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                    {lab.value}
                  </span>{" "}
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {lab.flag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Rounds are increasingly a chart review rather than a standalone
            quiz (spec §23), so the chart is one tap away at every stop. */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
          <Link
            href={`/patients/${stop.patientId}?tab=results`}
            className="inline-flex h-9 items-center rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-700"
          >
            Review results
          </Link>
          {stop.hasChart ? (
            <Link
              href={`/patients/${stop.patientId}?tab=chart`}
              className="inline-flex h-9 items-center rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-700"
            >
              Assessment &amp; plan
            </Link>
          ) : null}
        </div>
      </Card>

      {stop.prompt ? (
        <PromptCard
          key={`${stop.patientId}:${stop.prompt.id}`}
          patientId={stop.patientId}
          prompt={stop.prompt}
          ttsRate={audio.rate}
          voiceUri={audio.voiceUri}
          onContinue={advance}
          continueLabel={isLast ? "Finish rounds" : "Next patient"}
        />
      ) : (
        <EmptyState
          title="No rounds question defined"
          body="This case has no rounds prompts. Add one to its case file to generate work here."
        />
      )}
    </div>
  );
}
