"use client";

import { useTransition } from "react";
import { seedDemoContentAction } from "@/app/actions";
import { Card } from "@/components/ui";

export function SeedPrompt({ seeded }: { seeded: boolean }) {
  const [pending, startTransition] = useTransition();

  if (seeded) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-700">
          The synthetic teaching library is loaded and ready.
        </p>
        <p className="mt-1 text-xs text-ink-400">
          All demo cases and conferences are original synthetic material written
          for this prototype. You can remove or reset them at any time from
          Settings → Developer.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-sm text-ink-700">
        No teaching content is loaded yet. Load the synthetic demo library to
        start seeing patients.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => seedDemoContentAction())}
        className="mt-3 h-11 w-full rounded-lg border border-clinical-200 bg-clinical-50 text-sm font-semibold text-clinical-700 disabled:opacity-50"
      >
        {pending ? "Loading…" : "Load demo content"}
      </button>
    </Card>
  );
}
