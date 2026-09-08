/** Shared fixtures: an in-memory database seeded with the demo library. */

import { createDbHandle, setDbHandle, type Db, type DbHandle } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seedDemoContent } from "@/db/seed";
import { addRotation, upsertProfile } from "@/domain/profile";
import type { IsoDate } from "@/lib/date";

export interface TestContext {
  handle: DbHandle;
  db: Db;
}

export function createTestDb(seed = true): TestContext {
  const handle = createDbHandle(":memory:");
  setDbHandle(handle);
  runMigrations(handle.db);
  if (seed) seedDemoContent(handle.db);
  return { handle, db: handle.db };
}

export function closeTestDb(ctx: TestContext): void {
  ctx.handle.sqlite.close();
  setDbHandle(null);
}

export interface ProfileOptions {
  step3Date?: IsoDate;
  targetPatientCount?: number;
  studyStartDate?: IsoDate;
  rotationSpecialty?: string;
  rotationStart?: IsoDate;
  rotationEnd?: IsoDate;
}

export function seedProfile(ctx: TestContext, options: ProfileOptions = {}) {
  const db = ctx.db;
  const profile = upsertProfile(db, {
    name: "Test Resident",
    degree: "MD",
    specialty: "Internal Medicine",
    step3Date: options.step3Date ?? "2026-12-31",
    targetPatientCount: options.targetPatientCount ?? 60,
  });

  if (options.studyStartDate) {
    // upsertProfile stamps today; tests need a controlled study window.
    ctx.handle.sqlite
      .prepare("UPDATE user_profile SET study_start_date = ?")
      .run(options.studyStartDate);
  }

  addRotation(db, {
    name: options.rotationSpecialty ?? "Internal Medicine",
    specialty: options.rotationSpecialty ?? "Internal Medicine",
    startDate: options.rotationStart ?? "2026-01-01",
    endDate: options.rotationEnd ?? "2026-12-31",
  });

  return profile;
}
