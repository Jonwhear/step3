import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CONTENT_SPECIALTIES } from "@/config/app";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Card, SectionHeading } from "@/components/ui";
import * as schema from "@/db/schema";
import { getCaseFindings, getCasePrompts } from "@/domain/cases";
import { listCaseProblems } from "@/domain/chart";
import { CASE_STATUS_LABELS, getCaseRow, isEditable, listRevisions, type CaseStatus } from "@/domain/content/cases";
import { findUntestedMappings } from "@/domain/content/provenance";
import { validateCase } from "@/domain/content/validation";
import { getCaseImaging, getCaseLabResults } from "@/domain/labs";
import { db } from "@/server/db";
import { duplicateCaseAction, markReviewedAction } from "@/app/settings/content/actions";
import { CaseEditorForm, CaseStatusControls } from "./CaseEditorForm";
import { DeleteCaseButton } from "./DeleteCaseButton";

export const dynamic = "force-dynamic";

/** Case editor (spec §38-39). */
export default async function CaseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseId = decodeURIComponent(id);
  const database = db();

  const row = getCaseRow(database, caseId);
  if (!row) notFound();

  const validation = validateCase(database, caseId);
  const editable = isEditable(row);
  const prompts = (["HANDOFF", "ADMISSION", "ROUNDS", "DISCHARGE"] as const).flatMap((stage) =>
    getCasePrompts(database, caseId, stage),
  );
  const findings = getCaseFindings(database, caseId);
  const labs = getCaseLabResults(database, caseId);
  const imaging = getCaseImaging(database, caseId);
  const problems = listCaseProblems(database, caseId);
  const revisions = listRevisions(database, caseId);
  const untested = findUntestedMappings(database, caseId);

  const rules = database
    .select()
    .from(schema.caseActionRule)
    .where(eq(schema.caseActionRule.caseId, caseId))
    .all();

  return (
    <>
      <AppHeader subtitle="Case editor" />
      <PageShell>
        <Link href="/settings/content" className="text-xs font-medium text-clinical-600">
          ‹ Content library
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink-900">{row.title}</h1>
            <p className="mt-0.5 text-xs text-ink-400">
              {row.code} · version {row.version} · {row.isDemo ? "bundled" : "custom"}
            </p>
          </div>
          <Badge tone={validation.ok ? "good" : "bad"}>
            {CASE_STATUS_LABELS[row.status as CaseStatus] ?? row.status}
          </Badge>
        </div>

        {/* --- validation --------------------------------------------------- */}
        <section className="mt-4">
          <SectionHeading>Validation</SectionHeading>
          <Card className="p-4">
            {validation.ok && validation.warnings.length === 0 ? (
              <p className="text-sm text-good-700">
                No problems found. This case can be published.
              </p>
            ) : null}

            {validation.errors.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-bad-700">
                  {validation.errors.length} error
                  {validation.errors.length === 1 ? "" : "s"} — publication is blocked
                </p>
                <ul className="mt-2 space-y-1.5">
                  {validation.errors.map((issue, index) => (
                    <li key={index} className="text-sm text-ink-800">
                      <span className="mr-2 rounded bg-bad-200 px-1 text-[10px] font-semibold uppercase text-bad-700">
                        {issue.code}
                      </span>
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {validation.warnings.length > 0 ? (
              <div className={validation.errors.length > 0 ? "mt-4" : ""}>
                <p className="text-sm font-medium text-warn-700">
                  {validation.warnings.length} warning
                  {validation.warnings.length === 1 ? "" : "s"} — publication is allowed
                </p>
                <ul className="mt-2 space-y-1.5">
                  {validation.warnings.slice(0, 12).map((issue, index) => (
                    <li key={index} className="text-sm text-ink-600">
                      <span className="mr-2 rounded bg-warn-200 px-1 text-[10px] font-semibold uppercase text-warn-700">
                        {issue.code}
                      </span>
                      {issue.message}
                    </li>
                  ))}
                </ul>
                {validation.warnings.length > 12 ? (
                  <p className="mt-1 text-xs text-ink-400">
                    …and {validation.warnings.length - 12} more.
                  </p>
                ) : null}
              </div>
            ) : null}
          </Card>
        </section>

        {/* --- status ------------------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Status</SectionHeading>
          <Card className="p-4">
            <CaseStatusControls
              caseId={caseId}
              status={row.status}
              canPublish={validation.ok}
            />
            <form action={markReviewedAction} className="mt-4 border-t border-ink-100 pt-4">
              <input type="hidden" name="caseId" value={caseId} />
              <label className="block">
                <span className="text-xs font-medium text-ink-600">Review notes</span>
                <textarea
                  name="reviewNotes"
                  defaultValue={row.reviewNotes}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900"
                />
              </label>
              <button
                type="submit"
                className="mt-2 h-10 rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700"
              >
                Mark medical content reviewed
              </button>
              <p className="mt-1 text-xs text-ink-400">
                Currently {row.reviewStatus.toLowerCase().replace("_", " ")}
                {row.reviewedAt ? ` · ${row.reviewedAt.slice(0, 10)}` : ""}
              </p>
            </form>
          </Card>
        </section>

        {/* --- basics ------------------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Basics</SectionHeading>
          <CaseEditorForm
            values={{
              id: caseId,
              title: row.title,
              specialty: row.specialty,
              topic: row.topic,
              primaryDiagnosis: row.primaryDiagnosis,
              difficulty: row.difficulty,
              step3Importance: row.step3Importance,
              handoffScript: row.handoffScript,
              dailySignout: row.dailySignout,
              admissionOpening: row.admissionOpening,
              teachingPoint: row.teachingPoint,
              minimumRoundsBeforeDischarge: row.minimumRoundsBeforeDischarge,
              patientAgeYears: row.patientAgeYears,
              patientSex: row.patientSex,
              chiefComplaint: row.chiefComplaint,
              codeStatus: row.codeStatus,
              allergies: row.allergies,
            }}
            editable={editable}
            specialties={CONTENT_SPECIALTIES}
          />
        </section>

        {/* --- structured content (read-only for now) ----------------------- */}
        <section className="mt-6">
          <SectionHeading>Structured content</SectionHeading>
          <Card className="divide-y divide-ink-100">
            <CountRow label="Findings" count={findings.length} />
            <CountRow label="Laboratory results" count={labs.length} />
            <CountRow label="Imaging studies" count={imaging.length} />
            <CountRow label="Action rules" count={rules.length} />
            <CountRow label="Prompts" count={prompts.length} />
            <CountRow label="Problems (assessment & plan)" count={problems.length} />
          </Card>
          <p className="mt-2 text-xs text-ink-400">
            These collections are authored in the case&apos;s content file and
            imported through a content pack. Editing them in the browser is a
            planned extension of this editor.
          </p>
        </section>

        {/* --- learning points ---------------------------------------------- */}
        {untested.length > 0 ? (
          <section className="mt-6">
            <SectionHeading>Learning points mapped but never tested</SectionHeading>
            <Card className="divide-y divide-ink-100">
              {untested.map((point) => (
                <div key={point.id} className="px-4 py-2.5">
                  <p className="text-sm text-ink-800">{point.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{point.code}</p>
                </div>
              ))}
            </Card>
            <p className="mt-2 text-xs text-ink-400">
              These are attached to this case but no prompt, action rule or plan
              option actually asks about them.
            </p>
          </section>
        ) : null}

        {/* --- duplicate / delete ------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Manage</SectionHeading>
          <Card className="space-y-4 p-4">
            <form action={duplicateCaseAction}>
              <input type="hidden" name="caseId" value={caseId} />
              <label className="block">
                <span className="text-xs font-medium text-ink-600">New case code</span>
                <input
                  type="text"
                  name="newCode"
                  placeholder={`${row.code}-COPY`}
                  className="mt-1 h-11 w-full rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-900"
                />
              </label>
              <button
                type="submit"
                className="mt-2 h-11 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
              >
                Duplicate and edit
              </button>
            </form>

            {!row.isDemo ? (
              <div className="border-t border-ink-100 pt-4">
                <DeleteCaseButton caseId={caseId} />
                <p className="mt-1 text-xs text-ink-400">
                  Archiving is preferred: it keeps your study history readable.
                  Permanent deletion is refused for a case you have already seen.
                </p>
              </div>
            ) : null}

            {revisions.length > 0 ? (
              <p className="border-t border-ink-100 pt-4 text-xs text-ink-400">
                {revisions.length} saved revision{revisions.length === 1 ? "" : "s"} — the
                most recent is version {revisions[0]?.version}.
              </p>
            ) : null}
          </Card>
        </section>
      </PageShell>
    </>
  );
}

function CountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <span className="text-sm text-ink-600">{label}</span>
      <span className="text-sm tabular-nums text-ink-900">{count}</span>
    </div>
  );
}
