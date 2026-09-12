import Link from "next/link";
import { notFound } from "next/navigation";
import { inArray } from "drizzle-orm";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Card, EmptyState, SectionHeading, type Tone } from "@/components/ui";
import {
  ChartTabs,
  parseChartTab,
  type ChartTab,
} from "@/components/emr/ChartTabs";
import { ImagingList } from "@/components/emr/ImagingReport";
import { LabPanels } from "@/components/emr/LabPanels";
import { PatientHeader } from "@/components/emr/PatientHeader";
import { listActions } from "@/domain/actions";
import { buildChart } from "@/domain/chart";
import {
  getCaseById,
  getCaseConceptIds,
  getCaseFindings,
  getCasePrompts,
  promptChoices,
} from "@/domain/cases";
import { buildImagingViews, buildLabPanels } from "@/domain/labs";
import {
  getPatient,
  hospitalDay,
  listPatientActions,
  listPromptResponses,
  listRevealedFindingIds,
} from "@/domain/patients";
import { getAudioPreferences } from "@/domain/profile";
import { getPreferences } from "@/domain/settings";
import { resolvePatientVisual } from "@/lib/assets";
import { db } from "@/server/db";
import { formatShortDate } from "@/lib/date";
import * as schema from "@/db/schema";
import { AssessmentPlan } from "@/components/emr/AssessmentPlan";
import { DischargeFlow } from "./DischargeFlow";

export const dynamic = "force-dynamic";

const CLASSIFICATION_TONE: Record<string, Tone> = {
  REQUIRED: "good",
  APPROPRIATE: "good",
  OPTIONAL: "neutral",
  UNNECESSARY: "warn",
  CONTRAINDICATED: "bad",
};

const CATEGORY_LABEL: Record<string, string> = {
  HISTORY: "History",
  EXAM: "Examination",
  VITAL: "Vital signs",
  LAB: "Laboratory (narrative)",
  IMAGING: "Imaging (narrative)",
  ECG: "ECG",
  OTHER: "Other studies",
};

