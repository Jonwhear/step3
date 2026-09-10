import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { getCaseById } from "@/domain/cases";
import {
  hospitalDay,
  listAllPatients,
  listPromptResponses,
} from "@/domain/patients";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";
import { formatShortDate } from "@/lib/date";

export const dynamic = "force-dynamic";

/** Patient history with filtering by specialty, topic and performance (spec §35). */
export default async function PatientHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; topic?: string; q?: string; perf?: string }>;
}) {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");
  const database = db();
  const filters = await searchParams;

  const rows = listAllPatients(database)
    .map((patient) => {
      const template = getCaseById(database, patient.caseId);
      const responses = listPromptResponses(database, patient.id);
      const correct = responses.filter((r) => r.correct).length;
      return {
        patient,
        template,
        total: responses.length,
        correct,
        allCorrect: responses.length > 0 && correct === responses.length,
        anyMissed: responses.some((r) => !r.correct),
      };
    })
    .filter((row) => row.template !== null);

  const specialties = Array.from(
    new Set(rows.map((r) => r.template?.specialty).filter(Boolean)),
  ).sort() as string[];
  const topics = Array.from(
    new Set(rows.map((r) => r.template?.topic).filter(Boolean)),
  ).sort() as string[];

  const query = (filters.q ?? "").toLowerCase();
  const filtered = rows.filter((row) => {
    if (filters.specialty && row.template?.specialty !== filters.specialty) return false;
    if (filters.topic && row.template?.topic !== filters.topic) return false;
    if (filters.perf === "correct" && !row.allCorrect) return false;
    if (filters.perf === "missed" && !row.anyMissed) return false;
    if (query) {
      const haystack = [
        row.patient.patientName,
        row.template?.primaryDiagnosis ?? "",
        row.template?.title ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const discharged = filtered.filter((r) => r.patient.state === "DISCHARGED");
  const active = filtered.filter((r) => r.patient.state !== "DISCHARGED");

  return (
    <>
      <AppHeader rotationName="Patient history" />
      <PageShell>
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-ink-900">Patient history</h1>
          <p className="text-sm text-ink-500">
            {rows.length} patient{rows.length === 1 ? "" : "s"} on record
          </p>
        </header>

        <Card className="p-3">
          <form className="grid gap-2 sm:grid-cols-2" method="get">
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search name or diagnosis"
              className="h-11 rounded-lg border border-ink-200 px-3 text-sm sm:col-span-2"
            />
            <select
              name="specialty"
              defaultValue={filters.specialty ?? ""}
              className="h-11 rounded-lg border border-ink-200 bg-surface px-2 text-sm"
            >
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="topic"
              defaultValue={filters.topic ?? ""}
              className="h-11 rounded-lg border border-ink-200 bg-surface px-2 text-sm"
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              name="perf"
              defaultValue={filters.perf ?? ""}
              className="h-11 rounded-lg border border-ink-200 bg-surface px-2 text-sm"
            >
              <option value="">Any performance</option>
              <option value="correct">All answers correct</option>
              <option value="missed">Something missed</option>
            </select>
            <button
              type="submit"
              className="h-11 rounded-lg bg-clinical-600 text-sm font-semibold text-white"
            >
              Filter
            </button>
          </form>
        </Card>

        {active.length > 0 ? (
          <section className="mt-6">
            <SectionHeading>Currently on service</SectionHeading>
            <div className="space-y-2">
              {active.map((row) => (
                <HistoryRow key={row.patient.id} row={row} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <SectionHeading>Discharged</SectionHeading>
          {discharged.length === 0 ? (
            <EmptyState
              title="No discharged patients yet"
              body="Patients move here once you complete their discharge interaction."
            />
          ) : (
            <div className="space-y-2">
              {discharged.map((row) => (
                <HistoryRow key={row.patient.id} row={row} />
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </>
  );
}

interface HistoryRowData {
  patient: ReturnType<typeof listAllPatients>[number];
  template: ReturnType<typeof getCaseById>;
  total: number;
  correct: number;
}

function HistoryRow({ row }: { row: HistoryRowData }) {
  const { patient, template } = row;
  return (
    <Link
      href={`/patients/${patient.id}`}
      className="tap block rounded-xl border border-ink-200 bg-surface p-3 hover:border-clinical-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">
            <span className="tabular-nums text-ink-500">{patient.roomNumber}</span>
            <span className="mx-1.5 text-ink-300">—</span>
            {patient.patientName}
          </p>
          <p className="truncate text-sm text-ink-600">{template?.primaryDiagnosis}</p>
          <p className="mt-1 text-xs text-ink-400">
            {template?.specialty} · {template?.topic} · hospital day{" "}
            {hospitalDay(patient)}
            {patient.dischargedAt
              ? ` · discharged ${formatShortDate(patient.dischargedAt.slice(0, 10))}`
              : ""}
          </p>
        </div>
        {row.total > 0 ? (
          <Badge tone={row.correct === row.total ? "good" : "warn"}>
            {row.correct}/{row.total}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
