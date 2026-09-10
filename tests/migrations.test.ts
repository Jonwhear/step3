/**
 * Database migration safety (spec §45, §70).
 *
 * The developer has real application state, so an upgrade must never be
 * "delete and recreate". These tests build a database at the V1 schema, put
 * user data in it, then run the full migration chain and assert nothing was
 * lost.
 */

import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { MIGRATIONS_FOLDER } from "@/db/migrate";

/**
 * Applies only the migrations up to and including `tag`, through Drizzle's own
 * migrator so its bookkeeping table is written exactly as it would be in a real
 * V1 install. Hand-applying the SQL would leave the database looking unmigrated
 * and make the later full migrate() try to recreate existing tables.
 */
function migrateUpTo(sqlite: Database.Database, tag: string): void {
  const journal = JSON.parse(
    fs.readFileSync(path.join(MIGRATIONS_FOLDER, "meta", "_journal.json"), "utf8"),
  ) as { version: string; dialect: string; entries: { tag: string }[] };

  const cutoff = journal.entries.findIndex((e) => e.tag === tag) + 1;
  const entries = journal.entries.slice(0, cutoff);

  const scoped = fs.mkdtempSync(path.join(os.tmpdir(), "gh-migrations-"));
  fs.mkdirSync(path.join(scoped, "meta"), { recursive: true });
  fs.writeFileSync(
    path.join(scoped, "meta", "_journal.json"),
    JSON.stringify({ ...journal, entries }),
  );
  for (const entry of entries) {
    fs.copyFileSync(
      path.join(MIGRATIONS_FOLDER, `${entry.tag}.sql`),
      path.join(scoped, `${entry.tag}.sql`),
    );
  }

  migrate(drizzle(sqlite), { migrationsFolder: scoped });
  fs.rmSync(scoped, { recursive: true, force: true });
}

interface V1Fixture {
  sqlite: Database.Database;
  counts: Record<string, number>;
}

