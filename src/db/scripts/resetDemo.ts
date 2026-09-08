import { getDb } from "../client";
import { runMigrations } from "../migrate";
import { resetDemoContent } from "../seed";

const db = getDb();
runMigrations(db);
const result = resetDemoContent(db);
console.log("Demo content reset. Profile and rotations were not touched.");
console.table(result);
