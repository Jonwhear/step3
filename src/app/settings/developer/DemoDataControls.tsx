"use client";

import { useState, useTransition } from "react";
import {
  deleteDemoContentAction,
  resetDemoContentAction,
  seedDemoContentAction,
} from "@/app/actions";
import { Card } from "@/components/ui";

const CONFIRM_TEXT =
  "This will permanently remove all synthetic demo cases, lectures, patient instances, and demo progress. Your profile and rotation schedule will remain.";

export function DemoDataControls({ counts }: { counts: Record<string, number> }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<null | "delete" | "reset">(null);

  const run = (fn: () => Promise<void>) => {
    setConfirming(null);
    startTransition(() => fn());
  };

  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-ink-800">Demo content currently loaded</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {Object.entries(counts).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <dt className="text-ink-500">{label}</dt>
            <dd className="tabular-nums text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>

      {confirming ? (
        <div className="mt-4 rounded-lg border border-warn-200 bg-warn-50 p-3">
          <p className="text-sm text-warn-700">{CONFIRM_TEXT}</p>
          {confirming === "reset" ? (
            <p className="mt-2 text-sm text-warn-700">
              The synthetic dataset will then be restored from the seed files.
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(confirming === "delete" ? deleteDemoContentAction : resetDemoContentAction)
              }
              className="h-11 flex-1 rounded-lg bg-rose-600 text-sm font-semibold text-white disabled:opacity-50"
            >
              {confirming === "delete" ? "Yes, delete it all" : "Yes, reset demo content"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="h-11 rounded-lg border border-ink-200 px-4 text-sm font-medium text-ink-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(seedDemoContentAction)}
            className="h-11 rounded-lg border border-clinical-200 bg-clinical-50 text-sm font-semibold text-clinical-700 disabled:opacity-50"
          >
            {pending ? "Working…" : "Seed demo content"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming("reset")}
            className="h-11 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 disabled:opacity-50"
          >
            Reset demo content
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming("delete")}
            className="h-11 rounded-lg border border-bad-200 text-sm font-medium text-bad-700 disabled:opacity-50"
          >
            Delete all demo content
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-ink-400">
        Seeding is idempotent — running it twice updates existing records rather
        than duplicating them.
      </p>
    </Card>
  );
}
