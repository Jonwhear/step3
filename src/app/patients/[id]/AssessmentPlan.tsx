"use client";

/**
 * Problem-based Assessment & Plan (spec §20-21).
 *
 * The learner adds problems from the case's own list, then ticks plan items
 * under each. The result reads like a note, but every element came from
 * authored content, so grading stays deterministic and no free text is ever
 * interpreted.
 *
 * Grading happens on Sign, not on each tick, so the plan can be revised freely
 * while it is being built.
 */

import { useActionState, useTransition } from "react";
import {
  addProblemAction,
  removeProblemAction,
  signPlanAction,
  togglePlanSelectionAction,
  type PlanSignState,
} from "@/app/actions";
import { Badge, Card, SectionHeading } from "@/components/ui";

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
  options: PlanOptionProp[];
}

const initial: PlanSignState = { status: "idle" };

export function AssessmentPlan({
  patientId,
  problems,
  readOnly = false,
}: {
  patientId: string;
  problems: ProblemProp[];
  readOnly?: boolean;
}) {
  const [signState, signAction, signing] = useActionState(signPlanAction, initial);
  const [pending, startTransition] = useTransition();

  const added = problems.filter((p) => p.added);
  const available = problems.filter((p) => !p.added);

  if (problems.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-500">
          This case does not define a problem list yet. Add problems to its case
          file to build an assessment and plan here.
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
      {added.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-ink-600">
            No problems on the list yet. Add the problems you think this patient
            has, then build a plan under each one.
          </p>
        </Card>
      ) : null}

      {added.map((problem) => (
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
              {problem.isPrimary ? <Badge tone="info">Primary</Badge> : null}
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() =>
                    mutate(removeProblemAction, { patientId, problemId: problem.id })
                  }
                  className="text-xs text-ink-500 underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <ul className="divide-y divide-ink-100">
            {problem.options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={readOnly}
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
      ))}

      {!readOnly && available.length > 0 ? (
        <section>
          <SectionHeading>Add problem</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {available.map((problem) => (
              <button
                key={problem.id}
                type="button"
                onClick={() => mutate(addProblemAction, { patientId, problemId: problem.id })}
                className="tap flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-700"
              >
                <span aria-hidden="true" className="text-clinical-600">
                  +
                </span>
                {problem.label}
              </button>
            ))}
          </Card>
        </section>
      ) : null}

      {!readOnly && added.length > 0 ? (
        <form action={signAction}>
          <input type="hidden" name="patientId" value={patientId} />
          <button
            type="submit"
            disabled={signing}
            className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
          >
            {signing ? "Signing…" : "Sign note"}
          </button>
        </form>
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
