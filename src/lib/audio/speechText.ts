/**
 * Turns displayed content into something worth listening to (spec §60-61).
 *
 * Lecture bodies use a small markdown subset for the screen. Feeding that
 * straight into speech synthesis makes the voice read "asterisk asterisk", so
 * display text and speech text are rendered separately from the same source.
 *
 * The abbreviation dictionary is deliberately conservative. Expanding "IV" to
 * "intravenous" is safe; expanding something ambiguous is worse than leaving
 * the letters alone, so ambiguous forms are simply absent.
 */

/**
 * Spoken forms for abbreviations. A value with spaces between letters
 * ("C B C") makes the synthesiser spell it out instead of attempting a word.
 * Keys are matched case-sensitively on whole words only.
 */
export const SPEECH_ABBREVIATIONS: Record<string, string> = {
  IV: "intravenous",
  IM: "intramuscular",
  PO: "oral",
  PR: "rectal",
  SQ: "subcutaneous",
  SC: "subcutaneous",
  BID: "twice daily",
  TID: "three times daily",
  QID: "four times daily",
  QHS: "at bedtime",
  PRN: "as needed",
  NPO: "nothing by mouth",
  CBC: "C B C",
  BMP: "B M P",
  CMP: "C M P",
  ECG: "E K G",
  EKG: "E K G",
  EEG: "E E G",
  CT: "C T",
  MRI: "M R I",
  CXR: "chest x-ray",
  ABG: "arterial blood gas",
  VBG: "venous blood gas",
  LFT: "liver function test",
  LFTs: "liver function tests",
  BUN: "B U N",
  INR: "I N R",
  PTT: "P T T",
  DVT: "D V T",
  PE: "pulmonary embolism",
  MI: "myocardial infarction",
  CHF: "congestive heart failure",
  COPD: "C O P D",
  DKA: "D K A",
  ESRD: "end stage renal disease",
  ICU: "I C U",
  ED: "emergency department",
  GI: "G I",
  UTI: "urinary tract infection",
  SBP: "spontaneous bacterial peritonitis",
  HCC: "hepatocellular carcinoma",
  PPI: "proton pump inhibitor",
  NSAID: "N SAID",
  NSAIDs: "N SAIDs",
};

/** Escapes a dictionary key for use inside a whole-word regular expression. */
function wordPattern(key: string): RegExp {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "g");
}

const COMPILED = Object.entries(SPEECH_ABBREVIATIONS)
  // Longest first so "LFTs" is not consumed by "LFT".
  .sort((a, b) => b[0].length - a[0].length)
  .map(([key, spoken]) => [wordPattern(key), spoken] as const);

export function expandAbbreviations(text: string): string {
  let out = text;
  for (const [pattern, spoken] of COMPILED) out = out.replace(pattern, spoken);
  return out;
}

/** Strips the supported markdown subset, leaving readable prose. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\|/g, " ");
}

/**
 * Renders one lecture section as a single spoken paragraph: heading first, then
 * the body with bullets turned into sentences so the voice pauses naturally
 * instead of running every point together.
 */
export function renderSectionForSpeech(section: {
  heading?: string;
  body: string;
}): string {
  const lines = stripMarkdown(section.body)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    // A bullet without terminal punctuation would otherwise run into the next.
    .map((line) => (/[.!?:]$/.test(line) ? line : `${line}.`));

  const heading = section.heading?.trim();
  const spokenHeading = heading ? (/[.!?:]$/.test(heading) ? heading : `${heading}.`) : "";

  return expandAbbreviations([spokenHeading, ...lines].filter(Boolean).join(" "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Convenience for plain prompts and scripts that have no heading or markup. */
export function renderTextForSpeech(text: string): string {
  return expandAbbreviations(stripMarkdown(text)).replace(/\s+/g, " ").trim();
}
