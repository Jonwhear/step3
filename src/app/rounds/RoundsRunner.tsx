"use client";

/**
 * Rounds: one patient at a time, bedside data then a single prompt.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { PromptCard, type PromptView } from "@/components/patient/PromptCard";

export interface RoundsStop {
  patientId: string;
  patientName: string;
  roomNumber: string;
  age: string;
  diagnosis: string;
  hospitalDay: number;
  roundsCompleted: number;
  minimumRounds: number;
  vitals: { label: string; value: string }[];
  prompt: PromptView | null;
}

export function RoundsRunner({
  stops: initialStops,
  audio,
}: {
  stops: RoundsStop[];
  audio: { rate: number; voiceUri: string | null; autoRead: boolean };
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
        <p className="text-xs uppercase tracking-[0.12em] text-ink-500">
          Room {stop.roomNumber}
        </p>
        <p className="mt-1 text-base font-semibold text-ink-900">
          {stop.patientName}
          {stop.age ? <span className="font-normal text-ink-500">, {stop.age}</span> : null}
        </p>
        <p className="mt-0.5 text-sm text-ink-600">{stop.diagnosis}</p>
        <p className="mt-0.5 text-xs text-ink-400">Hospital day {stop.hospitalDay}</p>

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
      </Card>

      {stop.prompt ? (
        <PromptCard
          key={`${stop.patientId}:${stop.prompt.id}`}
          patientId={stop.patientId}
          prompt={stop.prompt}
          autoRead={audio.autoRead}
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
