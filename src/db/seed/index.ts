/**
 * Demo content seeding and removal.
 *
 * Seeding is idempotent: it keys on the stable content `code`, so running it
 * twice replaces rather than duplicates. Deletion removes only rows flagged
 * `is_demo`, plus the learner progress that depends on them — never the
 * profile, rotation schedule or settings (spec §38).
 */

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { APP_CONFIG } from "@/config/app";
import { loadDemoContent } from "@/content/demo";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";

const DEMO_MARKERS = {
  isDemo: true as const,
  contentOrigin: APP_CONFIG.demo.contentOrigin,
  demoSeedVersion: APP_CONFIG.demo.seedVersion,
};

/** Deterministic ids so re-seeding is stable across runs. */
const id = (prefix: string, key: string) => `${prefix}:${key}`;

export interface SeedResult {
  concepts: number;
  actions: number;
  cases: number;
  lectures: number;
  findings: number;
  actionRules: number;
  prompts: number;
  lectureSections: number;
  labDefinitions: number;
  labResults: number;
  imagingResults: number;
  problems: number;
  learningPoints: number;
}

export function seedDemoContent(db: Db): SeedResult {
  const content = loadDemoContent();
  const result: SeedResult = {
    concepts: 0,
    actions: 0,
    cases: 0,
    lectures: 0,
    findings: 0,
    actionRules: 0,
    prompts: 0,
    lectureSections: 0,
    labDefinitions: 0,
    labResults: 0,
    imagingResults: 0,
    problems: 0,
    learningPoints: 0,
  };

  db.transaction((tx) => {
    /* ------------------------------- concepts ------------------------------ */
    for (const c of content.concepts) {
      const conceptId = id("concept", c.code);
      tx.insert(t.concept)
        .values({
          id: conceptId,
          code: c.code,
          name: c.name,
          specialty: c.specialty,
          topic: c.topic,
          description: c.description,
          importance: c.importance,
          ...DEMO_MARKERS,
        })
        .onConflictDoUpdate({
          target: t.concept.id,
          set: {
            name: c.name,
            specialty: c.specialty,
            topic: c.topic,
            description: c.description,
            importance: c.importance,
          },
        })
        .run();
      result.concepts += 1;
    }

    /* -------------------------------- actions ------------------------------ */
    for (const a of content.actions) {
      const actionId = id("action", a.actionCode);
      tx.insert(t.actionDefinition)
        .values({
          id: actionId,
          actionCode: a.actionCode,
          category: a.category,
          displayName: a.displayName,
          synonymsJson: JSON.stringify(a.synonyms),
          ...DEMO_MARKERS,
        })
        .onConflictDoUpdate({
          target: t.actionDefinition.id,
          set: {
            category: a.category,
            displayName: a.displayName,
            synonymsJson: JSON.stringify(a.synonyms),
          },
        })
        .run();
      result.actions += 1;
    }

    /* --------------------------------- cases ------------------------------- */
    for (const c of content.cases) {
      const caseId = id("case", c.code);

      tx.insert(t.caseTemplate)
        .values({
          id: caseId,
          code: c.code,
          title: c.title,
          specialty: c.specialty,
          topic: c.topic,
          primaryDiagnosis: c.primaryDiagnosis,
          difficulty: c.difficulty,
          step3Importance: c.step3Importance,
          handoffScript: c.handoffScript,
          dailySignout: c.dailySignout,
          admissionOpening: c.admissionOpening,
          teachingPoint: c.teachingPoint,
          minimumRoundsBeforeDischarge: c.minimumRoundsBeforeDischarge,
          ...DEMO_MARKERS,
        })
        .onConflictDoUpdate({
          target: t.caseTemplate.id,
          set: {
            title: c.title,
            specialty: c.specialty,
            topic: c.topic,
            primaryDiagnosis: c.primaryDiagnosis,
            difficulty: c.difficulty,
            step3Importance: c.step3Importance,
            handoffScript: c.handoffScript,
            dailySignout: c.dailySignout,
            admissionOpening: c.admissionOpening,
            teachingPoint: c.teachingPoint,
            minimumRoundsBeforeDischarge: c.minimumRoundsBeforeDischarge,
          },
        })
        .run();
      result.cases += 1;

      // Children are replaced wholesale so edits to a case file take effect.
      tx.delete(t.caseConcept).where(eq(t.caseConcept.caseId, caseId)).run();
      tx.delete(t.caseFinding).where(eq(t.caseFinding.caseId, caseId)).run();
      tx.delete(t.caseActionRule).where(eq(t.caseActionRule.caseId, caseId)).run();
      tx.delete(t.casePrompt).where(eq(t.casePrompt.caseId, caseId)).run();

      for (const cc of c.concepts) {
        tx.insert(t.caseConcept)
          .values({ caseId, conceptId: id("concept", cc.code), weight: cc.weight })
          .run();
      }

      c.findings.forEach((f, index) => {
        tx.insert(t.caseFinding)
          .values({
            id: `${caseId}:finding:${index}`,
            caseId,
            category: f.category,
            label: f.label,
            value: f.value,
            units: f.units ?? null,
            referenceRange: f.referenceRange ?? null,
            triggerActionCode: f.triggerActionCode ?? null,
            initiallyVisible: f.initiallyVisible,
            displayOrder: index,
          })
          .run();
        result.findings += 1;
      });

      for (const r of c.actionRules) {
        tx.insert(t.caseActionRule)
          .values({
            id: `${caseId}:rule:${r.actionCode}`,
            caseId,
            actionCode: r.actionCode,
            classification: r.classification,
            resultText: r.resultText,
            feedbackText: r.feedbackText,
            conceptId: r.conceptCode ? id("concept", r.conceptCode) : null,
          })
          .run();
        result.actionRules += 1;
      }

      // Sequence numbers are assigned per stage in declaration order.
      const stageCounters = new Map<string, number>();
      c.prompts.forEach((p, index) => {
        const seq = stageCounters.get(p.stage) ?? 0;
        stageCounters.set(p.stage, seq + 1);
        tx.insert(t.casePrompt)
          .values({
            id: `${caseId}:prompt:${index}`,
            caseId,
            stage: p.stage,
            sequence: seq,
            promptText: p.promptText,
            responseType: p.responseType,
            answerConfigJson: JSON.stringify(p.answerConfig),
            correctFeedback: p.correctFeedback,
            incorrectFeedback: p.incorrectFeedback,
            conceptId: p.conceptCode ? id("concept", p.conceptCode) : null,
          })
          .run();
        result.prompts += 1;
      });
    }

    /* ------------------------------- lectures ------------------------------ */
    for (const l of content.lectures) {
      const lectureId = id("lecture", l.code);
      tx.insert(t.lecture)
        .values({
          id: lectureId,
          code: l.code,
          title: l.title,
          specialty: l.specialty,
          topic: l.topic,
          lectureType: l.lectureType,
          summary: l.summary,
          audioScript: JSON.stringify(l.audioScript),
          keyPointsJson: JSON.stringify(l.keyPoints),
          estimatedMinutes: l.estimatedMinutes,
          ...DEMO_MARKERS,
        })
        .onConflictDoUpdate({
          target: t.lecture.id,
          set: {
            title: l.title,
            specialty: l.specialty,
            topic: l.topic,
            lectureType: l.lectureType,
            summary: l.summary,
            audioScript: JSON.stringify(l.audioScript),
            keyPointsJson: JSON.stringify(l.keyPoints),
            estimatedMinutes: l.estimatedMinutes,
          },
        })
        .run();
      result.lectures += 1;

      tx.delete(t.lectureConcept).where(eq(t.lectureConcept.lectureId, lectureId)).run();
      for (const code of l.conceptCodes) {
        tx.insert(t.lectureConcept)
          .values({ lectureId, conceptId: id("concept", code) })
          .run();
      }

      // Structured sections when the lecture authors them; otherwise one
      // section per script paragraph with no heading, which the player renders
      // as "Part N". Either way the audio path is identical (spec §17).
      tx.delete(t.lectureSection).where(eq(t.lectureSection.lectureId, lectureId)).run();
      const sections = l.sections?.length
        ? l.sections.map((s) => ({
            heading: s.heading,
            body: s.body,
            mediaType: s.mediaType ?? null,
            mediaAssetPath: s.mediaAssetPath ?? null,
            caption: s.caption ?? null,
            altText: s.altText ?? null,
          }))
        : l.audioScript.map((body) => ({
            heading: "",
            body,
            mediaType: null,
            mediaAssetPath: null,
            caption: null,
            altText: null,
          }));

      sections.forEach((section, index) => {
        tx.insert(t.lectureSection)
          .values({
            id: `${lectureId}:section:${index}`,
            lectureId,
            heading: section.heading,
            body: section.body,
            displayOrder: index,
            ttsOrder: index,
            mediaType: section.mediaType,
            mediaAssetPath: section.mediaAssetPath,
            caption: section.caption,
            altText: section.altText,
          })
          .run();
        result.lectureSections += 1;
      });
    }
  });

  return result;
}

