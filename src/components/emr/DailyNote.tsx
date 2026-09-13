"use client";

/**
 * The progress note for the day (spec §20-21).
 *
 * The note is its own section of the chart, and signing it is the end of the
 * patient's day: there is no separate "done for today" to press afterwards,
 * because signing the note already says exactly that.
 *
 * A signed note stays readable — it is the day's record, not a receipt — and
 * stays correctable: the learner who signs, reads the feedback and wants to fix
 * something amends it rather than being locked out of their own note.
 *
 * Problems arrive with their diagnosis written — the admitting problem on day
 * one, and anything that emerges later on the day it emerges. The learner's
 * work is the management under each, which is the part worth practising. Every
 * element still comes from authored content, so grading stays deterministic and
 * no free text is ever interpreted.
 *
 * Grading happens on Sign, not on each tick, so the plan can be revised freely
 * while it is being built.
 */

import { useActionState, useState, useTransition } from "react";
import {
  addProblemAction,
  resolveProblemAction,
  signPlanAction,
  togglePlanSelectionAction,
  type PlanSignState,
} from "@/app/actions";
import { Badge, Card, Disclosure } from "@/components/ui";

export interface PlanOptionProp {
  id: string;
  label: string;
  selected: boolean;
}

export interface ProblemProp {
  id: string;
  label: string;
  assessmentText: string;
  isPrimary: boolean;
  added: boolean;
  addedOnDay: number | null;
  resolvedOnDay: number | null;
  options: PlanOptionProp[];
}

const initial: PlanSignState = { status: "idle" };

