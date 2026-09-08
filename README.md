# Step 3 Teaching Hospital

A case-centric USMLE Step 3 study application structured as a fictional teaching
hospital service. The learner works as a resident: they take morning handoff,
round on a persistent patient panel, admit new patients, discharge them, and
attend teaching conference. Underneath that surface is a deterministic
curriculum, mastery model and scheduler.

**There is no LLM anywhere in this application.** Every diagnosis, test result,
correct answer, piece of feedback, scoring rule and scheduling decision is
authored data or explicit code.

---

## 1. What this is

A working MVP whose purpose is to prove the educational model works:

- case-centric learning rather than a question bank
- a simulated hospital service with a **persistent patient panel**
- morning handoff, rounds, active admissions, discharge
- scheduled teaching conferences
- deterministic spaced repetition
- rotation-aware scheduling
- audio-first interaction with optional voice input
- progress that survives restarts

The learner sees patients. The concepts, mastery levels and spaced-repetition
queues exist underneath and surface only on the Progress and Developer screens.

## 2. Current MVP scope

Implemented:

| Area | Status |
|---|---|
| Onboarding, profile, rotation schedule | ✅ |
| Deterministic scheduler with debug inspector | ✅ |
| Morning handoff (audio-first, accept-to-panel) | ✅ |
| Rounds with deterministic prompts and mastery updates | ✅ |
| Active admission with a controlled action vocabulary | ✅ |
| Discharge interaction and patient history | ✅ |
| Teaching conference with section-by-section TTS | ✅ |
| Progress dashboard with specialty/topic drill-down | ✅ |
| 20 synthetic cases, 20 synthetic lectures, 101 concepts, 94 actions | ✅ |
| Demo content delete / reset | ✅ |
| Automated tests (65) | ✅ |

Deliberately **not** built (spec non-goals): authentication, multiplayer,
cloud sync, leaderboards, streaks, billing, native apps, LLM grading,
generative cases, dynamic physiologic simulation, a full CCS simulator, or any
external medical API.

## 3. Architecture

```
User Profile + Rotation Schedule
             │
             ▼
         Scheduler                     ← deterministic, seeded, inspectable
             │
      ┌──────┴───────┐
      ▼              ▼
Active Panel       Lectures
      │
      ├─ Handoff     (receptive — introduces concepts)
      ├─ Rounds      (retrieval — spaced repetition)
      ├─ Admission   (application — controlled action vocabulary)
      └─ Discharge   (consolidation)
             │
             ▼
       Concept Mastery                 ← transparent level 0-5 model
             │
             ▼
     Future Scheduling
```

A single Next.js monolith. Server Components read SQLite directly; every
mutation goes through a Server Action so nothing is graded on the client.

```
src/
  app/                 routes + server actions
    onboarding/ handoff/ rounds/ admissions/ conference/
    patients/ progress/ settings/developer/
  components/          layout, patient, audio, speech, ui
  domain/              the actual logic, framework-free
    scheduler/         pacing.ts, scoring.ts, entryMode.ts, index.ts
    cases/ patients/ mastery/ lectures/ actions/ progress/ profile/
  db/                  schema.ts, client.ts, migrations/, seed/, scripts/
  content/
    schema.ts          Zod schemas for all authored content
    demo/              cases/, concepts/, lectures/, actions/
  lib/                 date/, seededRandom/, audio/, speech/
  config/              app.ts, scheduler.ts   ← all tuning lives here
tests/                 scheduler, case engine, mastery, persistence
```

### Layer rules

- `domain/` never imports from `app/` or `components/`.
- All tunable numbers live in `src/config/scheduler.ts`; no formula is
  duplicated across files.
- `content/` holds medical content only. No medical content lives in UI
  components.

## 4. Why no LLM

The guiding question at every design decision was: *could this behaviour be
encoded explicitly instead of delegated to a model?* Where the answer was yes,
it is encoded explicitly.

- **Correctness must be auditable.** A resident preparing for Step 3 needs
  answers that a physician author has reviewed. `case_action_rule` and
  `case_prompt` rows hold exactly what a human wrote.
- **Scheduling must be reproducible.** Bugs have to be replayable. The
  scheduler is seeded on `(user id + date + case id)` and never calls unseeded
  `Math.random()`.
- **Speech must not guess.** A transcript is normalised, matched against
  explicit synonym lists, and **shown back to the learner for confirmation**
  before anything is scored. An unmatched phrase is reported as unmatched.
- **The system must be inspectable.** You can understand the whole application
  by reading the database rows, the case files, and `config/scheduler.ts`.

There is no OpenAI or Anthropic dependency, no embeddings, and no vector store.

