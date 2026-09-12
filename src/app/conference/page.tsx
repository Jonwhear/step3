import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { getLectureConceptIds, listLectures } from "@/domain/lectures";
import { loadDailySession } from "@/server/session";
import { db } from "@/server/db";
import { formatLongDate } from "@/lib/date";
import { LecturePlayer } from "./LecturePlayer";

export const dynamic = "force-dynamic";

export default async function ConferencePage({
  searchParams,
}: {
  searchParams: Promise<{ lecture?: string }>;
}) {
  const session = loadDailySession();
  if (!session.onboarded) redirect("/onboarding");
  const database = db();
  const params = await searchParams;

  const all = listLectures(database);
  const selected = params.lecture
    ? (all.find((l) => l.id === params.lecture) ?? session.lecture)
    : session.lecture;

  if (all.length === 0) {
    return (
      <>
        <AppHeader subtitle={session.rotation.serviceLabel} />
        <PageShell>
          <h1 className="mb-4 text-lg font-semibold text-ink-900">Teaching Conference</h1>
          <EmptyState
            title="No conferences available"
            body="Load the demo content from Settings → Developer to populate the teaching schedule."
          />
        </PageShell>
      </>
    );
  }

  return (
    <>
      <AppHeader subtitle={session.rotation.serviceLabel} />
      <PageShell>
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-ink-900">Teaching Conference</h1>
          <p className="text-sm text-ink-500">{formatLongDate(session.today)}</p>
        </header>

        {selected ? (
          <LecturePlayer
            lecture={{
              id: selected.id,
              title: selected.title,
              lectureTypeLabel: selected.lectureTypeLabel,
              specialty: selected.specialty,
              topic: selected.topic,
              summary: selected.summary,
              sections: selected.sections,
              keyPoints: selected.keyPoints,
              estimatedMinutes: selected.estimatedMinutes,
              status: selected.status,
              conceptCount: getLectureConceptIds(database, selected.id).length,
            }}
            audio={session.audio}
          />
        ) : null}

        <section className="mt-8">
          <SectionHeading>Conference schedule</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {all.map((lecture) => (
              <Link
                key={lecture.id}
                href={`/conference?lecture=${lecture.id}`}
                className={`tap flex min-h-14 items-center justify-between gap-3 px-4 py-3 ${
                  lecture.id === selected?.id ? "bg-clinical-50" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-800">
                    {lecture.title}
                  </span>
                  <span className="block text-xs text-ink-400">
                    {lecture.lectureTypeLabel} · {lecture.specialty}
                  </span>
                </span>
                {lecture.status === "COMPLETED" ? (
                  <Badge tone="good">Done</Badge>
                ) : lecture.status === "IN_PROGRESS" ? (
                  <Badge tone="info">Started</Badge>
                ) : null}
              </Link>
            ))}
          </Card>
        </section>
      </PageShell>
    </>
  );
}
