"use client";

/**
 * Teaching Conference player.
 *
 * Section-driven (spec §17-18): the body is a list of headed sections, clicking
 * one jumps playback there, and the section being spoken is highlighted.
 * Nothing plays until the learner presses Play (spec §19).
 */

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  completeLectureAction,
  saveAudioPreferenceAction,
  startLectureAction,
} from "@/app/actions";
import { AudioTransport } from "@/components/audio/AudioTransport";
import { useSpeechPlayer } from "@/components/audio/useSpeechPlayer";
import { LectureBody } from "@/components/lecture/LectureBody";
import { Badge, Card } from "@/components/ui";

export interface LectureSectionProp {
  id: string;
  heading: string;
  displayLabel: string;
  body: string;
  speechText: string;
  mediaType: string | null;
  mediaAssetPath: string | null;
  caption: string | null;
  altText: string | null;
}

export interface LecturePlayerProps {
  lecture: {
    id: string;
    title: string;
    lectureTypeLabel: string;
    specialty: string;
    topic: string;
    summary: string;
    sections: LectureSectionProp[];
    keyPoints: string[];
    estimatedMinutes: number;
    status: string;
    conceptCount: number;
  };
  audio: { rate: number; voiceUri: string | null };
}

export function LecturePlayer({ lecture, audio }: LecturePlayerProps) {
  const router = useRouter();
  const [reachedEnd, setReachedEnd] = useState(false);
  const [pending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(lecture.status === "COMPLETED");

  const speechSections = useMemo(
    () => lecture.sections.map((s) => ({ label: s.displayLabel, text: s.speechText })),
    [lecture.sections],
  );

  const player = useSpeechPlayer(speechSections, {
    rate: audio.rate,
    voiceUri: audio.voiceUri,
    onFinished: () => setReachedEnd(true),
    debugLabel: `Conference — ${lecture.title}`,
  });

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

  const active = player.machine.index;

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

      <AudioTransport
        player={player}
        label="Conference audio"
        rate={audio.rate}
        voiceUri={audio.voiceUri}
        onPreferenceChange={(prefs) => void saveAudioPreferenceAction(prefs)}
      />

      {/*
        There is deliberately no contents list above these cards. A list of
        "Part 1 … Part 6" told the learner nothing about what each part
        contained, and duplicated navigation the sections themselves provide:
        tapping a section jumps playback straight to it.
      */}
      <div className="space-y-3">
        {lecture.sections.map((section, index) => {
          const isActive = index === active;
          const isPlaying = isActive && player.machine.state === "PLAYING";
          return (
          <Card
            key={section.id}
            className={`p-4 ${
              isActive ? "border-clinical-200 ring-1 ring-clinical-200" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => player.select(index)}
              aria-current={isActive ? "true" : undefined}
              className="tap flex w-full items-center gap-2 text-left"
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  isActive ? "text-clinical-600" : "text-ink-500"
                }`}
              >
                {section.displayLabel}
              </p>
              <span className="ml-auto shrink-0 text-[11px] uppercase tracking-wide text-clinical-600">
                {isPlaying ? "Playing" : isActive ? "Selected" : "Play from here"}
              </span>
            </button>
            <LectureBody body={section.body} className="mt-2" />
            {section.caption ? (
              <p className="mt-2 text-xs italic text-ink-500">{section.caption}</p>
            ) : null}
          </Card>
          );
        })}
      </div>

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
        <p className="rounded-lg border border-good-200 bg-good-50 p-3 text-sm text-good-700">
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
          {pending ? "Saving…" : "Mark conference complete"}
        </button>
      )}
      {reachedEnd && !completed ? (
        <p className="text-center text-xs text-ink-500">
          You have listened to every section.
        </p>
      ) : null}
    </div>
  );
}
