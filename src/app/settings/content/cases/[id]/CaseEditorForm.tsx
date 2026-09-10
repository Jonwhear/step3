"use client";

/**
 * Case editor form (spec §39).
 *
 * Deliberately plain: the goal at this stage is a sustainable authoring
 * workflow, not visual polish. Fields that are structurally complex (prompts,
 * findings, action rules) are shown read-only with their counts — editing them
 * belongs in a later iteration and is documented as such rather than
 * half-implemented here.
 */

import { useActionState } from "react";
import {
  saveCaseAction,
  setCaseStatusAction,
  type ContentActionState,
} from "@/app/settings/content/actions";
import { Card } from "@/components/ui";

const idle: ContentActionState = { ok: true };

export interface CaseEditorValues {
  id: string;
  title: string;
  specialty: string;
  topic: string;
  primaryDiagnosis: string;
  difficulty: number;
  step3Importance: number;
  handoffScript: string;
  dailySignout: string;
  admissionOpening: string;
  teachingPoint: string;
  minimumRoundsBeforeDischarge: number;
  patientAgeYears: number | null;
  patientSex: string | null;
  chiefComplaint: string;
  codeStatus: string;
  allergies: string;
}

export function CaseEditorForm({
  values,
  editable,
  specialties,
}: {
  values: CaseEditorValues;
  editable: boolean;
  specialties: readonly string[];
}) {
  const [state, formAction, pending] = useActionState(saveCaseAction, idle);

  return (
    <form action={formAction}>
      <input type="hidden" name="caseId" value={values.id} />

      {!editable ? (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            This is bundled demo content and is read-only. Duplicate it to make
            an editable copy — that way re-seeding the demo library can never
            overwrite your work.
          </p>
        </Card>
      ) : null}

      <fieldset disabled={!editable || pending} className="space-y-4">
        <Card className="space-y-3 p-4">
          <Field label="Title" name="title" defaultValue={values.title} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Specialty"
              name="specialty"
              defaultValue={values.specialty}
              options={specialties}
            />
            <Field label="Topic" name="topic" defaultValue={values.topic} />
          </div>
          <Field
            label="Primary diagnosis"
            name="primaryDiagnosis"
            defaultValue={values.primaryDiagnosis}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField
              label="Difficulty (1–5)"
              name="difficulty"
              defaultValue={values.difficulty}
              min={1}
              max={5}
            />
            <NumberField
              label="Step 3 importance (1–5)"
              name="step3Importance"
              defaultValue={values.step3Importance}
              min={1}
              max={5}
            />
            <NumberField
              label="Minimum rounds"
              name="minimumRoundsBeforeDischarge"
              defaultValue={values.minimumRoundsBeforeDischarge}
              min={1}
              max={6}
            />
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            Patient
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Age (years)"
              name="patientAgeYears"
              defaultValue={values.patientAgeYears ?? ""}
              min={0}
              max={120}
            />
            <SelectField
              label="Sex"
              name="patientSex"
              defaultValue={values.patientSex ?? ""}
              options={["", "M", "F"]}
            />
          </div>
          <Field
            label="Chief complaint"
            name="chiefComplaint"
            defaultValue={values.chiefComplaint}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Allergies" name="allergies" defaultValue={values.allergies} />
            <Field label="Code status" name="codeStatus" defaultValue={values.codeStatus} />
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            Presentation
          </p>
          <TextareaField
            label="Handoff script"
            name="handoffScript"
            defaultValue={values.handoffScript}
            rows={6}
          />
          <TextareaField
            label="Daily sign-out"
            name="dailySignout"
            defaultValue={values.dailySignout}
            rows={3}
          />
          <TextareaField
            label="Admission opening"
            name="admissionOpening"
            defaultValue={values.admissionOpening}
            rows={3}
          />
          <TextareaField
            label="Teaching point"
            name="teachingPoint"
            defaultValue={values.teachingPoint}
            rows={3}
          />
        </Card>
      </fieldset>

      {state.error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}

      {editable ? (
        <button
          type="submit"
          disabled={pending}
          className="mt-4 h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save case"}
        </button>
      ) : null}
    </form>
  );
}

/** Status changes are their own form: publishing can fail validation. */
export function CaseStatusControls({
  caseId,
  status,
  canPublish,
}: {
  caseId: string;
  status: string;
  canPublish: boolean;
}) {
  const [state, formAction, pending] = useActionState(setCaseStatusAction, idle);

  const targets = ["DRAFT", "NEEDS_REVIEW", "REVIEWED", "PUBLISHED", "ARCHIVED"].filter(
    (s) => s !== status,
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {targets.map((target) => (
          <form key={target} action={formAction}>
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="status" value={target} />
            <button
              type="submit"
              disabled={pending || (target === "PUBLISHED" && !canPublish)}
              title={
                target === "PUBLISHED" && !canPublish
                  ? "Fix the validation errors first"
                  : undefined
              }
              className="h-10 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700 disabled:opacity-40"
            >
              {target === "PUBLISHED" ? "Publish" : `Mark ${target.toLowerCase().replace("_", " ")}`}
            </button>
          </form>
        ))}
      </div>
      {state.error ? (
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{state.error}</p>
      ) : null}
      {state.message ? <p className="mt-2 text-sm text-ink-500">{state.message}</p> : null}
    </div>
  );
}

/* ------------------------------ field helpers ----------------------------- */

const inputClass =
  "mt-1 h-11 w-full rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-900 disabled:opacity-60";

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-600">{label}</span>
      <input type="text" name={name} defaultValue={defaultValue} className={inputClass} />
    </label>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue: number | string;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-600">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className={inputClass}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-600">{label}</span>
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        {options.map((option) => (
          <option key={option || "none"} value={option}>
            {option || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-600">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm leading-relaxed text-ink-900 disabled:opacity-60"
      />
    </label>
  );
}
