import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import { Card, EmptyState, SectionHeading } from "@/components/ui";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { PatientCard } from "@/components/patient/PatientCard";
import { buildProgressSummary } from "@/domain/progress";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";
import { formatLongDate, formatShortDate } from "@/lib/date";

export const dynamic = "force-dynamic";

/** Home / Service — the central screen. Patients are the interface. */
export default function HomePage() {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");

  const progress = buildProgressSummary(db(), session.today);
  const profile = session.profile;

  const work = [
    {
      href: "/handoff",
      label: "Morning Handoff",
      detail:
        session.pendingHandoff.length > 0
          ? `${session.pendingHandoff.length} new patient${session.pendingHandoff.length === 1 ? "" : "s"}`
          : `${session.panel.length} sign-out${session.panel.length === 1 ? "" : "s"}`,
      urgent: session.pendingHandoff.length > 0,
    },
    {
      href: "/rounds",
      label: "Rounds",
      detail:
        session.roundsDue.length > 0
          ? `${session.roundsDue.length} patient${session.roundsDue.length === 1 ? "" : "s"}`
          : "All seen today",
      urgent: session.roundsDue.length > 0,
    },
    {
      href: "/admissions",
      label: "Admissions",
      detail:
        session.pendingAdmission.length > 0
          ? `${session.pendingAdmission.length} waiting`
          : "None waiting",
      urgent: session.pendingAdmission.length > 0,
    },
    {
      href: "/conference",
      label: "Teaching Conference",
      detail: session.lecture
        ? session.lecture.status === "COMPLETED"
          ? "Completed"
          : session.lecture.title
        : "None scheduled",
      urgent: Boolean(session.lecture && session.lecture.status !== "COMPLETED"),
    },
  ];

  return (
    <>
      <AppHeader rotationName={`${session.rotation.name} Service`} />
      <PageShell>
        {/* --- identity block --------------------------------------------- */}
        <Card className="p-4">
          <p className="text-xs text-ink-500">{formatLongDate(session.today)}</p>
          <h1 className="mt-0.5 text-lg font-semibold text-ink-900">
            {session.rotation.name} Service
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {profile?.name}
            {profile?.degree ? `, ${profile.degree}` : ""}
            {profile?.specialty ? ` · ${profile.specialty}` : ""}
          </p>
          {profile ? (
            <p className="mt-1 text-xs text-ink-400">
              Step 3: {formatShortDate(profile.step3Date)} · {progress.daysUntilStep3} days
            </p>
          ) : null}
          {session.rotation.isOffService ? (
            <p className="mt-2 rounded-lg bg-ink-50 p-2 text-xs text-ink-500">
              Today falls outside your rotation schedule, so you are on the
              general service. Add a rotation in Settings to change this.
            </p>
          ) : null}
        </Card>

        {/* --- returning after time away ---------------------------------- */}
        {session.daysAway !== null && session.daysAway >= 2 ? (
          <div className="mt-3 rounded-xl border border-clinical-200 bg-clinical-50 p-3 text-sm text-clinical-700">
            Welcome back. Your service has been adjusted to keep your Step 3 plan
            on pace.
          </div>
        ) : null}

        {/* --- today's work ----------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Today</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {work.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="tap flex min-h-14 items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm font-medium text-ink-800">{item.label}</span>
                <span
                  className={`text-sm ${item.urgent ? "font-medium text-clinical-600" : "text-ink-400"}`}
                >
                  {item.detail}
                  <span aria-hidden="true" className="ml-2 text-ink-300">
                    ›
                  </span>
                </span>
              </Link>
            ))}
          </Card>
        </section>

        {/* --- active panel ------------------------------------------------ */}
        <section className="mt-6">
          <SectionHeading
            action={
              <Link href="/patients" className="text-xs font-medium text-clinical-600">
                History ›
              </Link>
            }
          >
            Your service — {session.panel.length} patient
            {session.panel.length === 1 ? "" : "s"}
          </SectionHeading>

          {session.panel.length === 0 ? (
            <EmptyState
              title="No patients on service"
              body="The overnight team has not signed anyone out yet. Check Handoff, or add demo content in Settings if the library is empty."
            />
          ) : (
            <div className="space-y-2">
              {session.panel.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </section>

        {/* --- subtle progress -------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading
            action={
              <Link href="/progress" className="text-xs font-medium text-clinical-600">
                Details ›
              </Link>
            }
          >
            Progress
          </SectionHeading>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-semibold tabular-nums text-ink-900">
                  {progress.patientsCompleted}
                  <span className="text-sm font-normal text-ink-400">
                    /{progress.targetPatientCount}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-ink-500">Patients completed</p>
              </div>
              <div>
                <p className="text-lg font-semibold tabular-nums text-ink-900">
                  {progress.conceptsIntroduced}
                  <span className="text-sm font-normal text-ink-400">
                    /{progress.conceptsTotal}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-ink-500">Concepts introduced</p>
              </div>
              <div>
                <p className="text-lg font-semibold tabular-nums text-ink-900">
                  {progress.daysUntilStep3}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-500">Days to Step 3</p>
              </div>
            </div>
            <p className="mt-3 border-t border-ink-100 pt-3 text-center text-xs text-ink-500">
              {progress.pace.label}
            </p>
          </Card>
        </section>

        <p className="mt-6 text-center text-[11px] text-ink-400">
          {APP_CONFIG.hospitalShortName} · synthetic teaching content
        </p>
      </PageShell>
    </>
  );
}
