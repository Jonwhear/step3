"""
Semantic extraction schema, v0.1.

What this is for
----------------
One source question in, one faithful semantic record out. The extractor's job
is to say what the source *says* — the facts it states, the decision it tests,
why each answer is right or wrong, and what it teaches — with a quotation
behind every claim.

What this is deliberately NOT for
---------------------------------
Anything the deterministic pipeline already knows. Question id, answer-choice
text, specialty, system, topic, raw and cleaned OCR, section boundaries and the
OCR correct-answer marker are all merged around this record afterwards. Asking
a model to regenerate them costs tokens and invites disagreement with facts
that are not in dispute.

It is also not a case. A `CaseTemplateInput` on the app side needs a handoff
script, a daily sign-out, an admission opening, a classified management option
set and concept codes; none of that is extraction, because none of it is in the
source. Turning N extractions into one patient is the compiler's job, and the
compiler is a separate step.

Design rules
------------
- Strict by construction: `extra="forbid"` everywhere, because a model that
  invents a field is a model whose output nobody is checking.
- Every claim carries `Evidence` with a character-for-character quote. The
  quote is the audit trail; if it cannot be quoted, it was not in the source.
- One judgement per field. `role` says what a fact does; `must_preserve` says
  whether losing it would change the answer. Two overlapping rating scales are
  two chances to be inconsistent.
- Shapes stay boring: nested objects, enums, nullables and lists. No recursive
  models, no discriminated unions — structured-output decoding is reliable in
  direct proportion to how dull the schema is.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

SCHEMA_VERSION = "0.1"


class StrictModel(BaseModel):
    """Rejects any field the schema does not name. Pydantic ignores extras by
    default, which would silently swallow a hallucinated key."""

    model_config = ConfigDict(extra="forbid")


# --------------------------------------------------------------------------- #
# Evidence                                                                     #
# --------------------------------------------------------------------------- #


class SourceSection(str, Enum):
    STEM = "STEM"
    EXPLANATION = "EXPLANATION"
    EDUCATIONAL_OBJECTIVE = "EDUCATIONAL_OBJECTIVE"
    ANSWER_CHOICE = "ANSWER_CHOICE"
    OTHER = "OTHER"


class Evidence(StrictModel):
    source_section: SourceSection
    source_quote: str = Field(
        min_length=1,
        description=(
            "Exact character-for-character quotation from the OCR-derived "
            "source text. Preserve OCR errors and spacing where possible. Do "
            "not paraphrase, correct or tidy the quote."
        ),
    )


# --------------------------------------------------------------------------- #
# Patient context                                                              #
# --------------------------------------------------------------------------- #


class QuestionKind(str, Enum):
    CLINICAL_CASE = "CLINICAL_CASE"
    BIOSTATS_RESEARCH = "BIOSTATS_RESEARCH"
    ETHICS_SYSTEMS = "ETHICS_SYSTEMS"
    OTHER = "OTHER"


class AgeUnit(str, Enum):
    """Neonates are hours old and that is clinically load-bearing, so age is
    never coerced into years at extraction time."""

    HOURS = "HOURS"
    DAYS = "DAYS"
    WEEKS = "WEEKS"
    MONTHS = "MONTHS"
    YEARS = "YEARS"
    OTHER = "OTHER"


class Age(StrictModel):
    value: float | None = None
    unit: AgeUnit
    source_text: str = Field(
        min_length=1,
        description='As written, e.g. "50-hour-old", "3-week-old", "79-year-old".',
    )


class Sex(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class PregnancyStatus(str, Enum):
    PREGNANT = "PREGNANT"
    NOT_PREGNANT = "NOT_PREGNANT"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNKNOWN = "UNKNOWN"
    OTHER = "OTHER"


class PregnancyContext(StrictModel):
    status: PregnancyStatus
    gestational_age_value: float | None = None
    gestational_age_unit: AgeUnit | None = None
    evidence: Evidence | None = None


class PatientContext(StrictModel):
    """Null on the whole object when the question has no patient — a
    cross-sectional-study question does not have an age."""

    age: Age | None = None
    sex: Sex = Sex.UNKNOWN
    pregnancy: PregnancyContext | None = None


# --------------------------------------------------------------------------- #
# Clinical facts                                                               #
# --------------------------------------------------------------------------- #


class FactRole(str, Enum):
    """The four shared values match the app's `CLINICAL_ROLE_ENUM` exactly; a
    test asserts it. `OTHER` has no app equivalent and is normalised to
    `CONTEXT` at import."""

    KEY_POSITIVE = "KEY_POSITIVE"
    KEY_NEGATIVE = "KEY_NEGATIVE"
    CONTEXT = "CONTEXT"
    DISTRACTOR = "DISTRACTOR"
    OTHER = "OTHER"


class FactCategory(str, Enum):
    """NOT in the original v0 sketch — added so the compiler can tell a blood
    pressure from a past medical history.

    Without it every fact is one string of prose, and `case_finding` /
    `case_lab_result` rows cannot be built without a second pass that re-reads
    the source. The values mirror the app's `FINDING_CATEGORIES`.
    """

    VITAL = "VITAL"
    EXAM = "EXAM"
    LAB = "LAB"
    IMAGING = "IMAGING"
    ECG = "ECG"
    HISTORY = "HISTORY"
    OTHER = "OTHER"


class Measurement(StrictModel):
    """NOT in the original v0 sketch — added for the same reason.

    Populated only when the source states a discrete value. `label` stays free
    text: "serum potassium", "potassium" and "K" all map to LAB.POTASSIUM
    later, and terminology normalisation is not the extractor's problem.
    """

    label: str = Field(min_length=1, description='e.g. "serum potassium", "heart rate".')
    value: str = Field(min_length=1, description='As stated, e.g. "5.3", "138/84".')
    unit: str | None = Field(
        default=None, description='As stated, e.g. "mEq/L", "bpm". Null when the source gives none.'
    )


class ClinicalFact(StrictModel):
    source_text: str = Field(
        min_length=1,
        description="Literal or near-literal source representation of the fact.",
    )
    normalized_meaning: str = Field(
        min_length=1,
        description=(
            "Clean semantic representation of the fact. Do not add information "
            "that is absent from the source."
        ),
    )
    fact_category: FactCategory = Field(
        description=(
            "What kind of datum this is. VITAL/LAB for measured values, EXAM "
            "for physical findings, IMAGING/ECG for study results, HISTORY for "
            "narrative background."
        )
    )
    measurement: Measurement | None = Field(
        default=None,
        description=(
            "The discrete value, when the source states one. Null for narrative "
            "facts. Never infer or convert a value the source does not give."
        ),
    )
    role: FactRole = Field(
        description=(
            "KEY_POSITIVE: directly supports the tested conclusion. "
            "KEY_NEGATIVE: absence/negative finding used to exclude an alternative. "
            "CONTEXT: clinically relevant context but not decisive. "
            "DISTRACTOR: intentionally misleading or non-decisive information. "
            "OTHER: none of the above."
        )
    )
    must_preserve: bool = Field(
        description=(
            "True only if removing or changing this fact could change the "
            "correct answer, materially weaken the discrimination between "
            "answer choices, or make the source reasoning no longer faithful."
        )
    )
    evidence: Evidence


# --------------------------------------------------------------------------- #
# Diagnoses and the tested decision                                            #
# --------------------------------------------------------------------------- #


class DiagnosisClaim(StrictModel):
    diagnosis: str = Field(min_length=1)
    relationship: str = Field(
        min_length=1,
        description=(
            'How the source treats it, e.g. "correct diagnosis", "excluded by '
            'the normal troponin", "considered and rejected". Free text in v0; '
            "an enum once the real range is known."
        ),
    )
    evidence: Evidence


class DecisionType(str, Enum):
    DIAGNOSIS = "DIAGNOSIS"
    DIAGNOSTIC_TEST = "DIAGNOSTIC_TEST"
    TREATMENT = "TREATMENT"
    MEDICATION = "MEDICATION"
    DISPOSITION = "DISPOSITION"
    PREVENTION = "PREVENTION"
    FOLLOW_UP = "FOLLOW_UP"
    PROGNOSIS = "PROGNOSIS"
    MECHANISM = "MECHANISM"
    ETHICS = "ETHICS"
    PATIENT_SAFETY = "PATIENT_SAFETY"
    BIOSTATS = "BIOSTATS"
    OTHER = "OTHER"


class PhaseOfCare(str, Enum):
    PREVENTION_SCREENING = "PREVENTION_SCREENING"
    INITIAL_PRESENTATION = "INITIAL_PRESENTATION"
    ACUTE_MANAGEMENT = "ACUTE_MANAGEMENT"
    ONGOING_MANAGEMENT = "ONGOING_MANAGEMENT"
    DISPOSITION = "DISPOSITION"
    FOLLOW_UP = "FOLLOW_UP"
    OTHER = "OTHER"


class ClinicalDecision(StrictModel):
    decision_type: DecisionType
    phase_of_care: PhaseOfCare | None = Field(
        default=None,
        description=(
            "Null when the question has no phase of care — a study-design or "
            "systems question is not at a point in someone's illness."
        ),
    )
    tested_decision: str = Field(
        min_length=1,
        description="What distinction or action the question is actually testing.",
    )
    correct_conclusion: str = Field(
        min_length=1,
        description=(
            "Semantic conclusion supported by the source explanation. Do not "
            "simply copy the answer-choice text unless that is the clearest "
            "representation."
        ),
    )
    evidence: list[Evidence] = Field(min_length=1)


# --------------------------------------------------------------------------- #
# Answers and teaching                                                         #
# --------------------------------------------------------------------------- #


class AnswerReasoning(StrictModel):
    """Reasoning only. The answer-choice text is already known deterministically
    and is joined back on `label`."""

    label: str = Field(
        min_length=1, description='The choice letter as printed, e.g. "A", "B".'
    )
    is_correct: bool = Field(
        description=(
            "NOT in the original v0 sketch — added so the OCR answer marker and "
            "the model's reading of the explanation can be compared. Exactly "
            "one choice should be true; disagreement with the marker routes the "
            "question to review rather than into the library."
        )
    )
    reasoning: str = Field(
        min_length=1,
        description="Why the source says this choice is right or wrong.",
    )
    evidence: list[Evidence] = Field(min_length=1)


class LearningPoint(StrictModel):
    statement: str = Field(
        min_length=1,
        description=(
            "One atomic teaching statement supported by the source. Do not "
            "combine multiple independent rules into one statement."
        ),
    )
    evidence: list[Evidence] = Field(min_length=1)


# --------------------------------------------------------------------------- #
# The record                                                                   #
# --------------------------------------------------------------------------- #


class QuestionExtraction(StrictModel):
    """One source question's semantics.

    Everything the pipeline already knows is merged around this afterwards,
    which is why there is no question id, answer text, specialty, system,
    topic, OCR or section boundary here.
    """

    schema_version: str = SCHEMA_VERSION
    question_kind: QuestionKind
    patient: PatientContext | None = None
    clinical_facts: list[ClinicalFact] = Field(default_factory=list)
    diagnoses: list[DiagnosisClaim] = Field(default_factory=list)
    decision: ClinicalDecision
    answer_reasoning: list[AnswerReasoning] = Field(default_factory=list)
    learning_points: list[LearningPoint] = Field(default_factory=list)