/** A V1-schema database containing a profile, a panel and study history. */
function buildV1Database(): V1Fixture {
  const sqlite = new Database(":memory:");
  migrateUpTo(sqlite, "0000_init");

  sqlite
    .prepare(
      `INSERT INTO user_profile (id, name, degree, specialty, step3_date, target_patient_count, study_start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run("user-local", "V1 Resident", "MD", "Internal Medicine", "2026-12-01", 300, "2026-01-01");

  sqlite
    .prepare(
      `INSERT INTO rotation_block (id, user_id, name, specialty, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run("rot_1", "user-local", "Wards", "Internal Medicine", "2026-01-01", "2026-06-30");

  sqlite
    .prepare(`INSERT INTO user_setting (user_id, key, value) VALUES (?, ?, ?)`)
    .run("user-local", "profile.onboarded", "true");
  sqlite
    .prepare(`INSERT INTO user_setting (user_id, key, value) VALUES (?, ?, ?)`)
    .run("user-local", "tts.rate", "1.2");

  sqlite
    .prepare(
      `INSERT INTO case_template
         (id, code, title, specialty, topic, primary_diagnosis, handoff_script, admission_opening)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      "case:V1-001",
      "V1-001",
      "Legacy Case",
      "Internal Medicine",
      "Cardiology",
      "Legacy diagnosis",
      "Legacy handoff",
      "Legacy opening",
    );

  sqlite
    .prepare(
      `INSERT INTO patient_instance
         (id, user_id, case_id, patient_name, room_number, entry_mode, state, assigned_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run("pt_1", "user-local", "case:V1-001", "Legacy Patient", "404", "HANDOFF", "ON_SERVICE", "2026-02-01");

  sqlite
    .prepare(
      `INSERT INTO user_concept_state (id, user_id, concept_id, exposures, correct_count, mastery_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run("ucs_1", "user-local", "concept:CARD.AF.01", 4, 3, 3);

  sqlite
    .prepare(
      `INSERT INTO study_event (id, user_id, event_type, event_date) VALUES (?, ?, ?, ?)`,
    )
    .run("evt_1", "user-local", "PROMPT_CORRECT", "2026-02-01");

  const count = (table: string) =>
    (sqlite.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;

  return {
    sqlite,
    counts: {
      user_profile: count("user_profile"),
      rotation_block: count("rotation_block"),
      user_setting: count("user_setting"),
      case_template: count("case_template"),
      patient_instance: count("patient_instance"),
      user_concept_state: count("user_concept_state"),
      study_event: count("study_event"),
    },
  };
}

describe("V1 → V2 migration", () => {
  it("upgrades without losing any user data", () => {
    const { sqlite, counts } = buildV1Database();

    migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS_FOLDER });

    const after = Object.fromEntries(
      Object.keys(counts).map((table) => [
        table,
        (sqlite.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c,
      ]),
    );

    expect(after).toEqual(counts);
    sqlite.close();
  });

  it("preserves the actual field values, not just the row counts", () => {
    const { sqlite } = buildV1Database();
    migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS_FOLDER });

    const profile = sqlite
      .prepare(`SELECT * FROM user_profile WHERE id = 'user-local'`)
      .get() as { name: string; step3_date: string; target_patient_count: number };
    expect(profile.name).toBe("V1 Resident");
    expect(profile.step3_date).toBe("2026-12-01");
    expect(profile.target_patient_count).toBe(300);

    const patient = sqlite.prepare(`SELECT * FROM patient_instance WHERE id = 'pt_1'`).get() as {
      patient_name: string;
      room_number: string;
      state: string;
    };
    expect(patient.patient_name).toBe("Legacy Patient");
    expect(patient.room_number).toBe("404");
    expect(patient.state).toBe("ON_SERVICE");

    const mastery = sqlite
      .prepare(`SELECT * FROM user_concept_state WHERE id = 'ucs_1'`)
      .get() as { mastery_level: number; exposures: number };
    expect(mastery.mastery_level).toBe(3);
    expect(mastery.exposures).toBe(4);

    const rate = sqlite
      .prepare(`SELECT value FROM user_setting WHERE key = 'tts.rate'`)
      .get() as { value: string };
    expect(rate.value).toBe("1.2");

    sqlite.close();
  });

  it("adds the V2 tables and columns with workable defaults", () => {
    const { sqlite } = buildV1Database();
    migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS_FOLDER });

    const tables = (
      sqlite
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
        .all() as { name: string }[]
    ).map((r) => r.name);

    for (const table of [
      "hospital_room",
      "lab_definition",
      "case_lab_result",
      "case_imaging_result",
      "case_problem",
      "lecture_section",
      "content_pack",
      "content_source",
      "source_fragment",
      "learning_point",
      "learning_point_mapping",
      "evidence_link",
      "patient_visual",
      "case_revision",
    ]) {
      expect(tables).toContain(table);
    }

    // Existing rows pick up sensible values for the new columns rather than
    // needing a backfill script.
    const patient = sqlite.prepare(`SELECT * FROM patient_instance WHERE id = 'pt_1'`).get() as {
      location_type: string;
      room_id: string | null;
    };
    expect(patient.location_type).toBe("INPATIENT");
    expect(patient.room_id).toBeNull();

    const template = sqlite.prepare(`SELECT * FROM case_template WHERE id = 'case:V1-001'`).get() as {
      status: string;
      version: number;
    };
    // A V1 case was, by definition, live content — so it stays publishable.
    expect(template.status).toBe("PUBLISHED");
    expect(template.version).toBe(1);

    sqlite.close();
  });

  it("is idempotent: migrating an already-current database is a no-op", () => {
    const { sqlite, counts } = buildV1Database();
    migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS_FOLDER });
    migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS_FOLDER });

    expect(
      (sqlite.prepare(`SELECT COUNT(*) AS c FROM user_profile`).get() as { c: number }).c,
    ).toBe(counts.user_profile);
    sqlite.close();
  });
});
