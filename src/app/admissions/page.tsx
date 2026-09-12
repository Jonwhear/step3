import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/ui";
import { listActions } from "@/domain/actions";
import {
  getCaseActionRules,
  getCaseById,
  getCaseFindings,
  getCasePrompts,
  promptChoices,
} from "@/domain/cases";
import { getEdCapacity, listEdBoard } from "@/domain/admissions";
import { getPatient, listPatientActions, listPromptResponses } from "@/domain/patients";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";
import { formatLongDate } from "@/lib/date";
import { AdmissionWorkup, type AdmissionCase } from "./AdmissionWorkup";
import { EdBoard } from "./EdBoard";

export const dynamic = "force-dynamic";

export default function AdmissionsPage() {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");
  const database = db();

  const waiting = session.pendingAdmission[0];

  // The board is built even when a scheduled admission is waiting, so the
  // learner can queue up extra work without leaving the screen.
  const edBoard = listEdBoard(database, { today: session.today });
  const edCapacity = getEdCapacity(database);

  if (!waiting) {
    return (
      <>
        <AppHeader subtitle={session.rotation.serviceLabel} />
        <PageShell>
          <header className="mb-4">
            <h1 className="text-lg font-semibold text-ink-900">Admissions</h1>
            <p className="text-sm text-ink-500">{formatLongDate(session.today)}</p>
            <p className="mt-2 text-sm text-ink-600">
              Nothing has been signed out to you right now. New admissions arrive
              as the scheduler decides you are ready for a topic — or you can
              pick someone up from the board below.
            </p>
          </header>
          <EdBoard entries={edBoard} capacity={edCapacity} />
        </PageShell>
      </>
    );
  }

  const patient = getPatient(database, waiting.id);
  const template = patient ? getCaseById(database, patient.caseId) : null;
  if (!patient || !template) redirect("/");

  // Actions are limited to what this case can respond to, plus a modest shared
  // set — enough to feel open without offering hundreds of dead ends.
  const ruleCodes = new Set(getCaseActionRules(database, template.id).map((r) => r.actionCode));
  const findingTriggers = new Set(
    getCaseFindings(database, template.id)
      .map((f) => f.triggerActionCode)
      .filter((code): code is string => Boolean(code)),
  );
  const relevant = new Set([...ruleCodes, ...findingTriggers]);

  const available = listActions(database)
    .filter((a) => relevant.has(a.actionCode))
    .map((a) => ({
      actionCode: a.actionCode,
      displayName: a.displayName,
      category: a.category,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const taken = listPatientActions(database, patient.id).map((a) => {
    const def = listActions(database).find((d) => d.actionCode === a.actionCode);
    return {
      actionCode: a.actionCode,
      displayName: def?.displayName ?? a.actionCode,
      classification: a.classification,
      resultText: a.resultText,
    };
  });

  const vitals = getCaseFindings(database, template.id)
    .filter((f) => f.category === "VITAL" && f.initiallyVisible)
    .map((f) => ({ label: f.label, value: f.units ? `${f.value} ${f.units}` : f.value }));

  const prompts = getCasePrompts(database, template.id, "ADMISSION").map((p) => ({
    id: p.id,
    promptText: p.promptText,
    responseType: p.responseType,
    choices: promptChoices(p),
    allowsFreeText: p.responseType === "SHORT_TEXT",
  }));

  const answeredPromptIds = listPromptResponses(database, patient.id)
    .filter((r) => r.stage === "ADMISSION")
    .map((r) => r.promptId);

  const admission: AdmissionCase = {
    patientId: patient.id,
    caseId: template.id,
    patientName: patient.patientName,
    roomNumber: patient.roomNumber,
    opening: template.admissionOpening,
    vitals,
    available,
    taken,
    prompts,
    answeredPromptIds,
  };

  return (
    <>
      <AppHeader subtitle={session.rotation.serviceLabel} />
      <PageShell>
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-ink-900">Admission</h1>
          <p className="text-sm text-ink-500">{formatLongDate(session.today)}</p>
          {session.pendingAdmission.length > 1 ? (
            <p className="mt-1 text-xs text-ink-400">
              {session.pendingAdmission.length - 1} more waiting after this one.
            </p>
          ) : null}
        </header>
        <AdmissionWorkup admission={admission} audio={session.audio} />

        <section className="mt-8">
          <SectionHeading>Also waiting in the ED</SectionHeading>
          <EdBoard entries={edBoard} capacity={edCapacity} />
        </section>
      </PageShell>
    </>
  );
}