## 5. Setup

Requires Node 20+.

```bash
npm install
npm run db:migrate     # create/upgrade the SQLite schema
npm run db:seed        # load the synthetic demo library
npm run dev            # http://localhost:3000
```

Or the shorthand:

```bash
npm install && npm run setup && npm run dev
```

The database file defaults to `./data/step3.sqlite`. Override with
`STEP3_DB_PATH`.

### All commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed synthetic demo content (idempotent) |
| `npm run db:reset-demo` | Delete then re-seed demo content |
| `npm run db:delete-demo` | Delete demo content, keep profile |
| `npm run db:nuke` | Delete the database file entirely |
| `npm test` | Run the test suite |
| `npm run typecheck` | `tsc --noEmit` |

## 6. Database migrations

Drizzle ORM with SQL migrations in `src/db/migrations/`.

```bash
# after editing src/db/schema.ts
npx drizzle-kit generate --name your_change
npm run db:migrate
```

Migrations also run lazily on first request in the app (`src/server/db.ts`), so
a fresh clone works even if you forget the manual step.

## 7. Demo seed data

Everything currently loaded is **original synthetic teaching material written
for this prototype**. Nothing is copied from UWorld, First Aid, or any other
source. Every record carries:

```ts
is_demo          = true
content_origin   = "DEMO_SYNTHETIC"
demo_seed_version = "demo-v1"
```

The library contains 20 cases, 20 lectures, 101 concepts and 94 actions,
covering Internal Medicine (cardiology, pulmonary, endocrine, GI, ID),
Neurology, Psychiatry, Pediatrics, OB/GYN, Surgery, Emergency Medicine and
Preventive Care.

Seeding is **idempotent** — it keys on the stable content `code`, so running it
twice updates rather than duplicates, and edits to a case file take effect on
the next seed.

## 8. Deleting and resetting demo data

In the app: **Settings → Developer → Demo data**, with a confirmation dialog.

From the command line: `npm run db:delete-demo` or `npm run db:reset-demo`.

Deletion removes every row where `is_demo = true` and cascades through demo
cases, concepts, lectures, their relationships, patient instances built on demo
cases, mastery states for demo concepts, and the associated study events.

**It never deletes** your `UserProfile`, `RotationBlock` rows, or settings.

## 9. How to add a new case

`src/content/demo/cases/card001-atrial-fibrillation.ts` is the annotated
reference. Copy it, rename the file, change the `code`, and add it to the array
in `src/content/demo/cases/index.ts`. Nothing else needs to change — the seeder
validates it with Zod and the scheduler picks it up automatically.

The shape:

```ts
export const CASE_MY_001: CaseTemplateInput = {
  code: "DEMO-XXX-001",
  title: "…",
  specialty: "Internal Medicine",   // must be a CONTENT_SPECIALTIES value
  topic: "Cardiology",
  primaryDiagnosis: "…",
  difficulty: 3,                     // 1-5
  step3Importance: 5,                // 1-5, feeds the scheduler
  handoffScript: "…",                // read aloud at handoff for a new patient
  dailySignout: "…",                 // concise re-sign-out once on service
  admissionOpening: "…",             // the one-liner an admission starts with
  teachingPoint: "…",                // shown after handoff acceptance
  minimumRoundsBeforeDischarge: 2,

  concepts: [{ code: "CARD.AF.01", weight: 1 }],

  findings: [
    // initiallyVisible: shown from the door
    { category: "VITAL", label: "Heart rate", value: "138", initiallyVisible: true },
    // otherwise gated behind the action in triggerActionCode
    { category: "ECG", label: "12-lead ECG", value: "…", triggerActionCode: "ORDER_ECG" },
  ],

  actionRules: [
    { actionCode: "ORDER_ECG", classification: "REQUIRED",
      resultText: "…",           // the deterministic result, never invented
      feedbackText: "…",
      conceptCode: "CARD.AF.01" },
  ],

  prompts: [
    { stage: "ROUNDS", promptText: "…", responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE",
        choices: [{ key: "a", text: "…" }, { key: "b", text: "…" }],
        correctKey: "a" },
      correctFeedback: "…", incorrectFeedback: "…", conceptCode: "CARD.AF.01" },
  ],
};
```

Rules worth knowing:

- Every case needs at least one `ROUNDS` and one `DISCHARGE` prompt (tested).
- `ADMISSION` prompts are the diagnosis and disposition decisions.
- Classifications are `REQUIRED | APPROPRIATE | OPTIONAL | UNNECESSARY |
  CONTRAINDICATED`, scored `+2 / +1 / 0 / −1 / −3`.