export function DailyNote({
  patientId,
  patientName,
  hospitalDay,
  problems,
  signedToday,
  readOnly = false,
}: {
  patientId: string;
  patientName: string;
  hospitalDay: number;
  problems: ProblemProp[];
  signedToday: boolean;
  readOnly?: boolean;
}) {
  const [signState, signAction, signing] = useActionState(signPlanAction, initial);
  const [pending, startTransition] = useTransition();
  // Whether the note was already signed when the learner arrived. Taken once:
  // signing flips the live prop, and swapping the view at that moment would
  // hide the feedback they just asked for.
  const [signedOnArrival] = useState(signedToday);
  const [amending, setAmending] = useState(false);

  const active = problems.filter((p) => p.added);
  const available = problems.filter((p) => !p.added && p.resolvedOnDay === null);

  // Signed at any point — on arrival, or a moment ago in this session.
  const signed = signedOnArrival || signState.status === "signed";
  // A signed note is read-only until the learner asks to amend it.
  const locked = readOnly || (signedOnArrival && !amending);

  if (problems.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-500">
          This case does not define a problem list, so there is no note to write.
        </p>
      </Card>
    );
  }

  const mutate = (action: (fd: FormData) => Promise<void>, fields: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    startTransition(async () => {
      await action(formData);
    });
  };

  return (
    <div className={`space-y-4 ${pending ? "opacity-70" : ""}`}>
      {signed ? (
        <Card className="border-good-200 bg-good-50 p-3">
          <p className="text-sm font-medium text-good-700">
            {amending
              ? `Amending the signed note for hospital day ${hospitalDay}.`
              : `This note has been signed for hospital day ${hospitalDay}.`}
          </p>
        </Card>
      ) : null}

      {active.map((problem) => {
        const isNew = problem.addedOnDay === hospitalDay && hospitalDay > 1;
        const chosen = problem.options.some((o) => o.selected);

        return (
          <Card key={problem.id} className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-ink-200 bg-surface-muted px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">
                  <span aria-hidden="true" className="mr-1 text-ink-400">
                    #
                  </span>
                  {problem.label}
                </p>
                {problem.assessmentText ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
                    {problem.assessmentText}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isNew ? <Badge tone="warn">New today</Badge> : null}
                {problem.isPrimary ? <Badge tone="info">Primary</Badge> : null}
                {!locked ? (
                  <button
                    type="button"
                    onClick={() =>
                      mutate(resolveProblemAction, { patientId, problemId: problem.id })
                    }
                    className="text-xs text-ink-500 underline"
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
            </div>

            {isNew && !chosen ? (
              <p className="border-b border-ink-100 bg-warn-50 px-4 py-2 text-xs text-warn-700">
                New problem this admission. Choose its management.
              </p>
            ) : null}

            <ul className="divide-y divide-ink-100">
              {problem.options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      mutate(togglePlanSelectionAction, {
                        patientId,
                        problemId: problem.id,
                        optionId: option.id,
                      })
                    }
                    aria-pressed={option.selected}
                    className="tap flex w-full items-center gap-3 px-4 py-2.5 text-left disabled:opacity-70"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] ${
                        option.selected
                          ? "border-clinical-500 bg-clinical-500 text-white"
                          : "border-ink-300"
                      }`}
                    >
                      {option.selected ? "✓" : ""}
                    </span>
                    <span
                      className={`text-sm ${
                        option.selected ? "font-medium text-ink-900" : "text-ink-700"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {!locked && available.length > 0 ? (
        <Disclosure summary={`Add another problem (${available.length})`}>
          <ul className="divide-y divide-ink-100">
            {available.map((problem) => (
              <li key={problem.id}>
                <button
                  type="button"
                  onClick={() => mutate(addProblemAction, { patientId, problemId: problem.id })}
                  className="tap flex w-full items-center gap-2 py-2.5 text-left text-sm text-ink-700"
                >
                  <span aria-hidden="true" className="text-clinical-600">
                    +
                  </span>
                  {problem.label}
                </button>
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      {active.length > 0 && !readOnly ? (
        locked ? (
          // The work for this section is done, and the control says so rather
          // than disappearing — a section with no button reads as unfinished.
          <div>
            <button
              type="button"
              disabled
              className="h-12 w-full cursor-default rounded-lg border border-ink-200 bg-surface-muted text-sm font-semibold text-ink-500"
            >
              ✓ Note signed
            </button>
            <p className="mt-1.5 text-center text-xs text-ink-400">
              Need to change something?{" "}
              <button
                type="button"
                onClick={() => setAmending(true)}
                className="font-medium text-clinical-600 underline"
              >
                Amend note
              </button>
            </p>
          </div>
        ) : (
          <form action={signAction}>
            <input type="hidden" name="patientId" value={patientId} />
            <button
              type="submit"
              disabled={signing}
              className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
            >
              {signing
                ? "Signing…"
                : signed
                  ? "Amend note"
                  : `Sign note and finish with ${patientName}`}
            </button>
            <p className="mt-1.5 text-center text-xs text-ink-400">
              {signed
                ? "Re-signing replaces the note on file for today."
                : `Signing the note ends this patient's hospital day ${hospitalDay}.`}
            </p>
          </form>
        )
      ) : null}

      {signState.status === "signed" ? <PlanFeedback state={signState} /> : null}
    </div>
  );
}

function PlanFeedback({ state }: { state: PlanSignState }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        Note signed
      </p>
      <p className="mt-1 text-sm text-ink-800">
        {state.requiredSelected} of {state.requiredTotal} required items included.
      </p>

      {state.missedProblems?.length ? (
        <FeedbackGroup
          title="Problems not on your list"
          tone="warn"
          items={state.missedProblems.map((label) => ({ head: label, body: "" }))}
        />
      ) : null}

      {state.missedRequired?.length ? (
        <FeedbackGroup
          title="Required items you did not include"
          tone="warn"
          items={state.missedRequired.map((l) => ({
            head: `${l.problemLabel} — ${l.optionLabel}`,
            body: l.feedbackText,
          }))}
        />
      ) : null}

      {state.harmful?.length ? (
        <FeedbackGroup
          title="Items that were unnecessary or harmful"
          tone="bad"
          items={state.harmful.map((l) => ({
            head: `${l.problemLabel} — ${l.optionLabel}`,
            body: l.feedbackText,
          }))}
        />
      ) : null}

      {state.note ? (
        <div className="mt-4 border-t border-ink-100 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            Your note
          </p>
          <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-800">
            {state.note}
          </pre>
        </div>
      ) : null}
    </Card>
  );
}

function FeedbackGroup({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "warn" | "bad";
  items: { head: string; body: string }[];
}) {
  const border =
    tone === "bad"
      ? "border-bad-200"
      : "border-warn-200";
  return (
    <div className={`mt-3 rounded-lg border ${border} p-3`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-600">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item) => (
          <li key={item.head} className="text-sm text-ink-800">
            <span className="font-medium">{item.head}</span>
            {item.body ? (
              <span className="mt-0.5 block text-xs text-ink-600">{item.body}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
