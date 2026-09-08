import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Card, ProgressBar, SectionHeading, StatRow } from "@/components/ui";
import { buildProgressSummary } from "@/domain/progress";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * Progress. This is the one screen where the hidden curriculum is exposed
 * (spec §34, §60) — the Service screen keeps it behind patients.
 */
export default function ProgressPage() {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");
  const summary = buildProgressSummary(db(), session.today);

  return (
    <>
      <AppHeader rotationName={`${session.rotation.name} Service`} />
      <PageShell>
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-ink-900">Progress</h1>
          <p className="text-sm text-ink-500">
            {summary.pace.label} · {summary.daysUntilStep3} days to Step 3
          </p>
        </header>

        <SectionHeading>Overall</SectionHeading>
        <Card className="divide-y divide-ink-100 px-4">
          <StatRow
            label="Patients completed"
            value={`${summary.patientsCompleted} / ${summary.targetPatientCount}`}
          />
          <StatRow label="Patients currently on service" value={summary.patientsOnService} />
          <StatRow
            label="Cases encountered"
            value={`${summary.casesEncountered} / ${summary.casesAvailable}`}
          />
          <StatRow
            label="Concepts introduced"
            value={`${summary.conceptsIntroduced} / ${summary.conceptsTotal}`}
          />
          <StatRow label="Concepts mastered" value={summary.conceptsMastered} />
          <StatRow
            label="Conferences completed"
            value={`${summary.lecturesCompleted} / ${summary.lecturesAvailable}`}
          />
          <StatRow label="Days until Step 3" value={summary.daysUntilStep3} />
        </Card>

        <section className="mt-6">
          <SectionHeading>Specialty coverage</SectionHeading>
          <p className="mb-2 text-xs text-ink-400">
            Coverage is measured as concepts introduced divided by concepts
            available in the loaded content library.
          </p>
          <div className="space-y-3">
            {summary.specialties.map((specialty) => (
              <Card key={specialty.specialty} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-medium text-ink-800">
                    {specialty.specialty}
                  </h3>
                  <span className="text-sm font-semibold tabular-nums text-ink-900">
                    {specialty.coveragePercent}%
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    percent={specialty.coveragePercent}
                    label={`${specialty.specialty} coverage`}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-400">
                  {specialty.conceptsIntroduced}/{specialty.conceptsTotal} concepts ·{" "}
                  {specialty.casesEncountered}/{specialty.casesAvailable} cases ·{" "}
                  {specialty.conceptsMastered} mastered
                </p>

                {specialty.topics.length > 0 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-clinical-600">
                      Topic detail
                    </summary>
                    <ul className="mt-2 space-y-2 border-t border-ink-100 pt-2">
                      {specialty.topics.map((topic) => (
                        <li key={topic.topic}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm text-ink-700">{topic.topic}</span>
                            <span className="text-xs tabular-nums text-ink-500">
                              {topic.coveragePercent}%
                            </span>
                          </div>
                          <div className="mt-1">
                            <ProgressBar
                              percent={topic.coveragePercent}
                              label={`${topic.topic} coverage`}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-ink-400">
                            {topic.conceptsIntroduced}/{topic.conceptsTotal} concepts ·{" "}
                            {topic.casesEncountered}/{topic.casesAvailable} cases
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
