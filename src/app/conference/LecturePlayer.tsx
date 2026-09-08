"use client";

/**
 * Teaching Conference player.
 *
 * Audio-first: the script is read section by section, with the active section
 * highlighted. Completing it introduces the linked concepts, which is what
 * makes related cases score higher over the following days (spec §33).
 */

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  completeLectureAction,
  saveAudioPreferenceAction,
  startLectureAction,
} from "@/app/actions";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { Badge, Card } from "@/components/ui";

export interface LecturePlayerProps {
  lecture: {
    id: string;
    title: string;
    lectureTypeLabel: string;
    specialty: string;
    topic: string;
    summary: string;
    sections: string[];
    keyPoints: string[];
    estimatedMinutes: number;
    status: string;
    conceptCount: number;
  };
  audio: { rate: number; voiceUri: string | null; autoRead: boolean };
}

export function LecturePlayer({ lecture, audio }: LecturePlayerProps) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [pending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(lecture.status === "COMPLETED");

  // Mark as in-progress once, so the conference list reflects reality.
  useEffect(() => {
    if (lecture.status !== "NOT_STARTED") return;
    const formData = new FormData();
    formData.set("lectureId", lecture.id);
    void startLectureAction(formData);
  }, [lecture.id, lecture.status]);

  const complete = () => {
    const formData = new FormData();
    formData.set("lectureId", lecture.id);
    startTransition(async () => {
      await completeLectureAction(formData);
      setCompleted(true);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clinical-600">
              {lecture.lectureTypeLabel}
            </p>
            <h2 className="mt-1 text-base font-semibold text-ink-900">{lecture.title}</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              {lecture.specialty} · {lecture.topic} · about {lecture.estimatedMinutes} min
            </p>
          </div>
          {completed ? <Badge tone="good">Completed</Badge> : null}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">{lecture.summary}</p>
      </Card>

      <AudioPlayer
        label="Conference audio"
        sections={lecture.sections}
        initialRate={audio.rate}
        initialVoiceUri={audio.voiceUri}
        autoRead={audio.autoRead}
        onSectionChange={setActive}
        onFinished={() => setReachedEnd(true)}
        onPreferenceChange={(prefs) => void saveAudioPreferenceAction(prefs)}
      />

      <Card className="divide-y divide-ink-100">
        {lecture.sections.map((section, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            className={`tap block w-full px-4 py-3 text-left text-sm leading-relaxed ${
              index === active ? "bg-clinical-50 text-clinical-700" : "text-ink-700"
            }`}
          >
            <span className="mr-2 text-xs tabular-nums text-ink-400">{index + 1}</span>
            {section}
          </button>
        ))}
      </Card>

      <Card className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          Key points
        </p>
        <ul className="mt-2 space-y-1.5">
          {lecture.keyPoints.map((point) => (
            <li key={point} className="flex gap-2 text-sm leading-relaxed text-ink-800">
              <span aria-hidden="true" className="text-clinical-500">
                •
              </span>
              {point}
            </li>
          ))}
        </ul>
      </Card>

      {completed ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Conference completed. {lecture.conceptCount} concept
          {lecture.conceptCount === 1 ? " has" : "s have"} been marked as
          introduced, and related patients are more likely to appear on your
          service over the next several days.
        </p>
      ) : (
        <button
          type="button"
          onClick={complete}
          disabled={pending}
          className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending
            ? "Saving…"
            : reachedEnd
              ? "Mark conference complete"
              : "Mark conference complete"}
        </button>
      )}
    </div>
  );
}
