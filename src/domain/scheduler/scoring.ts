/**
 * Candidate case scoring.
 *
 * Every term is inspectable and every weight lives in config/scheduler.ts
 * (spec §28, §44). The formula is intentionally a single readable sum so the
 * developer inspector can display exactly what the engine computed.
 */

import { RELATED_SPECIALTIES } from "@/config/app";
import { SCHEDULER_CONFIG } from "@/config/scheduler";
import { seededJitter } from "@/lib/seededRandom";
import { daysBetween, type IsoDate } from "@/lib/date";

export interface CandidateCase {
  id: string;
  code: string;
  title: string;
  specialty: string;
  topic: string;
  step3Importance: number;
  conceptIds: string[];
}

export interface ScoringContext {
  userId: string;
  today: IsoDate;
  rotationSpecialty: string;
  /** Concept ids due for spaced review. */
  dueConceptIds: Set<string>;
  /** Concept ids the learner keeps getting wrong. */
  weakConceptIds: Set<string>;
  /** How many cases the learner has encountered per topic. */
  topicCaseCounts: Map<string, number>;
  /** Concept ids taught by a lecture completed within the boost window. */
  recentLectureConceptIds: Set<string>;
  /** Case id -> most recent assignment date, for the recency penalty. */
  lastAssignedByCase: Map<string, IsoDate>;
}

export interface ScoreBreakdown {
  caseId: string;
  code: string;
  title: string;
  rotationRelevance: number;
  spacedRepetitionDue: number;
  curriculumGap: number;
  weakness: number;
  recentLecture: number;
  step3Importance: number;
  recentlySeen: number;
  jitter: number;
  total: number;
}

/** 1.0 for the current specialty, 0.5 for a related one, 0 otherwise. */
export function rotationRelevanceFactor(
  caseSpecialty: string,
  rotationSpecialty: string,
): number {
  if (caseSpecialty === rotationSpecialty) {
    return SCHEDULER_CONFIG.ROTATION_RELEVANCE.sameSpecialty;
  }
  const related = RELATED_SPECIALTIES[rotationSpecialty] ?? [];
  if (related.includes(caseSpecialty)) {
    return SCHEDULER_CONFIG.ROTATION_RELEVANCE.relatedSpecialty;
  }
  return SCHEDULER_CONFIG.ROTATION_RELEVANCE.unrelated;
}

/** Fraction of a case's concepts that are in `set`, 0 when it has none. */
function conceptFraction(conceptIds: readonly string[], set: ReadonlySet<string>): number {
  if (conceptIds.length === 0) return 0;
  const hits = conceptIds.filter((id) => set.has(id)).length;
  return hits / conceptIds.length;
}

/**
 * Scores one candidate case. Higher is more deserving of being scheduled next.
 *
 *   priority = rotationRelevance*4 + due*5 + gap*3 + weakness*3
 *            + recentLecture*2 + step3Importance*2 - recentlySeen*4 + jitter
 */
export function scoreCandidateCase(
  candidate: CandidateCase,
  ctx: ScoringContext,
): ScoreBreakdown {
  const W = SCHEDULER_CONFIG.WEIGHTS;

  const rotationRelevance =
    rotationRelevanceFactor(candidate.specialty, ctx.rotationSpecialty) * W.rotationRelevance;

  const spacedRepetitionDue =
    conceptFraction(candidate.conceptIds, ctx.dueConceptIds) * W.spacedRepetitionDue;

  // A topic the learner has barely touched scores a full gap bonus; the bonus
  // decays linearly to zero as coverage reaches the threshold.
  const topicCount = ctx.topicCaseCounts.get(candidate.topic) ?? 0;
  const gapFraction = Math.max(
    0,
    (SCHEDULER_CONFIG.CURRICULUM_GAP_THRESHOLD - topicCount) /
      SCHEDULER_CONFIG.CURRICULUM_GAP_THRESHOLD,
  );
  const curriculumGap = gapFraction * W.curriculumGap;

  const weakness = conceptFraction(candidate.conceptIds, ctx.weakConceptIds) * W.weakness;

  const recentLecture =
    conceptFraction(candidate.conceptIds, ctx.recentLectureConceptIds) * W.recentLecture;

  // Normalise 1..5 importance onto 0..1 before weighting.
  const step3Importance = ((candidate.step3Importance - 1) / 4) * W.step3Importance;

  // Recency penalty decays linearly over RECENTLY_SEEN_WINDOW_DAYS.
  const lastAssigned = ctx.lastAssignedByCase.get(candidate.id);
  let recentlySeen = 0;
  if (lastAssigned) {
    const age = daysBetween(lastAssigned, ctx.today);
    const window = SCHEDULER_CONFIG.RECENTLY_SEEN_WINDOW_DAYS;
    const freshness = Math.max(0, (window - age) / window);
    recentlySeen = freshness * W.recentlySeen;
  }

  // Seeded on user + date + case: reproducible, but varies day to day.
  const jitter = seededJitter(
    SCHEDULER_CONFIG.JITTER_MAX,
    ctx.userId,
    ctx.today,
    candidate.id,
  );

  const total =
    rotationRelevance +
    spacedRepetitionDue +
    curriculumGap +
    weakness +
    recentLecture +
    step3Importance -
    recentlySeen +
    jitter;

  return {
    caseId: candidate.id,
    code: candidate.code,
    title: candidate.title,
    rotationRelevance,
    spacedRepetitionDue,
    curriculumGap,
    weakness,
    recentLecture,
    step3Importance,
    recentlySeen,
    jitter,
    total,
  };
}

/** Scores every candidate and returns them highest-first. */
export function rankCandidates(
  candidates: readonly CandidateCase[],
  ctx: ScoringContext,
): ScoreBreakdown[] {
  return candidates
    .map((c) => scoreCandidateCase(c, ctx))
    .sort((a, b) => b.total - a.total || a.caseId.localeCompare(b.caseId));
}
