import { getDb } from "../client";
import { runMigrations } from "../migrate";
import { deleteDemoContent } from "../seed";

const db = getDb();
runMigrations(db);
const result = deleteDemoContent(db);
console.log("Demo content deleted. Profile, rotations and settings were preserved.");
console.table(result);
