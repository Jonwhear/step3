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

The learner sees patients. The concepts, mastery levels and spaced-repetition
queues exist underneath and surface only on the Progress and Developer screens.

- case-centric learning rather than a question bank
- a simulated hospital service with a **persistent patient panel** in real
  rooms on a real floor
- morning handoff, rounds, active admissions, assessment & plan, discharge
- an EMR-shaped chart: patient header, grouped laboratory panels with
  reference ranges, radiology reports
- scheduled teaching conferences with navigable, headed sections
- deterministic spaced repetition and rotation-aware scheduling
- audio that never starts on its own
- progress that survives restarts

**V2 additionally solves the content-scale problem.** Consolidating a large
body of source questions into a smaller number of clinically coherent patients
is only safe if you can prove nothing was lost. So the whole pipeline —
source → fragment → learning point → the specific case interaction that tests
it — is stored in the database and auditable, rather than inferred. See §11d.

## 2. Current scope

Implemented:

| Area | Status |
|---|---|
| Onboarding, profile, rotation schedule | ✅ |
| Deterministic scheduler with debug inspector | ✅ |
| First-day service bootstrap | ✅ |
| Morning handoff (audio-first, accept-to-panel) | ✅ |
| Rounds with deterministic prompts and mastery updates | ✅ |
| Active admission with a controlled action vocabulary | ✅ |
| Discharge interaction and patient history | ✅ |
| Teaching conference with headed sections and click-to-jump TTS | ✅ |
| Progress dashboard with specialty/topic drill-down | ✅ |
| Hospital geography: rooms 401–410, floor map, room-order rounds | ✅ |
| ED board: search and admit a chosen diagnosis, with overflow beds | ✅ |
| EMR chart: patient header, tabs, grouped labs, imaging reports | ✅ |
| Central laboratory reference library + reference-range toggle | ✅ |
| Problem-based Assessment & Plan with deterministic scoring | ✅ |
| Content provenance: sources → fragments → learning points → cases | ✅ |
| Content coverage audit with drill-down | ✅ |
| Case validation engine gating publication | ✅ |
| Content library and case editor | ✅ |
| Portable, versioned content packs with migration adapters | ✅ |
| Dark mode, font size, density, accent | ✅ |
| Scheduler preferences (workload, census, catch-up, rotation emphasis) | ✅ |
| Adjustable spaced-repetition intervals | ✅ |
| 20 synthetic cases, 20 synthetic lectures, 101 concepts, 94 actions, 49 lab definitions, 24 learning points | ✅ |
| Demo content delete / reset | ✅ |
| Automated tests (228) | ✅ |

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
    onboarding/ handoff/ rounds/ conference/
    admissions/        workup + the ED board
    patients/[id]/     tabbed EMR chart + assessment & plan
    progress/ settings/
    settings/content/  content library, case editor, coverage audit, packs
    settings/developer/
  components/          layout, patient, audio, emr, hospital, lecture, speech, ui
  domain/              the actual logic, framework-free
    scheduler/         pacing.ts, scoring.ts, entryMode.ts, bootstrap.ts, index.ts
    content/           provenance.ts, validation.ts, cases.ts, packs.ts
    cases/ patients/ mastery/ lectures/ actions/ progress/ profile/
    rooms/ labs/ chart/ settings/ admissions/
  db/                  schema.ts, client.ts, migrations/, seed/, scripts/
  content/
    schema.ts          Zod schemas for all authored content
    labs/              central laboratory reference library
    demo/              cases/, concepts/, lectures/, actions/, sources/, learningPoints/
  lib/                 date/, seededRandom/, audio/, speech/, assets/
  config/              app.ts, scheduler.ts, hospital.ts  ← all tuning lives here
tests/                 15 suites — see §15
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

Finish onboarding and you land on a service immediately — two handoff patients
and one active admission, in rooms on Floor 4, plus that day's teaching
conference. Normal pacing starts the following day.

### Where to look first

| Screen | Path |
|---|---|
| Service — the ward *is* the patient list | `/` |
| Patient chart (Summary · Handoff · Results · Chart · Rounds · Course) | `/patients/<id>` |
| EMR labs and imaging | `/patients/<id>?tab=results` |
| Assessment & Plan | `/patients/<id>?tab=chart` |
| ED board — admit a diagnosis you choose | `/admissions` |
| Content library and case editor | `/settings/content` |
| Content coverage audit | `/settings/content/coverage` |
| Import / export content packs | `/settings/content/packs` |
| Scheduler, room and audio diagnostics | `/settings/developer` |

