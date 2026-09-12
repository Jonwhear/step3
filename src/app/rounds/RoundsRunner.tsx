"use client";

/**
 * Rounds: one patient, one page.
 *
 * The whole encounter lives here in the order a real one happens — look at the
 * patient, answer what today asks, write only if you decided something, then
 * sign off and walk to the next room. Nothing in that sequence sends the
 * learner to another screen and back.
 *
 * Two rules keep the work proportional:
 *
 *  - The stop states what is outstanding before it asks for anything. A patient
 *    whose question is answered and whose plan is already on file has nothing
 *    outstanding, and the learner is not made to open a chart to prove it.
 *  - A plan already on file carries forward. Only a patient with no plan at all
 *    is asked to write one; revising it is offered, never demanded.
 *
 * The patient stays on the rounds list until "Finish with …" is pressed, so the
 * encounter can be abandoned and resumed without losing the answer already
 * given — the server refuses a second answer to the same question on the same
 * day.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { finishRoundsAction } from "@/app/actions";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { Avatar } from "@/components/patient/Avatar";
import { PromptCard, type PromptView } from "@/components/patient/PromptCard";
import { AssessmentPlan, type ProblemProp } from "@/components/emr/AssessmentPlan";
import { resolvePatientVisual } from "@/lib/assets";
import { formatShortDate } from "@/lib/date";

export interface RoundsStop {
  patientId: string;
  patientName: string;
  initials: string;
  roomNumber: string;
  age: string;
  diagnosis: string;
  hospitalDay: number;
  roundsCompleted: number;
  minimumRounds: number;
  vitals: { label: string; value: string }[];
  /** Overnight results worth looking at before answering (spec §23). */
  abnormalLabs: { label: string; value: string; flag: string }[];
  /** The case's problem list, with whatever the learner has already selected. */
  problems: ProblemProp[];
  /** When this patient's plan was last signed; null means never. */
  planSignedOn: string | null;
  /** True when today's question has already been answered for this patient. */
  answeredToday: boolean;
  prompt: PromptView | null;
}

