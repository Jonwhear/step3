import { getDb, resolveDbPath } from "../client";
import { runMigrations } from "../migrate";

runMigrations(getDb());
console.log(`Migrations applied to ${resolveDbPath()}`);