The DKA and pneumonia patients are the ones with full EMR data — see §13.

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

### Upgrade discipline

**"Delete the database and recreate" is not an upgrade strategy here.** The
learner's profile, panel, mastery state and study history are the point of the
application, and they are not reproducible.

- `0000_init` is V1. `0001_v2_emr_and_content` is V2 and is **purely additive**:
  `CREATE TABLE` and `ALTER TABLE … ADD COLUMN` only, zero `DROP` statements.
  New columns carry defaults that make existing rows correct — a V1
  `patient_instance` becomes `location_type = 'INPATIENT'` with a null room
  (backfilled at runtime), and a V1 `case_template` becomes `PUBLISHED`,
  because a V1 case was by definition live content.
- `tests/migrations.test.ts` builds a database at the V1 schema, fills it with
  real user data, runs the migration chain and asserts both the row counts and
  the individual field values survive. Keep that test passing.
- Adding a column to an existing table is safe. Renaming or dropping one is
  not, and needs a data-preserving migration written by hand.

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
pause, repeat a section, or jump to one. Aim for 3–7 minutes total.

### Headed sections (preferred for new lectures)

Supplying `sections` overrides `audioScript` and gives the lecture real
headings in the contents list instead of "Part 1", "Part 2":

```ts
sections: [
  {
    heading: "Recognition",
    body:
      "Deep, regular respirations with a fruity breath odour point toward ketosis.\n" +
      "- Check a bedside **glucose** immediately\n" +
      "- Send a metabolic panel for the anion gap",
  },
  { heading: "Management", body: "…" },
]
```

`body` accepts a constrained markdown subset — paragraphs, `- ` bullets and
`**bold**` — and nothing else. It is rendered twice: once for the screen, and
once as plain text for speech, so markup is never read aloud.

## 10a. How to add laboratory results and imaging to a case

Labs reference the central library by code and supply only a value:

```ts
labs: [
  { labCode: "K", value: "5.3", triggerActionCode: "ORDER_BMP",
    collectedLabel: "On arrival", clinicalRole: "KEY_POSITIVE" },
],
imaging: [
  {
    studyName: "Chest radiograph, portable AP",
    modality: "XRAY",
    impression: "No acute cardiopulmonary abnormality.",
    findingsText: "…",
    triggerActionCode: "ORDER_CXR",
    clinicalRole: "KEY_NEGATIVE",
  },
],
```

- `labCode` must exist in `src/content/labs/index.ts`, or seeding fails loudly
  with the case code and the bad code.
- Omit `flag` and it is derived from the reference range. Set it only where
  "abnormal" is not a numeric comparison.
- `triggerActionCode` gates the result behind an order, exactly like findings.
- `clinicalRole` (`KEY_POSITIVE` / `KEY_NEGATIVE` / `CONTEXT` / `DISTRACTOR`)
  is authoring metadata for validation and case review. It is **never** shown
  to the learner — a labelled distractor would stop being a distractor.

Add a problem list to make the case work in the Assessment & Plan tab:

```ts
problems: [
  {
    label: "Diabetic ketoacidosis",
    assessmentText: "…",
    isPrimary: true,
    options: [
      { label: "IV isotonic fluid resuscitation", classification: "REQUIRED",
        actionCode: "GIVE_IV_FLUIDS", feedbackText: "…" },
      { label: "Subcutaneous sliding-scale insulin alone",
        classification: "CONTRAINDICATED", feedbackText: "…" },
    ],
  },
],
```

After editing any content file, run `npm run db:reset-demo`, then open
**Settings → Advanced → Content library** and check the case validates.

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

## 11a. Hospital geography and census

The hospital is a small, declarative 2D schematic — not a simulation.
`config/hospital.ts` defines the layout: inpatient rooms 401–410 on Floor 4,
plus ED bays, trauma bays, boarding and hallway slots reserved for a future ED
flow.

**The ward is the list.** The service screen renders one board, not a list of
patients above a map of the same people: each bed card carries its occupant's
name, working diagnosis, hospital day and what is owed today. Rounds completed
is deliberately absent — one round per day means the hospital day already says
it. Empty beds hold exactly one fact, so they are a row of numbers rather than
full-height boxes of nothing, and a patient who holds no bed on this floor (an
ED bay, say) is surfaced under "Elsewhere in the hospital" rather than
disappearing with the map that does not model them. `composeCensus` does the
join; `CensusBoard` draws it.

