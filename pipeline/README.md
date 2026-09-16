# Extraction pipeline

Turns source questions you own into structured semantics the teaching hospital
can build patients from. **v0 is the schema only** — there is no extractor here
yet, and no API call has been made.

## Where this sits

```
source PDF/images
      │  OCR                        ← not built
      ▼
raw text
      │  segmentation               ← not built
      ▼
segmented question                     deterministic: id, answer-choice text,
      │                                specialty, system, topic, section
      │  semantic extraction         ← not built (this is what v0 describes)
      ▼
QuestionExtraction  ──────┐
                          │  merge with the deterministic fields
                          ▼
                   content_source / source_fragment / learning_point
                          │  compile                ← not built
                          ▼
                   case_template + prompts + problems   (the app's own schema)
```

The application side of that diagram already exists: `content_source`,
`source_fragment`, `learning_point`, `learning_point_mapping` and
`evidence_link` are live tables, and `src/content/schema.ts` validates every
authored case before it reaches the database.

## What v0 extracts, and what it refuses to

`schemas/extraction_v0.py` holds one record per source question:

```
QuestionExtraction
├── question_kind
├── patient?              age (in its own unit), sex, pregnancy
├── clinical_facts[]      what the source states, with role + must_preserve
├── diagnoses[]           only those the source discusses
├── decision              what is being tested, and the correct conclusion
├── answer_reasoning[]    per choice: why, and whether it is the answer
└── learning_points[]     atomic teaching statements
```

Every claim carries `Evidence`: a section and a character-for-character quote.
If it cannot be quoted, it was not in the source.

Deliberately absent, because the deterministic pipeline already knows them:
question id, answer-choice text, specialty, system, topic, raw OCR, cleaned
OCR, section boundaries, and the OCR correct-answer marker. Regenerating them
costs tokens and invites disagreement about facts that are not in dispute.

## Three additions to the original v0 sketch

Each is marked in the source, and each is easy to strike if you disagree.

1. **`ClinicalFact.fact_category`** — VITAL / EXAM / LAB / IMAGING / ECG /
   HISTORY / OTHER, mirroring the app's `FINDING_CATEGORIES`. Without it the
   compiler cannot tell a blood pressure from a past medical history.
2. **`ClinicalFact.measurement`** — optional `{label, value, unit}`, populated
   only when the source states a discrete value. `case_lab_result` needs three
   fields; one sentence of prose would have to be parsed back out.
   Terminology normalisation stays out: "serum potassium", "potassium" and "K"
   all map to `LAB.POTASSIUM` later, not here.
3. **`AnswerReasoning.is_correct`** — the model's reading of which choice the
   explanation supports. This is the half of the OCR-marker cross-check that
   the schema was otherwise missing:

   ```
   OCR marker = B   and   model = B   →  agreed
   OCR marker = D   and   model = B   →  needs review
   ```

## Running the tests

```bash
cd pipeline
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q
```

Nineteen tests, covering what the schema refuses (unknown fields, unknown enum
values, empty quotes, unmade judgements), the shapes the six representative
questions will exercise, that the JSON Schema is flat enough for structured
output, and that the enums still agree with the application's.

That last one matters: `FactRole` and `FactCategory` exist in both Python and
TypeScript, and the tests read the app's own files to check they have not
drifted apart.

## Fixtures

`fixtures/` holds six placeholders for the questions worth testing the schema
against before it is locked:

| Fixture | Why |
|---|---|
| `q001_patient_safety` | little or no patient |
| `q006_hemodynamic_labs` | dense measured values |
| `q009_biostatistics` | no patient, no phase of care |
| `q011_neurologic_case` | load-bearing negative findings |
| `q026_pregnancy` | gestational age distinct from patient age |
| `q040_ethics_systems` | rules rather than clinical facts |

Each has a `meta.json` saying what it is for. **No extraction results are
written**, because inventing them would prove nothing about the schema.

Source text is not committed: `fixtures/**/source.txt` is gitignored, matching
the app's existing rule that copyrighted external material stays out of the
repository. Evidence quotes are the same class of material, which is why they
belong in the local provenance tables and must not travel in an exported
content pack.

## Next

1. Read the schema. It is ~300 lines and the field descriptions are the prompt.
2. Drop six real segmented questions into the fixtures.
3. Build the extractor against them, and compare its answer letter with the OCR
   marker before anything enters the library.
