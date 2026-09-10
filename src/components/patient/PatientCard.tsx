import Link from "next/link";
import { Badge, type Tone } from "@/components/ui";
import type { PanelPatient } from "@/server/session";

const STATE_LABEL: Record<string, { label: string; tone: Tone }> = {
  PENDING_HANDOFF: { label: "New overnight", tone: "info" },
  PENDING_ADMISSION: { label: "Admission waiting", tone: "warn" },
  ON_SERVICE: { label: "On service", tone: "neutral" },
  DISCHARGE_ELIGIBLE: { label: "Discharge eligible", tone: "good" },
  DISCHARGED: { label: "Discharged", tone: "neutral" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export function PatientCard({ patient }: { patient: PanelPatient }) {
  const state = STATE_LABEL[patient.state] ?? { label: patient.state, tone: "neutral" as Tone };

  return (
    <Link
      href={`/patients/${patient.id}`}
      className="tap block rounded-xl border border-ink-200 bg-surface p-3 transition-colors hover:border-clinical-200 hover:bg-clinical-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">
            <span className="tabular-nums text-ink-500">{patient.roomNumber}</span>
            <span className="mx-1.5 text-ink-300">—</span>
            {patient.patientName}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-ink-600">
            {patient.diagnosis ?? "Undifferentiated — pending admission workup"}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Hospital day {patient.hospitalDay}
            {patient.state !== "PENDING_ADMISSION" && patient.state !== "PENDING_HANDOFF"
              ? ` · ${patient.roundsCompleted} round${patient.roundsCompleted === 1 ? "" : "s"} completed`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={state.tone}>{state.label}</Badge>
          {patient.roundsDueToday ? <Badge tone="warn">Rounds due</Badge> : null}
        </div>
      </div>
    </Link>
  );
}