**Occupancy is derived, never stored twice.** A room is occupied when an active
patient row points at it (`patient_instance.room_id`). That makes
double-booking impossible to represent, and discharging a patient frees their
bed with no separate bookkeeping step that could be missed.

- Room assignment is deterministic: the lowest free room wins. No jitter.
- Rounds walk in ascending room order (`sortByRoomOrder`).
- The effective census cap is `min(physical rooms, your census preference)`.
  When the scheduler declines to assign, the developer inspector names which of
  the two constraints bound.
- Patients created before the map existed are backfilled by
  `reconcilePatientRooms`, matching on the old free-text room number where the
  room is free.

**Overflow beds.** A learner who admits several patients from the ED can fill
Floor 4 and leave no bed for the next morning. Rather than refusing the
admission — or silently dropping tomorrow's patient — the ward opens overflow
beds 411–416, the way a real floor flexes. Both the scheduler and the ED board
go through `findOrOpenRoom`, so neither can be starved by the other, and the
ward still cannot grow without limit.

The census cap and the ED board answer to different rules, deliberately:

- The **cap paces the scheduler** — how many patients arrive on their own.
- **Self-admission is the learner's call** and is bounded by beds, not by the
  cap. Going above it is a warning, not a refusal: the consequence is that the
  scheduler sends nothing new until the census falls back under the cap, which
  is real but reversible.

Patient thumbnails render as initials today. `patient_visual` already carries
`asset_type` / `asset_path`, and `lib/assets/index.ts` is the single resolver,
so attaching generated headshots later is a change in one place.

## 11a-2. The ED board

The scheduler decides what the learner *should* see. The ED board is the other
direction: someone with time left, or a specific weakness to work on, can pick
up a patient themselves.

- Search covers diagnosis, specialty, topic, complaint and case code. Multiple
  terms narrow rather than widen, so "surgery acute" is more specific than
  either word alone.
- `listEdBoard` returns the **whole** admittable library by default and the
  component paginates. Trimming server-side would silently limit a search to
  the visible slice — which is exactly what a learner hunting one diagnosis
  would hit.
- The board shows the working diagnosis, unlike a scheduled admission which
  hides it. That is the point: the learner is *choosing* what to practise. The
  workup itself is identical either way.
- Capacity is re-checked at admit time, not trusted from the rendered page,
  since a discharge may have happened in between.

## 11b. Laboratory and imaging

Reference ranges live in **one** place: `content/labs/index.ts`, seeded into
`lab_definition`. A case supplies only a *value*; units, range, panel grouping
and display order come from the library.

The abnormal flag is **derived** from the range rather than asserted per case,
so a case can never drift out of agreement with its own reference range. An
author can still override the flag for analytes where "abnormal" is not a
numeric comparison (`Large`, `Positive`).

Sex-specific ranges are supported where the difference changes the flag
(haemoglobin, haematocrit).

**The reference-range preference is display-only.** Turning ranges off never
hides an abnormal flag — the flag is the clinically load-bearing part. There is
a test for exactly this.

Imaging renders as a radiology report: study and time, then IMPRESSION, then
FINDINGS. `image_asset_path` exists and is null everywhere; when an image is
attached the component already renders it.

## 11c. Assessment & Plan

The learner builds a note by selecting from case-authored options rather than
typing prose. This is a deliberate constraint: it keeps the app free of
free-text clinical interpretation, keeps scoring deterministic, and still
exercises the real decision — which problems exist and what belongs under each.

- Problems are added from the case's own list; expected problems the learner
  never adds are reported at signing.
- Plan options carry the same classifications as admission actions
  (`REQUIRED` … `CONTRAINDICATED`) and are scored with the same weights.
- **Grading happens on Sign, not on each tick**, so a half-built plan carries
  no penalty and can be revised freely.
- `renderPlanAsNote` produces the note-like text shown back to the learner.

## 11d. Content provenance and the coverage audit

This is the part of V2 that exists to make *content scale safely*.

Consolidating a large body of source questions into a smaller number of
clinically coherent patients is only safe if you can prove nothing was dropped.
So the pipeline is **stored, not inferred**:

```
ContentSource  →  SourceFragment  →  LearningPoint  →  mapping  →  case / lecture
```

