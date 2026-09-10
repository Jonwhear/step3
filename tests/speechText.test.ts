/**
 * TTS-safe rendering and the abbreviation dictionary (spec §60-61).
 */

import { describe, expect, it } from "vitest";
import {
  expandAbbreviations,
  renderSectionForSpeech,
  renderTextForSpeech,
  stripMarkdown,
} from "@/lib/audio/speechText";

describe("stripMarkdown", () => {
  it("removes emphasis markers", () => {
    expect(stripMarkdown("Give **calcium** first")).toBe("Give calcium first");
    expect(stripMarkdown("*italic* text")).toBe("italic text");
  });

  it("removes bullet and heading markers", () => {
    expect(stripMarkdown("- First point\n- Second point")).toBe("First point\nSecond point");
    expect(stripMarkdown("## Management")).toBe("Management");
  });
});

describe("expandAbbreviations", () => {
  it("expands unambiguous abbreviations to words", () => {
    expect(expandAbbreviations("Give IV fluids")).toBe("Give intravenous fluids");
    expect(expandAbbreviations("Start PO intake")).toBe("Start oral intake");
    expect(expandAbbreviations("Dose BID")).toBe("Dose twice daily");
  });

  it("spells out letter abbreviations rather than making a word of them", () => {
    expect(expandAbbreviations("Order a CBC")).toBe("Order a C B C");
    expect(expandAbbreviations("Check the ECG")).toBe("Check the E K G");
  });

  it("only matches whole words", () => {
    // "IV" inside a larger token must not be rewritten.
    expect(expandAbbreviations("DIVIDED")).toBe("DIVIDED");
    expect(expandAbbreviations("CTX")).toBe("CTX");
  });

  it("prefers the longest match", () => {
    expect(expandAbbreviations("Check LFTs")).toBe("Check liver function tests");
  });

  it("leaves unknown abbreviations alone", () => {
    expect(expandAbbreviations("Consider TIPS")).toBe("Consider TIPS");
  });
});

describe("renderSectionForSpeech", () => {
  it("reads the heading first, then the body", () => {
    const spoken = renderSectionForSpeech({
      heading: "Management",
      body: "Give fluids.",
    });
    expect(spoken).toBe("Management. Give fluids.");
  });

  it("turns bullets into separate sentences", () => {
    const spoken = renderSectionForSpeech({
      heading: "Management",
      body: "- Give IV fluids\n- Start insulin after potassium assessment\n- Continue until the anion gap closes",
    });
    expect(spoken).toBe(
      "Management. Give intravenous fluids. Start insulin after potassium assessment. Continue until the anion gap closes.",
    );
  });

  it("never leaks markdown symbols into speech", () => {
    const spoken = renderSectionForSpeech({
      heading: "Pitfalls",
      body: "- **Never** start insulin before checking potassium\n- Watch the *gap*",
    });
    expect(spoken).not.toMatch(/[*#|]/);
  });

  it("works without a heading, for legacy flat scripts", () => {
    const spoken = renderSectionForSpeech({ body: "A single paragraph of script." });
    expect(spoken).toBe("A single paragraph of script.");
  });

  it("collapses whitespace", () => {
    const spoken = renderSectionForSpeech({ heading: "A", body: "one\n\n\n   two" });
    expect(spoken).toBe("A. one. two.");
  });
});

describe("renderTextForSpeech", () => {
  it("handles plain prompt text", () => {
    expect(renderTextForSpeech("What is the next step? Order a CBC.")).toBe(
      "What is the next step? Order a C B C.",
    );
  });
});
