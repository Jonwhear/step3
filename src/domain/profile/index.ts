/**
 * User profile, rotation schedule and preferences.
 *
 * Single-user prototype: there is one profile row keyed by APP_CONFIG.singleUserId.
 */

import { and, asc, eq } from "drizzle-orm";
import { APP_CONFIG, OFF_SERVICE_ROTATION } from "@/config/app";
import type { Db } from "@/db/client";
import * as t from "@/db/schema";
import { isWithin, nowIso, todayIso, type IsoDate } from "@/lib/date";

export const USER_ID = APP_CONFIG.singleUserId;

export interface CurrentRotation {
  id: string | null;
  name: string;
  specialty: string;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  isOffService: boolean;
}

export function getProfile(db: Db): t.UserProfileRow | null {
  return db.select().from(t.userProfile).where(eq(t.userProfile.id, USER_ID)).get() ?? null;
}

export interface ProfileInput {
  name: string;
  degree: string;
  specialty: string;
  step3Date: IsoDate;
  targetPatientCount: number;
}

export function upsertProfile(db: Db, input: ProfileInput): t.UserProfileRow {
  const existing = getProfile(db);
  if (existing) {
    db.update(t.userProfile)
      .set({ ...input, updatedAt: nowIso() })
      .where(eq(t.userProfile.id, USER_ID))
      .run();
  } else {
    db.insert(t.userProfile)
      .values({
        id: USER_ID,
        ...input,
        studyStartDate: todayIso(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .run();
  }
  return getProfile(db) as t.UserProfileRow;
}

export function listRotations(db: Db): t.RotationBlockRow[] {
  return db
    .select()
    .from(t.rotationBlock)
    .where(eq(t.rotationBlock.userId, USER_ID))
    .orderBy(asc(t.rotationBlock.startDate))
    .all();
}

export interface RotationInput {
  name: string;
  specialty: string;
  startDate: IsoDate;
  endDate: IsoDate;
}

export function addRotation(db: Db, input: RotationInput): void {
  db.insert(t.rotationBlock)
    .values({
      id: `rot_${crypto.randomUUID()}`,
      userId: USER_ID,
      ...input,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();
}

export function updateRotation(db: Db, id: string, input: RotationInput): void {
  db.update(t.rotationBlock)
    .set({ ...input, updatedAt: nowIso() })
    .where(and(eq(t.rotationBlock.id, id), eq(t.rotationBlock.userId, USER_ID)))
    .run();
}

export function deleteRotation(db: Db, id: string): void {
  db.delete(t.rotationBlock)
    .where(and(eq(t.rotationBlock.id, id), eq(t.rotationBlock.userId, USER_ID)))
    .run();
}

/**
 * The rotation block containing `date`, or the General / Off-Service fallback
 * when the schedule has a gap (spec §7).
 */
export function getCurrentRotation(db: Db, date: IsoDate = todayIso()): CurrentRotation {
  const match = listRotations(db).find((r) => isWithin(date, r.startDate, r.endDate));
  if (!match) {
    return {
      id: null,
      name: OFF_SERVICE_ROTATION.name,
      specialty: OFF_SERVICE_ROTATION.specialty,
      startDate: null,
      endDate: null,
      isOffService: true,
    };
  }
  return {
    id: match.id,
    name: match.name,
    specialty: match.specialty,
    startDate: match.startDate,
    endDate: match.endDate,
    isOffService: false,
  };
}

/* ------------------------------- preferences ------------------------------ */

export const SETTING_KEYS = {
  ttsRate: "tts.rate",
  ttsVoice: "tts.voice",
  onboarded: "profile.onboarded",
} as const;

export function getSettings(db: Db): Record<string, string> {
  const rows = db
    .select()
    .from(t.userSetting)
    .where(eq(t.userSetting.userId, USER_ID))
    .all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(db: Db, key: string, value: string): void {
  db.insert(t.userSetting)
    .values({ userId: USER_ID, key, value, updatedAt: nowIso() })
    .onConflictDoUpdate({
      target: [t.userSetting.userId, t.userSetting.key],
      set: { value, updatedAt: nowIso() },
    })
    .run();
}

export interface AudioPreferences {
  rate: number;
  voiceUri: string | null;
}

/**
 * There is deliberately no "read aloud automatically" preference: nothing in
 * the app plays on mount any more (spec §19). Audio always starts from Play.
 */
export function getAudioPreferences(db: Db): AudioPreferences {
  const settings = getSettings(db);
  const rate = Number(settings[SETTING_KEYS.ttsRate]);
  return {
    rate: Number.isFinite(rate) && rate > 0 ? rate : APP_CONFIG.defaults.ttsRate,
    voiceUri: settings[SETTING_KEYS.ttsVoice] || null,
  };
}
