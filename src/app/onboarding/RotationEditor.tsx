"use client";

import { useActionState, useState } from "react";
import { CONTENT_SPECIALTIES } from "@/config/app";
import {
  addRotationAction,
  deleteRotationAction,
  updateRotationAction,
  type ActionState,
} from "@/app/actions";
import { Card } from "@/components/ui";
import { formatShortDate } from "@/lib/date";
import type { RotationBlockRow } from "@/db/schema";

const initial: ActionState = { ok: false };

export function RotationEditor({ rotations }: { rotations: RotationBlockRow[] }) {
  const [addState, addAction, adding] = useActionState(addRotationAction, initial);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {rotations.length === 0 ? (
        <p className="text-sm text-ink-500">
          No rotations yet. Days without a rotation use the general service, so
          you can start without a complete schedule.
        </p>
      ) : (
        <ul className="space-y-2">
          {rotations.map((rotation) =>
            editingId === rotation.id ? (
              <li key={rotation.id}>
                <EditRotationForm
                  rotation={rotation}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={rotation.id}>
                <Card className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {rotation.name}
                    </p>
                    <p className="text-xs text-ink-500">
                      {rotation.specialty} · {formatShortDate(rotation.startDate)} –{" "}
                      {formatShortDate(rotation.endDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(rotation.id)}
                      className="h-9 rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-700"
                    >
                      Edit
                    </button>
                    <form action={deleteRotationAction}>
                      <input type="hidden" name="id" value={rotation.id} />
                      <button
                        type="submit"
                        className="h-9 rounded-lg border border-ink-200 px-3 text-xs font-medium text-rose-700"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </Card>
              </li>
            ),
          )}
        </ul>
      )}

      <Card className="p-3">
        <p className="mb-2 text-sm font-medium text-ink-700">Add rotation</p>
        <form action={addAction} className="grid grid-cols-2 gap-2">
          <input
            name="name"
            placeholder="Rotation name"
            required
            className="col-span-2 h-11 rounded-lg border border-ink-200 px-3 text-sm"
          />
          <select
            name="specialty"
            defaultValue="Internal Medicine"
            className="col-span-2 h-11 rounded-lg border border-ink-200 bg-white px-3 text-sm"
          >
            {CONTENT_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="text-xs text-ink-500">
            Start
            <input
              name="startDate"
              type="date"
              required
              className="mt-1 h-11 w-full rounded-lg border border-ink-200 px-2 text-sm"
            />
          </label>
          <label className="text-xs text-ink-500">
            End
            <input
              name="endDate"
              type="date"
              required
              className="mt-1 h-11 w-full rounded-lg border border-ink-200 px-2 text-sm"
            />
          </label>
          {addState.error ? (
            <p className="col-span-2 text-sm text-rose-700">{addState.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={adding}
            className="col-span-2 h-11 rounded-lg border border-clinical-200 bg-clinical-50 text-sm font-semibold text-clinical-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add rotation"}
          </button>
        </form>
      </Card>
    </div>
  );
}

function EditRotationForm({
  rotation,
  onDone,
}: {
  rotation: RotationBlockRow;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(updateRotationAction, initial);
  if (state.ok) onDone();

  return (
    <Card className="p-3">
      <form action={action} className="grid grid-cols-2 gap-2">
        <input type="hidden" name="id" value={rotation.id} />
        <input
          name="name"
          defaultValue={rotation.name}
          required
          className="col-span-2 h-11 rounded-lg border border-ink-200 px-3 text-sm"
        />
        <select
          name="specialty"
          defaultValue={rotation.specialty}
          className="col-span-2 h-11 rounded-lg border border-ink-200 bg-white px-3 text-sm"
        >
          {CONTENT_SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          name="startDate"
          type="date"
          defaultValue={rotation.startDate}
          required
          className="h-11 rounded-lg border border-ink-200 px-2 text-sm"
        />
        <input
          name="endDate"
          type="date"
          defaultValue={rotation.endDate}
          required
          className="h-11 rounded-lg border border-ink-200 px-2 text-sm"
        />
        {state.error ? (
          <p className="col-span-2 text-sm text-rose-700">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-clinical-600 text-sm font-semibold text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-lg border border-ink-200 text-sm font-medium text-ink-700"
        >
          Cancel
        </button>
      </form>
    </Card>
  );
}
