"use client";

/**
 * Active admission.
 *
 * Feels open-ended, is finite underneath (spec §49): categories of actions,
 * deterministic results, and an optional microphone whose interpretation must
 * be confirmed before anything is applied.
 */

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import {
  completeAdmissionAction,
  interpretForCaseAction,
  takeAdmissionActionAction,
  type AdmissionActionState,
} from "@/app/actions";
import { MicInput, type InterpretedItem } from "@/components/speech/MicInput";
import { PromptCard, type PromptView } from "@/components/patient/PromptCard";
import { Badge, Card, EmptyState, SectionHeading, type Tone } from "@/components/ui";

export interface AdmissionAction {
  actionCode: string;
  displayName: string;
  category: string;
}

export interface TakenAction {
  actionCode: string;
  displayName: string;
  classification: string;
  resultText: string;
}

export interface AdmissionCase {
  patientId: string;
  caseId: string;
  patientName: string;
  roomNumber: string;
  opening: string;
  vitals: { label: string; value: string }[];
  available: AdmissionAction[];
  taken: TakenAction[];
  prompts: PromptView[];
  answeredPromptIds: string[];
}

const CATEGORY_ORDER = ["HISTORY", "EXAM", "ORDER", "TREATMENT", "CONSULT", "DISPOSITION"];
const CATEGORY_LABEL: Record<string, string> = {
  HISTORY: "History",
  EXAM: "Examination",
  ORDER: "Orders & tests",
  TREATMENT: "Treatment",
  CONSULT: "Consults",
  DISPOSITION: "Disposition",
};

const CLASSIFICATION_TONE: Record<string, Tone> = {
  REQUIRED: "good",
  APPROPRIATE: "good",
  OPTIONAL: "neutral",
  UNNECESSARY: "warn",
  CONTRAINDICATED: "bad",
};

const initialActionState: AdmissionActionState = { status: "idle" };

