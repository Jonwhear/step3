/**
 * Browser speech synthesis wrapper.
 *
 * Uses window.speechSynthesis only (spec §14) — no external TTS provider.
 * A single module-level utterance guarantees voices never overlap.
 */

export interface VoiceOption {
  uri: string;
  name: string;
  lang: string;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function listVoices(): VoiceOption[] {
  if (!speechSupported()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang }));
}

/**
 * Voice lists load asynchronously in some browsers; this resolves once they
 * are populated (or immediately if they already are).
 */
export function onVoicesReady(callback: () => void): () => void {
  if (!speechSupported()) return () => {};
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) callback();
  const handler = () => callback();
  synth.addEventListener("voiceschanged", handler);
  return () => synth.removeEventListener("voiceschanged", handler);
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export interface SpeakOptions {
  rate?: number;
  voiceUri?: string | null;
  onEnd?: () => void;
  onError?: () => void;
  onBoundary?: (charIndex: number) => void;
}

/** Cancels anything currently speaking and speaks `text`. */
export function speak(text: string, options: SpeakOptions = {}): void {
  if (!speechSupported() || !text.trim()) {
    options.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 1;
  if (options.voiceUri) {
    const voice = synth.getVoices().find((v) => v.voiceURI === options.voiceUri);
    if (voice) utterance.voice = voice;
  }
  utterance.onend = () => {
    if (currentUtterance === utterance) currentUtterance = null;
    options.onEnd?.();
  };
  utterance.onerror = () => {
    if (currentUtterance === utterance) currentUtterance = null;
    options.onError?.();
  };
  if (options.onBoundary) {
    utterance.onboundary = (event) => options.onBoundary?.(event.charIndex);
  }

  currentUtterance = utterance;
  synth.speak(utterance);
}

export function pause(): void {
  if (speechSupported()) window.speechSynthesis.pause();
}

export function resume(): void {
  if (speechSupported()) window.speechSynthesis.resume();
}

/** Stops all speech. Called on navigation so voices never overlap (spec §46). */
export function stop(): void {
  if (!speechSupported()) return;
  currentUtterance = null;
  window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return speechSupported() && window.speechSynthesis.speaking;
}

export function isPaused(): boolean {
  return speechSupported() && window.speechSynthesis.paused;
}
