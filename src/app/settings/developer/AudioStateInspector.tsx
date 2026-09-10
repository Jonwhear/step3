"use client";

/**
 * Live audio state (spec §68).
 *
 * TTS lifecycle bugs are invisible until you can see the state machine, which
 * is exactly how the V1 autoplay bug survived. This subscribes to whatever
 * player is currently mounted; on this page there is none, so it reports the
 * last known state and says so plainly rather than implying it is live.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui";
import {
  getAudioDebug,
  subscribeAudioDebug,
  type AudioDebugSnapshot,
} from "@/lib/audio/debug";
import { speechSupported } from "@/lib/audio/speech";

export function AudioStateInspector() {
  const snapshot = useSyncExternalStore<AudioDebugSnapshot | null>(
    subscribeAudioDebug,
    getAudioDebug,
    () => null,
  );

  // Read after mount, not during render: `speechSupported()` is false on the
  // server and true in the browser, and reading it inline makes the first
  // client render disagree with the server HTML.
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => setSupported(speechSupported()), []);

  return (
    <Card className="p-4">
      <dl className="space-y-1 text-sm">
        <Row
          label="Speech synthesis available"
          value={supported === null ? "Checking…" : supported ? "Yes" : "No"}
        />
        <Row label="Current state" value={snapshot?.state ?? "STOPPED"} />
        <Row label="Player" value={snapshot?.label ?? "None mounted"} />
        <Row
          label="Current section"
          value={
            snapshot
              ? `${snapshot.sectionLabel || "—"} (${snapshot.sectionIndex + 1} of ${snapshot.sectionCount})`
              : "—"
          }
        />
        <Row label="Rate" value={snapshot ? `${snapshot.rate.toFixed(1)}×` : "—"} />
        <Row label="Selected voice" value={snapshot?.voiceUri ?? "Default"} />
      </dl>
      <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-400">
        {snapshot
          ? "Last reported by a player on another screen. No audio plays on this page."
          : "No player has run in this browser session yet. Every screen opens STOPPED."}
      </p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-600">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value}</dd>
    </div>
  );
}