export function RoundsRunner({
  stops,
  audio,
}: {
  stops: RoundsStop[];
  audio: { rate: number; voiceUri: string | null };
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answeredHere, setAnsweredHere] = useState<string | null>(null);
  const [finishing, startFinishing] = useTransition();

  // The walking order is fixed on mount, but each stop is read from live props:
  // ticking a plan item revalidates the page, and the learner must see their
  // own tick. Finishing a patient removes them from props, which is why the
  // order is remembered separately.
  const [order] = useState(() => stops.map((stop) => stop.patientId));
  // Whether each question was already answered when the learner arrived. Taken
  // once, because answering one makes the live prop flip — and re-rendering the
  // card as "answered earlier" would throw away the explanation they are
  // reading.
  const [answeredOnArrival] = useState(
    () => new Map(stops.map((stop) => [stop.patientId, stop.answeredToday])),
  );
  // Same reasoning for the note: signing it flips `planSignedOn`, and swapping
  // the editor for a "carried forward" summary at that moment would hide the
  // grading the learner just asked for.
  const [noteDueOnArrival] = useState(
    () =>
      new Map(
        stops.map((stop) => [
          stop.patientId,
          stop.problems.length > 0 && stop.planSignedOn === null,
        ]),
      ),
  );
  const byId = new Map(stops.map((stop) => [stop.patientId, stop]));

  if (stops.length === 0) {
    return (
      <EmptyState
        title="Rounds complete"
        body="Every patient on your service has been seen today. New questions become available tomorrow."
      />
    );
  }

  // Skip past anyone finished elsewhere — a second tab, a refresh mid-save.
  const cursor = order.findIndex((id, i) => i >= index && byId.has(id));
  const stop = cursor === -1 ? undefined : byId.get(order[cursor] as string);
  if (!stop) return null;

  const isLast = !order.slice(cursor + 1).some((id) => byId.has(id));
  const askedOnArrival = answeredOnArrival.get(stop.patientId) === false;
  const answered = !askedOnArrival || answeredHere === stop.patientId;
  const needsNote = stop.problems.length > 0 && stop.planSignedOn === null;
  const writeNote = noteDueOnArrival.get(stop.patientId) === true;
  const outstanding = [
    stop.prompt && !answered ? "today's question" : null,
    needsNote ? "an assessment and plan" : null,
  ].filter((item): item is string => item !== null);

  const finish = () => {
    const formData = new FormData();
    formData.set("patientId", stop.patientId);
    startFinishing(async () => {
      await finishRoundsAction(formData);
      if (isLast) {
        router.push("/");
        router.refresh();
      } else {
        setIndex(cursor + 1);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums text-ink-500">
          Patient {cursor + 1} of {order.length}
        </span>
        <Badge tone="neutral">
          Round {stop.roundsCompleted + 1} of at least {stop.minimumRounds}
        </Badge>
      </div>

      {/* ------------------------------ bedside ------------------------------ */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            visual={resolvePatientVisual({
              patientName: stop.patientName,
              fallbackInitials: stop.initials,
            })}
            size="md"
          />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.12em] text-ink-500">
              Room {stop.roomNumber}
            </p>
            <p className="mt-0.5 text-base font-semibold text-ink-900">
              {stop.patientName}
              {stop.age ? (
                <span className="font-normal text-ink-500">, {stop.age}</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-sm text-ink-600">{stop.diagnosis}</p>
            <p className="mt-0.5 text-xs text-ink-400">Hospital day {stop.hospitalDay}</p>
          </div>
        </div>

        {stop.vitals.length > 0 ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-ink-100 pt-3 sm:grid-cols-3">
            {stop.vitals.map((v) => (
              <div key={v.label} className="text-sm">
                <dt className="text-xs text-ink-400">{v.label}</dt>
                <dd className="tabular-nums text-ink-800">{v.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {stop.abnormalLabs.length > 0 ? (
          <div className="mt-3 border-t border-ink-100 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Abnormal results
            </p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {stop.abnormalLabs.map((lab) => (
                <li key={lab.label} className="text-sm text-ink-800">
                  {lab.label}{" "}
                  <span className="font-medium tabular-nums text-warn-700">
                    {lab.value}
                  </span>{" "}
                  <span className="text-[10px] font-bold text-warn-700">{lab.flag}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-600">
          {outstanding.length > 0 ? (
            <>
              <span className="font-medium text-ink-800">Needs a decision today:</span>{" "}
              {outstanding.join(" and ")}.
            </>
          ) : (
            <>
              <span className="font-medium text-ink-800">Nothing outstanding.</span>{" "}
              Continue the current plan and move on.
            </>
          )}{" "}
          <Link
            href={`/patients/${stop.patientId}?tab=results`}
            className="font-medium text-clinical-600"
          >
            Full chart ›
          </Link>
        </p>
      </Card>

      {/* ------------------------------ question ----------------------------- */}
      {stop.prompt && askedOnArrival ? (
        <PromptCard
          key={`${stop.patientId}:${stop.prompt.id}`}
          patientId={stop.patientId}
          prompt={stop.prompt}
          ttsRate={audio.rate}
          voiceUri={audio.voiceUri}
          onGraded={() => setAnsweredHere(stop.patientId)}
        />
      ) : stop.prompt ? (
        <Card className="p-4">
          <p className="text-sm text-ink-600">
            Today&apos;s question for this patient has already been answered.
          </p>
        </Card>
      ) : null}

      {/* -------------------------------- plan ------------------------------- */}
      {stop.problems.length > 0 ? (
        <section>
          <SectionHeading>
            {writeNote ? "Assessment and plan" : "Plan on file"}
          </SectionHeading>
          {writeNote ? (
            <AssessmentPlan patientId={stop.patientId} problems={stop.problems} />
          ) : (
            <details>
              <summary className="tap flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-ink-200 bg-surface px-4 py-3">
                <span className="text-sm text-ink-600">
                  {stop.planSignedOn
                    ? `Signed ${formatShortDate(stop.planSignedOn)} and carried forward.`
                    : "Carried forward."}
                </span>
                <span className="shrink-0 text-xs font-medium text-clinical-600">
                  Revise ›
                </span>
              </summary>
              <div className="mt-2">
                <AssessmentPlan patientId={stop.patientId} problems={stop.problems} />
              </div>
            </details>
          )}
        </section>
      ) : null}

      {/* ------------------------------- sign off ---------------------------- */}
      <button
        type="button"
        onClick={finish}
        disabled={finishing}
        className="h-12 w-full rounded-lg bg-ink-900 text-sm font-semibold text-surface disabled:opacity-50"
      >
        {finishing
          ? "Saving…"
          : isLast
            ? `Finish with ${stop.patientName} and end rounds`
            : `Finish with ${stop.patientName} ›`}
      </button>
    </div>
  );
}
