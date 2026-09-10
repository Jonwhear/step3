/**
 * Live audio state for the developer inspector (spec §68).
 *
 * TTS bugs are lifecycle bugs, and lifecycle bugs are invisible unless the
 * current state is written down somewhere. Every active player publishes here;
 * the developer page subscribes. Client-only and intentionally not persisted.
 */

import type { AudioState } from "./machine";

export interface AudioDebugSnapshot {
  label: string;
  state: AudioState;
  sectionIndex: number;
  sectionCount: number;
  sectionLabel: string;
  supported: boolean;
  rate: number;
  voiceUri: string | null;
  updatedAt: number;
}

let snapshot: AudioDebugSnapshot | null = null;
const listeners = new Set<() => void>();

export function publishAudioDebug(
  next: Omit<AudioDebugSnapshot, "updatedAt">,
): void {
  snapshot = { ...next, updatedAt: Date.now() };
  for (const listener of listeners) listener();
}

export function subscribeAudioDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAudioDebug(): AudioDebugSnapshot | null {
  return snapshot;
}

/** Cleared when the last player unmounts so the inspector never lies. */
export function clearAudioDebug(): void {
  snapshot = null;
  for (const listener of listeners) listener();
}
