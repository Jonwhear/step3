/**
 * Applies Drizzle SQL migrations. Called by `npm run db:migrate` and lazily by
 * the app so a fresh clone works without a manual step being forgotten.
 */

import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { Db } from "./client";

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "src", "db", "migrations");

export function runMigrations(db: Db, folder: string = MIGRATIONS_FOLDER): void {
  migrate(db, { migrationsFolder: folder });
}
