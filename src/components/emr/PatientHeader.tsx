/**
 * Consistent chart header (spec §53).
 *
 * Shown identically on every tab of a patient's chart so the learner always
 * knows who they are looking at. Fields that the case does not define are
 * omitted rather than rendered blank — an empty "Allergies:" line is worse
 * than no line at all.
 */

import { Avatar } from "@/components/patient/Avatar";
import { Badge, type Tone } from "@/components/ui";
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
  status?: { label: string; tone: Tone } | null;
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
  status,
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
            {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
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
