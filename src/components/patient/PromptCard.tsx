"use client";

/**
 * Renders one deterministic prompt and its graded feedback.
 *
 * Grading happens on the server (submitPromptAction). This component only
 * collects a response and displays what came back.
 */

import { useActionState, useEffect, useState } from "react";
import { submitPromptAction, type PromptResultState } from "@/app/actions";
import { Card } from "@/components/ui";
import { speak, stop as stopSpeech } from "@/lib/audio/speech";

export interface PromptView {
  id: string;
  promptText: string;
  responseType: string;
  choices: { key: string; text: string }[];
  /** Present for SHORT_TEXT prompts so free typing is allowed. */
  allowsFreeText: boolean;
}

const initial: PromptResultState = { status: "idle" };

export function PromptCard({
  patientId,
  prompt,
  autoRead,
  ttsRate,
  voiceUri,
  onGraded,
  continueLabel = "Continue",
  onContinue,
}: {
  patientId: string;
  prompt: PromptView;
  autoRead?: boolean;
  ttsRate?: number;
  voiceUri?: string | null;
  onGraded?: (correct: boolean) => void;
  continueLabel?: string;
  onContinue?: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitPromptAction, initial);
  const [selected, setSelected] = useState("");
  const [freeText, setFreeText] = useState("");

  // Reading the question aloud is what makes rounds usable hands-free.
  useEffect(() => {
    if (!autoRead) return;
    speak(prompt.promptText, { rate: ttsRate ?? 1, voiceUri: voiceUri ?? null });
    return stopSpeech;
  }, [autoRead, prompt.promptText, prompt.id, ttsRate, voiceUri]);

  const graded = state.status === "graded";

  useEffect(() => {
    if (graded && state.correct !== undefined) onGraded?.(state.correct);
    // Read the feedback aloud too, so the whole loop works by ear.
    if (graded && autoRead && state.feedback) {
      speak(state.feedback, { rate: ttsRate ?? 1, voiceUri: voiceUri ?? null });
    }
    // onGraded is intentionally excluded: it is a stable callback from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graded, state.correct, state.feedback]);

  const response = prompt.allowsFreeText && freeText ? freeText : selected;

  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        Question
      </p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-ink-900">
        {prompt.promptText}
      </p>

      {!graded ? (
        <form action={formAction} className="mt-4 space-y-2">
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="promptId" value={prompt.id} />
          <input type="hidden" name="response" value={response} />

          {prompt.choices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              onClick={() => {
                setSelected(choice.key);
                setFreeText("");
              }}
              aria-pressed={selected === choice.key}
              className={`tap block w-full rounded-lg border px-3 py-3 text-left text-sm leading-snug ${
                selected === choice.key
                  ? "border-clinical-500 bg-clinical-50 text-clinical-700"
                  : "border-ink-200 bg-white text-ink-800"
              }`}
            >
              {choice.text}
            </button>
          ))}

          {prompt.allowsFreeText ? (
            <input
              type="text"
              value={freeText}
              onChange={(e) => {
                setFreeText(e.target.value);
                setSelected("");
              }}
              placeholder="Or type your answer…"
              className="h-12 w-full rounded-lg border border-ink-200 px-3 text-sm"
            />
          ) : null}

          {state.error ? (
            <p className="text-sm text-rose-700">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !response}
            className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-40"
          >
            {pending ? "Submitting…" : "Submit"}
          </button>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          <div
            className={`rounded-lg border p-3 ${
              state.correct
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                state.correct ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              {state.correct ? "Correct" : "Not quite"}
            </p>
            <p
              className={`mt-1 text-sm leading-relaxed ${
                state.correct ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              {state.feedback}
            </p>
            {!state.correct && state.correctLabel ? (
              <p className="mt-2 text-sm text-amber-900">
                <span className="font-medium">Answer:</span> {state.correctLabel}
              </p>
            ) : null}
          </div>

          {state.masteryLabel ? (
            <p className="text-xs text-ink-400">{state.masteryLabel}</p>
          ) : null}

          {onContinue ? (
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                onContinue();
              }}
              className="h-12 w-full rounded-lg bg-ink-900 text-sm font-semibold text-white"
            >
              {continueLabel}
            </button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