const STATE_BADGE: Record<string, { label: string; tone: Tone }> = {
  PENDING_HANDOFF: { label: "Handoff", tone: "info" },
  PENDING_ADMISSION: { label: "Admission", tone: "warn" },
  ON_SERVICE: { label: "On service", tone: "neutral" },
  DISCHARGE_ELIGIBLE: { label: "Discharge ready", tone: "good" },
  DISCHARGED: { label: "Discharged", tone: "neutral" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

/** Patient chart. Active patients see only what they have uncovered (spec §56). */
export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: requestedTab } = await searchParams;
  const database = db();
  const patient = getPatient(database, id);
  if (!patient) notFound();

  const template = getCaseById(database, patient.caseId);
  if (!template) notFound();

  const isDischarged = patient.state === "DISCHARGED" || patient.state === "ARCHIVED";
  const undifferentiated = patient.state === "PENDING_ADMISSION";
  const prefs = getPreferences(database);

  const revealedIds = new Set(listRevealedFindingIds(database, patient.id));
  const allFindings = getCaseFindings(database, patient.caseId);
  const taken = listPatientActions(database, patient.id);
  const takenCodes = new Set(taken.map((a) => a.actionCode));

  // A discharged patient becomes a full case review (spec §25); an active one
  // shows only what the learner has legitimately encountered.
  const visibleFindings = isDischarged
    ? allFindings
    : allFindings.filter((f) => f.initiallyVisible || revealedIds.has(f.id));

  // Handoff patients arrive with their story told, so their results are known.
  const unlockedFor = isDischarged || patient.entryMode === "HANDOFF" ? null : takenCodes;
  const labPanels = buildLabPanels(database, patient.caseId, {
    takenActionCodes: unlockedFor,
    patientSex: (template.patientSex as "M" | "F" | null) ?? null,
  });
  const imaging = buildImagingViews(database, patient.caseId, unlockedFor);
  const chart = buildChart(database, patient.id, patient.caseId);

  const groups = Object.entries(
    visibleFindings.reduce<Record<string, typeof visibleFindings>>((acc, finding) => {
      (acc[finding.category] ??= []).push(finding);
      return acc;
    }, {}),
  );

  const actionDefs = new Map(listActions(database).map((a) => [a.actionCode, a]));
  const responses = listPromptResponses(database, patient.id);

  const conceptIds = getCaseConceptIds(database, patient.caseId);
  const concepts = conceptIds.length
    ? database.select().from(schema.concept).where(inArray(schema.concept.id, conceptIds)).all()
    : [];
  const conceptStates = new Map(
    (conceptIds.length
      ? database
          .select()
          .from(schema.userConceptState)
          .where(inArray(schema.userConceptState.conceptId, conceptIds))
          .all()
      : []
    ).map((s) => [s.conceptId, s]),
  );

  const promptsById = new Map(
    (["ROUNDS", "DISCHARGE", "ADMISSION", "HANDOFF"] as const)
      .flatMap((stage) => getCasePrompts(database, patient.caseId, stage))
      .map((p) => [p.id, p]),
  );

  const dischargePrompts = getCasePrompts(database, patient.caseId, "DISCHARGE");
  const answeredDischarge = new Set(
    responses.filter((r) => r.stage === "DISCHARGE").map((r) => r.promptId),
  );
  const pendingDischargePrompt = dischargePrompts.find((p) => !answeredDischarge.has(p.id));
  const correctCount = responses.filter((r) => r.correct).length;

  // Only offer tabs that actually have something behind them (spec §52).
  const available: ChartTab[] = ["summary"];
  if (labPanels.length > 0 || imaging.length > 0 || groups.length > 0) available.push("results");
  if (responses.length > 0 || taken.length > 0) available.push("rounds");
  if (chart.length > 0) available.push("chart");

  const tab = parseChartTab(requestedTab, available);

  const visual = resolvePatientVisual({ patientName: patient.patientName });

  return (
    <>
      <AppHeader subtitle="Patient chart" />

      <PatientHeader
        visual={visual}
        name={patient.patientName}
        ageYears={template.patientAgeYears}
        sex={template.patientSex}
        roomNumber={patient.roomNumber}
        hospitalDay={hospitalDay(patient)}
        diagnosis={undifferentiated ? null : template.primaryDiagnosis}
        allergies={undifferentiated ? undefined : template.allergies}
        codeStatus={undifferentiated ? undefined : template.codeStatus}
        status={STATE_BADGE[patient.state] ?? null}
      />
      <ChartTabs patientId={patient.id} active={tab} available={available} />

      <PageShell>
        <Link href="/" className="text-xs font-medium text-clinical-600">
          ‹ Back to service
        </Link>

        {/* --- state-specific calls to action ----------------------------- */}
        {patient.state === "DISCHARGE_ELIGIBLE" ? (
          <section className="mt-4">
            <SectionHeading>Discharge</SectionHeading>
            <DischargeFlow
              patientId={patient.id}
              patientName={patient.patientName}
              prompt={
                pendingDischargePrompt
                  ? {
                      id: pendingDischargePrompt.id,
                      promptText: pendingDischargePrompt.promptText,
                      responseType: pendingDischargePrompt.responseType,
                      choices: promptChoices(pendingDischargePrompt),
                      allowsFreeText: pendingDischargePrompt.responseType === "SHORT_TEXT",
                    }
                  : null
              }
              audio={getAudioPreferences(database)}
            />
          </section>
        ) : null}

        {undifferentiated ? (
          <Card className="mt-4 border-warn-200 bg-warn-50 p-3">
            <p className="text-sm text-warn-700">
              This patient is waiting in the emergency department. Open
              Admissions to work them up.
            </p>
            <Link
              href="/admissions"
              className="mt-2 inline-flex h-10 items-center rounded-lg bg-clinical-600 px-4 text-sm font-semibold text-white"
            >
              Go to admission
            </Link>
          </Card>
        ) : null}

        {patient.state === "PENDING_HANDOFF" ? (
          <Card className="mt-4 border-clinical-200 bg-clinical-50 p-3">
            <p className="text-sm text-clinical-700">
              This patient is on the handoff list and has not been accepted yet.
            </p>
            <Link
              href="/handoff"
              className="mt-2 inline-flex h-10 items-center rounded-lg bg-clinical-600 px-4 text-sm font-semibold text-white"
            >
              Go to handoff
            </Link>
          </Card>
        ) : null}

        {/* ------------------------------ summary -------------------------- */}
        {tab === "summary" ? (
          <div className="mt-4 space-y-4">
            <section>
              <SectionHeading>Presentation</SectionHeading>
              <Card className="p-4">
                {template.chiefComplaint ? (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Chief complaint — {template.chiefComplaint}
                  </p>
                ) : null}
                <p className="text-sm leading-relaxed text-ink-800">
                  {template.admissionOpening}
                </p>
              </Card>
            </section>

            {!undifferentiated && template.handoffScript ? (
              <section>
                <SectionHeading>Sign-out</SectionHeading>
                <Card className="p-4">
                  <p className="text-sm leading-relaxed text-ink-800">
                    {template.handoffScript}
                  </p>
                </Card>
              </section>
            ) : null}

            {!undifferentiated && template.teachingPoint ? (
              <section>
                <SectionHeading>Teaching point</SectionHeading>
                <Card className="border-clinical-200 bg-clinical-50 p-4">
                  <p className="text-sm leading-relaxed text-clinical-700">
                    {template.teachingPoint}
                  </p>
                </Card>
              </section>
            ) : null}

            {concepts.length > 0 ? (
              <section>
                <SectionHeading>Concepts encountered</SectionHeading>
                <Card className="divide-y divide-ink-100">
                  {concepts.map((concept) => {
                    const state = conceptStates.get(concept.id);
                    return (
                      <div
                        key={concept.id}
                        className="flex justify-between gap-4 px-4 py-2.5"
                      >
                        <span className="min-w-0 text-sm text-ink-700">
                          <span className="block truncate">{concept.name}</span>
                          <span className="block text-xs text-ink-400">{concept.code}</span>
                        </span>
                        <span className="shrink-0 text-right text-xs text-ink-500">
                          Mastery {state?.masteryLevel ?? 0}/5
                          {state?.nextDueAt ? (
                            <span className="block text-ink-400">
                              due {formatShortDate(state.nextDueAt)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              </section>
            ) : null}
          </div>
        ) : null}

        {/* ------------------------------ results -------------------------- */}
        {tab === "results" ? (
          <div className="mt-4 space-y-5">
            <LabPanels
              panels={labPanels}
              showReferenceRanges={prefs.labs.showReferenceRanges}
            />

            {imaging.length > 0 ? (
              <section>
                <SectionHeading>Imaging</SectionHeading>
                <ImagingList studies={imaging} />
              </section>
            ) : null}

            {groups.map(([category, findings]) => (
              <section key={category}>
                <SectionHeading>{CATEGORY_LABEL[category] ?? category}</SectionHeading>
                <Card className="divide-y divide-ink-100">
                  {findings.map((finding) => (
                    <div key={finding.id} className="flex justify-between gap-4 px-4 py-2.5">
                      <span className="text-sm text-ink-600">{finding.label}</span>
                      <span className="text-right text-sm text-ink-900">
                        {finding.value}
                        {finding.units ? ` ${finding.units}` : ""}
                        {finding.referenceRange && prefs.labs.showReferenceRanges ? (
                          <span className="ml-2 text-xs text-ink-400">
                            ({finding.referenceRange})
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </Card>
              </section>
            ))}
          </div>
        ) : null}

        {/* ------------------------------- chart --------------------------- */}
        {tab === "chart" ? (
          <div className="mt-4">
            <SectionHeading>Assessment &amp; plan</SectionHeading>
            <AssessmentPlan
              patientId={patient.id}
              problems={chart.map((problem) => ({
                id: problem.id,
                label: problem.label,
                assessmentText: problem.assessmentText,
                isPrimary: problem.isPrimary,
                added: problem.added,
                options: problem.options.map((o) => ({
                  id: o.id,
                  label: o.label,
                  selected: o.selected,
                })),
              }))}
              readOnly={isDischarged}
            />
          </div>
        ) : null}

        {/* ------------------------------- rounds -------------------------- */}
        {tab === "rounds" ? (
          <div className="mt-4 space-y-4">
            {taken.length > 0 ? (
              <section>
                <SectionHeading>Orders and actions</SectionHeading>
                <Card className="divide-y divide-ink-100">
                  {taken.map((action) => (
                    <div key={action.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-ink-800">
                          {actionDefs.get(action.actionCode)?.displayName ?? action.actionCode}
                        </p>
                        <Badge tone={CLASSIFICATION_TONE[action.classification] ?? "neutral"}>
                          {action.classification}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-600">{action.resultText}</p>
                    </div>
                  ))}
                </Card>
              </section>
            ) : null}

            {responses.length > 0 ? (
              <section>
                <SectionHeading>
                  Study performance — {correctCount}/{responses.length} correct
                </SectionHeading>
                <Card className="divide-y divide-ink-100">
                  {responses.map((response) => {
                    const prompt = promptsById.get(response.promptId);
                    return (
                      <div key={response.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-ink-800">
                            {prompt?.promptText ?? "Question"}
                          </p>
                          <Badge tone={response.correct ? "good" : "warn"}>
                            {response.correct ? "Correct" : "Missed"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          {response.stage.toLowerCase()} ·{" "}
                          {formatShortDate(response.createdAt.slice(0, 10))}
                        </p>
                      </div>
                    );
                  })}
                </Card>
              </section>
            ) : null}
          </div>
        ) : null}

      </PageShell>
    </>
  );
}
