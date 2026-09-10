"use client";

/**
 * Morning handoff.
 *
 * Two categories (spec §13): concise re-sign-out for patients already on the
 * service, then new patients whose full teaching sign-out is read and who the
 * learner explicitly accepts onto the panel.
 *
 * Designed so the whole thing works without reading the screen: the audio
 * player carries every section in order.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { acceptPatientAction, saveAudioPreferenceAction } from "@/app/actions";
import { AudioTransport } from "@/components/audio/AudioTransport";
import { useSpeechPlayer } from "@/components/audio/useSpeechPlayer";
import { renderTextForSpeech } from "@/lib/audio/speechText";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui";

export interface HandoffItem {
  patientId: string;
  patientName: string;
  roomNumber: string;
  caseTitle: string;
  diagnosis: string;
  script: string;
  teachingPoint: string;
  isNew: boolean;
  hospitalDay: number;
}

export function HandoffRunner({
  items,
  audio,
}: {
  items: HandoffItem[];
  audio: { rate: number; voiceUri: string | null };
}) {
  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  // One audio section per patient, so pressing Play walks the whole sign-out
  // list without the learner touching the screen.
  const sections = useMemo(
    () =>
      items.map((item) => ({
        label: `${item.roomNumber} — ${item.patientName}`,
        text: renderTextForSpeech(
          item.isNew && item.teachingPoint
            ? `${item.script} ${item.teachingPoint}`
            : item.script,
        ),
      })),
    [items],
  );

  const player = useSpeechPlayer(sections, {
    rate: audio.rate,
    voiceUri: audio.voiceUri,
    debugLabel: "Sign-out",
  });

  // Audio drives the visible patient; the list and the voice never disagree.
  const playerIndex = player.machine.index;
  useEffect(() => {
    setIndex(playerIndex);
  }, [playerIndex]);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to sign out"
        body="There are no patients on your service and none waiting from the overnight team."
      />
    );
  }

  const current = items[index];
  if (!current) return null;

  const isAccepted = accepted.has(current.patientId);

  const accept = () => {
    const formData = new FormData();
    formData.set("patientId", current.patientId);
    startTransition(async () => {
      await acceptPatientAction(formData);
      setAccepted((prev) => new Set(prev).add(current.patientId));
    });
  };

  return (
    <div className="space-y-4">
      <AudioTransport
        player={player}
        label="Sign-out"
        rate={audio.rate}
        voiceUri={audio.voiceUri}
        onPreferenceChange={(prefs) => void saveAudioPreferenceAction(prefs)}
      />

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">
              <span className="tabular-nums text-ink-500">{current.roomNumber}</span>
              <span className="mx-1.5 text-ink-300">—</span>
              {current.patientName}
            </p>
            <p className="mt-0.5 text-sm text-ink-600">{current.diagnosis}</p>
          </div>
          <Badge tone={current.isNew ? "info" : "neutral"}>
            {current.isNew ? "New overnight" : `Hospital day ${current.hospitalDay}`}
          </Badge>
        </div>

        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-800">
          {current.script}
        </p>

        {current.isNew && current.teachingPoint ? (
          <div className="mt-3 rounded-lg border border-clinical-200 bg-clinical-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-clinical-700">
              Teaching point
            </p>
            <p className="mt-1 text-sm leading-relaxed text-clinical-700">
              {current.teachingPoint}
            </p>
          </div>
        ) : null}

        {/* The server re-renders after acceptance, so the confirmation is driven
            by the local set rather than by the (now stale) isNew flag. */}
        {isAccepted ? (
          <p className="mt-4 rounded-lg border border-good-200 bg-good-50 p-3 text-sm text-good-700">
            Accepted. {current.patientName} is on your service and will appear
            on rounds.
          </p>
        ) : current.isNew ? (
          <button
            type="button"
            onClick={accept}
            disabled={pending}
            className="mt-4 h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Accepting…" : "Accept patient"}
          </button>
        ) : null}
      </Card>

      <nav className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => player.select(index - 1)}
          disabled={index === 0}
          className="h-11 rounded-lg border border-ink-200 px-4 text-sm font-medium text-ink-700 disabled:opacity-40"
        >
          ‹ Previous
        </button>
        <span className="text-xs tabular-nums text-ink-500">
          {index + 1} of {items.length}
        </span>
        <button
          type="button"
          onClick={() => player.select(index + 1)}
          disabled={index >= items.length - 1}
          className="h-11 rounded-lg border border-ink-200 px-4 text-sm font-medium text-ink-700 disabled:opacity-40"
        >
          Next ›
        </button>
      </nav>

      <SectionHeading>Sign-out list</SectionHeading>
      <ol className="space-y-1">
        {items.map((item, i) => (
          <li key={item.patientId}>
            <button
              type="button"
              onClick={() => player.select(i)}
              className={`tap flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm ${
                i === index
                  ? "border-clinical-200 bg-clinical-50 text-clinical-700"
                  : "border-ink-200 bg-surface text-ink-700"
              }`}
            >
              <span className="truncate">
                <span className="tabular-nums text-ink-400">{item.roomNumber}</span>{" "}
                {item.patientName}
              </span>
              {accepted.has(item.patientId) ? (
                <Badge tone="good">Accepted</Badge>
              ) : item.isNew ? (
                <Badge tone="info">New</Badge>
              ) : null}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
