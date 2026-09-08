/** Deletes the entire database file. Development convenience only. */
import fs from "node:fs";
import { resolveDbPath } from "../client";

const path = resolveDbPath();
for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${path}${suffix}`;
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    console.log(`Removed ${file}`);
  }
}
