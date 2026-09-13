import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { getCaseById } from "@/domain/cases";
import { listActivePanel } from "@/domain/patients";
import { initialsFor, sortByRoomOrder } from "@/domain/rooms";
import { buildRoundsEncounter, roundsStatusFor } from "@/domain/rounds";
import { getPreferences } from "@/domain/settings";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";
import { formatLongDate } from "@/lib/date";
import { RoundsRunner, type RoundsStop } from "./RoundsRunner";

export const dynamic = "force-dynamic";

export default function RoundsPage() {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");
  const database = db();
  const prefs = getPreferences(database);

  // Everyone on service today, finished or not. Keeping the finished ones on
  // the list is what stops a patient disappearing the moment their note is
  // signed, taking the grading the learner just asked for with them.
  const onService = sortByRoomOrder(database, listActivePanel(database)).filter((patient) => {
    const status = roundsStatusFor(database, patient, session.today);
    return status === "DUE" || status === "COMPLETED_TODAY";
  });

  const stops: RoundsStop[] = onService
    .map((patient) => {
      const template = getCaseById(database, patient.caseId);
      if (!template) return null;

      const encounter = buildRoundsEncounter(database, patient, template, {
        today: session.today,
      });

      // Age is embedded in the opening line rather than stored separately.
      const ageMatch = /(\d{1,3})[- ]?(?:year|month)[- ]old/.exec(template.admissionOpening);

      return {
        patientId: encounter.patientId,
        patientName: encounter.patientName,
        initials: initialsFor(patient.patientName),
        roomNumber: encounter.roomNumber,
        age: ageMatch?.[0] ?? "",
        diagnosis: encounter.diagnosis ?? "Undifferentiated",
        hospitalDay: encounter.hospitalDay,
        status: encounter.status,
        roundsCompleted: encounter.roundsCompleted,
        minimumRounds: encounter.minimumRounds,
        dischargeEligible: encounter.dischargeEligible,
        prompt: encounter.prompt,
        answeredToday: encounter.answeredToday,
        vitals: encounter.vitals,
        labPanels: encounter.labPanels,
        imaging: encounter.imaging,
        findings: encounter.findings,
        priorAnswers: encounter.priorAnswers,
        noteSignedToday: encounter.noteSignedToday,
        problems: encounter.problems.map((problem) => ({
          id: problem.id,
          label: problem.label,
          assessmentText: problem.assessmentText,
          isPrimary: problem.isPrimary,
          added: problem.added,
          addedOnDay: problem.addedOnDay,
          resolvedOnDay: problem.resolvedOnDay,
          options: problem.options.map((o) => ({
            id: o.id,
            label: o.label,
            selected: o.selected,
          })),
        })),
      } satisfies RoundsStop;
    })
    .filter((s): s is RoundsStop => s !== null);

  return (
    <>
      <AppHeader subtitle={session.rotation.serviceLabel} />
      <PageShell>
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-ink-900">Rounds</h1>
          <p className="text-sm text-ink-500">{formatLongDate(session.today)}</p>
        </header>
        <RoundsRunner
          stops={stops}
          audio={session.audio}
          showReferenceRanges={prefs.labs.showReferenceRanges}
        />
      </PageShell>
    </>
  );
}
