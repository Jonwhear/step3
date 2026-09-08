"use client";

/**
 * Section-by-section audio player built on window.speechSynthesis.
 *
 * Handles play / pause / resume / restart / previous / next, playback speed and
 * voice selection (spec §14). Preferences persist through a server action so
 * they survive a restart. Speech is stopped on unmount so navigating away can
 * never leave two voices talking (spec §46).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { APP_CONFIG } from "@/config/app";
import {
  isPaused,
  listVoices,
  onVoicesReady,
  pause as pauseSpeech,
  resume as resumeSpeech,
  speak,
  speechSupported,
  stop as stopSpeech,
  type VoiceOption,
} from "@/lib/audio/speech";

export interface AudioPlayerProps {
  /** Sections read one at a time. */
  sections: string[];
  initialRate?: number;
  initialVoiceUri?: string | null;
  autoRead?: boolean;
  /** Persists preference changes; optional so the player works standalone. */
  onPreferenceChange?: (prefs: { rate?: number; voiceUri?: string | null }) => void;
  /** Called when the final section finishes. */
  onFinished?: () => void;
  /** Called whenever the active section changes, so the page can highlight it. */
  onSectionChange?: (index: number) => void;
  label?: string;
}

export function AudioPlayer({
  sections,
  initialRate = APP_CONFIG.defaults.ttsRate,
  initialVoiceUri = null,
  autoRead = false,
  onPreferenceChange,
  onFinished,
  onSectionChange,
  label = "Audio",
}: AudioPlayerProps) {
  const [supported, setSupported] = useState(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(initialRate);
  const [voiceUri, setVoiceUri] = useState<string | null>(initialVoiceUri);
  const [voices, setVoices] = useState<VoiceOption[]>([]);

  // Latest values for callbacks that outlive a render.
  const indexRef = useRef(index);
  indexRef.current = index;
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const voiceRef = useRef(voiceUri);
  voiceRef.current = voiceUri;
  const autoStarted = useRef(false);

  useEffect(() => {
    setSupported(speechSupported());
    return onVoicesReady(() => setVoices(listVoices()));
  }, []);

  // Always stop speaking when this component goes away.
  useEffect(() => stopSpeech, []);

  const playSection = useCallback(
    (target: number, continueAfter: boolean) => {
      const text = sections[target];
      if (text === undefined) {
        setPlaying(false);
        onFinished?.();
        return;
      }
      setIndex(target);
      onSectionChange?.(target);
      setPlaying(true);
      setPaused(false);
      speak(text, {
        rate: rateRef.current,
        voiceUri: voiceRef.current,
        onEnd: () => {
          if (!continueAfter) {
            setPlaying(false);
            return;
          }
          const next = target + 1;
          if (next < sections.length) {
            playSection(next, true);
          } else {
            setPlaying(false);
            onFinished?.();
          }
        },
        onError: () => setPlaying(false),
      });
    },
    [sections, onFinished, onSectionChange],
  );

  // Auto-read starts once, only when the preference is on.
  useEffect(() => {
    if (!autoRead || autoStarted.current || !speechSupported() || sections.length === 0) return;
    autoStarted.current = true;
    playSection(0, true);
  }, [autoRead, playSection, sections.length]);

  const handlePlayPause = () => {
    if (!playing) {
      playSection(indexRef.current, true);
      return;
    }
    if (isPaused() || paused) {
      resumeSpeech();
      setPaused(false);
    } else {
      pauseSpeech();
      setPaused(true);
    }
  };

  const handleStop = () => {
    stopSpeech();
    setPlaying(false);
    setPaused(false);
  };

  const goTo = (target: number) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, target));
    stopSpeech();
    if (playing) {
      playSection(clamped, true);
    } else {
      setIndex(clamped);
      onSectionChange?.(clamped);
    }
  };

  const changeRate = (next: number) => {
    setRate(next);
    rateRef.current = next;
    onPreferenceChange?.({ rate: next });
    if (playing) playSection(indexRef.current, true);
  };

  const changeVoice = (next: string) => {
    const value = next || null;
    setVoiceUri(value);
    voiceRef.current = value;
    onPreferenceChange?.({ voiceUri: value });
    if (playing) playSection(indexRef.current, true);
  };

  if (!supported) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        This browser does not support speech synthesis, so audio playback is
        unavailable. All content remains readable on screen.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          {label}
        </span>
        <span className="text-xs tabular-nums text-ink-500">
          Section {index + 1} of {sections.length}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous section"
          className="h-11 min-w-11 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700 disabled:opacity-40"
        >
          ‹ Prev
        </button>

        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={playing && !paused ? "Pause" : "Play"}
          className="h-11 flex-1 rounded-lg bg-clinical-600 px-4 text-sm font-semibold text-white"
        >
          {playing ? (paused ? "Resume" : "Pause") : "Play"}
        </button>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= sections.length - 1}
          aria-label="Next section"
          className="h-11 min-w-11 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700 disabled:opacity-40"
        >
          Next ›
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            handleStop();
            goTo(0);
          }}
          className="h-10 rounded-lg border border-ink-200 px-3 text-sm text-ink-700"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={handleStop}
          className="h-10 rounded-lg border border-ink-200 px-3 text-sm text-ink-700"
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
              onClick={() => changeRate(option)}
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
              onChange={(e) => changeVoice(e.target.value)}
              className="h-9 rounded-md border border-ink-200 bg-white px-2 text-xs text-ink-700"
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
