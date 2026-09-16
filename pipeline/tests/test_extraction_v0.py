"""
Schema tests for extraction v0.1.

These are not tests of an extractor — there is no extractor yet. They pin down
the contract before a single API call is spent: what the schema refuses, what
it demands, and that its JSON Schema is the dull shape structured output
decodes reliably.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from pydantic import ValidationError

from schemas.extraction_v0 import (
    SCHEMA_VERSION,
    AnswerReasoning,
    ClinicalDecision,
    ClinicalFact,
    DecisionType,
    Evidence,
    FactCategory,
    FactRole,
    LearningPoint,
    Measurement,
    PatientContext,
    QuestionExtraction,
    QuestionKind,
    SourceSection,
)

REPO_ROOT = Path(__file__).resolve().parents[2]


def evidence(quote: str = "she is afebrile", section: SourceSection = SourceSection.STEM) -> Evidence:
    return Evidence(source_section=section, source_quote=quote)


def minimal_extraction(**overrides) -> QuestionExtraction:
    payload = {
        "question_kind": QuestionKind.CLINICAL_CASE,
        "decision": ClinicalDecision(
            decision_type=DecisionType.TREATMENT,
            tested_decision="Whether to start antibiotics before the culture returns",
            correct_conclusion="Empiric antibiotics are started immediately",
            evidence=[evidence("Empiric therapy should not be delayed", SourceSection.EXPLANATION)],
        ),
    }
    payload.update(overrides)
    return QuestionExtraction(**payload)


# --------------------------------------------------------------------------- #
# Strictness                                                                   #
# --------------------------------------------------------------------------- #


class TestStrictness:
    def test_an_unknown_field_is_refused_not_ignored(self):
        """Pydantic ignores extras by default. A model that invents a key must
        fail loudly, or nobody is checking its output."""
        with pytest.raises(ValidationError) as excinfo:
            QuestionExtraction(
                question_kind=QuestionKind.OTHER,
                decision=minimal_extraction().decision,
                confidence=0.9,  # never asked for
            )
        assert "extra_forbidden" in str(excinfo.value)

    def test_every_model_forbids_extras(self):
        """One model left on the default would be the one the extractor uses."""
        lenient = [
            model.__name__
            for model in (
                Evidence,
                PatientContext,
                Measurement,
                ClinicalFact,
                ClinicalDecision,
                AnswerReasoning,
                LearningPoint,
                QuestionExtraction,
            )
            if model.model_config.get("extra") != "forbid"
        ]
        assert lenient == []

    def test_an_unknown_enum_value_is_refused(self):
        with pytest.raises(ValidationError):
            Evidence(source_section="FOOTNOTE", source_quote="x")

    def test_evidence_cannot_be_an_empty_quote(self):
        """An unquotable claim was not in the source."""
        with pytest.raises(ValidationError):
            Evidence(source_section=SourceSection.STEM, source_quote="")


# --------------------------------------------------------------------------- #
# What the schema demands                                                      #
# --------------------------------------------------------------------------- #


class TestRequiredJudgements:
    def test_a_fact_must_declare_its_role_and_whether_it_can_be_lost(self):
        """`must_preserve` has no default on purpose: defaulting it would let the
        judgement go unmade on every fact."""
        with pytest.raises(ValidationError) as excinfo:
            ClinicalFact(
                source_text="Temperature 38.9 C",
                normalized_meaning="Febrile at 38.9 C",
                fact_category=FactCategory.VITAL,
                evidence=evidence(),
            )
        missing = {error["loc"][0] for error in excinfo.value.errors()}
        assert missing == {"role", "must_preserve"}

    def test_a_decision_must_cite_something(self):
        with pytest.raises(ValidationError):
            ClinicalDecision(
                decision_type=DecisionType.DIAGNOSIS,
                tested_decision="x",
                correct_conclusion="y",
                evidence=[],
            )

    def test_the_decision_is_the_only_mandatory_body(self):
        """A question with no patient, no facts and no answer analysis is still a
        question about something."""
        record = minimal_extraction()
        assert record.schema_version == SCHEMA_VERSION
        assert record.patient is None
        assert record.clinical_facts == []
        assert record.learning_points == []


# --------------------------------------------------------------------------- #
# Shapes the six representative questions will exercise                        #
# --------------------------------------------------------------------------- #


class TestRepresentativeShapes:
    def test_a_patientless_question_is_representable(self):
        """#9 biostatistics and #40 ethics/systems: no age, no phase of care."""
        record = minimal_extraction(
            question_kind=QuestionKind.BIOSTATS_RESEARCH,
            decision=ClinicalDecision(
                decision_type=DecisionType.BIOSTATS,
                tested_decision="Which study design is described",
                correct_conclusion="A cross-sectional study",
                evidence=[evidence("measured at a single point in time", SourceSection.EXPLANATION)],
            ),
        )
        assert record.patient is None
        assert record.decision.phase_of_care is None

    def test_age_is_not_forced_into_years(self):
        """#1 patient safety and paediatric stems: a 50-hour-old is not 0.006
        years old, and rounding it would delete the clinical point."""
        neonate = PatientContext.model_validate(
            {"age": {"value": 50, "unit": "HOURS", "source_text": "50-hour-old"}, "sex": "MALE"}
        )
        assert neonate.age is not None
        assert neonate.age.unit.value == "HOURS"

    def test_pregnancy_carries_its_own_evidence(self):
        """#26 pregnancy: gestational age is a fact with a quote behind it."""
        pregnant = PatientContext.model_validate(
            {
                "age": {"value": 28, "unit": "YEARS", "source_text": "28-year-old"},
                "sex": "FEMALE",
                "pregnancy": {
                    "status": "PREGNANT",
                    "gestational_age_value": 32,
                    "gestational_age_unit": "WEEKS",
                    "evidence": {"source_section": "STEM", "source_quote": "at 32 weeks gestation"},
                },
            }
        )
        assert pregnant.pregnancy is not None
        assert pregnant.pregnancy.gestational_age_value == 32

    def test_a_measured_value_survives_as_a_value(self):
        """#6 hemodynamic/lab-heavy: the compiler needs "potassium 5.3 mEq/L" as
        three fields, not as one sentence it would have to parse back."""
        fact = ClinicalFact(
            source_text="Serum potassium is 5.3 mEq/L",
            normalized_meaning="Serum potassium 5.3 mEq/L, above the reference range",
            fact_category=FactCategory.LAB,
            measurement=Measurement(label="serum potassium", value="5.3", unit="mEq/L"),
            role=FactRole.KEY_POSITIVE,
            must_preserve=True,
            evidence=evidence("Serum potassium is 5.3 mEq/L"),
        )
        assert fact.measurement is not None
        assert fact.measurement.value == "5.3"

    def test_a_narrative_fact_carries_no_measurement(self):
        """#11 neurologic: "no history of seizures" is a fact with no number."""
        fact = ClinicalFact(
            source_text="He has no history of seizures",
            normalized_meaning="No prior seizure history",
            fact_category=FactCategory.HISTORY,
            role=FactRole.KEY_NEGATIVE,
            must_preserve=True,
            evidence=evidence("no history of seizures"),
        )
        assert fact.measurement is None


