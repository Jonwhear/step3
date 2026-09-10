"use client";

/**
 * Renders one deterministic prompt and its graded feedback.
 *
 * Grading happens on the server (submitPromptAction). This component only
 * collects a response and displays what came back — it never decides anything.
 *
 * Audio is opt-in: the question is spoken when the learner presses Listen, and
 * never on mount (spec §19).
 */

import { useActionState, useEffect, useMemo, useState } from "react";
import { submitPromptAction, type PromptResultState } from "@/app/actions";
import { Card } from "@/components/ui";
import { useSpeechPlayer } from "@/components/audio/useSpeechPlayer";
import { renderTextForSpeech } from "@/lib/audio/speechText";

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
  ttsRate,
  voiceUri,
  onGraded,
  continueLabel = "Continue",
  onContinue,
}: {
  patientId: string;
  prompt: PromptView;
  ttsRate?: number;
  voiceUri?: string | null;
  onGraded?: (correct: boolean) => void;
  continueLabel?: string;
  onContinue?: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitPromptAction, initial);
  const [selected, setSelected] = useState("");
  const [freeText, setFreeText] = useState("");

  const graded = state.status === "graded";

  // Question first, then the explanation once it exists, so Listen reads the
  // whole exchange rather than only re-reading the stem.
  const sections = useMemo(() => {
    const list = [{ label: "Question", text: renderTextForSpeech(prompt.promptText) }];
    if (graded) {
      const spoken = [
        state.correct ? "Correct." : "Not quite.",
        !state.correct && state.correctLabel ? `The best answer is ${state.correctLabel}.` : "",
        state.feedback ?? "",
        state.whyCorrect ?? "",
      ]
        .filter(Boolean)
        .join(" ");
      if (spoken.trim()) list.push({ label: "Explanation", text: renderTextForSpeech(spoken) });
    }
    return list;
  }, [
    prompt.promptText,
    graded,
    state.correct,
    state.correctLabel,
    state.feedback,
    state.whyCorrect,
  ]);

  const player = useSpeechPlayer(sections, {
    rate: ttsRate ?? 1,
    voiceUri: voiceUri ?? null,
    debugLabel: "Prompt",
  });

  useEffect(() => {
    if (graded && state.correct !== undefined) onGraded?.(state.correct);
    // onGraded is a stable callback from the parent and is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graded, state.correct]);

  const response = prompt.allowsFreeText && freeText ? freeText : selected;
  const playing = player.machine.state === "PLAYING";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          Question
        </p>
        {player.supported ? (
          <button
            type="button"
            onClick={player.toggle}
            className="-mt-1 h-8 shrink-0 rounded-md border border-ink-200 px-2 text-xs font-medium text-ink-600"
          >
            {playing ? "Pause" : player.machine.state === "PAUSED" ? "Resume" : "Listen"}
          </button>
        ) : null}
      </div>
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
                  : "border-ink-200 bg-surface text-ink-800"
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
              className="h-12 w-full rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-900"
            />
          ) : null}

          {state.error ? <p className="text-sm text-bad-700">{state.error}</p> : null}

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
          <PromptExplanation state={state} />
          {state.masteryLabel ? (
            <p className="text-xs text-ink-400">{state.masteryLabel}</p>
          ) : null}

          {onContinue ? (
            <button
              type="button"
              onClick={() => {
                player.stop();
                onContinue();
              }}
              className="h-12 w-full rounded-lg bg-ink-900 text-sm font-semibold text-white dark:bg-ink-200 dark:text-ink-900"
            >
              {continueLabel}
            </button>
          ) : null}
        </div>
      )}
    </Card>
  );
}

/**
 * Layered feedback (spec §24). Every section below the verdict is optional and
 * simply absent when the case does not author it, so thin content still reads
 * cleanly rather than showing a page of empty headings.
 */
function PromptExplanation({ state }: { state: PromptResultState }) {
  const correct = Boolean(state.correct);
  return (
    <div
      className={`rounded-lg border p-3 ${
        correct
          ? "border-good-200 bg-good-50"
          : "border-warn-200 bg-warn-50"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          correct
            ? "text-good-700"
            : "text-warn-700"
        }`}
      >
        {correct ? "Correct." : "Not quite."}
      </p>

      {!correct && state.correctLabel ? (
        <p className="mt-2 text-sm text-ink-800">
          <span className="font-medium">Best answer:</span> {state.correctLabel}
        </p>
      ) : null}

      {state.feedback ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-800">{state.feedback}</p>
      ) : null}

      <ExplanationBlock title="Why" body={state.whyCorrect} />
      <ExplanationBlock title="What in the case points toward this" body={state.caseEvidence} />
      <ExplanationBlock
        title="Why the alternatives are less appropriate"
        body={state.whyOthersWrong}
      />
      <ExplanationBlock title="Key clinical point" body={state.detailedExplanation} />

      {state.sourceReferences?.length ? (
        <div className="mt-3 border-t border-ink-200/60 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            Source
          </p>
          <ul className="mt-1 space-y-0.5">
            {state.sourceReferences.map((ref) => (
              <li key={ref} className="text-xs text-ink-500">
                {ref}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ExplanationBlock({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        {title}
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink-800">{body}</p>
    </div>
  );
}
