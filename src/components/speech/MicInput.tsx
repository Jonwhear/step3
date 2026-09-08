"use client";

/**
 * Optional voice input with an explicit confirmation step.
 *
 * The contract from spec §16 and §49: transcribe, normalise, match against the
 * controlled vocabulary, show the learner what was understood, and only score
 * after they confirm. An uncertain match is never guessed — it is shown as
 * unmatched and the learner falls back to buttons.
 *
 * If the browser has no speech recognition, this renders a note and the
 * surrounding UI continues to work with typing and buttons.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeechRecognition,
  type SpeechRecognitionLike,
} from "@/lib/speech/types";

export interface InterpretedItem {
  code: string;
  label: string;
}

export interface MicInputProps {
  /** Interprets a transcript deterministically on the server or client. */
  interpret: (transcript: string) => Promise<{
    matched: InterpretedItem[];
    unmatched: boolean;
  }>;
  /** Called only after the learner confirms the interpretation. */
  onConfirm: (items: InterpretedItem[], transcript: string) => void;
  placeholder?: string;
  helpText?: string;
}

type Phase = "idle" | "listening" | "interpreting" | "confirming";

export function MicInput({
  interpret,
  onConfirm,
  placeholder = "Or type what you would do…",
  helpText,
}: MicInputProps) {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [matched, setMatched] = useState<InterpretedItem[]>([]);
  const [unmatched, setUnmatched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
    return () => recognitionRef.current?.abort();
  }, []);

  const runInterpretation = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setPhase("interpreting");
      setTranscript(text);
      try {
        const result = await interpret(text);
        setMatched(result.matched);
        setUnmatched(result.unmatched);
        setPhase("confirming");
      } catch {
        setError("Could not interpret that. Please use the buttons below.");
        setPhase("idle");
      }
    },
    [interpret],
  );

  const startListening = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    setError(null);
    setTranscript("");
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const alternative = result[0];
        if (!alternative) continue;
        if (result.isFinal) finalText += alternative.transcript;
        else interim += alternative.transcript;
      }
      setTranscript(finalText || interim);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied. You can type instead."
          : "Speech recognition failed. You can type instead.",
      );
      setPhase("idle");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (finalText.trim()) {
        void runInterpretation(finalText);
      } else {
        setPhase("idle");
      }
    };

    recognitionRef.current = recognition;
    setPhase("listening");
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const reset = () => {
    setPhase("idle");
    setTranscript("");
    setTyped("");
    setMatched([]);
    setUnmatched(false);
  };

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      {helpText ? <p className="mb-2 text-xs text-ink-500">{helpText}</p> : null}

      {phase === "confirming" ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-500">I heard</p>
          <p className="mt-1 rounded-lg bg-ink-50 p-2 text-sm italic text-ink-700">
            &ldquo;{transcript}&rdquo;
          </p>

          {matched.length > 0 ? (
            <>
              <p className="mt-3 text-xs uppercase tracking-wide text-ink-500">
                Interpreted as
              </p>
              <ul className="mt-1 space-y-1">
                {matched.map((item) => (
                  <li
                    key={item.code}
                    className="flex items-center gap-2 text-sm text-ink-800"
                  >
                    <span aria-hidden="true" className="text-emerald-600">
                      ✓
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {unmatched ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
              Nothing in that phrase matched a known action. Nothing has been
              scored — please choose from the options instead.
            </p>
          ) : null}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onConfirm(matched, transcript);
                reset();
              }}
              disabled={matched.length === 0}
              className="h-11 flex-1 rounded-lg bg-clinical-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-11 rounded-lg border border-ink-200 px-4 text-sm font-medium text-ink-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {supported ? (
              <button
                type="button"
                onClick={phase === "listening" ? stopListening : startListening}
                aria-label={phase === "listening" ? "Stop listening" : "Start voice input"}
                className={`h-11 rounded-lg px-4 text-sm font-semibold ${
                  phase === "listening"
                    ? "bg-rose-600 text-white"
                    : "border border-ink-200 bg-white text-ink-700"
                }`}
              >
                {phase === "listening" ? "◼ Stop" : "🎙 Speak"}
              </button>
            ) : null}

            <form
              className="flex flex-1 items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void runInterpretation(typed);
              }}
            >
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={placeholder}
                className="h-11 flex-1 rounded-lg border border-ink-200 px-3 text-sm text-ink-900 placeholder:text-ink-400"
              />
              <button
                type="submit"
                disabled={!typed.trim() || phase === "interpreting"}
                className="h-11 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700 disabled:opacity-40"
              >
                Interpret
              </button>
            </form>
          </div>

          {phase === "listening" ? (
            <p className="text-sm text-ink-500">
              Listening… {transcript ? `“${transcript}”` : ""}
            </p>
          ) : null}
          {phase === "interpreting" ? (
            <p className="text-sm text-ink-500">Interpreting…</p>
          ) : null}
          {!supported ? (
            <p className="text-xs text-ink-400">
              Voice input is not available in this browser. Typing and the
              buttons below work exactly the same way.
            </p>
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
