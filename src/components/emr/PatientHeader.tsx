/**
 * Consistent chart header (spec §53).
 *
 * Shown identically on every tab of a patient's chart so the learner always
 * knows who they are looking at. Fields that the case does not define are
 * omitted rather than rendered blank — an empty "Allergies:" line is worse
 * than no line at all.
 */

import Link from "next/link";
import { Avatar } from "@/components/patient/Avatar";
import type { PatientVisual } from "@/lib/assets";

export interface PatientHeaderProps {
  visual: PatientVisual;
  name: string;
  ageYears?: number | null;
  sex?: string | null;
  roomNumber: string;
  hospitalDay: number;
  /** Null while an admission is still undifferentiated. */
  diagnosis: string | null;
  allergies?: string;
  codeStatus?: string;
  /**
   * The patients either side of this one on the service, in room order. Null
   * at the ends of the ward — the list does not wrap, because walking off the
   * end of the floor and reappearing at the start is not how rounds work.
   */
  previous?: { id: string; roomNumber: string; name: string } | null;
  next?: { id: string; roomNumber: string; name: string } | null;
  /** Kept on the link so the arrows do not drop the learner back to Summary. */
  tab?: string;
}

/** One arrow. Rendered as a dead control at the ends rather than removed, so
 *  the header does not reflow as the learner walks the floor. */
function NavArrow({
  target,
  tab,
  direction,
}: {
  target: { id: string; roomNumber: string; name: string } | null | undefined;
  tab?: string;
  direction: "previous" | "next";
}) {
  const glyph = direction === "previous" ? "\u2190" : "\u2192";
  const base =
    "flex h-9 w-9 items-center justify-center rounded-lg border text-sm";

  if (!target) {
    return (
      <span
        aria-hidden="true"
        className={`${base} border-ink-200 text-ink-300 opacity-50`}
      >
        {glyph}
      </span>
    );
  }

  const query = tab ? `?tab=${tab}` : "";
  return (
    <Link
      href={`/patients/${target.id}${query}`}
      aria-label={`${direction === "previous" ? "Previous" : "Next"} patient: room ${target.roomNumber}, ${target.name}`}
      className={`tap ${base} border-ink-200 text-ink-600`}
    >
      {glyph}
    </Link>
  );
}

export function PatientHeader({
  visual,
  name,
  ageYears,
  sex,
  roomNumber,
  hospitalDay,
  diagnosis,
  allergies,
  codeStatus,
  previous,
  next,
  tab,
}: PatientHeaderProps) {
  const demographics = [
    ageYears ? `${ageYears}` : null,
    sex ? sex : null,
  ]
    .filter(Boolean)
    .join(" ");

  const line = [
    demographics || null,
    `Room ${roomNumber}`,
    `Hospital day ${hospitalDay}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="sticky top-0 z-20 border-b border-ink-200 bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex max-w-3xl items-start gap-3">
        <Avatar visual={visual} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="truncate text-base font-semibold text-ink-900">{name}</h1>
            <span className="flex shrink-0 items-center gap-1">
              <NavArrow target={previous} tab={tab} direction="previous" />
              <NavArrow target={next} tab={tab} direction="next" />
            </span>
          </div>
          <p className="mt-0.5 text-xs tabular-nums text-ink-500">{line}</p>
          <p className="mt-1 text-sm text-ink-700">
            {diagnosis ?? "Undifferentiated — pending admission workup"}
          </p>
          {allergies || codeStatus ? (
            <p className="mt-1 text-[11px] text-ink-500">
              {allergies ? <>Allergies: {allergies}</> : null}
              {allergies && codeStatus ? <span className="mx-1.5 text-ink-300">·</span> : null}
              {codeStatus ? <>Code status: {codeStatus}</> : null}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
