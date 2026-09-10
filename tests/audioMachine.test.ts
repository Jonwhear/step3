/**
 * Playback state machine (spec §19, §69).
 *
 * These are the regression tests for the V1 bug: rounds started speaking on
 * mount and the transport did not agree with the browser. The machine is pure,
 * so the rules can be asserted directly without mocking speechSynthesis.
 */

import { describe, expect, it } from "vitest";
import { initialMachine, reduce, type AudioMachine } from "@/lib/audio/machine";

const SECTIONS = 3;

function fresh(): AudioMachine {
  return initialMachine(SECTIONS);
}

/** Applies a sequence of actions, returning the final state and last effect. */
function run(machine: AudioMachine, actions: Parameters<typeof reduce>[1][]) {
  let current = machine;
  let effect = reduce(machine, { type: "STOP" }).effect;
  for (const action of actions) {
    const transition = reduce(current, action);
    current = transition.next;
    effect = transition.effect;
  }
  return { machine: current, effect };
}

describe("audio state machine", () => {
  it("initialises STOPPED at the first section", () => {
    const machine = fresh();
    expect(machine.state).toBe("STOPPED");
    expect(machine.index).toBe(0);
  });

  it("produces no speech effect without an explicit action", () => {
    // The whole autoplay bug in one assertion: constructing the machine must
    // never, on its own, ask anything to be spoken.
    const machine = fresh();
    const { effect } = reduce(machine, { type: "SECTION_ENDED" });
    expect(effect.kind).toBe("none");
    expect(machine.state).toBe("STOPPED");
  });

  it("STOPPED + Play starts speaking the current section", () => {
    const { next, effect } = reduce(fresh(), { type: "PLAY" });
    expect(next.state).toBe("PLAYING");
    expect(effect).toEqual({ kind: "speak", index: 0 });
  });

  it("PLAYING + Pause pauses rather than cancelling", () => {
    const playing = reduce(fresh(), { type: "PLAY" }).next;
    const { next, effect } = reduce(playing, { type: "PAUSE" });
    expect(next.state).toBe("PAUSED");
    expect(effect.kind).toBe("pause");
  });

  it("PAUSED + Play resumes instead of re-speaking the section", () => {
    const { machine, effect } = run(fresh(), [{ type: "PLAY" }, { type: "PAUSE" }, { type: "PLAY" }]);
    expect(machine.state).toBe("PLAYING");
    // Re-speaking would restart the sentence the learner was halfway through.
    expect(effect.kind).toBe("resume");
  });

  it("Restart re-speaks the current section", () => {
    const { machine, effect } = run(fresh(), [
      { type: "PLAY" },
      { type: "SECTION_ENDED" },
      { type: "RESTART" },
    ]);
    expect(machine.state).toBe("PLAYING");
    expect(effect).toEqual({ kind: "speak", index: 1 });
  });

  it("Stop cancels and returns to STOPPED", () => {
    const { machine, effect } = run(fresh(), [{ type: "PLAY" }, { type: "STOP" }]);
    expect(machine.state).toBe("STOPPED");
    expect(effect.kind).toBe("cancel");
  });

  it("selecting a section while playing jumps there and keeps playing", () => {
    const { machine, effect } = run(fresh(), [{ type: "PLAY" }, { type: "SELECT", index: 2 }]);
    expect(machine.state).toBe("PLAYING");
    expect(machine.index).toBe(2);
    expect(effect).toEqual({ kind: "speak", index: 2 });
  });

  it("selecting a section while stopped only moves the cursor", () => {
    const { next, effect } = reduce(fresh(), { type: "SELECT", index: 2 });
    expect(next.index).toBe(2);
    expect(next.state).toBe("STOPPED");
    expect(effect.kind).toBe("cancel");
  });

  it("selecting while paused waits for Play (spec §18)", () => {
    const { machine } = run(fresh(), [
      { type: "PLAY" },
      { type: "PAUSE" },
      { type: "SELECT", index: 1 },
    ]);
    expect(machine.index).toBe(1);
    expect(machine.state).toBe("STOPPED");
  });

  it("clamps a selection outside the section range", () => {
    expect(reduce(fresh(), { type: "SELECT", index: 99 }).next.index).toBe(SECTIONS - 1);
    expect(reduce(fresh(), { type: "SELECT", index: -5 }).next.index).toBe(0);
  });

  it("advances through sections as each finishes", () => {
    const first = reduce(fresh(), { type: "PLAY" }).next;
    const second = reduce(first, { type: "SECTION_ENDED" });
    expect(second.next.index).toBe(1);
    expect(second.effect).toEqual({ kind: "speak", index: 1 });
  });

  it("stops after the final section and reports finished", () => {
    const { machine, effect } = run(fresh(), [
      { type: "PLAY" },
      { type: "SECTION_ENDED" },
      { type: "SECTION_ENDED" },
      { type: "SECTION_ENDED" },
    ]);
    expect(machine.state).toBe("STOPPED");
    expect(effect.kind).toBe("finished");
  });

  it("ignores a stale SECTION_ENDED once stopped", () => {
    const stopped = run(fresh(), [{ type: "PLAY" }, { type: "STOP" }]).machine;
    const { next, effect } = reduce(stopped, { type: "SECTION_ENDED" });
    expect(next.state).toBe("STOPPED");
    expect(effect.kind).toBe("none");
  });

  it("RESET returns to a silent first section — used on navigation", () => {
    const { machine, effect } = run(fresh(), [
      { type: "PLAY" },
      { type: "SELECT", index: 2 },
      { type: "RESET" },
    ]);
    expect(machine).toEqual(initialMachine(SECTIONS));
    expect(effect.kind).toBe("cancel");
  });

  it("does nothing when there are no sections to play", () => {
    const emptyMachine = initialMachine(0);
    const { next, effect } = reduce(emptyMachine, { type: "PLAY" });
    expect(next.state).toBe("STOPPED");
    expect(effect.kind).toBe("none");
  });

  it("Toggle plays from stopped and pauses from playing", () => {
    const played = reduce(fresh(), { type: "TOGGLE" });
    expect(played.next.state).toBe("PLAYING");
    const paused = reduce(played.next, { type: "TOGGLE" });
    expect(paused.next.state).toBe("PAUSED");
  });
});
