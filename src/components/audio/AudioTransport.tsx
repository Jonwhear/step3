"use client";

/**
 * Transport controls for a `useSpeechPlayer` instance.
 *
 * Purely presentational: it renders the machine's state and dispatches
 * commands. Every control is live from first paint, including before anything
 * has been played, which is the half of the V1 bug that was not autoplay.
 */

import { APP_CONFIG } from "@/config/app";
import type { SpeechPlayer } from "./useSpeechPlayer";

export function AudioTransport({
  player,
  label = "Audio",
  rate,
  voiceUri,
  onPreferenceChange,
  showSectionCount = true,
}: {
  player: SpeechPlayer;
  label?: string;
  rate: number;
  voiceUri: string | null;
  onPreferenceChange?: (prefs: { rate?: number; voiceUri?: string | null }) => void;
  showSectionCount?: boolean;
}) {
  const { machine, supported, voices } = player;
  const playing = machine.state === "PLAYING";
  const multiSection = machine.sectionCount > 1;

  if (!supported) {
    return (
      <div className="rounded-xl border border-warn-200 bg-warn-50 p-3 text-sm text-warn-700">
        This browser does not support speech synthesis, so audio playback is
        unavailable. All content remains readable on screen.
      </div>
    );
  }

  // Changing voice or speed mid-sentence has to re-speak: the utterance
  // already handed to the browser cannot be retuned in place.
  const reapply = () => {
    if (playing) player.restart();
  };

  return (
    <div className="rounded-xl border border-ink-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          {label}
        </span>
        <span className="flex items-center gap-2 text-xs tabular-nums text-ink-500">
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              machine.state === "PLAYING"
                ? "bg-emerald-500"
                : machine.state === "PAUSED"
                  ? "bg-amber-500"
                  : "bg-ink-300"
            }`}
          />
          {showSectionCount && multiSection
            ? `Section ${machine.index + 1} of ${machine.sectionCount}`
            : machine.state.charAt(0) + machine.state.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {multiSection ? (
          <button
            type="button"
            onClick={player.previous}
            disabled={machine.index === 0}
            aria-label="Previous section"
            className="h-11 min-w-11 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700 disabled:opacity-40"
          >
            ‹ Prev
          </button>
        ) : null}

        <button
          type="button"
          onClick={player.toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="h-11 flex-1 rounded-lg bg-clinical-600 px-4 text-sm font-semibold text-white"
        >
          {playing ? "Pause" : machine.state === "PAUSED" ? "Resume" : "Play"}
        </button>

        {multiSection ? (
          <button
            type="button"
            onClick={player.next}
            disabled={machine.index >= machine.sectionCount - 1}
            aria-label="Next section"
            className="h-11 min-w-11 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700 disabled:opacity-40"
          >
            Next ›
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={player.restart}
          className="h-10 rounded-lg border border-ink-200 px-3 text-sm text-ink-700"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={player.stop}
          disabled={machine.state === "STOPPED"}
          className="h-10 rounded-lg border border-ink-200 px-3 text-sm text-ink-700 disabled:opacity-40"
        >
          Stop
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-500">Speed</span>
          {APP_CONFIG.ttsRates.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onPreferenceChange?.({ rate: option });
                reapply();
              }}
              aria-pressed={rate === option}
              className={`h-9 rounded-md px-2 text-xs font-medium tabular-nums ${
                rate === option
                  ? "bg-clinical-600 text-white"
                  : "border border-ink-200 text-ink-600"
              }`}
            >
              {option.toFixed(1)}×
            </button>
          ))}
        </div>

        {voices.length > 0 ? (
          <label className="flex items-center gap-2 text-xs text-ink-500">
            Voice
            <select
              value={voiceUri ?? ""}
              onChange={(e) => {
                onPreferenceChange?.({ voiceUri: e.target.value || null });
                reapply();
              }}
              className="h-9 rounded-md border border-ink-200 bg-surface px-2 text-xs text-ink-700"
            >
              <option value="">Default</option>
              {voices.map((v) => (
                <option key={v.uri} value={v.uri}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}
