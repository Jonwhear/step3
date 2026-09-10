"use client";

import { useActionState } from "react";
import { DEGREES, SPECIALTIES } from "@/config/app";
import { saveProfileAction, type ActionState } from "@/app/actions";
import type { UserProfileRow } from "@/db/schema";

const initial: ActionState = { ok: false };

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
          className="input"
        />
      </Field>

      <Field label="Degree" htmlFor="degree">
        <select id="degree" name="degree" defaultValue={profile?.degree ?? "MD"} className="input">
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
          className="input"
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
          className="input"
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
          className="input"
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

      <style>{`
        .input {
          height: 3rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-ink-200);
          background: white;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: var(--color-ink-900);
        }
      `}</style>
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
