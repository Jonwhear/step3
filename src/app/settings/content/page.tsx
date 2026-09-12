import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Card, SectionHeading, type Tone } from "@/components/ui";
import { CASE_STATUS_LABELS, listCaseSummaries, type CaseStatus } from "@/domain/content/cases";
import { listContentPacks } from "@/domain/content/packs";
import {
  buildCoverageTotals,
  listContentSources,
  listLearningPoints,
} from "@/domain/content/provenance";
import { listLectures } from "@/domain/lectures";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<CaseStatus, Tone> = {
  DRAFT: "neutral",
  NEEDS_REVIEW: "warn",
  REVIEWED: "info",
  PUBLISHED: "good",
  ARCHIVED: "neutral",
};

/** Content library (spec §37). Cases first, as the spec prioritises. */
export default function ContentLibraryPage() {
  const database = db();
  const cases = listCaseSummaries(database);
  const lectures = listLectures(database);
  const points = listLearningPoints(database);
  const sources = listContentSources(database);
  const packs = listContentPacks(database);
  const coverage = buildCoverageTotals(database);

  const withErrors = cases.filter((c) => c.errorCount > 0).length;
  const published = cases.filter((c) => c.status === "PUBLISHED").length;

  return (
    <>
      <AppHeader subtitle="Content library" />
      <PageShell>
        <Link href="/settings" className="text-xs font-medium text-clinical-600">
          ‹ Settings
        </Link>
        <h1 className="mt-3 text-lg font-semibold text-ink-900">Content library</h1>
        <p className="mt-1 text-sm text-ink-500">
          Everything the scheduler can draw from. Only published cases reach a
          learner&apos;s service.
        </p>

        {/* --- at a glance -------------------------------------------------- */}
        <Card className="mt-4 p-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Cases" value={`${published}/${cases.length}`} hint="published" />
            <Stat
              label="Validation"
              value={withErrors === 0 ? "Clean" : String(withErrors)}
              hint={withErrors === 0 ? "no errors" : "with errors"}
            />
            <Stat label="Learning points" value={String(points.length)} hint="tracked" />
            <Stat
              label="Coverage"
              value={`${coverage.patientCoveragePercent}%`}
              hint="in a patient"
            />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
            <LibraryLink href="/settings/content/coverage" label="Coverage audit" />
            <LibraryLink href="/settings/content/packs" label="Import / export packs" />
          </div>
        </Card>

        {/* --- cases -------------------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Cases — {cases.length}</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {cases.map((caseSummary) => (
              <Link
                key={caseSummary.id}
                href={`/settings/content/cases/${encodeURIComponent(caseSummary.id)}`}
                className="tap block px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {caseSummary.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {caseSummary.code} · {caseSummary.specialty} · {caseSummary.topic}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={STATUS_TONE[caseSummary.status]}>
                      {CASE_STATUS_LABELS[caseSummary.status]}
                    </Badge>
                    {caseSummary.errorCount > 0 ? (
                      <Badge tone="bad">
                        {caseSummary.errorCount} error
                        {caseSummary.errorCount === 1 ? "" : "s"}
                      </Badge>
                    ) : caseSummary.warningCount > 0 ? (
                      <span className="text-[11px] text-ink-400">
                        {caseSummary.warningCount} warning
                        {caseSummary.warningCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>
                {caseSummary.isDemo ? (
                  <p className="mt-1 text-[11px] text-ink-400">
                    Bundled demo content — duplicate to edit
                  </p>
                ) : null}
              </Link>
            ))}
          </Card>
        </section>

        {/* --- other collections ------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Lectures — {lectures.length}</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {lectures.slice(0, 25).map((lecture) => (
              <div key={lecture.id} className="flex justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 text-sm text-ink-700">
                  <span className="block truncate">{lecture.title}</span>
                  <span className="block text-xs text-ink-400">
                    {lecture.code} · {lecture.sections.length} section
                    {lecture.sections.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-400">{lecture.topic}</span>
              </div>
            ))}
          </Card>
        </section>

        <section className="mt-6">
          <SectionHeading>Sources — {sources.length}</SectionHeading>
          {sources.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-ink-500">
                No source material has been imported. Sources are how a learning
                point stays traceable to the material it came from.
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-ink-100">
              {sources.map((source) => (
                <div key={source.id} className="px-4 py-2.5">
                  <p className="text-sm text-ink-800">{source.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {source.sourceType}
                    {source.sourceIdentifier ? ` · ${source.sourceIdentifier}` : ""}
                    {source.section ? ` · ${source.section}` : ""}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </section>

        <section className="mt-6">
          <SectionHeading>Content packs — {packs.length}</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {packs.map((pack) => (
              <div key={pack.id} className="flex justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 text-sm text-ink-700">
                  <span className="block truncate">{pack.name}</span>
                  <span className="block text-xs text-ink-400">
                    v{pack.version} · schema {pack.schemaVersion}
                  </span>
                </span>
                {pack.isBuiltin ? <Badge tone="neutral">Builtin</Badge> : null}
              </div>
            ))}
          </Card>
        </section>
      </PageShell>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink-900">{value}</dd>
      <dd className="text-[11px] text-ink-400">{hint}</dd>
    </div>
  );
}

function LibraryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700"
    >
      {label} ›
    </Link>
  );
}
