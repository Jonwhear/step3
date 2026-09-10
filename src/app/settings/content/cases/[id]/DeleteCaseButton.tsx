"use client";

/**
 * Permanent deletion (spec §64).
 *
 * The domain layer refuses to delete a case that has study history; this only
 * has to make the action deliberate and show the refusal when it comes back.
 */

import { useActionState, useState } from "react";
import { deleteCaseAction, type ContentActionState } from "@/app/settings/content/actions";

const idle: ContentActionState = { ok: true };

export function DeleteCaseButton({ caseId }: { caseId: string }) {
  const [state, formAction, pending] = useActionState(deleteCaseAction, idle);
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <>
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="h-11 w-full rounded-lg border border-rose-200 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:text-rose-400"
        >
          Delete this case permanently
        </button>
        {state.error ? (
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{state.error}</p>
        ) : null}
      </>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="caseId" value={caseId} />
      <p className="text-sm text-ink-700">
        This cannot be undone. Delete this case and all of its content?
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-11 flex-1 rounded-lg bg-rose-600 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="h-11 flex-1 rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
        >
          Cancel
        </button>
      </div>
      {state.error ? (
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{state.error}</p>
      ) : null}
    </form>
  );
}
