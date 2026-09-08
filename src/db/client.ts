/**
 * SQLite connection. Single-user local prototype, so one shared better-sqlite3
 * handle per process is exactly right.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "step3.sqlite");

export function resolveDbPath(): string {
  return process.env.STEP3_DB_PATH ?? DEFAULT_DB_PATH;
}

export type Db = BetterSQLite3Database<typeof schema>;

export interface DbHandle {
  db: Db;
  sqlite: Database.Database;
}

let handle: DbHandle | null = null;

export function createDbHandle(dbPath: string): DbHandle {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return { sqlite, db: drizzle(sqlite, { schema }) };
}

export function getDbHandle(): DbHandle {
  if (!handle) {
    handle = createDbHandle(resolveDbPath());
  }
  return handle;
}

export function getDb(): Db {
  return getDbHandle().db;
}

/** Test helper: point the module-level handle at a specific database. */
export function setDbHandle(next: DbHandle | null): void {
  handle = next;
}

export { schema };
