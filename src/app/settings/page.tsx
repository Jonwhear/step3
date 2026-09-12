import Link from "next/link";
import { INPATIENT_ROOM_COUNT, INPATIENT_UNIT } from "@/config/hospital";
import { resetPreferencesAction } from "@/app/actions";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Card, SectionHeading } from "@/components/ui";
import { OnboardingForm } from "@/app/onboarding/OnboardingForm";
import { RotationEditor } from "@/app/onboarding/RotationEditor";
import {
  ReviewIntervalsEditor,
  SegmentedPreference,
  TogglePreference,
} from "./PreferenceControls";
import { getProfile, listRotations } from "@/domain/profile";
import {
  getPreferences,
  MAX_REVIEW_INTERVAL_DAYS,
  MIN_REVIEW_INTERVAL_DAYS,
  resolveSchedulerTuning,
  REVIEWABLE_LEVELS,
  SETTINGS_KEYS,
} from "@/domain/settings";
import { MASTERY_LABELS } from "@/config/scheduler";
import { db } from "@/server/db";
import { addDays, todayIso } from "@/lib/date";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const database = db();
  const profile = getProfile(database);
  const rotations = listRotations(database);
  const prefs = getPreferences(database);
  const tuning = resolveSchedulerTuning(prefs.scheduler);

  const censusOptions = Array.from({ length: 6 }, (_, i) => ({
    value: String(i + 5),
    label: String(i + 5),
  }));

  return (
    <>
      <AppHeader subtitle="Settings" />
      <PageShell>
        <h1 className="mb-4 text-lg font-semibold text-ink-900">Settings</h1>

        {/* --- profile & study plan --------------------------------------- */}
        <SectionHeading>Profile &amp; study plan</SectionHeading>
        <Card className="p-4">
          <p className="mb-3 text-xs text-ink-500">
            Changing your Step 3 date or target recalculates pacing from the next
            scheduler run. Your progress is never reset.
          </p>
          <OnboardingForm profile={profile} defaultStep3Date={addDays(todayIso(), 120)} />
        </Card>

        <section className="mt-6">
          <SectionHeading>Rotation schedule</SectionHeading>
          <RotationEditor rotations={rotations} />
        </section>

        {/* --- appearance --------------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Appearance</SectionHeading>
          <Card className="space-y-5 p-4">
            <SegmentedPreference
              label="Theme"
              hint="System follows your device setting."
              settingKey={SETTINGS_KEYS.theme}
              value={prefs.appearance.theme}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <SegmentedPreference
              label="Font size"
              settingKey={SETTINGS_KEYS.fontSize}
              value={prefs.appearance.fontSize}
              options={[
                { value: "compact", label: "Compact" },
                { value: "standard", label: "Standard" },
                { value: "large", label: "Large" },
              ]}
            />
            <SegmentedPreference
              label="Density"
              hint="Compact tightens spacing between chart blocks."
              settingKey={SETTINGS_KEYS.density}
              value={prefs.appearance.density}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
            />
            <SegmentedPreference
              label="Accent colour"
              settingKey={SETTINGS_KEYS.accent}
              value={prefs.appearance.accent}
              options={[
                { value: "clinical", label: "Ceil" },
                { value: "teal", label: "Teal" },
                { value: "indigo", label: "Indigo" },
                { value: "slate", label: "Slate" },
              ]}
            />
          </Card>
        </section>

        {/* --- labs --------------------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Laboratory display</SectionHeading>
          <Card className="p-4">
            <TogglePreference
              label="Show laboratory reference ranges"
              hint="Mirrors how ranges are presented on the exam. Abnormal flags stay visible either way."
              settingKey={SETTINGS_KEYS.showLabReferenceRanges}
              enabled={prefs.labs.showReferenceRanges}
            />
          </Card>
        </section>

        {/* --- scheduler ---------------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Scheduler</SectionHeading>
          <Card className="space-y-5 p-4">
            <SegmentedPreference
              label="Daily workload intensity"
              hint="Scales how many new patients arrive each day."
              settingKey={SETTINGS_KEYS.workloadIntensity}
              value={prefs.scheduler.workloadIntensity}
              options={[
                { value: "light", label: "Light" },
                { value: "standard", label: "Standard" },
                { value: "high", label: "High" },
              ]}
            />
            <SegmentedPreference
              label="Maximum active census"
              hint={`${INPATIENT_UNIT} physically holds ${INPATIENT_ROOM_COUNT} patients; the lower of the two applies.`}
              settingKey={SETTINGS_KEYS.maxCensus}
              value={String(prefs.scheduler.maxCensus)}
              options={censusOptions}
            />
            <SegmentedPreference
              label="Catch-up intensity"
              hint="How quickly missed days are repaid."
              settingKey={SETTINGS_KEYS.catchUpIntensity}
              value={prefs.scheduler.catchUpIntensity}
              options={[
                { value: "gentle", label: "Gentle" },
                { value: "standard", label: "Standard" },
                { value: "aggressive", label: "Aggressive" },
              ]}
            />
            <SegmentedPreference
              label="Current-rotation emphasis"
              hint="How strongly today's rotation pulls matching cases forward."
              settingKey={SETTINGS_KEYS.rotationEmphasis}
              value={prefs.scheduler.rotationEmphasis}
              options={[
                { value: "low", label: "Low" },
                { value: "standard", label: "Standard" },
                { value: "high", label: "High" },
              ]}
            />

            <div className="border-t border-ink-100 pt-4">
              <ReviewIntervalsEditor
                intervals={prefs.scheduler.reviewIntervals}
                levels={REVIEWABLE_LEVELS}
                labels={MASTERY_LABELS}
                min={MIN_REVIEW_INTERVAL_DAYS}
                max={MAX_REVIEW_INTERVAL_DAYS}
              />
            </div>

            <div className="border-t border-ink-100 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                Resolved values
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-ink-500">Effective census cap</dt>
                <dd className="tabular-nums text-ink-800">{tuning.effectiveCensusCap}</dd>
                <dt className="text-ink-500">Workload multiplier</dt>
                <dd className="tabular-nums text-ink-800">
                  {tuning.workloadMultiplier.toFixed(2)}×
                </dd>
                <dt className="text-ink-500">Catch-up spread</dt>
                <dd className="tabular-nums text-ink-800">
                  {tuning.catchUpSpreadDays} days, max +{tuning.catchUpCap}/day
                </dd>
                <dt className="text-ink-500">Rotation weight</dt>
                <dd className="tabular-nums text-ink-800">
                  {tuning.rotationRelevanceWeight.toFixed(2)}
                </dd>
              </dl>
            </div>

            <form action={resetPreferencesAction}>
              <button
                type="submit"
                className="h-11 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
              >
                Reset all preferences to defaults
              </button>
            </form>
          </Card>
        </section>

        {/* --- advanced ----------------------------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Advanced</SectionHeading>
          <Card className="divide-y divide-ink-100">
            <SettingsLink
              href="/settings/content"
              title="Content library"
              body="Browse, validate, edit and publish cases. Manage sources, learning points and content packs."
            />
            <SettingsLink
              href="/settings/content/coverage"
              title="Content coverage audit"
              body="Where each source learning point is tested, and what is still unmapped."
            />
            <SettingsLink
              href="/settings/developer"
              title="Developer tools"
              body="Scheduler inspector, room state, audio state and demo data management."
            />
          </Card>
        </section>

      </PageShell>
    </>
  );
}

function SettingsLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="tap block px-4 py-3">
      <p className="text-sm font-medium text-ink-800">
        {title}
        <span aria-hidden="true" className="ml-1.5 text-ink-300">
          ›
        </span>
      </p>
      <p className="mt-0.5 text-xs text-ink-500">{body}</p>
    </Link>
  );
}
