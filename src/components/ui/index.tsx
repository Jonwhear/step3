/** Small shared presentational primitives. Deliberately plain. */

import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-ink-200 bg-surface shadow-[0_1px_2px_rgba(20,27,38,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        {children}
      </h2>
      {action}
    </div>
  );
}

const TONE_CLASSES = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  info: "bg-clinical-50 text-clinical-700 border-clinical-200",
  good: "bg-good-50 text-good-700 border-good-200",
  warn: "bg-warn-50 text-warn-700 border-warn-200",
  bad: "bg-bad-50 text-bad-700 border-bad-200",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <Card className="p-6 text-center">
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {body ? <p className="mt-1 text-sm text-ink-500">{body}</p> : null}
    </Card>
  );
}

export function StatRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-sm text-ink-600">{label}</span>
      <span className="text-right">
        <span className="text-sm font-semibold tabular-nums text-ink-900">{value}</span>
        {hint ? <span className="ml-2 text-xs text-ink-400">{hint}</span> : null}
      </span>
    </div>
  );
}

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-clinical-500 transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
