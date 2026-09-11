"use client";

/**
 * The emergency department board.
 *
 * Lets the learner pick up a patient themselves rather than waiting for the
 * scheduler — useful when they have time left, or a specific weakness to work
 * on. Search filters the whole published library; without a search it shows a
 * short waiting list so the screen reads like a board rather than a catalogue.
 *
 * Filtering happens on the client over a list the server already computed, so
 * typing is instant and no keystroke costs a round trip.
 */

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { admitFromEdAction, type EdAdmitState } from "@/app/actions";
import { Badge, Card } from "@/components/ui";

export interface EdBoardEntryView {
  caseId: string;
  code: string;
  title: string;
  diagnosis: string;
  specialty: string;
  topic: string;
  difficulty: number;
  oneLiner: string;
  bay: string;
}

export interface EdCapacityView {
  activePanelSize: number;
  censusCap: number;
  freeBeds: number;
  overflowRemaining: number;
  admissionsRemaining: number;
  willOpenOverflow: boolean;
  overCap: boolean;
  capWarning: string | null;
  blockedReason: string | null;
}

const idle: EdAdmitState = { status: "idle" };

/** How many board entries to show before the learner asks for more. */
const VISIBLE_LIMIT = 8;

export function EdBoard({
  entries,
  capacity,
}: {
  entries: EdBoardEntryView[];
  capacity: EdCapacityView;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(admitFromEdAction, idle);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    const terms = needle.split(/\s+/);
    return entries.filter((entry) => {
      const haystack =
        `${entry.title} ${entry.diagnosis} ${entry.specialty} ${entry.topic} ${entry.oneLiner} ${entry.code}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [entries, query]);

  const visible = showAll || query ? filtered : filtered.slice(0, VISIBLE_LIMIT);
  const full = capacity.admissionsRemaining === 0;

  if (state.status === "admitted") {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium text-good-700">
          {state.patientName} is admitted to room {state.roomNumber}.
        </p>
        {state.openedOverflow ? (
          <p className="mt-1 text-xs text-ink-500">
            Floor 4 was full, so overflow bed {state.roomNumber} was opened.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="h-11 flex-1 rounded-lg bg-clinical-600 px-4 text-sm font-semibold text-white"
          >
            Start the workup
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="h-11 rounded-lg border border-ink-200 px-4 text-sm font-medium text-ink-700"
          >
            Back to the board
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-ink-800">Emergency department</p>
          <p className="text-xs tabular-nums text-ink-500">
            Census {capacity.activePanelSize}/{capacity.censusCap} · {capacity.freeBeds} bed
            {capacity.freeBeds === 1 ? "" : "s"} free
          </p>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Pick up a patient yourself when you have time, or search for a
          diagnosis you want to practise.
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a diagnosis, specialty or complaint…"
          aria-label="Search the emergency department board"
          className="mt-3 h-11 w-full rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-900"
        />

        {capacity.capWarning ? (
          <p className="mt-3 rounded-lg border border-warn-200 bg-warn-50 p-3 text-xs text-warn-700">
            {capacity.capWarning}
          </p>
        ) : null}
        {capacity.willOpenOverflow && !full ? (
          <p className="mt-3 rounded-lg border border-clinical-200 bg-clinical-50 p-3 text-xs text-clinical-700">
            Floor 4 is full. The next admission opens an overflow bed — {capacity.overflowRemaining}{" "}
            remaining.
          </p>
        ) : null}
        {full ? (
          <p className="mt-3 rounded-lg border border-bad-200 bg-bad-50 p-3 text-xs text-bad-700">
            {capacity.blockedReason}
          </p>
        ) : null}
        {state.error ? (
          <p className="mt-3 rounded-lg border border-bad-200 bg-bad-50 p-3 text-sm text-bad-700">
            {state.error}
          </p>
        ) : null}
      </Card>

      {visible.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-ink-500">
            {query
              ? `Nothing on the board matches “${query}”. Every other published case is already on your service.`
              : "Every published case is already on your service."}
          </p>
        </Card>
      ) : null}

      {visible.map((entry) => (
        <Card key={entry.caseId} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-500">{entry.bay}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-900">{entry.diagnosis}</p>
              <p className="mt-0.5 text-sm text-ink-600">{entry.oneLiner}</p>
              <p className="mt-1 text-xs text-ink-400">
                {entry.specialty} · {entry.topic} · difficulty {entry.difficulty}/5
              </p>
            </div>
            <Badge tone="neutral">{entry.code}</Badge>
          </div>

          <form action={formAction} className="mt-3">
            <input type="hidden" name="caseId" value={entry.caseId} />
            <button
              type="submit"
              disabled={pending || full}
              className="h-11 w-full rounded-lg border border-clinical-500 text-sm font-semibold text-clinical-700 disabled:opacity-40"
            >
              {pending ? "Admitting…" : "Admit"}
            </button>
          </form>
        </Card>
      ))}

      {!query && !showAll && filtered.length > VISIBLE_LIMIT ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="h-11 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
        >
          Show the rest of the board ({filtered.length - VISIBLE_LIMIT} more)
        </button>
      ) : null}
    </div>
  );
}