- Any action without a rule returns the explicit fallback
  *"No case-specific abnormality is defined for this test."* — the engine never
  invents a finding.
- New concepts go in `src/content/demo/concepts/index.ts`; new actions and
  their spoken synonyms go in `src/content/demo/actions/index.ts`.

Then `npm run db:seed` (or **Reset demo content** in the developer page).

## 10. How to add a new lecture

Add an entry to `src/content/demo/lectures/index.ts`:

```ts
{
  code: "DEMO-LEC-021",
  title: "…",
  specialty: "Neurology",
  topic: "Stroke",
  lectureType: "NOON_CONFERENCE",  // or MORNING_REPORT | GRAND_ROUNDS | CORE_LECTURE
  summary: "…",
  audioScript: ["section one…", "section two…"],  // read one at a time
  keyPoints: ["…", "…"],
  estimatedMinutes: 5,
  conceptCodes: ["NEURO.STROKE.01"],
}
```

Sections matter: the audio player reads them individually so the learner can
pause, repeat a section, or let it auto-advance. Aim for 3–7 minutes total.

## 11. Scheduler explanation

The scheduler runs **once per study date**, recording its decision in
`scheduler_run` so reopening the app the same day does not assign more patients.
Its whole reasoning is visible at `/settings/developer`.

### Order of operations

1. **Load the existing panel first.** Continuity beats novelty.
2. **Compute panel capacity** — `MAX_ACTIVE_PANEL_SIZE` (7) minus the current
   panel.
3. **Compute today's target** from the study plan.
4. **Score every eligible case** and take the top N.
5. **Choose an entry mode** per case.
6. **Choose today's lecture.**
7. **Persist the whole decision** for inspection.

### Pacing (`domain/scheduler/pacing.ts`)

```
baselineRate    = remainingPatients / (daysRemaining + 1)
expectedProgress = targetPatientCount × fractionOfWindowElapsed
deficit          = max(0, expectedProgress − actualProgress)
catchUp          = min(deficit / CATCHUP_SPREAD_DAYS, CATCHUP_CAP)
dailyTarget      = clamp(ceil(baselineRate + catchUp), MIN, MAX_NEW_PER_DAY)
```

Defaults: `CATCHUP_SPREAD_DAYS = 4`, `CATCHUP_CAP = 1`,
`MAX_NEW_PATIENTS_PER_DAY = 5`, `MAX_ACTIVE_PANEL_SIZE = 7`.

The point of the cap: **missing a week makes the service a little busier for a
few days, not a backlog of 20 waiting patients.** There is no punitive language
anywhere; returning after time away shows *"Welcome back. Your service has been
adjusted to keep your Step 3 plan on pace."*

### Case scoring (`domain/scheduler/scoring.ts`)

```
priority = rotationRelevance × 4
         + spacedRepetitionDue × 5
         + curriculumGap × 3
         + weakness × 3
         + recentLectureBonus × 2
         + step3Importance × 2
         − recentlySeenPenalty × 4
         + deterministicJitter
```

- **Rotation relevance** — 1.0 same specialty, 0.5 related (see
  `RELATED_SPECIALTIES`), 0 unrelated.
- **Spaced repetition due** — fraction of the case's concepts past their review
  date.
- **Curriculum gap** — decays to zero as a topic reaches
  `CURRICULUM_GAP_THRESHOLD` encountered cases.
- **Weakness** — fraction of concepts repeatedly answered incorrectly.
- **Recent lecture** — concepts taught in the last 7 days, so Monday's stroke
  conference makes stroke patients more likely mid-week.
- **Recently seen** — linear decay over 21 days.
- **Jitter** — seeded on `(userId, date, caseId)`, bounded at 0.5 so it breaks
  ties without overriding real signal.

Every term is displayed as its own column in the developer inspector.

### Entry mode (`domain/scheduler/entryMode.ts`)

```
majority of concepts UNSEEN            → HANDOFF   (introduce)
majority INTRODUCED or WEAK            → alternate HANDOFF / ADMISSION
otherwise                              → ADMISSION (test)
```

Deterministic: the middle band alternates on the assignment's index within the
day rather than on a random draw.

### Lecture selection

Priority order: current rotation topic → a topic not yet introduced → a weak
topic → a topic matching a patient on service → review. Ties broken with a
seeded value so the same day always yields the same conference.

### Spaced repetition

| Mastery | Label | Next review |
|---|---|---|
| 0 | Unseen | not scheduled (needs introduction) |
| 1 | Introduced | 1 day |
| 2 | Weak | 2 days |
| 3 | Developing | 5 days |
| 4 | Competent | 12 days |
| 5 | Mastered | 30 days |

