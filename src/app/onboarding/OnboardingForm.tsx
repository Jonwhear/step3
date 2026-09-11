"use client";

import { useActionState } from "react";
import { DEGREES, SPECIALTIES } from "@/config/app";
import { saveProfileAction, type ActionState } from "@/app/actions";
import type { UserProfileRow } from "@/db/schema";

const initial: ActionState = { ok: false };

/**
 * Shared field styling.
 *
 * These are theme tokens rather than literal colours: the form previously set a
 * hardcoded white background, which left the near-white dark-mode text sitting
 * on white and effectively unreadable.
 */
const INPUT_CLASS =
  "h-12 w-full rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-900";

export function OnboardingForm({
  profile,
  defaultStep3Date,
}: {
  profile: UserProfileRow | null;
  defaultStep3Date: string;
}) {
  const [state, formAction, pending] = useActionState(saveProfileAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          defaultValue={profile?.name ?? ""}
          autoComplete="name"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Degree" htmlFor="degree">
        <select id="degree" name="degree" defaultValue={profile?.degree ?? "MD"} className={INPUT_CLASS}>
          {DEGREES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Specialty" htmlFor="specialty">
        <select
          id="specialty"
          name="specialty"
          defaultValue={profile?.specialty ?? "Internal Medicine"}
          className={INPUT_CLASS}
        >
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Step 3 test date" htmlFor="step3Date">
        <input
          id="step3Date"
          name="step3Date"
          type="date"
          required
          defaultValue={profile?.step3Date ?? defaultStep3Date}
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        label="Target unique patients before Step 3"
        htmlFor="targetPatientCount"
        hint="Used to pace how many new patients arrive each day."
      >
        <input
          id="targetPatientCount"
          name="targetPatientCount"
          type="number"
          min={1}
          max={5000}
          required
          defaultValue={profile?.targetPatientCount ?? 300}
          className={INPUT_CLASS}
        />
      </Field>

      {state.error ? (
        <p className="rounded-lg border border-bad-200 bg-bad-50 p-2 text-sm text-bad-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg border border-good-200 bg-good-50 p-2 text-sm text-good-700">
          Saved. Add your rotation schedule below.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink-700">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}
