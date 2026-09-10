"use client";

/**
 * Pack import (spec §43).
 *
 * Two explicit steps — inspect, then confirm — because a pack that silently
 * rewrote the library would be very hard to undo. The inspect step writes
 * nothing; the confirm step is a single transaction.
 */

import { useActionState } from "react";
import {
  confirmPackImportAction,
  inspectPackAction,
  type PackImportState,
} from "@/app/settings/content/actions";
import { Badge, Card } from "@/components/ui";

const idle: PackImportState = { status: "idle" };

export function PackImport() {
  const [inspectState, inspectAction, inspecting] = useActionState(inspectPackAction, idle);
  const [importState, importAction, importing] = useActionState(confirmPackImportAction, idle);

  if (importState.status === "imported") {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Import complete.
        </p>
        <ul className="mt-2 space-y-0.5">
          {Object.entries(importState.imported ?? {}).map(([kind, count]) => (
            <li key={kind} className="text-sm text-ink-700">
              {count} {kind}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-500">
          Imported cases arrive as drafts. Review and publish them in the content
          library before they can reach your service.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form action={inspectAction}>
          <label className="block">
            <span className="text-xs font-medium text-ink-600">
              Paste a pack file (JSON)
            </span>
            <textarea
              name="payload"
              rows={8}
              defaultValue={inspectState.payload}
              placeholder='{"manifest": {"format": "general-hospital-content-pack", ...}, "content": {...}}'
              className="mt-1 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 font-mono text-xs text-ink-900"
            />
          </label>
          <button
            type="submit"
            disabled={inspecting}
            className="mt-2 h-11 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-700 disabled:opacity-50"
          >
            {inspecting ? "Checking…" : "Check pack"}
          </button>
        </form>

        {inspectState.error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {inspectState.error}
          </p>
        ) : null}
        {importState.error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {importState.error}
          </p>
        ) : null}
      </Card>

      {inspectState.status === "inspected" && inspectState.summary ? (
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {inspectState.summary.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                v{inspectState.summary.version}
                {inspectState.summary.author ? ` · ${inspectState.summary.author}` : ""}
              </p>
            </div>
            <Badge tone="good">Compatible</Badge>
          </div>

          <dl className="mt-3 space-y-1 border-t border-ink-100 pt-3 text-sm">
            {Object.entries(inspectState.summary.counts).map(([kind, count]) => (
              <div key={kind} className="flex justify-between gap-4">
                <dt className="text-ink-600">{kind}</dt>
                <dd className="tabular-nums text-ink-900">{count}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-ink-100 pt-1">
              <dt className="text-ink-600">Schema version</dt>
              <dd className="tabular-nums text-ink-900">
                {inspectState.summary.schemaVersion}
              </dd>
            </div>
          </dl>

          {inspectState.summary.migrationNotes.length > 0 ? (
            <div className="mt-3 rounded-lg border border-clinical-200 bg-clinical-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-clinical-700">
                Migrated from an older format
              </p>
              <ul className="mt-1 space-y-0.5">
                {inspectState.summary.migrationNotes.map((note) => (
                  <li key={note} className="text-xs text-clinical-700">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {inspectState.summary.conflicts.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                {inspectState.summary.conflicts.length} conflict
                {inspectState.summary.conflicts.length === 1 ? "" : "s"} with existing content
              </p>
              <ul className="mt-1 space-y-0.5">
                {inspectState.summary.conflicts.slice(0, 10).map((conflict) => (
                  <li
                    key={`${conflict.kind}:${conflict.code}`}
                    className="text-xs text-amber-900 dark:text-amber-300"
                  >
                    {conflict.kind} {conflict.code} already exists
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <form action={importAction} className="mt-4">
            <input type="hidden" name="payload" value={inspectState.payload ?? ""} />
            <button
              type="submit"
              disabled={importing}
              className="h-12 w-full rounded-lg bg-clinical-600 text-sm font-semibold text-white disabled:opacity-50"
            >
              {importing ? "Importing…" : "Confirm import"}
            </button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
