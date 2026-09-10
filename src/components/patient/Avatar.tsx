/**
 * Circular patient thumbnail (spec §31, §58).
 *
 * Initials today, a generated headshot later. Callers pass a resolved visual
 * so the sizing and shape stay identical either way — swapping in images must
 * not reflow the floor map or the chart header.
 */

import type { PatientVisual } from "@/lib/assets";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-base",
} as const;

export function Avatar({
  visual,
  size = "md",
  className = "",
}: {
  visual: PatientVisual;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const base = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${SIZES[size]} ${className}`;

  if (visual.kind === "image" && visual.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={visual.src} alt="" aria-hidden="true" className={`${base} object-cover`} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${base} bg-clinical-100 text-clinical-700 ring-1 ring-clinical-200`}
    >
      {visual.initials}
    </span>
  );
}
