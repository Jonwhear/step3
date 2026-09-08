import { APP_CONFIG } from "@/config/app";
import { finishOnboardingAction } from "@/app/actions";
import { Card, SectionHeading } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { hasDemoContent } from "@/db/seed";
import { getProfile, listRotations } from "@/domain/profile";
import { db } from "@/server/db";
import { addDays, todayIso } from "@/lib/date";
import { OnboardingForm } from "./OnboardingForm";
import { RotationEditor } from "./RotationEditor";
import { SeedPrompt } from "./SeedPrompt";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  const database = db();
  const profile = getProfile(database);
  const rotations = listRotations(database);
  const seeded = hasDemoContent(database);

  return (
    <PageShell>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-500">
          Welcome to
        </p>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">
          {APP_CONFIG.hospitalName}
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          You are joining as a resident on our teaching service. Tell us a little
          about your training and your exam plan, and we will build a patient
          panel around it.
        </p>
      </header>

      <section>
        <SectionHeading>Step 1 — Your details</SectionHeading>
        <Card className="p-4">
          <OnboardingForm profile={profile} defaultStep3Date={addDays(todayIso(), 120)} />
        </Card>
      </section>

      <section className="mt-6">
        <SectionHeading>Step 2 — Rotation schedule</SectionHeading>
        <p className="mb-2 text-sm text-ink-500">
          Add the blocks you know about. A complete year is not required — days
          outside any block use the general service.
        </p>
        <RotationEditor rotations={rotations} />
      </section>

      <section className="mt-6">
        <SectionHeading>Step 3 — Teaching content</SectionHeading>
        <SeedPrompt seeded={seeded} />
      </section>

      <section className="mt-8">
        <form action={finishOnboardingAction}>
          <button
            type="submit"
            disabled={!profile}
            className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-40"
          >
            {profile ? "Start on the service" : "Save your profile first"}
          </button>
        </form>
        {!profile ? (
          <p className="mt-2 text-center text-xs text-ink-400">
            Save your details above to continue.
          </p>
        ) : null}
      </section>
    </PageShell>
  );
}
