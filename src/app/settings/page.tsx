import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { toggleAutoReadAction } from "@/app/actions";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Card, SectionHeading } from "@/components/ui";
import { OnboardingForm } from "@/app/onboarding/OnboardingForm";
import { RotationEditor } from "@/app/onboarding/RotationEditor";
import {
  getAudioPreferences,
  getProfile,
  listRotations,
} from "@/domain/profile";
import { db } from "@/server/db";
import { addDays, todayIso } from "@/lib/date";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const database = db();
  const profile = getProfile(database);
  const rotations = listRotations(database);
  const audio = getAudioPreferences(database);

  return (
    <>
      <AppHeader rotationName="Settings" />
      <PageShell>
        <h1 className="mb-4 text-lg font-semibold text-ink-900">Settings</h1>

        <SectionHeading>Audio</SectionHeading>
        <Card className="p-4">
          <form action={toggleAutoReadAction}>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="autoRead"
                defaultChecked={audio.autoRead}
                className="mt-1 h-5 w-5 rounded border-ink-300"
              />
              <span>
                <span className="block text-sm font-medium text-ink-800">
                  Auto-read clinical content aloud
                </span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  When enabled, opening handoff starts reading automatically and
                  conferences advance section by section. Speed and voice are
                  chosen in the player and are remembered.
                </span>
              </span>
            </label>
            <button
              type="submit"
              className="mt-3 h-11 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
            >
              Save audio preference
            </button>
          </form>
          <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-400">
            Speech uses the browser&apos;s built-in synthesis. Voice availability
            and quality vary between browsers, and some have no voices at all —
            in that case all content remains readable on screen.
          </p>
        </Card>

        <section className="mt-6">
          <SectionHeading>Profile</SectionHeading>
          <Card className="p-4">
            <OnboardingForm profile={profile} defaultStep3Date={addDays(todayIso(), 120)} />
          </Card>
        </section>

        <section className="mt-6">
          <SectionHeading>Rotation schedule</SectionHeading>
          <RotationEditor rotations={rotations} />
        </section>

        <section className="mt-6">
          <SectionHeading>Developer</SectionHeading>
          <Card className="p-4">
            <p className="text-sm text-ink-700">
              Scheduler inspector and demo data management.
            </p>
            <Link
              href="/settings/developer"
              className="mt-3 inline-flex h-11 items-center rounded-lg border border-ink-200 px-4 text-sm font-medium text-ink-700"
            >
              Open developer tools ›
            </Link>
          </Card>
        </section>

        <section className="mt-6">
          <SectionHeading>About</SectionHeading>
          <Card className="p-4">
            <p className="text-sm text-ink-700">{APP_CONFIG.educationalDisclaimer}</p>
            <p className="mt-2 text-xs text-ink-400">
              All clinical content currently loaded is original synthetic
              material authored for this prototype. It is labelled{" "}
              <code className="rounded bg-ink-100 px-1">
                {APP_CONFIG.demo.contentOrigin}
              </code>{" "}
              and is not derived from any question bank or textbook.
            </p>
          </Card>
        </section>
      </PageShell>
    </>
  );
}