export function AdmissionWorkup({
  admission,
  audio,
}: {
  admission: AdmissionCase;
  audio: { rate: number; voiceUri: string | null; autoRead: boolean };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    takeAdmissionActionAction,
    initialActionState,
  );
  const [openCategory, setOpenCategory] = useState<string>("HISTORY");
  const [finishing, startFinishing] = useTransition();
  const [promptIndex, setPromptIndex] = useState(0);
  const [phase, setPhase] = useState<"workup" | "decide">("workup");

  const takenCodes = new Set(admission.taken.map((a) => a.actionCode));

  const applyAction = (actionCode: string) => {
    const formData = new FormData();
    formData.set("patientId", admission.patientId);
    formData.set("actionCode", actionCode);
    formAction(formData);
  };

  const confirmSpoken = (items: InterpretedItem[]) => {
    // Applied one at a time so each result is recorded individually.
    for (const item of items) applyAction(item.code);
  };

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    actions: admission.available.filter((a) => a.category === category),
  })).filter((group) => group.actions.length > 0);

  // Snapshotted for the same reason as the rounds queue: answering a decision
  // removes it from the server-side list, and the sequence must stay stable.
  const [unanswered] = useState(() =>
    admission.prompts.filter((p) => !admission.answeredPromptIds.includes(p.id)),
  );
  const currentPrompt = unanswered[promptIndex];

  const finish = () => {
    const formData = new FormData();
    formData.set("patientId", admission.patientId);
    startFinishing(async () => {
      await completeAdmissionAction(formData);
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-ink-500">
          Room {admission.roomNumber}
        </p>
        <p className="mt-1 text-base font-semibold text-ink-900">
          {admission.patientName}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-800">{admission.opening}</p>

        {admission.vitals.length > 0 ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-ink-100 pt-3 sm:grid-cols-3">
            {admission.vitals.map((v) => (
              <div key={v.label} className="text-sm">
                <dt className="text-xs text-ink-400">{v.label}</dt>
                <dd className="tabular-nums text-ink-800">{v.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Card>

      {phase === "workup" ? (
        <>
          <MicInput
            interpret={(transcript) => interpretForCaseAction(admission.caseId, transcript)}
            onConfirm={confirmSpoken}
            helpText='Say or type what you would do — for example, "I would get an ECG, give aspirin and check a troponin." Nothing is scored until you confirm.'
          />

          {state.status === "resolved" ? (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-ink-900">
                  {state.displayName}
                </p>
                <Badge tone={CLASSIFICATION_TONE[state.classification ?? ""] ?? "neutral"}>
                  {state.classification}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-800">
                {state.resultText}
              </p>
              {state.feedbackText ? (
                <p className="mt-2 border-t border-ink-100 pt-2 text-sm text-ink-600">
                  {state.feedbackText}
                </p>
              ) : null}
            </Card>
          ) : null}

          <SectionHeading>Actions</SectionHeading>
          <div className="space-y-2">
            {byCategory.map((group) => {
              const open = openCategory === group.category;
              return (
                <Card key={group.category} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(open ? "" : group.category)}
                    aria-expanded={open}
                    className="tap flex min-h-12 w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-ink-800">
                      {CATEGORY_LABEL[group.category] ?? group.category}
                    </span>
                    <span className="text-xs text-ink-400">
                      {group.actions.filter((a) => takenCodes.has(a.actionCode)).length}/
                      {group.actions.length}
                      <span aria-hidden="true" className="ml-2">
                        {open ? "▾" : "▸"}
                      </span>
                    </span>
                  </button>
                  {open ? (
                    <div className="grid gap-1 border-t border-ink-100 p-2 sm:grid-cols-2">
                      {group.actions.map((action) => {
                        const done = takenCodes.has(action.actionCode);
                        return (
                          <button
                            key={action.actionCode}
                            type="button"
                            disabled={pending}
                            onClick={() => applyAction(action.actionCode)}
                            className={`tap min-h-11 rounded-lg border px-3 py-2 text-left text-sm ${
                              done
                                ? "border-ink-100 bg-ink-50 text-ink-400"
                                : "border-ink-200 bg-white text-ink-800"
                            }`}
                          >
                            {done ? "✓ " : ""}
                            {action.displayName}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>

          {admission.taken.length > 0 ? (
            <>
              <SectionHeading>Results so far</SectionHeading>
              <Card className="divide-y divide-ink-100">
                {admission.taken.map((action) => (
                  <div key={action.actionCode} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink-800">
                        {action.displayName}
                      </p>
                      <Badge tone={CLASSIFICATION_TONE[action.classification] ?? "neutral"}>
                        {action.classification}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-600">{action.resultText}</p>
                  </div>
                ))}
              </Card>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setPhase("decide")}
            disabled={admission.taken.length === 0}
            className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-40"
          >
            {admission.taken.length === 0
              ? "Take at least one action first"
              : "Commit to a diagnosis and disposition"}
          </button>
        </>
      ) : (
        <>
          <SectionHeading>Decisions</SectionHeading>
          {currentPrompt ? (
            <PromptCard
              key={currentPrompt.id}
              patientId={admission.patientId}
              prompt={currentPrompt}
              autoRead={audio.autoRead}
              ttsRate={audio.rate}
              voiceUri={audio.voiceUri}
              onContinue={() => {
                if (promptIndex >= unanswered.length - 1) {
                  finish();
                } else {
                  setPromptIndex((i) => i + 1);
                }
              }}
              continueLabel={
                promptIndex >= unanswered.length - 1 ? "Admit to the service" : "Next decision"
              }
            />
          ) : (
            <>
              <EmptyState
                title="Workup complete"
                body="This patient is ready to join your service."
              />
              <button
                type="button"
                onClick={finish}
                disabled={finishing}
                className="mt-3 h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
              >
                {finishing ? "Admitting…" : "Admit to the service"}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setPhase("workup")}
            className="h-11 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
          >
            ‹ Back to workup
          </button>
        </>
      )}
    </div>
  );
}
