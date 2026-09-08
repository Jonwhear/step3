import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Card, SectionHeading, type Tone } from "@/components/ui";
import { listActions } from "@/domain/actions";
import {
  getCaseById,
  getCaseConceptIds,
  getCaseFindings,
  getCasePrompts,
  promptChoices,
} from "@/domain/cases";
import {
  getPatient,
  hospitalDay,
  listPatientActions,
  listPromptResponses,
  listRevealedFindingIds,
} from "@/domain/patients";
import { getAudioPreferences } from "@/domain/profile";
import { db } from "@/server/db";
import { formatShortDate } from "@/lib/date";
import * as schema from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
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
  LAB: "Laboratory",
  IMAGING: "Imaging",
  ECG: "ECG",
  OTHER: "Other studies",
};

/** Patient chart. Active patients see only what they have uncovered (spec §56). */
export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const database = db();
  const patient = getPatient(database, id);
  if (!patient) notFound();

  const template = getCaseById(database, patient.caseId);
  if (!template) notFound();

  const isDischarged = patient.state === "DISCHARGED" || patient.state === "ARCHIVED";
  const revealedIds = new Set(listRevealedFindingIds(database, patient.id));
  const allFindings = getCaseFindings(database, patient.caseId);

  // A discharged patient becomes a full case review; an active one shows only
  // what the learner has legitimately encountered.
  const visibleFindings = isDischarged
    ? allFindings
    : allFindings.filter((f) => f.initiallyVisible || revealedIds.has(f.id));

  const groups = Object.entries(
    visibleFindings.reduce<Record<string, typeof visibleFindings>>((acc, finding) => {
      (acc[finding.category] ??= []).push(finding);
      return acc;
    }, {}),
  );

  const actionDefs = new Map(listActions(database).map((a) => [a.actionCode, a]));
  const taken = listPatientActions(database, patient.id);
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

  return (
    <>
      <AppHeader rotationName="Patient chart" />
      <PageShell>
        <Link href="/" className="text-xs font-medium text-clinical-600">
          ‹ Back to service
        </Link>

        <Card className="mt-3 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-ink-500">
            Room {patient.roomNumber}
          </p>
          <h1 className="mt-1 text-lg font-semibold text-ink-900">{patient.patientName}</h1>
          <p className="mt-0.5 text-sm text-ink-600">
            {patient.state === "PENDING_ADMISSION"
              ? "Undifferentiated — pending admission workup"
              : template.primaryDiagnosis}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Hospital day {hospitalDay(patient)} · entered via{" "}
            {patient.entryMode === "HANDOFF" ? "handoff" : "admission"} ·{" "}
            {patient.roundsCompleted} round{patient.roundsCompleted === 1 ? "" : "s"}
            {isDischarged && patient.dischargedAt
              ? ` · discharged ${formatShortDate(patient.dischargedAt.slice(0, 10))}`
              : ""}
          </p>
        </Card>

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

        {patient.state === "PENDING_ADMISSION" ? (
          <section className="mt-4">
            <Card className="border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-900">
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
          </section>
        ) : null}

        {patient.state === "PENDING_HANDOFF" ? (
          <section className="mt-4">
            <Card className="border-clinical-200 bg-clinical-50 p-3">
              <p className="text-sm text-clinical-700">
                This patient is on the handoff list and has not been accepted
                yet.
              </p>
              <Link
                href="/handoff"
                className="mt-2 inline-flex h-10 items-center rounded-lg bg-clinical-600 px-4 text-sm font-semibold text-white"
              >
                Go to handoff
              </Link>
            </Card>
          </section>
        ) : null}

        {patient.state !== "PENDING_ADMISSION" ? (
          <section className="mt-6">
            <SectionHeading>Handoff</SectionHeading>
            <Card className="p-4">
              <p className="text-sm leading-relaxed text-ink-800">
                {template.handoffScript}
              </p>
            </Card>
          </section>
        ) : null}

        <section className="mt-6">
          <SectionHeading>Presentation</SectionHeading>
          <Card className="p-4">
            <p className="text-sm leading-relaxed text-ink-800">
              {template.admissionOpening}
            </p>
          </Card>
        </section>

        {groups.map(([category, findings]) => (
          <section key={category} className="mt-6">
            <SectionHeading>{CATEGORY_LABEL[category] ?? category}</SectionHeading>
            <Card className="divide-y divide-ink-100">
              {findings.map((finding) => (
                <div key={finding.id} className="flex justify-between gap-4 px-4 py-2.5">
                  <span className="text-sm text-ink-600">{finding.label}</span>
                  <span className="text-right text-sm text-ink-900">
                    {finding.value}
                    {finding.units ? ` ${finding.units}` : ""}
                    {finding.referenceRange ? (
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

        {taken.length > 0 ? (
          <section className="mt-6">
            <SectionHeading>Actions taken</SectionHeading>
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
          <section className="mt-6">
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

        {concepts.length > 0 ? (
          <section className="mt-6">
            <SectionHeading>Concepts encountered</SectionHeading>
            <Card className="divide-y divide-ink-100">
              {concepts.map((concept) => {
                const state = conceptStates.get(concept.id);
                return (
                  <div key={concept.id} className="flex justify-between gap-4 px-4 py-2.5">
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
      </PageShell>
    </>
  );
}

void eq;