Every step persists in the database. Nothing depends on a model remembering an
earlier batch, which is what makes incremental ingestion safe: fragment 400 can
be processed months after fragment 1 with no loss of context.

**Status is derived from mappings, not asserted:**

| Status | Meaning |
|---|---|
| `UNPROCESSED` | extracted but mapped nowhere |
| `PARTIALLY_MAPPED` | attached to a case, but nothing actually tests it |
| `FULLY_MAPPED` | reachable through a prompt, action rule, plan option or lecture |
| `EXCLUDED` | deliberately out of scope, or merged into a canonical point |

The distinction between the middle two matters: being *present in a patient* is
not the same as being *tested*, and conflating them is precisely how content
disappears during consolidation.

**Settings → Advanced → Content coverage audit** answers, for every learning
point: where did this come from, which patients test it, which lectures teach
it, and has a human reviewed it. The bundled demo library deliberately ships
four unmapped points (hyperkalaemia and cirrhosis) so the audit has something
real to report — an audit that always says 100% teaches you nothing.

Duplicate handling (`canonical_learning_point_id`, `is_canonical`) is modelled
and `mergeLearningPoint` re-points a duplicate's mappings at the canonical
point. Merging is deliberately manual; no automatic semantic merging is done.

`EvidenceLink` ties any structured claim back to the source that supports it,
and graded prompts surface those citations under **Source** in their feedback.

## 11e. Case validation and publication

`domain/content/validation.ts` runs against the **database**, not against an
authoring object, so it catches the failures that only appear once content is
stored: a prompt referencing a deleted concept, a lab code no longer in the
library, a trigger action that does not exist, a choice-type prompt whose
correct key matches nothing.

- **Errors block publication.** Only `PUBLISHED` cases reach a learner.
- **Warnings do not.** Refusing to publish over "this action has no feedback"
  would make the editor hostile to normal iterative work.

Running this over the bundled library during development found a real defect —
a plan option referencing an action code that did not exist — which is the
point of having it.

Bundled demo cases are **read-only**. Editing one requires *Duplicate and edit*,
so re-seeding the demo library can never destroy authored work. Deletion is
soft (archive) by default; permanent deletion is refused for any case with
study history, because `StudyEvent` rows reference the case id.

## 11f. Portable content packs

The application is the engine; a pack is a portable library of patients.

```json
{
  "manifest": {
    "format": "general-hospital-content-pack",
    "schemaVersion": 2,
    "packId": "custom-neuro-pack",
    "name": "Custom Neurology Pack",
    "version": "1.0.0",
    "author": "..."
  },
  "content": { "concepts": [], "cases": [], "lectures": [], ... }
}
```

Two rules matter more than the format itself:

1. **Every pack declares `schemaVersion`.** Once a version ships it is never
   silently reinterpreted. Older packs are brought forward by explicit
   migration adapters (`migratePackToCurrent`), applied in sequence, so adding
   a future version means writing one more step rather than revisiting the ones
   before it. A pack from a *newer* build is refused with an explanation rather
   than partially imported.
2. **Import is never blind.** Inspect → summary → confirm. The inspect step
   writes nothing; the confirm step is a single transaction, so a malformed
   pack cannot leave a half-imported library behind.

Imported cases arrive as `DRAFT` / `UNREVIEWED` regardless of what they claimed
elsewhere: publishing is a decision made in *this* installation.

## 12. Voice and TTS: browser limitations

**Audio never starts on its own.** Every screen opens `STOPPED` and silent;
playback begins only when the learner presses Play. There is deliberately no
"read aloud automatically" preference. The transitions live in a pure reducer
(`lib/audio/machine.ts`) that the component drives, so the state machine is
testable without a browser:

```
STOPPED + Play    → PLAYING     PLAYING + Pause  → PAUSED
PAUSED  + Play    → PLAYING (resume, not re-speak)
any     + Stop    → STOPPED     any + Restart    → re-speaks current section
select while playing → jump there and keep playing
select while paused/stopped → move the cursor and wait for Play
navigation / new patient → STOPPED
```

Lecture bodies use a small markdown subset for the screen and are rendered
*separately* for speech (`renderSectionForSpeech`), so markup is never read
aloud. A conservative abbreviation dictionary expands unambiguous forms
(`IV` → "intravenous") and spells out letter abbreviations (`CBC` → "C B C");
ambiguous forms are deliberately absent, because guessing is worse than leaving
the letters alone.

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

## 13. Known limitations

