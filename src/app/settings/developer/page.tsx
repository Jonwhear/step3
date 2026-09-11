import Link from "next/link";
import { eq } from "drizzle-orm";
import { APP_CONFIG } from "@/config/app";
import { SCHEDULER_CONFIG } from "@/config/scheduler";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Card, EmptyState, SectionHeading, StatRow } from "@/components/ui";
import * as schema from "@/db/schema";
import { INPATIENT_UNIT } from "@/config/hospital";
import { listCaseSummaries } from "@/domain/content/cases";
import { buildCoverageTotals } from "@/domain/content/provenance";
import {
  DEFAULT_REVIEW_INTERVALS,
  getReviewIntervals,
  REVIEWABLE_LEVELS,
} from "@/domain/settings";
import { buildFloorMap } from "@/domain/rooms";
import { getSchedulerDebug } from "@/domain/scheduler";
import { listStudyEvents } from "@/domain/patients";
import { db } from "@/server/db";
import { todayIso } from "@/lib/date";
import { AudioStateInspector } from "./AudioStateInspector";
import { DemoDataControls } from "./DemoDataControls";

export const dynamic = "force-dynamic";

/** Developer-only scheduler inspector and demo data management (spec §44, §38). */
export default function DeveloperPage() {
  const database = db();
  const today = todayIso();
  const debug = getSchedulerDebug(database, today);

  const counts = {
    Cases: database.select().from(schema.caseTemplate).where(eq(schema.caseTemplate.isDemo, true)).all().length,
    Concepts: database.select().from(schema.concept).where(eq(schema.concept.isDemo, true)).all().length,
    Lectures: database.select().from(schema.lecture).where(eq(schema.lecture.isDemo, true)).all().length,
    Actions: database.select().from(schema.actionDefinition).where(eq(schema.actionDefinition.isDemo, true)).all().length,
    Patients: database.select().from(schema.patientInstance).all().length,
    "Concept states": database.select().from(schema.userConceptState).all().length,
    "Study events": database.select().from(schema.studyEvent).all().length,
  };

  const events = listStudyEvents(database, 40);

  const floor = buildFloorMap(database, { today });
  const occupiedRooms = floor.filter((r) => r.patient).length;

  const allCases = listCaseSummaries(database);
  const publishedCases = allCases.filter((c) => c.status === "PUBLISHED").length;
  const casesWithErrors = allCases.filter((c) => c.errorCount > 0).length;
  const coverage = buildCoverageTotals(database);
  const reviewIntervals = getReviewIntervals(database);

  return (
    <>
      <AppHeader rotationName="Developer" />
      <PageShell>
        <Link href="/settings" className="text-xs font-medium text-clinical-600">
          ‹ Settings
        </Link>
        <h1 className="mt-3 text-lg font-semibold text-ink-900">Developer tools</h1>
        <p className="mt-1 text-sm text-ink-500">
          Everything the scheduler decided today, plus demo data management.
        </p>

        {/* ---------------------------- scheduler ---------------------------- */}
        <section className="mt-6">
          <SectionHeading>Scheduler — {today}</SectionHeading>
          {!debug ? (
            <EmptyState
              title="No scheduler run recorded for today"
              body="Complete onboarding and open the service screen to trigger a run."
            />
          ) : (
            <div className="space-y-3">
              <Card className="divide-y divide-ink-100 px-4">
                <StatRow
                  label="Rotation"
                  value={debug.rotation.name}
                  hint={debug.rotation.specialty}
                />
                <StatRow
                  label="Baseline new-patient rate"
                  value={debug.pacing.baselineRate.toFixed(2)}
                  hint="remaining / days left"
                />
                <StatRow
                  label="Expected progress"
                  value={debug.pacing.expectedProgress.toFixed(1)}
                  hint={`actual ${debug.pacing.actualProgress}`}
                />
                <StatRow label="Deficit" value={debug.pacing.deficit.toFixed(2)} />
                <StatRow
                  label="Catch-up adjustment"
                  value={`+${debug.pacing.catchUpAdjustment.toFixed(2)}`}
                  hint={`spread ${SCHEDULER_CONFIG.CATCHUP_SPREAD_DAYS}d, cap ${SCHEDULER_CONFIG.CATCHUP_CAP}`}
                />
                <StatRow
                  label="Today's target"
                  value={debug.pacing.dailyTarget}
                  hint={`raw ${debug.pacing.rawTarget.toFixed(2)}`}
                />
                <StatRow
                  label="Active panel size"
                  value={`${debug.activePanelSize} / ${debug.censusCap}`}
                  hint={`ward holds ${debug.physicalRoomCap}`}
                />
                <StatRow label="Available panel slots" value={debug.availableSlots} />
                <StatRow label="Available beds" value={debug.availableBeds} />
                <StatRow
                  label="Eligible cases"
                  value={debug.eligibleCaseCount}
                  hint={`${debug.excludedCaseCount} excluded of ${debug.totalCaseCount}`}
                />
                <StatRow label="New patients requested" value={debug.newPatientsRequested} />
                <StatRow label="New patients assigned" value={debug.newPatientsAssigned} />
                <StatRow label="Concepts due for review" value={debug.dueConceptCount} />
                <StatRow label="Weak concepts" value={debug.weakConceptCount} />
                <StatRow
                  label="Recent-lecture concepts"
                  value={debug.recentLectureConceptCount}
                  hint={`${SCHEDULER_CONFIG.RECENT_LECTURE_WINDOW_DAYS}d window`}
                />
              </Card>

              {/* Spec §36: never fail silently. */}
              {debug.blockedReason ? (
                <Card className="border-warn-200 bg-warn-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warn-700">
                    Why wasn&apos;t a patient assigned?
                  </p>
                  <p className="mt-1 text-sm text-warn-700">
                    {debug.blockedReason}
                  </p>
                </Card>
              ) : null}

              {debug.notes.length > 0 ? (
                <Card className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Notes
                  </p>
                  <ul className="mt-1 space-y-1">
                    {debug.notes.map((note) => (
                      <li key={note} className="text-sm text-ink-700">
                        · {note}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <Card className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  Lecture selection
                </p>
                <p className="mt-1 text-sm text-ink-700">
                  {debug.lecture.reason || "No lecture selected."}
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  Priority tier {debug.lecture.priority}
                </p>
              </Card>

              {debug.assigned.length > 0 ? (
                <Card className="divide-y divide-ink-100">
                  <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Assigned today
                  </p>
                  {debug.assigned.map((a) => (
                    <div key={a.caseId} className="p-3">
                      <p className="text-sm font-medium text-ink-900">
                        {a.roomNumber} — {a.patientName} · {a.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {a.code} · {a.entryMode} · score {a.score.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">{a.entryModeReason}</p>
                    </div>
                  ))}
                </Card>
              ) : null}

              <Card className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  Candidate scores
                </p>
                <p className="mt-1 mb-2 text-xs text-ink-400">
                  rotation×{SCHEDULER_CONFIG.WEIGHTS.rotationRelevance} + due×
                  {SCHEDULER_CONFIG.WEIGHTS.spacedRepetitionDue} + gap×
                  {SCHEDULER_CONFIG.WEIGHTS.curriculumGap} + weakness×
                  {SCHEDULER_CONFIG.WEIGHTS.weakness} + lecture×
                  {SCHEDULER_CONFIG.WEIGHTS.recentLecture} + importance×
                  {SCHEDULER_CONFIG.WEIGHTS.step3Importance} − recent×
                  {SCHEDULER_CONFIG.WEIGHTS.recentlySeen} + jitter
                </p>
                <div className="-mx-4 overflow-x-auto px-4">
                  <table className="w-full min-w-[42rem] text-xs">
                    <thead>
                      <tr className="border-b border-ink-200 text-left text-ink-500">
                        <th className="py-1 pr-2 font-medium">Case</th>
                        <th className="py-1 px-1 text-right font-medium">Rot</th>
                        <th className="py-1 px-1 text-right font-medium">Due</th>
                        <th className="py-1 px-1 text-right font-medium">Gap</th>
                        <th className="py-1 px-1 text-right font-medium">Weak</th>
                        <th className="py-1 px-1 text-right font-medium">Lec</th>
                        <th className="py-1 px-1 text-right font-medium">Imp</th>
                        <th className="py-1 px-1 text-right font-medium">Seen</th>
                        <th className="py-1 px-1 text-right font-medium">Jit</th>
                        <th className="py-1 pl-1 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {debug.candidateScores.map((s) => (
                        <tr key={s.caseId} className="border-b border-ink-100">
                          <td className="max-w-[14rem] truncate py-1 pr-2 text-ink-800">
                            {s.title}
                          </td>
                          <td className="py-1 px-1 text-right">+{s.rotationRelevance.toFixed(1)}</td>
                          <td className="py-1 px-1 text-right">+{s.spacedRepetitionDue.toFixed(1)}</td>
                          <td className="py-1 px-1 text-right">+{s.curriculumGap.toFixed(1)}</td>
                          <td className="py-1 px-1 text-right">+{s.weakness.toFixed(1)}</td>
                          <td className="py-1 px-1 text-right">+{s.recentLecture.toFixed(1)}</td>
                          <td className="py-1 px-1 text-right">+{s.step3Importance.toFixed(1)}</td>
                          <td className="py-1 px-1 text-right text-bad-700">
                            −{s.recentlySeen.toFixed(1)}
                          </td>
                          <td className="py-1 px-1 text-right text-ink-400">
                            +{s.jitter.toFixed(2)}
                          </td>
                          <td className="py-1 pl-1 text-right font-semibold text-ink-900">
                            {s.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </section>

        {/* ----------------------------- rooms ------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Room state — {INPATIENT_UNIT}</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {floor.map((room) => (
              <div key={room.id} className="flex justify-between gap-4 px-4 py-2 text-sm">
                <span className="tabular-nums text-ink-700">{room.roomNumber}</span>
                <span className="text-right text-ink-500">
                  {room.patient
                    ? `${room.patient.name} · ${room.status.toLowerCase().replace("_", " ")}`
                    : "empty"}
                </span>
              </div>
            ))}
          </Card>
          <p className="mt-2 text-xs text-ink-400">
            {occupiedRooms} occupied, {floor.length - occupiedRooms} free. Occupancy is
            derived from active patients holding a room, so a room cannot be
            double-booked.
          </p>
        </section>

        {/* ----------------------------- audio ------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Audio state</SectionHeading>
          <AudioStateInspector />
        </section>

        {/* --------------------------- content ------------------------------- */}
        <section className="mt-6">
          <SectionHeading>Content coverage</SectionHeading>
          <Card className="divide-y divide-ink-100 px-4">
            <StatRow label="Cases" value={`${publishedCases} / ${allCases.length}`} hint="published" />
            <StatRow
              label="Cases with validation errors"
              value={casesWithErrors}
              hint={casesWithErrors === 0 ? "library is clean" : "publication blocked"}
            />
            <StatRow label="Learning points" value={coverage.total} />
            <StatRow label="Fully mapped" value={coverage.fullyMapped} />
            <StatRow label="Partially mapped" value={coverage.partiallyMapped} />
            <StatRow label="Unmapped" value={coverage.unmapped} />
            <StatRow label="Patient coverage" value={`${coverage.patientCoveragePercent}%`} />
          </Card>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/settings/content"
              className="inline-flex h-10 items-center rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700"
            >
              Content library ›
            </Link>
            <Link
              href="/settings/content/coverage"
              className="inline-flex h-10 items-center rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700"
            >
              Coverage audit ›
            </Link>
            <Link
              href="/settings/content/packs"
              className="inline-flex h-10 items-center rounded-lg border border-ink-200 px-3 text-sm font-medium text-ink-700"
            >
              Import / export ›
            </Link>
          </div>
        </section>

        {/* ------------------------ spaced repetition ------------------------ */}
        <section className="mt-6">
          <SectionHeading>Spaced repetition intervals</SectionHeading>
          <Card className="divide-y divide-ink-100 px-4">
            <StatRow label="Mastery 0" value="not scheduled" hint="needs introduction" />
            {REVIEWABLE_LEVELS.map((level) => (
              <StatRow
                key={level}
                label={`Mastery ${level}`}
                value={`${reviewIntervals[level]} day${reviewIntervals[level] === 1 ? "" : "s"}`}
                hint={
                  reviewIntervals[level] === DEFAULT_REVIEW_INTERVALS[level]
                    ? undefined
                    : `default ${DEFAULT_REVIEW_INTERVALS[level]}`
                }
              />
            ))}
          </Card>
          <p className="mt-2 text-xs text-ink-400">
            These are the values currently in force. Change them in{" "}
            <Link href="/settings" className="font-medium text-clinical-600">
              Settings → Scheduler
            </Link>
            .
          </p>
        </section>

        {/* --------------------------- demo content -------------------------- */}
        <section className="mt-6">
          <SectionHeading>Demo data</SectionHeading>
          <p className="mb-2 text-xs text-ink-400">
            All loaded clinical content is synthetic, marked{" "}
            <code className="rounded bg-ink-100 px-1">
              {APP_CONFIG.demo.contentOrigin}
            </code>{" "}
            at seed version{" "}
            <code className="rounded bg-ink-100 px-1">{APP_CONFIG.demo.seedVersion}</code>.
          </p>
          <DemoDataControls counts={counts} />
        </section>

        {/* --------------------------- audit trail --------------------------- */}
        <section className="mt-6">
          <SectionHeading>Recent study events</SectionHeading>
          {events.length === 0 ? (
            <EmptyState title="No events recorded yet" />
          ) : (
            <Card className="divide-y divide-ink-100">
              {events.map((event) => (
                <div key={event.id} className="px-4 py-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-ink-800">{event.eventType}</span>
                    <span className="tabular-nums text-ink-400">
                      {event.createdAt.slice(0, 19).replace("T", " ")}
                    </span>
                  </div>
                  {event.conceptId || event.response ? (
                    <p className="mt-0.5 truncate text-ink-500">
                      {event.conceptId ? `concept ${event.conceptId.split(":").pop()}` : ""}
                      {event.response ? ` · ${event.response}` : ""}
                      {event.correct !== null
                        ? event.correct
                          ? " · correct"
                          : " · incorrect"
                        : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </Card>
          )}
        </section>
      </PageShell>
    </>
  );
}
