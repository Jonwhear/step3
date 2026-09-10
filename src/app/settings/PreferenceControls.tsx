"use client";

/**
 * Segmented preference pickers.
 *
 * Each option is a form submit rather than a controlled input, so a preference
 * is saved the moment it is chosen and there is no "unsaved changes" state to
 * get wrong. The page re-renders from the database afterwards, which is also
 * what re-stamps the theme attributes on <html>.
 */

import { useTransition } from "react";
import { savePreferenceAction } from "@/app/actions";

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
