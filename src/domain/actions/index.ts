/**
 * Controlled action vocabulary and deterministic speech matching.
 *
 * Speech never determines correctness (spec §16). It is normalised, matched
 * against explicit synonym lists, shown back to the learner, and only scored
 * after they confirm. Anything unmatched is surfaced as unmatched — never
 * guessed.
 */

import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";

export interface ActionDef {
  actionCode: string;
  category: string;
  displayName: string;
  synonyms: string[];
}

export function listActions(db: Db): ActionDef[] {
  return db
    .select()
    .from(t.actionDefinition)
    .all()
    .map(toActionDef);
}

export function getAction(db: Db, actionCode: string): ActionDef | null {
  const row = db
    .select()
    .from(t.actionDefinition)
    .where(eq(t.actionDefinition.actionCode, actionCode))
    .get();
  return row ? toActionDef(row) : null;
}

function toActionDef(row: t.ActionDefinitionRow): ActionDef {
  let synonyms: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.synonymsJson);
    if (Array.isArray(parsed)) synonyms = parsed.filter((s): s is string => typeof s === "string");
  } catch {
    synonyms = [];
  }
  return {
    actionCode: row.actionCode,
    category: row.category,
    displayName: row.displayName,
    synonyms,
  };
}

/**
 * Deterministic text normalisation applied to both spoken transcripts and
 * stored synonyms before comparison.
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\b(\d+)\s*lead\b/g, "$1 lead")
    .replace(/\s+/g, " ")
    .trim();
}

/** Filler words removed before matching so "um, get an ECG" still matches. */
const FILLER = new Set([
  "um",
  "uh",
  "so",
  "well",
  "okay",
  "ok",
  "please",
  "lets",
  "let's",
  "i'd",
  "id",
  "i",
  "would",
  "want",
  "to",
  "the",
  "a",
  "an",
  "and",
  "then",
  "also",
  "next",
  "maybe",
  "think",
]);

export function stripFiller(normalized: string): string {
  return normalized
    .split(" ")
    .filter((w) => w && !FILLER.has(w))
    .join(" ");
}

export interface SpeechMatch {
  actionCode: string;
  displayName: string;
  /** The synonym text that produced the match, for display back to the user. */
  matchedPhrase: string;
}

export interface SpeechMatchResult {
  transcript: string;
  normalized: string;
  matched: SpeechMatch[];
  /** True when nothing matched — the caller must not guess. */
  unmatched: boolean;
}

/**
 * Matches a free-form transcript against the action vocabulary.
 *
 * Longest synonyms are tried first so "give aspirin" wins over "aspirin", and
 * a matched span is consumed so one phrase cannot produce two actions.
 */
export function matchTranscriptToActions(
  transcript: string,
  actions: readonly ActionDef[],
): SpeechMatchResult {
  const normalized = normalizeText(transcript);
  const haystackFull = ` ${normalized} `;
  const haystackStripped = ` ${stripFiller(normalized)} `;

  const candidates: { actionCode: string; displayName: string; phrase: string }[] = [];
  for (const action of actions) {
    const phrases = [action.displayName, ...action.synonyms].map(normalizeText);
    for (const phrase of phrases) {
      if (phrase) candidates.push({ actionCode: action.actionCode, displayName: action.displayName, phrase });
    }
  }
  // Longest phrase first: specific beats generic.
  candidates.sort((a, b) => b.phrase.length - a.phrase.length);

  const matched: SpeechMatch[] = [];
  const seen = new Set<string>();
  // Track consumed character spans so overlapping synonyms do not double-match.
  const consumed: [number, number][] = [];

  const overlaps = (start: number, end: number) =>
    consumed.some(([s, e]) => start < e && end > s);

  for (const candidate of candidates) {
    if (seen.has(candidate.actionCode)) continue;
    const needle = ` ${candidate.phrase} `;
    let index = haystackFull.indexOf(needle);
    if (index === -1) {
      // Retry against the filler-stripped form for phrasing like "I'd get an ECG".
      if (haystackStripped.includes(needle)) {
        matched.push({
          actionCode: candidate.actionCode,
          displayName: candidate.displayName,
          matchedPhrase: candidate.phrase,
        });
        seen.add(candidate.actionCode);
      }
      continue;
    }
    // +1/-1 because the needle carries its own padding spaces.
    const start = index + 1;
    const end = start + candidate.phrase.length;
    if (overlaps(start, end)) continue;
    consumed.push([start, end]);
    matched.push({
      actionCode: candidate.actionCode,
      displayName: candidate.displayName,
      matchedPhrase: candidate.phrase,
    });
    seen.add(candidate.actionCode);
    index = -1;
  }

  return {
    transcript: transcript.trim(),
    normalized,
    matched,
    unmatched: matched.length === 0,
  };
}

/**
 * Matches a transcript against a fixed set of short answers (used for
 * SHORT_TEXT prompts). Exact match after normalisation only — no fuzziness,
 * because an ambiguous match must never be silently scored.
 */
export function matchShortAnswer(
  transcript: string,
  acceptedAnswers: readonly string[],
): { matched: boolean; normalized: string } {
  const normalized = normalizeText(transcript);
  const stripped = stripFiller(normalized);
  const accepted = acceptedAnswers.map(normalizeText);
  const matched = accepted.some(
    (a) => a === normalized || a === stripped || normalized.includes(a) || stripped.includes(a),
  );
  return { matched, normalized };
}