class TestAnswerCrossCheck:
    """The deterministic pipeline knows which letter the OCR marker says. This
    is the other half of that comparison."""

    def test_reasoning_names_the_choice_it_believes_correct(self):
        reasoning = [
            AnswerReasoning(
                label="A",
                is_correct=False,
                reasoning="A repeat radiograph adds nothing once she is afebrile",
                evidence=[evidence("no indication for repeat imaging", SourceSection.EXPLANATION)],
            ),
            AnswerReasoning(
                label="B",
                is_correct=True,
                reasoning="Oral therapy completes the course with vaccination and follow-up",
                evidence=[evidence("complete the course orally", SourceSection.EXPLANATION)],
            ),
        ]
        believed = [choice.label for choice in reasoning if choice.is_correct]
        assert believed == ["B"]

    def test_answer_text_is_not_asked_for_again(self):
        """The segmented file already has the choice text; re-emitting it only
        creates something to disagree with."""
        assert "text" not in AnswerReasoning.model_fields
        with pytest.raises(ValidationError):
            AnswerReasoning(
                label="B",
                is_correct=True,
                reasoning="…",
                evidence=[evidence()],
                text="An oral antibiotic to complete the course",
            )


# --------------------------------------------------------------------------- #
# Fitness for structured output                                                #
# --------------------------------------------------------------------------- #


