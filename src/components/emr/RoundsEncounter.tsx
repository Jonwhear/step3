"use client";

/**
 * One patient's rounds for one hospital day (spec V3 §10-17).
 *
 * The order is the order the work happens in: the clinical question first,
 * before any data is interpreted for the learner; then today's state.
 * Previous performance is real but historical, so it sits collapsed at the
 * bottom rather than competing with today.
 *
 * There is no sign-off button here. Answering is the whole gesture when the
 * case has no note to write, and where it has one, signing that note is what
 * ends the patient's day — pressing Submit and then pressing Done would be
 * saying the same thing twice.
 *
 * The same component serves the patient chart and the service walker; the
 * walker passes the note in, so its whole day is one scroll.
 */

import { useState } from "react";
import { CurrentData } from "@/components/emr/CurrentData";
import { PromptCard, type PromptView } from "@/components/patient/PromptCard";
import { Badge, Card, Disclosure, SectionHeading } from "@/components/ui";
import type {
  EncounterFinding,
  EncounterLabPanel,
  EncounterVital,
  PriorAnswer,
  RoundsStatus,
} from "@/domain/rounds";
import type { ImagingResultView } from "@/domain/labs";
import { formatShortDate } from "@/lib/date";

export interface RoundsEncounterProps {
  patientId: string;
  patientName: string;
  hospitalDay: number;
  status: RoundsStatus;
  prompt: PromptView | null;
  answeredToday: boolean;
  vitals: EncounterVital[];
  labPanels: EncounterLabPanel[];
  imaging: ImagingResultView[];
  findings: EncounterFinding[];
  priorAnswers: PriorAnswer[];
  dischargeEligible: boolean;
  showReferenceRanges: boolean;
  audio: { rate: number; voiceUri: string | null };
  /** The day's note, when the caller wants it on this screen too. */
  note?: React.ReactNode;
  /** Rendered when the case engine has made the patient discharge-eligible. */
  discharge?: React.ReactNode;
  /** Called when answering finished the patient's day. */
  onAnswered?: () => void;
}

export function RoundsEncounter({
  patientId,
  patientName,
  hospitalDay,
  status,
  prompt,
  answeredToday,
  vitals,
  labPanels,
  imaging,
  findings,
  priorAnswers,
  dischargeEligible,
  showReferenceRanges,
  audio,
  note,
  discharge,
  onAnswered,
}: RoundsEncounterProps) {
  // Whether the question was already answered when the learner arrived. Taken
  // once: answering flips the live prop, and swapping the card out at that
  // moment would throw away the explanation they are reading.
  const [askedOnArrival] = useState(() => !answeredToday);
  const [answeredHere, setAnsweredHere] = useState(false);

  const completed = status === "COMPLETED_TODAY";

  return (
    <div className="space-y-5">
      {/* ---------------------------- today's work ---------------------------- */}
      <section>
        <SectionHeading>Today&apos;s rounds</SectionHeading>

        {completed ? (
          <Card className="border-good-200 bg-good-50 p-4">
            <p className="text-sm font-medium text-good-700">
              Rounds complete for hospital day {hospitalDay}
            </p>
            <p className="mt-1 text-sm text-good-700">
              You are finished with {patientName} today.
            </p>
          </Card>
        ) : status === "NO_TASK" ? (
          <Card className="p-4">
            <p className="text-sm text-ink-600">
              There is no rounds task for this patient today.
            </p>
          </Card>
        ) : prompt && askedOnArrival ? (
          <PromptCard
            key={`${patientId}:${prompt.id}`}
            patientId={patientId}
            prompt={prompt}
            ttsRate={audio.rate}
            voiceUri={audio.voiceUri}
            onGraded={() => {
              setAnsweredHere(true);
              onAnswered?.();
            }}
          />
        ) : prompt ? (
          <Card className="p-4">
            <p className="text-sm text-ink-600">
              Today&apos;s question for this patient has already been answered.
            </p>
          </Card>
        ) : (
          <Card className="p-4">
            <p className="text-sm text-ink-600">
              This case has no rounds question. Review the data and settle the
              plan.
            </p>
          </Card>
        )}
      </section>

      {dischargeEligible && !completed ? <Badge tone="good">Discharge eligible</Badge> : null}

      {/* ------------------------------ the data ------------------------------ */}
      <section>
        <SectionHeading>Current data</SectionHeading>
        <CurrentData
          vitals={vitals}
          labPanels={labPanels}
          imaging={imaging}
          findings={findings}
          showReferenceRanges={showReferenceRanges}
        />
      </section>

      {/* -------------------------------- note -------------------------------- */}
      {note ? (
        <section>
          <SectionHeading>Progress note · Hospital day {hospitalDay}</SectionHeading>
          {note}
        </section>
      ) : null}

      {discharge ? <section>{discharge}</section> : null}

      {/* -------------------------- previous performance ---------------------- */}
      {priorAnswers.length > 0 ? (
        <Disclosure summary={`Previous performance (${priorAnswers.length})`}>
          <ul className="space-y-2">
            {priorAnswers.map((answer) => (
              <li key={answer.id} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm text-ink-800">{answer.promptText}</span>
                  <span className="block text-xs text-ink-400">
                    {answer.stage.toLowerCase()} · {formatShortDate(answer.date)}
                  </span>
                </span>
                <Badge tone={answer.correct ? "good" : "warn"}>
                  {answer.correct ? "Correct" : "Missed"}
                </Badge>
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}
    </div>
  );
}
