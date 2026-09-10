/**
 * First-day service bootstrap (spec §35).
 *
 * V1 could finish onboarding and hand the learner an empty hospital: the daily
 * scheduler had already recorded a run for today (or pacing legitimately asked
 * for zero patients), so nothing arrived until the next calendar day. That is
 * indistinguishable from a broken app.
 *
 * This is a *separate* mechanism rather than a special case bolted into pacing.
 * It runs exactly once per profile, ignores the daily target, and guarantees a
 * small usable service — at least one handoff, ideally one active admission —
 * so every part of the workflow is reachable on day one.
 */

import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { getCaseConceptIds, listCases } from "@/domain/cases";
import { getDueConcepts, getWeakConcepts } from "@/domain/mastery";
import { createPatientInstance, listActivePanel, listAllPatients } from "@/domain/patients";
import { getCurrentRotation, getProfile, getSettings, setSetting, USER_ID } from "@/domain/profile";
import {
  countAvailableInpatientRooms,
  findAvailableRoom,
  reconcilePatientRooms,
  seedHospitalRooms,
} from "@/domain/rooms";
import { getPreferences, resolveSchedulerTuning, SETTINGS_KEYS } from "@/domain/settings";
import { DEMO_PATIENT_NAMES } from "@/content/demo/patientNames";
import { seededUnit } from "@/lib/seededRandom";
import { nowIso, todayIso, type IsoDate } from "@/lib/date";
import { rankCandidates, type CandidateCase } from "./scoring";

/** Spec §35: two handoff patients and one active admission. */
export const BOOTSTRAP_HANDOFF_COUNT = 2;
export const BOOTSTRAP_ADMISSION_COUNT = 1;
export const BOOTSTRAP_TOTAL = BOOTSTRAP_HANDOFF_COUNT + BOOTSTRAP_ADMISSION_COUNT;

export interface BootstrapResult {
  ran: boolean;
  reason: string;
  patientIds: string[];
  handoffCount: number;
  admissionCount: number;
}

export function hasBootstrapped(db: Db): boolean {
  return getSettings(db)[SETTINGS_KEYS.bootstrapCompleted] === "true";
}

function markBootstrapped(db: Db): void {
  setSetting(db, SETTINGS_KEYS.bootstrapCompleted, "true");
}

/**
 * Creates the learner's opening service. Safe to call on every page load: it
 * returns immediately once the marker is set, and never re-runs on its own.
 */
