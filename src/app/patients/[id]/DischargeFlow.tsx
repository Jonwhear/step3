"use client";

/**
 * Discharge: one prompt, then the patient moves to history (spec §36).
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { dischargePatientAction } from "@/app/actions";
import { PromptCard, type PromptView } from "@/components/patient/PromptCard";
import { Card } from "@/components/ui";

export function DischargeFlow({
  patientId,
  patientName,
  prompt,
  audio,
}: {
  patientId: string;
  patientName: string;
  prompt: PromptView | null;
  audio: { rate: number; voiceUri: string | null; autoRead: boolean };
}) {
  const router = useRouter();
  const [answered, setAnswered] = useState(false);
  const [pending, startTransition] = useTransition();

  const discharge = () => {
    const formData = new FormData();
    formData.set("patientId", patientId);
    startTransition(async () => {
      await dischargePatientAction(formData);
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <Card className="border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-medium text-emerald-800">Discharge eligible</p>
        <p className="mt-1 text-sm text-emerald-800">
          {patientName} has met the required number of rounds encounters. Settle
          the discharge plan and send them home.
        </p>
      </Card>

      {prompt && !answered ? (
        <PromptCard
          patientId={patientId}
          prompt={prompt}
          autoRead={audio.autoRead}
          ttsRate={audio.rate}
          voiceUri={audio.voiceUri}
          onGraded={() => setAnswered(true)}
          onContinue={discharge}
          continueLabel="Discharge patient"
        />
      ) : (
        <button
          type="button"
          onClick={discharge}
          disabled={pending}
          className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Discharging…" : "Discharge patient"}
        </button>
      )}
    </div>
  );
}
