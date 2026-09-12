import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import {
  getCaseById,
  getCaseFindings,
  getCasePrompts,
  promptChoices,
} from "@/domain/cases";
import { buildChart, lastPlanSignedDate } from "@/domain/chart";
import { buildLabPanels } from "@/domain/labs";
import { getPatient, hasAnsweredPromptOn } from "@/domain/patients";
import { initialsFor } from "@/domain/rooms";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";
import { formatLongDate } from "@/lib/date";
import { RoundsRunner, type RoundsStop } from "./RoundsRunner";

export const dynamic = "force-dynamic";

export default function RoundsPage() {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");
  const database = db();

  const stops: RoundsStop[] = session.roundsDue
    .map((panelPatient) => {
      const patient = getPatient(database, panelPatient.id);
      if (!patient) return null;
      const template = getCaseById(database, patient.caseId);
      if (!template) return null;

      const prompts = getCasePrompts(database, patient.caseId, "ROUNDS");
      // The cursor cycles, so a long-stay patient keeps generating questions.
      const prompt = prompts.length
        ? prompts[patient.currentRoundPromptIndex % prompts.length]
        : undefined;

      const vitals = getCaseFindings(database, patient.caseId)
        .filter((f) => f.category === "VITAL")
        .map((f) => ({
          label: f.label,
          value: f.units ? `${f.value} ${f.units}` : f.value,
        }));

      // Age is embedded in the opening line rather than stored separately.
      const ageMatch = /(\d{1,3})[- ]?(?:year|month)[- ]old/.exec(
        template.admissionOpening,
      );

      // Overnight results are part of the bedside picture, so the abnormal
      // ones are surfaced at the stop rather than only inside the chart.
      const abnormalLabs = buildLabPanels(database, patient.caseId, {
        takenActionCodes: null,
        patientSex: (template.patientSex as "M" | "F" | null) ?? null,
      })
        .flatMap((panel) => panel.results)
        .filter((result) => result.flag !== "NORMAL")
        .slice(0, 6)
        .map((result) => ({
          label: result.displayName,
          value: result.units ? `${result.value} ${result.units}` : result.value,
          flag: result.flagLabel,
        }));

      const chart = buildChart(database, patient.id, patient.caseId);
      const planSignedOn = lastPlanSignedDate(database, patient.id);

      return {
        patientId: patient.id,
        patientName: patient.patientName,
        initials: initialsFor(patient.patientName),
        roomNumber: patient.roomNumber,
        age: ageMatch?.[0] ?? "",
        abnormalLabs,
        problems: chart.map((problem) => ({
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
        })),
        planSignedOn,
        diagnosis: template.primaryDiagnosis,
        hospitalDay: panelPatient.hospitalDay,
        roundsCompleted: patient.roundsCompleted,
        minimumRounds: template.minimumRoundsBeforeDischarge,
        vitals,
        answeredToday: prompt
          ? hasAnsweredPromptOn(database, patient.id, prompt.id, session.today)
          : false,
        prompt: prompt
          ? {
              id: prompt.id,
              promptText: prompt.promptText,
              responseType: prompt.responseType,
              choices: promptChoices(prompt),
              allowsFreeText: prompt.responseType === "SHORT_TEXT",
            }
          : null,
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
        <RoundsRunner stops={stops} audio={session.audio} />
      </PageShell>
    </>
  );
}
