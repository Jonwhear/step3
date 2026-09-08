import { getDb, resolveDbPath } from "../client";
import { runMigrations } from "../migrate";
import { seedDemoContent } from "../seed";

const db = getDb();
runMigrations(db);
const result = seedDemoContent(db);
console.log(`Seeded demo content into ${resolveDbPath()}`);
console.table(result);
