import "server-only";

import { getDb, type Db } from "@/db/client";
import { runMigrations } from "@/db/migrate";

let migrated = false;

/**
 * Application entry point to the database. Migrations run lazily once per
 * process so a fresh clone works without a forgotten manual step.
 */
export function db(): Db {
  const instance = getDb();
  if (!migrated) {
    runMigrations(instance);
    migrated = true;
  }
  return instance;
}
