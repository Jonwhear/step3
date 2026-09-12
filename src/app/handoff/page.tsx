import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/ui";
import { getCaseById } from "@/domain/cases";
import { getPatient } from "@/domain/patients";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";
import { formatLongDate } from "@/lib/date";
import { HandoffRunner, type HandoffItem } from "./HandoffRunner";

export const dynamic = "force-dynamic";

export default function HandoffPage() {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");
  const database = db();

  // The list is ordered by room number and stays stable while the learner
  // works through it: accepting a patient changes its badge, not its position.
  const sorted = [...session.panel]
    .filter((p) => p.state !== "PENDING_ADMISSION")
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

  const incomingCount = sorted.filter((p) => p.state === "PENDING_HANDOFF").length;

  const items = sorted
    .map((panelPatient): HandoffItem | null => {
      const patient = getPatient(database, panelPatient.id);
      if (!patient) return null;
      const template = getCaseById(database, patient.caseId);
      if (!template) return null;

      // A patient the learner has not accepted yet gets the full teaching
      // sign-out; one already on the service gets the concise daily version.
      const isNew = patient.state === "PENDING_HANDOFF";
      const script = isNew ? template.handoffScript : template.dailySignout;

      return {
        patientId: patient.id,
        patientName: patient.patientName,
        roomNumber: patient.roomNumber,
        caseTitle: template.title,
        diagnosis: template.primaryDiagnosis,
        script: `Room ${patient.roomNumber}. ${patient.patientName}. ${script}`,
        teachingPoint: template.teachingPoint,
        isNew,
        hospitalDay: panelPatient.hospitalDay,
      };
    })
    .filter((item): item is HandoffItem => item !== null);

  return (
    <>
      <AppHeader subtitle={session.rotation.serviceLabel} />
      <PageShell>
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-ink-900">Morning Handoff</h1>
          <p className="text-sm text-ink-500">{formatLongDate(session.today)}</p>
          <p className="mt-2 text-sm text-ink-600">
            {incomingCount > 0
              ? `The overnight team has ${incomingCount} new patient${incomingCount === 1 ? "" : "s"} for you, plus sign-out on your existing service.`
              : "Sign-out on your existing service. No new patients overnight."}
          </p>
        </header>

        <SectionHeading>Sign-out</SectionHeading>
        <HandoffRunner items={items} audio={session.audio} />
      </PageShell>
    </>
  );
}