Correct: `+1` level (max 5). Incorrect: `−1` level (floor 1 once introduced)
**and back tomorrow regardless of level**. This is a transparent MVP model, not
a claim about psychometrics — all values live in `config/scheduler.ts`.

## 12. Voice and TTS: browser limitations

**Text-to-speech** uses `window.speechSynthesis` only — no external provider.

- Voice availability, quality and naming vary widely between browsers and
  operating systems. Some environments expose no voices at all.
- Voices load asynchronously; the player listens for `voiceschanged`.
- Speed (0.8× – 1.6×) and voice choice are persisted to the database.
- Speech is stopped on navigation, so voices never overlap.
- If synthesis is unavailable, a notice is shown and **all content remains
  readable on screen**.

**Speech recognition** (`SpeechRecognition` / `webkitSpeechRecognition`) is
strictly optional. Where it exists:

1. The learner presses the microphone.
2. The transcript appears live.
3. It is normalised deterministically and matched against explicit synonyms.
4. **The interpretation is shown back to them.**
5. Only after they press Confirm is anything applied or scored.
6. Nothing matched → it says so and offers the buttons. It never guesses.

Where it does not exist, typing and buttons do exactly the same job. Chromium
browsers generally support recognition; Firefox generally does not.

## 13. Known MVP limitations

- **Single user, single device.** One profile row, no authentication, local
  SQLite. Not multi-user safe.
- **Cases do not vary.** One `CaseTemplate` produces one `PatientInstance` at a
  time and is excluded while on the panel. There is no case variation engine.
- **No physiologic simulation.** A patient's data is fixed; they do not
  deteriorate or improve in response to treatment. Clinical time is narrative.
- **Discharge is intentionally shallow** — one prompt, per spec.
- **Admission actions are per-case.** Only actions a case defines a rule or
  finding for are offered, so the surface is smaller than a real CCS.
- **Speech matching is substring-based** after normalisation. It is predictable
  and auditable, but it will not parse negation ("I would *not* give aspirin").
- **The mastery model is deliberately naïve** — one level per response.
- **Coverage percentages are simple ratios** of what is in the loaded library,
  not a claim about Step 3 blueprint coverage.
- **Content is synthetic.** It approximates Step 3 style and scope for
  architectural demonstration; it has not been reviewed for clinical teaching
  use.

## 14. Extension points

Left clean but unimplemented:

- **Content authoring UI** — the Zod schemas in `src/content/schema.ts` already
  describe the full shape a form would need to produce.
- **Real content ingestion** — replace `src/content/demo/` with authored
  material and drop the `is_demo` flag. The demo-deletion path exists precisely
  so synthetic content can be removed without disturbing production content.
- **Case variation** — `PatientInstance` is already separate from
  `CaseTemplate`; variation would add a modifier layer between them.
- **Richer scoring** — `study_event` is append-only and complete, so any future
  scoring model can be recomputed from history rather than migrated.
- **Multi-user** — every table already carries `user_id`.
- **Better spaced repetition** — swap `SPACED_REPETITION_INTERVALS` and
  `nextMasteryLevel()`; nothing else depends on the internals.
- **Server-side TTS** — the `AudioPlayer` interface would accept an audio-URL
  source with no changes to callers.

## 15. Testing

```bash
npm test
```

65 tests across four files:

- `tests/scheduler.test.ts` — panel size ceiling, gentle catch-up, no backlog,
  rotation preference, due-concept preference, recency penalty, lecture boost,
  handoff-vs-admission selection, determinism under the same seed, distinct
  rooms and names.
- `tests/caseEngine.test.ts` — required and contraindicated action recognition,
  deterministic test results, the undefined-test fallback, speech synonym
  normalisation, unknown speech not silently scored, and a library-wide check
  that every prompt has a gradeable correct answer.
- `tests/mastery.test.ts` — level transitions, interval table, incorrect answers
  returning tomorrow, introduction without grading, due/weak queries.
- `tests/persistence.test.ts` — panel, rounds cursor and discharge surviving a
  real database close/reopen; hospital-day counting; progress counts; demo
  deletion leaving the profile and rotations intact.

## 16. Configuration

Rename the hospital in one place — `src/config/app.ts`:

```ts
export const APP_CONFIG = {
  hospitalName: "County General Teaching Hospital",
  ...
};
```

Scheduler tuning is entirely in `src/config/scheduler.ts`.

---

## Disclaimer

This application is intended for medical education and examination preparation.
It is not intended to guide the care of actual patients. All clinical content
currently loaded is synthetic material authored for this prototype.