Stated plainly, because knowing where the edges are is more useful than a
feature list.

- **Only two bundled cases carry structured labs, imaging and a problem list.**
  Diabetic ketoacidosis (`DEMO-ENDO-001`) and community-acquired pneumonia
  (`DEMO-PULM-001`) exercise the full EMR chart. The other eighteen still use
  V1's narrative `findings`, which render in the Results tab under
  "Laboratory (narrative)". Upgrading them is content authoring, not
  engineering: add `labs`, `imaging` and `problems` to the case file, following
  either of those two as the template.
- **Lecture sections are auto-derived for eighteen of twenty lectures.** The
  `LectureSection` model, click-to-jump TTS and constrained-markdown rendering
  are complete, but most bundled lectures still supply the flat `audioScript`
  array, so their sections show as "Part 1", "Part 2". Adding a `sections`
  array with real headings to a lecture file upgrades it.
- **The case editor edits case *basics* only.** Findings, prompts, action
  rules, labs and problems are shown read-only with counts; they are authored
  in content files or imported through a pack. The validation, status, review,
  duplicate and delete workflows around them are complete.
- **Pack export covers cases and their concepts.** Lectures, actions, lab
  definitions, sources and learning points are modelled in the format and
  imported correctly, but `exportPack` currently emits them as empty
  collections.
- **The ED map is modelled but not surfaced.** ED, trauma, boarding and hallway
  rooms are seeded and `buildFloorMap` accepts a unit, but only the inpatient
  floor has a screen. Patient location (`location_type`) exists so an
  ED → admitted → inpatient flow can be added cleanly.
- **Learning-point extraction is manual.** The storage, fragmenting, mapping,
  provenance and audit machinery is complete and tested; deriving learning
  points from a fragment is authoring work, by design (spec §71).
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

Modelled and documented, with the hard part already done:

- **Ingesting your own licensed material.** The pathway is complete and tested:
  create a `ContentSource`, split it with `chunkSourceText` into
  `SourceFragment` rows, author `LearningPoint` rows against those fragments,
  map them to cases and lectures, then run the coverage audit. Nothing is
  fetched or scraped, and the app stores only material you provide.
- **Patient headshots** — `patient_visual` carries `asset_type` / `asset_path`,
  `lib/assets/index.ts` is the single resolver, and `Avatar` already renders an
  image when one is present. Sizing is identical either way, so adding images
  will not reflow the floor map or the chart header.
- **Lecture figures** — `lecture_section` carries `media_type`,
  `media_asset_path`, `caption` and `alt_text`.
- **Attached imaging** — `case_imaging_result.image_asset_path`; the report
  component renders it when non-null.
- **ED flow** — ED, trauma, boarding and hallway rooms are seeded and
  `patient_instance.location_type` distinguishes `ED` / `INPATIENT` /
  `DISCHARGED`, so an ED → admitted → inpatient transition can be added without
  a migration.
- **Learning-point merging** — `canonical_learning_point_id` / `is_canonical`
  and `mergeLearningPoint` exist; only the review UI is missing.
- **Case revision history** — `case_revision` snapshots every custom-case edit;
  the revert UI is not built, but the data is there.
- **Full case editing** — the Zod schemas in `src/content/schema.ts` describe
  the exact shape a form would need to produce for findings, prompts and rules.
- **Case variation** — `PatientInstance` is already separate from
  `CaseTemplate`; variation would add a modifier layer between them.
- **Richer scoring** — `study_event` is append-only and complete, so any future
  scoring model can be recomputed from history rather than migrated.
- **Multi-user** — every table already carries `user_id`.
- **Better spaced repetition** — swap `SPACED_REPETITION_INTERVALS` and
  `nextMasteryLevel()`; nothing else depends on the internals.
- **Server-side TTS** — `useSpeechPlayer` is the only thing that touches the
  browser API; an audio-URL source would replace it with no change to callers.

## 15. Testing

```bash
npm test
```

228 tests across 16 files. Every test runs against a real in-memory SQLite
database with the real migrations and the real demo content — there are no
mocks of the domain layer.

**V1 suites (65 tests), all still green:**

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

**V2 suites (163 tests):**

- `tests/audioMachine.test.ts` — the regression tests for the autoplay bug. The
  machine emits no speak effect without an explicit action; Play from stopped
  speaks, Play from paused *resumes* rather than restarting the sentence;
  selecting a section jumps while playing but only moves the cursor while
  paused; a stale `SECTION_ENDED` after Stop is ignored.