export function bootstrapNewUserService(
  db: Db,
  options: { today?: IsoDate; force?: boolean } = {},
): BootstrapResult {
  const today = options.today ?? todayIso();
  const empty = (reason: string): BootstrapResult => ({
    ran: false,
    reason,
    patientIds: [],
    handoffCount: 0,
    admissionCount: 0,
  });

  if (hasBootstrapped(db) && !options.force) {
    return empty("Bootstrap has already run for this profile.");
  }

  const profile = getProfile(db);
  if (!profile) return empty("No profile yet — onboarding is not complete.");

  seedHospitalRooms(db);
  reconcilePatientRooms(db);

  // Someone who already has a service does not need a starter one; mark it done
  // so a returning V1 user is never given a surprise extra panel.
  const existing = listAllPatients(db);
  if (existing.length > 0) {
    markBootstrapped(db);
    return empty("Profile already has patients; bootstrap marked complete without assigning.");
  }

  const tuning = resolveSchedulerTuning(getPreferences(db).scheduler);
  const panelSize = listActivePanel(db).length;
  const capacity = Math.min(
    Math.max(0, tuning.effectiveCensusCap - panelSize),
    countAvailableInpatientRooms(db),
    BOOTSTRAP_TOTAL,
  );
  if (capacity === 0) {
    return empty("No inpatient capacity available for a starter service.");
  }

  const publishable = listCases(db).filter((c) => c.status === "PUBLISHED");
  if (publishable.length === 0) {
    return empty(
      "The content library contains no published cases, so no starter service could be created.",
    );
  }

  const rotation = getCurrentRotation(db, today);
  const candidates: CandidateCase[] = publishable.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    specialty: c.specialty,
    topic: c.topic,
    step3Importance: c.step3Importance,
    conceptIds: getCaseConceptIds(db, c.id),
  }));

  // Same scoring as any other day, so the starter panel favours the learner's
  // current rotation rather than being an arbitrary slice of the library.
  const ranked = rankCandidates(candidates, {
    userId: USER_ID,
    today,
    rotationSpecialty: rotation.specialty,
    dueConceptIds: new Set(getDueConcepts(db, today)),
    weakConceptIds: new Set(getWeakConcepts(db)),
    topicCaseCounts: new Map(),
    recentLectureConceptIds: new Set(),
    lastAssignedByCase: new Map(),
    rotationRelevanceWeight: tuning.rotationRelevanceWeight,
  });

  const plan = planEntryModes(capacity);
  const usedNames = new Set<string>();
  const reservedRooms = new Set<string>();
  const patientIds: string[] = [];
  let handoffCount = 0;
  let admissionCount = 0;

  for (const [index, score] of ranked.slice(0, capacity).entries()) {
    const candidate = candidates.find((c) => c.id === score.caseId);
    if (!candidate) continue;

    const room = findAvailableRoom(db, "INPATIENT", reservedRooms);
    if (!room) break;
    reservedRooms.add(room.id);

    const entryMode = plan[index] ?? "HANDOFF";

    const patientId = createPatientInstance(db, {
      caseId: candidate.id,
      patientName: pickName(candidate.id, today, usedNames),
      roomNumber: room.roomNumber,
      roomId: room.id,
      locationType: "INPATIENT",
      entryMode,
      assignedDate: today,
    });

    patientIds.push(patientId);
    if (entryMode === "HANDOFF") handoffCount += 1;
    else admissionCount += 1;
  }

  markBootstrapped(db);
  // Recorded so the daily scheduler knows not to top the starter panel up to
  // the census cap on this same date — that would turn a deliberately gentle
  // first day into a full service. It still runs, and still picks the day's
  // teaching conference; it just assigns no additional patients.
  if (patientIds.length > 0) setSetting(db, SETTINGS_KEYS.bootstrapDate, today);

  return {
    ran: patientIds.length > 0,
    reason:
      patientIds.length > 0
        ? `Starter service created: ${handoffCount} handoff patient(s) and ${admissionCount} admission(s).`
        : "No starter patients could be created.",
    patientIds,
    handoffCount,
    admissionCount,
  };
}

/**
 * Handoffs first, then one active admission.
 *
 * On a cold start every concept is unseen, so the usual mastery-based entry
 * mode would make every starter patient a handoff and leave the admission
 * workflow unreachable on day one. A handoff always comes first because it is
 * the gentler introduction; the admission only appears once there is room for
 * both (spec §35).
 */
export function planEntryModes(capacity: number): ("HANDOFF" | "ADMISSION")[] {
  const plan: ("HANDOFF" | "ADMISSION")[] = [];
  const handoffs = Math.min(BOOTSTRAP_HANDOFF_COUNT, Math.max(1, capacity - BOOTSTRAP_ADMISSION_COUNT));
  for (let i = 0; i < Math.min(handoffs, capacity); i += 1) plan.push("HANDOFF");
  while (plan.length < capacity) plan.push("ADMISSION");
  return plan.slice(0, capacity);
}

/** The date the starter service was created, if it has been. */
export function getBootstrapDate(db: Db): string | null {
  return getSettings(db)[SETTINGS_KEYS.bootstrapDate] ?? null;
}

function pickName(caseId: string, today: IsoDate, used: Set<string>): string {
  const base = seededUnit(USER_ID, today, caseId, "bootstrap");
  const pool = DEMO_PATIENT_NAMES;
  for (let i = 0; i < pool.length; i += 1) {
    const name = pool[(Math.floor(base * pool.length) + i) % pool.length] as string;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return "Patient";
}

/** Used by the developer tools to re-run a bootstrap deliberately. */
export function clearBootstrapMarker(db: Db): void {
  db.delete(t.userSetting)
    .where(eq(t.userSetting.key, SETTINGS_KEYS.bootstrapCompleted))
    .run();
}
