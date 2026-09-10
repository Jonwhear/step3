/**
 * Explicit playback state machine (spec §19).
 *
 * V1 fired `speak()` from an effect on mount, which meant audio started before
 * the learner asked for it and the transport controls did not agree with what
 * the browser was actually doing. The transitions now live in this pure
 * reducer: it owns the state, and the component's only job is to run the
 * returned effect. Because nothing here touches `window`, the whole state
 * machine is testable without a browser.
 *
 * The one rule that drives the rest: a freshly mounted player is STOPPED and
 * silent. Sound only ever follows an explicit PLAY.
 */

export type AudioState = "STOPPED" | "PLAYING" | "PAUSED";

export interface AudioMachine {
  state: AudioState;
  index: number;
  sectionCount: number;
}

export type AudioAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  /** Play/Pause button: the machine decides which of the three it means. */
  | { type: "TOGGLE" }
  | { type: "STOP" }
  | { type: "RESTART" }
  | { type: "SELECT"; index: number }
  | { type: "SECTION_ENDED" }
  | { type: "ERROR" }
  /** Navigating away, or swapping to a different patient / lecture. */
  | { type: "RESET" };

export type AudioEffect =
  | { kind: "none" }
  | { kind: "speak"; index: number }
  | { kind: "pause" }
  | { kind: "resume" }
  | { kind: "cancel" }
  /** The final section finished on its own. */
  | { kind: "finished" };

export interface AudioTransition {
  next: AudioMachine;
  effect: AudioEffect;
}

export function initialMachine(sectionCount: number): AudioMachine {
  return { state: "STOPPED", index: 0, sectionCount };
}

function clampIndex(index: number, sectionCount: number): number {
  if (sectionCount <= 0) return 0;
  return Math.max(0, Math.min(sectionCount - 1, index));
}

export function reduce(machine: AudioMachine, action: AudioAction): AudioTransition {
  const stay: AudioTransition = { next: machine, effect: { kind: "none" } };
  const { state, index, sectionCount } = machine;

  switch (action.type) {
    case "PLAY":
      if (sectionCount === 0) return stay;
      // Resuming mid-utterance is not the same as starting one: the browser
      // keeps the queued utterance, so re-speaking would restart the sentence.
      if (state === "PAUSED") {
        return { next: { ...machine, state: "PLAYING" }, effect: { kind: "resume" } };
      }
      if (state === "PLAYING") return stay;
      return { next: { ...machine, state: "PLAYING" }, effect: { kind: "speak", index } };

    case "RESUME":
      if (state !== "PAUSED") return stay;
      return { next: { ...machine, state: "PLAYING" }, effect: { kind: "resume" } };

    case "PAUSE":
      if (state !== "PLAYING") return stay;
      return { next: { ...machine, state: "PAUSED" }, effect: { kind: "pause" } };

    case "TOGGLE":
      return reduce(machine, { type: state === "PLAYING" ? "PAUSE" : "PLAY" });

    case "STOP":
      if (state === "STOPPED") return { next: machine, effect: { kind: "cancel" } };
      return { next: { ...machine, state: "STOPPED" }, effect: { kind: "cancel" } };

    case "RESTART": {
      if (sectionCount === 0) return stay;
      // Restart always speaks, even from STOPPED — it is an explicit request.
      return { next: { ...machine, state: "PLAYING" }, effect: { kind: "speak", index } };
    }

    case "SELECT": {
      if (sectionCount === 0) return stay;
      const target = clampIndex(action.index, sectionCount);
      // Clicking a section while it is playing jumps there and keeps playing.
      if (state === "PLAYING") {
        return {
          next: { ...machine, index: target, state: "PLAYING" },
          effect: { kind: "speak", index: target },
        };
      }
      // Paused or stopped: select it and wait for Play (spec §18).
      return {
        next: { ...machine, index: target, state: "STOPPED" },
        effect: { kind: "cancel" },
      };
    }

    case "SECTION_ENDED": {
      if (state !== "PLAYING") return stay;
      const next = index + 1;
      if (next >= sectionCount) {
        return {
          next: { ...machine, state: "STOPPED", index },
          effect: { kind: "finished" },
        };
      }
      return {
        next: { ...machine, index: next, state: "PLAYING" },
        effect: { kind: "speak", index: next },
      };
    }

    case "ERROR":
      return { next: { ...machine, state: "STOPPED" }, effect: { kind: "cancel" } };

    case "RESET":
      return {
        next: { state: "STOPPED", index: 0, sectionCount },
        effect: { kind: "cancel" },
      };

    default:
      return stay;
  }
}

/** True when the transport should render a Pause rather than a Play label. */
export function isActive(machine: AudioMachine): boolean {
  return machine.state === "PLAYING";
}