export interface DeleteResult {
  cases: number;
  concepts: number;
  lectures: number;
  actions: number;
  patientInstances: number;
  conceptStates: number;
  studyEvents: number;
  lectureStates: number;
  schedulerRuns: number;
}

/**
 * Removes all synthetic demo content and the learner progress derived from it.
 * Profile, rotation blocks and settings are deliberately untouched.
 */
export function deleteDemoContent(db: Db): DeleteResult {
  const counts: DeleteResult = {
    cases: 0,
    concepts: 0,
    lectures: 0,
    actions: 0,
    patientInstances: 0,
    conceptStates: 0,
    studyEvents: 0,
    lectureStates: 0,
    schedulerRuns: 0,
  };

  db.transaction((tx) => {
    const demoCaseIds = tx
      .select({ id: t.caseTemplate.id })
      .from(t.caseTemplate)
      .where(eq(t.caseTemplate.isDemo, true))
      .all()
      .map((r) => r.id);

    const demoConceptIds = tx
      .select({ id: t.concept.id })
      .from(t.concept)
      .where(eq(t.concept.isDemo, true))
      .all()
      .map((r) => r.id);

    const demoLectureIds = tx
      .select({ id: t.lecture.id })
      .from(t.lecture)
      .where(eq(t.lecture.isDemo, true))
      .all()
      .map((r) => r.id);

    // Patient instances built on demo cases, and everything hanging off them.
    const patientIds = demoCaseIds.length
      ? tx
          .select({ id: t.patientInstance.id })
          .from(t.patientInstance)
          .where(inArray(t.patientInstance.caseId, demoCaseIds))
          .all()
          .map((r) => r.id)
      : [];

    if (patientIds.length) {
      tx.delete(t.patientAction)
        .where(inArray(t.patientAction.patientInstanceId, patientIds))
        .run();
      tx.delete(t.patientRevealedFinding)
        .where(inArray(t.patientRevealedFinding.patientInstanceId, patientIds))
        .run();
      tx.delete(t.patientPromptResponse)
        .where(inArray(t.patientPromptResponse.patientInstanceId, patientIds))
        .run();
      tx.delete(t.patientInstance).where(inArray(t.patientInstance.id, patientIds)).run();
      counts.patientInstances = patientIds.length;
    }

    // Study events that reference any demo content, plus orphan scheduler noise.
    if (demoCaseIds.length || demoConceptIds.length || demoLectureIds.length || patientIds.length) {
      const clauses = [];
      if (demoCaseIds.length) clauses.push(inArray(t.studyEvent.caseId, demoCaseIds));
      if (demoConceptIds.length) clauses.push(inArray(t.studyEvent.conceptId, demoConceptIds));
      if (demoLectureIds.length) clauses.push(inArray(t.studyEvent.lectureId, demoLectureIds));
      if (patientIds.length)
        clauses.push(inArray(t.studyEvent.patientInstanceId, patientIds));
      const where = clauses.length === 1 ? clauses[0] : or(...clauses);
      counts.studyEvents = tx.delete(t.studyEvent).where(where).run().changes;
    }

    // Mastery state exists only for demo concepts, so it goes with them.
    if (demoConceptIds.length) {
      counts.conceptStates = tx
        .delete(t.userConceptState)
        .where(inArray(t.userConceptState.conceptId, demoConceptIds))
        .run().changes;
    }

    if (demoLectureIds.length) {
      counts.lectureStates = tx
        .delete(t.userLectureState)
        .where(inArray(t.userLectureState.lectureId, demoLectureIds))
        .run().changes;
      tx.delete(t.lectureConcept)
        .where(inArray(t.lectureConcept.lectureId, demoLectureIds))
        .run();
    }

    if (demoCaseIds.length) {
      tx.delete(t.caseConcept).where(inArray(t.caseConcept.caseId, demoCaseIds)).run();
      tx.delete(t.caseFinding).where(inArray(t.caseFinding.caseId, demoCaseIds)).run();
      tx.delete(t.caseActionRule).where(inArray(t.caseActionRule.caseId, demoCaseIds)).run();
      tx.delete(t.casePrompt).where(inArray(t.casePrompt.caseId, demoCaseIds)).run();
    }

    counts.cases = tx.delete(t.caseTemplate).where(eq(t.caseTemplate.isDemo, true)).run().changes;
    counts.lectures = tx.delete(t.lecture).where(eq(t.lecture.isDemo, true)).run().changes;
    counts.concepts = tx.delete(t.concept).where(eq(t.concept.isDemo, true)).run().changes;
    counts.actions = tx
      .delete(t.actionDefinition)
      .where(eq(t.actionDefinition.isDemo, true))
      .run().changes;

    // Scheduler snapshots describe content that no longer exists.
    counts.schedulerRuns = tx.delete(t.schedulerRun).run().changes;
  });

  return counts;
}

/** Delete then re-seed, restoring a pristine synthetic dataset. */
export function resetDemoContent(db: Db): SeedResult {
  deleteDemoContent(db);
  return seedDemoContent(db);
}

/** True when any demo content is present. */
export function hasDemoContent(db: Db): boolean {
  const row = db
    .select({ id: t.caseTemplate.id })
    .from(t.caseTemplate)
    .where(eq(t.caseTemplate.isDemo, true))
    .limit(1)
    .get();
  return Boolean(row);
}

/** Silences unused-import lint when the query helpers change shape. */
void and;
void isNull;