class TestJsonSchema:
    def test_the_schema_is_flat_enough_to_decode(self):
        """Nested objects, enums, nullables and lists decode reliably. A model
        that refers to itself does not."""
        schema = QuestionExtraction.model_json_schema()
        rendered = json.dumps(schema)
        assert "$defs" in schema
        # No definition may reference itself, directly or through the root.
        for name, definition in schema["$defs"].items():
            assert f'"#/$defs/{name}"' not in json.dumps(definition), name
        assert '"#"' not in rendered

    def test_every_description_survives_into_the_schema(self):
        """The field descriptions are the prompt. If they do not reach the JSON
        Schema, the model never sees the instructions."""
        schema = json.dumps(QuestionExtraction.model_json_schema())
        assert "character-for-character" in schema
        assert "could change the correct answer" in schema or "change the correct" in schema

    def test_a_round_trip_through_json_is_lossless(self):
        record = minimal_extraction(
            clinical_facts=[
                ClinicalFact(
                    source_text="BP 88/50",
                    normalized_meaning="Hypotensive at 88/50 mmHg",
                    fact_category=FactCategory.VITAL,
                    measurement=Measurement(label="blood pressure", value="88/50", unit="mmHg"),
                    role=FactRole.KEY_POSITIVE,
                    must_preserve=True,
                    evidence=evidence("blood pressure is 88/50 mm Hg"),
                )
            ],
            learning_points=[
                LearningPoint(
                    statement="Hypotension in sepsis is resuscitated before vasopressors",
                    evidence=[evidence("fluids first", SourceSection.EDUCATIONAL_OBJECTIVE)],
                )
            ],
        )
        again = QuestionExtraction.model_validate_json(record.model_dump_json())
        assert again == record


# --------------------------------------------------------------------------- #
# Agreement with the application                                               #
# --------------------------------------------------------------------------- #


class TestAppParity:
    """The extractor and the app hold the same enum in two languages. Drift
    between them would be found the day an import silently dropped a role."""

    def test_fact_roles_match_the_apps_clinical_role_enum(self):
        source = (REPO_ROOT / "src" / "content" / "schema.ts").read_text(encoding="utf-8")
        block = re.search(
            r"export const CLINICAL_ROLE_ENUM = z\.enum\(\[(.*?)\]\)", source, re.S
        )
        assert block, "CLINICAL_ROLE_ENUM not found in the app schema"
        app_roles = set(re.findall(r'"([A-Z_]+)"', block.group(1)))

        extractor_roles = {role.value for role in FactRole}
        # OTHER is extraction-only and is normalised to CONTEXT on import.
        assert extractor_roles - {"OTHER"} == app_roles

    def test_fact_categories_match_the_apps_finding_categories(self):
        source = (REPO_ROOT / "src" / "domain" / "constants.ts").read_text(encoding="utf-8")
        block = re.search(r"FINDING_CATEGORIES = \[(.*?)\]", source, re.S)
        assert block, "FINDING_CATEGORIES not found in the app constants"
        app_categories = set(re.findall(r'"([A-Z_]+)"', block.group(1)))

        assert {category.value for category in FactCategory} == app_categories
