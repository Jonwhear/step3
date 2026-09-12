import Link from "next/link";
import { notFound } from "next/navigation";
import { inArray } from "drizzle-orm";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Card, Disclosure, SectionHeading } from "@/components/ui";
import { ChartTabs, parseChartTab, type ChartTab } from "@/components/emr/ChartTabs";
import { HospitalCourse } from "@/components/emr/HospitalCourse";
import { PatientHeader } from "@/components/emr/PatientHeader";
import { RoundsEncounter } from "@/components/emr/RoundsEncounter";
import { TeachingPoint } from "@/components/emr/TeachingPoint";
import { buildHospitalCourse, lastPlanSignedDate } from "@/domain/chart";
import { getCaseById, getCaseConceptIds, getCasePrompts, promptChoices } from "@/domain/cases";
import {
  getPatient,
  hospitalDayOn,
  listActivePanel,
  listPromptResponses,
} from "@/domain/patients";
import { getAudioPreferences } from "@/domain/profile";
import { buildRoundsEncounter } from "@/domain/rounds";
import { serviceNeighbours } from "@/domain/rooms";
import { getPreferences } from "@/domain/settings";
import { resolvePatientVisual } from "@/lib/assets";
import { db } from "@/server/db";
import { formatShortDate, todayIso } from "@/lib/date";
import * as schema from "@/db/schema";
import { DischargeFlow } from "./DischargeFlow";

export const dynamic = "force-dynamic";

/**
 * The patient chart: two tabs, because there are two things a learner does with
 * a patient — read them, and work them.
 *
 * Summary is the record: how they presented, what was handed over, and the
 * problem-based course as the learner's own signed plans have written it.
 * Rounds is today's work, and it holds the data the old Results tab used to,
 * because the point of looking at a potassium is the decision you make with it.
 */
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
  const today = todayIso();

  const patient = getPatient(database, id);
  if (!patient) notFound();

  const template = getCaseById(database, patient.caseId);
  if (!template) notFound();

  const undifferentiated = patient.state === "PENDING_ADMISSION";
  const isDischarged = patient.state === "DISCHARGED" || patient.state === "ARCHIVED";
  const prefs = getPreferences(database);

  const planSignedOn = lastPlanSignedDate(database, patient.id);
  const encounter = buildRoundsEncounter(database, patient, template, {
    today,
    planSignedOn,
  });
  const course = buildHospitalCourse(database, patient.id, patient.caseId);

  // The discharge question the case still has outstanding, if any. Discharge
  // itself stays governed by the case engine: eligibility is the patient's
  // state, not something the chart decides.
  const answeredDischarge = new Set(
    listPromptResponses(database, patient.id)
      .filter((r) => r.stage === "DISCHARGE")
      .map((r) => r.promptId),
  );
  const dischargePrompt = getCasePrompts(database, patient.caseId, "DISCHARGE").find(
    (p) => !answeredDischarge.has(p.id),
  );

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

  // The header arrows step room to room, skipping beds nobody is in.
  const neighbours = serviceNeighbours(database, listActivePanel(database), patient.id);
  const asTarget = (row: (typeof neighbours)["next"]) =>
    row ? { id: row.id, roomNumber: row.roomNumber, name: row.patientName } : null;

  const available: ChartTab[] = ["summary"];
  if (!undifferentiated && !isDischarged) available.push("rounds");
  const tab = parseChartTab(requestedTab, available);

  return (
    <>
      <AppHeader subtitle="Patient chart" />

      <PatientHeader
        visual={resolvePatientVisual({ patientName: patient.patientName })}
        name={patient.patientName}
        ageYears={template.patientAgeYears}
        sex={template.patientSex}
        roomNumber={patient.roomNumber}
        hospitalDay={hospitalDayOn(patient, today)}
        diagnosis={undifferentiated ? null : template.primaryDiagnosis}
        allergies={undifferentiated ? undefined : template.allergies}
        codeStatus={undifferentiated ? undefined : template.codeStatus}
        previous={asTarget(neighbours.previous)}
        next={asTarget(neighbours.next)}
        tab={tab}
      />
      <ChartTabs patientId={patient.id} active={tab} available={available} />

      <PageShell>
        <Link href="/" className="text-xs font-medium text-clinical-600">
          ‹ Back to service
        </Link>

        {/* --- state-specific calls to action ----------------------------- */}
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
                {template.teachingPoint ? (
                  <p className="mt-3">
                    <TeachingPoint text={template.teachingPoint} />
                  </p>
                ) : null}
              </Card>
            </section>

            {!undifferentiated && (template.dailySignout || template.handoffScript) ? (
              <section>
                <SectionHeading>
                  Overnight sign-out · Hospital day {hospitalDayOn(patient, today)}
                </SectionHeading>
                <Card className="p-4">
                  <p className="text-sm leading-relaxed text-ink-800">
                    {template.dailySignout || template.handoffScript}
                  </p>
                </Card>
              </section>
            ) : null}

            {!undifferentiated ? <HospitalCourse course={course} /> : null}

            {concepts.length > 0 ? (
              <Disclosure summary={`Concepts encountered (${concepts.length})`}>
                <ul className="divide-y divide-ink-100">
                  {concepts.map((concept) => {
                    const state = conceptStates.get(concept.id);
                    return (
                      <li key={concept.id} className="flex justify-between gap-4 py-2">
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
                      </li>
                    );
                  })}
                </ul>
              </Disclosure>
            ) : null}
          </div>
        ) : null}

        {/* ------------------------------- rounds -------------------------- */}
        {tab === "rounds" ? (
          <div className="mt-4">
            <RoundsEncounter
              patientId={patient.id}
              patientName={patient.patientName}
              hospitalDay={encounter.hospitalDay}
              status={encounter.status}
              prompt={encounter.prompt}
              answeredToday={encounter.answeredToday}
              vitals={encounter.vitals}
              labPanels={encounter.labPanels}
              imaging={encounter.imaging}
              findings={encounter.findings}
              problems={encounter.problems.map((problem) => ({
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
              priorAnswers={encounter.priorAnswers}
              dischargeEligible={encounter.dischargeEligible}
              showReferenceRanges={prefs.labs.showReferenceRanges}
              audio={getAudioPreferences(database)}
              discharge={
                encounter.dischargeEligible ? (
                  <DischargeFlow
                    patientId={patient.id}
                    patientName={patient.patientName}
                    prompt={
                      dischargePrompt
                        ? {
                            id: dischargePrompt.id,
                            promptText: dischargePrompt.promptText,
                            responseType: dischargePrompt.responseType,
                            choices: promptChoices(dischargePrompt),
                            allowsFreeText: dischargePrompt.responseType === "SHORT_TEXT",
                          }
                        : null
                    }
                    audio={getAudioPreferences(database)}
                  />
                ) : null
              }
            />
          </div>
        ) : null}
      </PageShell>
    </>
  );
}
