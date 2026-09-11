"use client";

/**
 * Segmented preference pickers.
 *
 * Each option is a form submit rather than a controlled input, so a preference
 * is saved the moment it is chosen and there is no "unsaved changes" state to
 * get wrong. The page re-renders from the database afterwards, which is also
 * what re-stamps the theme attributes on <html>.
 */

import { useActionState, useTransition } from "react";
import {
  savePreferenceAction,
  saveReviewIntervalsAction,
  type ActionState,
} from "@/app/actions";

export function SegmentedPreference({
  label,
  hint,
  settingKey,
  value,
  options,
}: {
  label: string;
  hint?: string;
  settingKey: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();

  const choose = (next: string) => {
    if (next === value) return;
    const formData = new FormData();
    formData.set("key", settingKey);
    formData.set("value", next);
    startTransition(async () => {
      await savePreferenceAction(formData);
    });
  };

  return (
    <div className={pending ? "opacity-60" : undefined}>
      <p className="text-sm font-medium text-ink-800">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-500">{hint}</p> : null}
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-2 flex flex-wrap gap-1.5"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => choose(option.value)}
            className={`h-10 rounded-lg border px-3 text-sm font-medium ${
              option.value === value
                ? "border-clinical-500 bg-clinical-50 text-clinical-700"
                : "border-ink-200 bg-surface text-ink-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TogglePreference({
  label,
  hint,
  settingKey,
  enabled,
}: {
  label: string;
  hint?: string;
  settingKey: string;
  enabled: boolean;
}) {
  return (
    <SegmentedPreference
      label={label}
      hint={hint}
      settingKey={settingKey}
      value={String(enabled)}
      options={[
        { value: "true", label: "On" },
        { value: "false", label: "Off" },
      ]}
    />
  );
}

/**
 * Spaced-repetition schedule.
 *
 * These numbers were previously displayed read-only on the developer page,
 * which implied they were adjustable without offering any way to adjust them.
 * They are a genuine study preference, so they belong here and they are now
 * editable — the domain layer clamps anything out of range.
 */
export function ReviewIntervalsEditor({
  intervals,
  levels,
  labels,
  min,
  max,
}: {
  intervals: Record<number, number>;
  levels: readonly number[];
  labels: Record<number, string>;
  min: number;
  max: number;
}) {
  const [state, formAction, pending] = useActionState(saveReviewIntervalsAction, {
    ok: false,
  } as ActionState);

  return (
    <form action={formAction}>
      <p className="text-sm font-medium text-ink-800">Review intervals</p>
      <p className="mt-0.5 text-xs text-ink-500">
        Days until a concept comes back after a correct answer at each mastery
        level. An incorrect answer always returns the next day.
      </p>

      <div className="mt-3 space-y-2">
        {levels.map((level) => (
          <label key={level} className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-700">
              {labels[level] ?? `Level ${level}`}
              <span className="ml-1.5 text-xs text-ink-400">level {level}</span>
            </span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                name={`level_${level}`}
                defaultValue={intervals[level]}
                min={min}
                max={max}
                className="h-10 w-20 rounded-lg border border-ink-200 bg-surface px-2 text-right text-sm tabular-nums text-ink-900"
              />
              <span className="w-8 text-xs text-ink-500">days</span>
            </span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-3 h-11 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save review intervals"}
      </button>
      {state.ok ? (
        <p className="mt-2 text-xs text-good-700">
          Saved. New intervals apply from your next graded answer.
        </p>
      ) : null}
    </form>
  );
}
