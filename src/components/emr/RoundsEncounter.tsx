"use client";

/**
 * One patient's rounds for one hospital day (spec V3 §10-17).
 *
 * The order is the order the work happens in: the clinical question first,
 * before any data is interpreted for the learner; then today's state; then the
 * plan; then sign-off. Previous performance is real but historical, so it sits
 * collapsed at the bottom rather than competing with today.
 *
 * The same component serves the patient chart and the service walker. The only
 * difference between them is what happens after sign-off, which the caller
 * supplies.
 */

import { useState, useTransition } from "react";
import { signOffRoundsAction } from "@/app/actions";
import { AssessmentPlan, type ProblemProp } from "@/components/emr/AssessmentPlan";
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
  problems: ProblemProp[];
  priorAnswers: PriorAnswer[];
  dischargeEligible: boolean;
  showReferenceRanges: boolean;
  audio: { rate: number; voiceUri: string | null };
  /** Rendered under the sign-off button when discharge is on the table. */
  discharge?: React.ReactNode;
  /** What the caller does once this patient is signed off. */
  onSignedOff?: () => void;
  signOffLabel?: string;
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
  problems,
  priorAnswers,
  dischargeEligible,
  showReferenceRanges,
  audio,
  discharge,
  onSignedOff,
  signOffLabel,
}: RoundsEncounterProps) {
  // Whether the question was already answered when the learner arrived. Taken
  // once: answering flips the live prop, and swapping the card out at that
  // moment would throw away the explanation they are reading.
  const [askedOnArrival] = useState(() => !answeredToday);
  const [answeredHere, setAnsweredHere] = useState(false);
  const [signingOff, startSignOff] = useTransition();

  const answered = !askedOnArrival || answeredHere;
  const completed = status === "COMPLETED_TODAY";

  const signOff = () => {
    const formData = new FormData();
    formData.set("patientId", patientId);
    startSignOff(async () => {
      await signOffRoundsAction(formData);
      onSignedOff?.();
    });
  };

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
            onGraded={() => setAnsweredHere(true)}
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

      {/* -------------------------------- plan -------------------------------- */}
      {problems.length > 0 ? (
        <section>
          <SectionHeading>Plan</SectionHeading>
          <AssessmentPlan patientId={patientId} problems={problems} readOnly={completed} />
        </section>
      ) : null}

      {/* ------------------------------ sign off ------------------------------ */}
      {!completed ? (
        <section className="space-y-2">
          {dischargeEligible ? (
            <Badge tone="good">Discharge eligible</Badge>
          ) : null}
          <button
            type="button"
            onClick={signOff}
            disabled={signingOff || status === "NO_TASK" || (prompt !== null && !answered)}
            className="h-12 w-full rounded-lg bg-ink-900 text-sm font-semibold text-surface disabled:opacity-50"
          >
            {signingOff ? "Signing off…" : (signOffLabel ?? "Sign off rounds")}
          </button>
          {!answered && prompt ? (
            <p className="text-center text-xs text-ink-400">
              Answer today&apos;s question before signing off.
            </p>
          ) : null}
          {discharge}
        </section>
      ) : (
        discharge ?? null
      )}

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