- `tests/bootstrap.test.ts` — a new profile receives a usable service
  immediately, exactly once, with at least one handoff and one admission;
  respects a census cap; distinct rooms; deterministic for the same profile and
  date; and does **not** stack with the daily scheduler on day one.
- `tests/rooms.test.ts` — no duplicate room assignment, lowest free room first,
  discharge frees the bed, rounds sort ascending, a full ward assigns nothing
  and says why, legacy patients backfilled.
- `tests/labs.test.ts` — flags derived from the central range, sex-specific
  ranges, results gated behind their trigger order, and the preference toggle
  never hiding a flag.
- `tests/chart.test.ts` — problems added and removed, selections toggled and
  discarded with their problem, required/contraindicated scoring, note
  rendering.
- `tests/contentValidation.test.ts` — every bundled case validates; a correct
  key matching no choice, duplicate sequence numbers, missing concepts, missing
  lab definitions, unreachable triggers and orphaned mappings are all rejected;
  the publish gate refuses a case with errors.
- `tests/contentPacks.test.ts` — v1 packs migrate forward, newer-than-this-build
  packs are refused with an explanation, malformed packs write nothing,
  re-import is idempotent, and an export round-trips.
- `tests/migrations.test.ts` — builds a database at the V1 schema, fills it with
  profile, panel, mastery and event data, runs the full migration chain, and
  asserts both the row counts *and* the field values survive.
- `tests/speechText.test.ts` — markdown never reaches the synthesiser,
  abbreviations expand on whole words only, longest match wins.
- `tests/edBoard.test.ts` — search narrows across fields, the board reaches the
  whole library, a case leaves the board once admitted, the learner may admit
  past their census cap, overflow beds open in sequence and are reused once
  freed, and the ward stops flexing at its limit.
- `tests/reviewIntervals.test.ts` — defaults match the shipped schedule, an
  out-of-range or malformed value never reaches the scheduler (including a JSON
  array, which would otherwise be read by numeric index), and a saved interval
  changes when a concept next comes back.
- `tests/serviceLabel.test.ts` — the top bar names the rotation as a phrase:
  an off-service day reads "General Service", not "General / Off-Service
  Service", and a rotation already named "… Service" is not given a second one.
- `composeCensus` cases in `tests/rooms.test.ts` — the service board joins the
  floor to the panel exactly: bed order is preserved, a patient with no bed on
  this floor is surfaced rather than dropped, and a stale occupancy row renders
  an empty bed rather than a card with no data.

## 16. Configuration

Rename the hospital in one place — `src/config/app.ts`:

```ts
export const APP_CONFIG = {
  hospitalName: "County General Teaching Hospital",
  ...
};
```

Scheduler tuning is entirely in `src/config/scheduler.ts`; hospital geography is
in `src/config/hospital.ts`; laboratory reference ranges are in
`src/content/labs/index.ts`.

### Preferences vs. internals

The learner is offered a handful of meaningful choices — workload intensity,
maximum census, catch-up intensity, current-rotation emphasis — never raw
coefficients. `domain/settings/index.ts` is the **only** place that translates
one into the other (`resolveSchedulerTuning`), and the scheduler never reads a
preference string directly. That indirection is what lets the internal formula
change without invalidating anyone's saved settings.

Settings → Scheduler shows the resolved values, so the translation is visible
rather than mysterious.

The spaced-repetition intervals are the exception to "no raw coefficients":
they are a genuine study decision, so they are directly editable there. Values
are clamped to 1–365 days on the way in, and a malformed stored value falls
back to the shipped default per level rather than reaching the scheduler.

### Theming

The `ink` and `clinical` scales are *semantic*, not literal lightness values:
in dark mode the ink scale is inverted in place, so a component written as
`text-ink-700 bg-surface` is correct in both themes without a `dark:` variant.
Clinical status colours (`good` / `warn` / `bad`) work the same way — use those
rather than Tailwind's `emerald` / `amber` / `rose`, which are fixed values and
stay light in dark mode.

---

## Disclaimer

This application is intended for medical education and examination preparation.
It is not intended to guide the care of actual patients. All clinical content
currently loaded is synthetic material authored for this prototype.

In the app itself this is stated once, on the onboarding screen. It used to sit
in a footer under every screen, which meant it was read once and then scrolled
past forever — repetition made it chrome, not a disclaimer.
