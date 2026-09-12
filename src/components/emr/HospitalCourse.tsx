/**
 * The hospital course (spec V3 §8-9).
 *
 * Problem-based, and entirely a record: each problem shows the assessment the
 * case authored and the plan exactly as the learner last finalised it. Nothing
 * is generated and no correctness is shown — this is the chart, not a score.
 *
 * Problems that have come off the active list are collapsed at the bottom
 * rather than left in the way; a patient with none gets no control at all.
 */

import { Card, Disclosure, SectionHeading } from "@/components/ui";
import type { CourseProblem, HospitalCourse as HospitalCourseData } from "@/domain/chart";

function ProblemEntry({ problem }: { problem: CourseProblem }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200 bg-surface-muted px-4 py-2">
        <p className="text-sm font-semibold text-ink-900">
          <span aria-hidden="true" className="mr-1 text-ink-400">
            #
          </span>
          {problem.label}
        </p>
      </div>
      <div className="space-y-3 px-4 py-3">
        {problem.assessmentText ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Course
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-700">
              {problem.assessmentText}
            </p>
          </div>
        ) : null}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            {problem.hospitalDay
              ? `Plan · signed on hospital day ${problem.hospitalDay}`
              : "Plan"}
          </p>
          {problem.planItems.length > 0 ? (
            <ul className="mt-1 space-y-0.5">
              {problem.planItems.map((item) => (
                <li key={item} className="text-sm text-ink-800">
                  <span aria-hidden="true" className="mr-1.5 text-ink-400">
                    —
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-0.5 text-sm text-ink-500">
              No plan has been signed for this problem yet.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function HospitalCourse({ course }: { course: HospitalCourseData }) {
  if (course.active.length === 0 && course.resolved.length === 0) {
    return (
      <section>
        <SectionHeading>Hospital course</SectionHeading>
        <Card className="p-4">
          <p className="text-sm text-ink-500">
            No problems have been put on this patient&apos;s list yet. Build the
            problem list on rounds and the course is written from it.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading>Hospital course</SectionHeading>
      <div className="space-y-3">
        {course.active.map((problem) => (
          <ProblemEntry key={problem.problemId} problem={problem} />
        ))}

        {course.resolved.length > 0 ? (
          <Disclosure summary={`Resolved problems (${course.resolved.length})`}>
            <div className="space-y-3">
              {course.resolved.map((problem) => (
                <ProblemEntry key={problem.problemId} problem={problem} />
              ))}
            </div>
          </Disclosure>
        ) : null}
      </div>
    </section>
  );
}
