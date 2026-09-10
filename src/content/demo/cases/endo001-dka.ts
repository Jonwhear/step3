/** DEMO CASE 06 — Diabetic ketoacidosis. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_ENDO_001: CaseTemplateInput = {
  code: "DEMO-ENDO-001",
  title: "Diabetic Ketoacidosis",
  specialty: "Internal Medicine",
  topic: "Endocrinology",
  primaryDiagnosis: "Diabetic ketoacidosis",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "Next patient is a 24-year-old woman with type 1 diabetes who came in with a day of vomiting, abdominal pain and polyuria. Her glucose was 480, bicarbonate 10, anion gap 25, serum ketones positive, and her potassium was 5.3. She was given isotomic fluids first, and once we confirmed she was making urine and her potassium was adequate, an insulin infusion was started. Her gap has come down to 16 and her glucose is now 240. She admits she stopped her insulin four days ago because she ran out and could not afford a refill. She is on an insulin drip with hourly glucose checks and gap monitoring every four hours.",
  dailySignout:
    "24-year-old woman with diabetic ketoacidosis on an insulin infusion. Anion gap closing, glucose trending down, potassium being repleted. Precipitant identified as insulin nonadherence due to cost.",
  admissionOpening:
    "A 24-year-old woman with type 1 diabetes presents with one day of vomiting, diffuse abdominal pain and increased urination. She is breathing deeply and her breath has a fruity odor.",
  teachingPoint:
    "The sequence in diabetic ketoacidosis is fluids, then potassium assessment, then insulin. Starting insulin before checking potassium can drive it intracellularly and precipitate a fatal arrhythmia, because total-body potassium is depleted even when the serum value looks high.",

  minimumRoundsBeforeDischarge: 3,

  patientAgeYears: 24,
  patientSex: "F",
  chiefComplaint: "Vomiting, abdominal pain and polyuria",
  codeStatus: "Full code",
  allergies: "No known drug allergies",

  concepts: [
    { code: "ENDO.DKA.01", weight: 1 },
    { code: "ENDO.DKA.02", weight: 1 },
    { code: "ENDO.DKA.03", weight: 1 },
    { code: "ENDO.DKA.04", weight: 1 },
    { code: "ENDO.DKA.05", weight: 1 },
    { code: "ENDO.DKA.06", weight: 0.8 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "118", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "104/64", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "26, deep and regular", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "36.8", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "99% on room air", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "One day of vomiting, abdominal pain and polyuria", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Type 1 diabetes diagnosed at age 11. No prior episodes of ketoacidosis.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "She ran out of insulin four days ago and could not afford a refill.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "General appearance", value: "Dry mucous membranes, deep regular respirations, fruity breath odor, alert", triggerActionCode: "EXAM_GENERAL", clinicalRole: "KEY_POSITIVE" },
    { category: "EXAM", label: "Abdomen", value: "Diffusely tender without guarding or rebound", triggerActionCode: "EXAM_ABDOMEN", clinicalRole: "DISTRACTOR" },
    { category: "LAB", label: "Serum ketones", value: "Strongly positive; beta-hydroxybutyrate 5.8 mmol/L", triggerActionCode: "ORDER_KETONES", clinicalRole: "KEY_POSITIVE" },
  ],

  /*
   * Structured results. Values only — units, reference ranges and panel
   * grouping come from the central lab library, and the abnormal flag is
   * derived from the range rather than being asserted here (spec §14).
   */
  labs: [
    { labCode: "GLU", value: "480", triggerActionCode: "ORDER_GLUCOSE", collectedLabel: "On arrival", clinicalRole: "KEY_POSITIVE" },
    { labCode: "NA", value: "132", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival", clinicalRole: "CONTEXT" },
    { labCode: "K", value: "5.3", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival", clinicalRole: "KEY_POSITIVE" },
    { labCode: "CL", value: "97", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival" },
    { labCode: "HCO3", value: "10", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival", clinicalRole: "KEY_POSITIVE" },
    { labCode: "ANION_GAP", value: "25", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival", clinicalRole: "KEY_POSITIVE" },
    { labCode: "CR", value: "1.2", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival" },
    { labCode: "WBC", value: "14.2", triggerActionCode: "ORDER_CBC", collectedLabel: "On arrival", clinicalRole: "DISTRACTOR" },
    { labCode: "HGB", value: "14.1", triggerActionCode: "ORDER_CBC", collectedLabel: "On arrival" },
    { labCode: "PLT", value: "288", triggerActionCode: "ORDER_CBC", collectedLabel: "On arrival" },
    { labCode: "PH_ART", value: "7.19", triggerActionCode: "ORDER_ABG", collectedLabel: "Venous sample", clinicalRole: "KEY_POSITIVE" },
    { labCode: "PCO2", value: "24", triggerActionCode: "ORDER_ABG", collectedLabel: "Venous sample", clinicalRole: "CONTEXT" },
    { labCode: "UA_KETONES", value: "Large", flag: "ABNORMAL", triggerActionCode: "ORDER_URINALYSIS", clinicalRole: "KEY_POSITIVE" },
    { labCode: "UA_GLUCOSE", value: "Large", flag: "ABNORMAL", triggerActionCode: "ORDER_URINALYSIS", clinicalRole: "CONTEXT" },
    { labCode: "UA_NITRITE", value: "Negative", triggerActionCode: "ORDER_URINALYSIS", clinicalRole: "KEY_NEGATIVE" },
    { labCode: "UA_LEUK", value: "Negative", triggerActionCode: "ORDER_URINALYSIS", clinicalRole: "KEY_NEGATIVE" },
  ],

  imaging: [
    {
      studyName: "Chest radiograph, portable AP",
      modality: "XRAY",
      performedLabel: "Hospital day 1",
      impression: "No acute cardiopulmonary abnormality. No infiltrate.",
      findingsText:
        "Lung volumes are adequate. The lungs are clear without focal consolidation, effusion or pneumothorax. Cardiomediastinal silhouette is within normal limits.",
      triggerActionCode: "ORDER_CXR",
      clinicalRole: "KEY_NEGATIVE",
    },
  ],

  /* Assessment & Plan (spec §20-21). Every option is deterministically scored. */
  problems: [
    {
      label: "Diabetic ketoacidosis",
      assessmentText:
        "Type 1 diabetic with an anion-gap metabolic acidosis, ketosis and hyperglycaemia precipitated by insulin nonadherence.",
      isPrimary: true,
      conceptCode: "ENDO.DKA.01",
      options: [
        { label: "IV isotonic fluid resuscitation", classification: "REQUIRED", actionCode: "GIVE_IV_FLUIDS", feedbackText: "Fluids restore perfusion and begin lowering glucose before insulin is introduced.", conceptCode: "ENDO.DKA.02" },
        { label: "Check potassium before starting insulin", classification: "REQUIRED", actionCode: "GIVE_POTASSIUM", feedbackText: "Insulin drives potassium intracellularly; starting it into an unrecognised deficit can be fatal.", conceptCode: "ENDO.DKA.03" },
        { label: "IV insulin infusion", classification: "REQUIRED", actionCode: "GIVE_INSULIN", feedbackText: "Insulin stops ketogenesis and closes the gap — after fluids and a potassium check.", conceptCode: "ENDO.DKA.02" },
        { label: "Hourly glucose and q4h electrolytes", classification: "REQUIRED", feedbackText: "An insulin infusion is only safe with this monitoring cadence." },
        { label: "Add dextrose when glucose falls below 200 with an open gap", classification: "APPROPRIATE", actionCode: "GIVE_DEXTROSE", feedbackText: "Lets the infusion continue suppressing ketogenesis after the glucose normalises.", conceptCode: "ENDO.DKA.04" },
        { label: "IV sodium bicarbonate", classification: "UNNECESSARY", feedbackText: "Not indicated at this pH; it does not improve outcomes and may worsen hypokalaemia." },
        { label: "Subcutaneous sliding-scale insulin alone", classification: "CONTRAINDICATED", feedbackText: "Inadequate for an open anion gap — this patient needs an infusion." },
      ],
    },
    {
      label: "Hypokalaemia risk / total-body potassium depletion",
      assessmentText:
        "Serum potassium of 5.3 reflects extracellular shift, not stores. It will fall rapidly once insulin is running.",
      conceptCode: "ENDO.DKA.03",
      options: [
        { label: "Replete potassium as it falls on the infusion", classification: "REQUIRED", actionCode: "GIVE_POTASSIUM", feedbackText: "Expect the value to drop quickly once insulin reverses the shift.", conceptCode: "ENDO.DKA.03" },
        { label: "Continuous cardiac monitoring", classification: "APPROPRIATE", feedbackText: "Reasonable while potassium is moving rapidly." },
        { label: "Withhold all potassium because the serum value is high", classification: "CONTRAINDICATED", feedbackText: "This is the error the case is built around: the serum value is misleading." },
      ],
    },
    {
      label: "Insulin access / cost-related nonadherence",
      assessmentText:
        "The precipitant was running out of insulin she could not afford. Treating the episode without fixing this guarantees readmission.",
      conceptCode: "ENDO.DKA.06",
      options: [
        { label: "Confirm an insulin supply she can actually obtain", classification: "REQUIRED", feedbackText: "The discharge plan has to solve the problem that caused the admission.", conceptCode: "ENDO.DKA.06" },
        { label: "Social work / pharmacy assistance referral", classification: "REQUIRED", feedbackText: "Cost-related nonadherence is a solvable, concrete barrier." },
        { label: "Sick-day rules education", classification: "APPROPRIATE", feedbackText: "Reduces the risk of the next episode." },
        { label: "Endocrinology follow-up within one week", classification: "APPROPRIATE", feedbackText: "Close follow-up after an admission for ketoacidosis." },
        { label: "Discharge on the same regimen she could not afford", classification: "CONTRAINDICATED", feedbackText: "Guarantees a repeat admission." },
      ],
    },
  ],

  actionRules: [
    { actionCode: "GIVE_IV_FLUIDS", classification: "REQUIRED", resultText: "Isotonic crystalloid started. Heart rate falls to 96, blood pressure improves to 116/72, and glucose falls to 410 from dilution and improved perfusion alone.", feedbackText: "Fluid resuscitation comes first. It restores perfusion, improves renal clearance of glucose and ketones, and must precede insulin.", conceptCode: "ENDO.DKA.02" },
    { actionCode: "ORDER_BMP", classification: "REQUIRED", resultText: "Sodium 132, potassium 5.3, chloride 97, bicarbonate 10, anion gap 25, creatinine 1.2, glucose 480.", feedbackText: "The metabolic panel gives you the anion gap and the potassium — the two numbers that drive management.", conceptCode: "ENDO.DKA.03" },
    { actionCode: "ORDER_GLUCOSE", classification: "REQUIRED", resultText: "Bedside glucose 480 mg/dL.", feedbackText: "A bedside glucose is immediate and confirms the hyperglycemia component of the triad.", conceptCode: "ENDO.DKA.01" },
    { actionCode: "ORDER_KETONES", classification: "REQUIRED", resultText: "Strongly positive; beta-hydroxybutyrate 5.8 mmol/L.", feedbackText: "Ketosis completes the diagnostic triad of hyperglycemia, anion-gap acidosis and ketosis.", conceptCode: "ENDO.DKA.01" },
    { actionCode: "GIVE_INSULIN", classification: "REQUIRED", resultText: "Insulin infusion started after fluids and after confirming potassium is above 3.3 with adequate urine output. Anion gap falls from 25 to 16 over six hours.", feedbackText: "Insulin stops ketogenesis and closes the gap, but only after fluids and a potassium check.", conceptCode: "ENDO.DKA.02" },
    { actionCode: "GIVE_POTASSIUM", classification: "REQUIRED", resultText: "Potassium repleted as it falls to 4.0 on the insulin infusion.", feedbackText: "Total-body potassium is depleted despite an elevated serum value; insulin unmasks the deficit rapidly.", conceptCode: "ENDO.DKA.03" },
    { actionCode: "ORDER_ABG", classification: "APPROPRIATE", resultText: "pH 7.19, pCO2 24, consistent with metabolic acidosis and respiratory compensation.", feedbackText: "A venous gas is adequate; an arterial sample is rarely necessary." },
    { actionCode: "ORDER_URINALYSIS", classification: "APPROPRIATE", resultText: "Large ketones and glucose. No nitrites, no leukocyte esterase.", feedbackText: "Screens for urinary infection as a precipitant.", conceptCode: "ENDO.DKA.06" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "White count 14.2 without left shift, hemoglobin 14.1.", feedbackText: "Leukocytosis is common in ketoacidosis itself and does not by itself indicate infection." },
    { actionCode: "HX_MEDICATIONS", classification: "REQUIRED", resultText: "She ran out of insulin four days ago and could not afford a refill.", feedbackText: "Identifying the precipitant is part of treating the episode. Cost-related nonadherence is a solvable problem.", conceptCode: "ENDO.DKA.06" },
    { actionCode: "GIVE_DEXTROSE", classification: "APPROPRIATE", resultText: "Dextrose added to the fluids once glucose falls below 200 while the anion gap remains open, allowing the insulin infusion to continue.", feedbackText: "Adding dextrose lets you keep suppressing ketogenesis after the glucose normalizes but before the gap closes.", conceptCode: "ENDO.DKA.04" },
    { actionCode: "ADMIT_ICU", classification: "APPROPRIATE", resultText: "Admitted to a monitored setting for hourly glucose and frequent electrolyte checks on an insulin infusion.", feedbackText: "An insulin infusion with hourly monitoring requires an intensive care or step-down setting in most hospitals." },
    { actionCode: "ORDER_CXR", classification: "OPTIONAL", resultText: "Clear lung fields. No infiltrate.", feedbackText: "Reasonable as part of a search for a precipitating infection." },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "UNNECESSARY", resultText: "She is afebrile with no localizing source and a clear radiograph and urinalysis. Empiric antibiotics are not indicated.", feedbackText: "Leukocytosis alone in ketoacidosis does not warrant antibiotics." },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "UNNECESSARY", resultText: "No acute intra-abdominal abnormality.", feedbackText: "Abdominal pain is a well-recognized feature of ketoacidosis itself and typically resolves with treatment." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "She has an open anion gap on an insulin infusion. Discharge would be lethal.", feedbackText: "The gap must close and she must transition to subcutaneous insulin and tolerate oral intake before discharge is even considered.", conceptCode: "ENDO.DKA.05" },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "dka", text: "Diabetic ketoacidosis" },
        { key: "hhs", text: "Hyperosmolar hyperglycemic state" },
        { key: "gastro", text: "Acute viral gastroenteritis" },
        { key: "lactic", text: "Lactic acidosis from sepsis" },
      ], correctKey: "dka" },
      correctFeedback: "Correct. Hyperglycemia, an anion-gap metabolic acidosis and positive ketones define ketoacidosis.",
      incorrectFeedback: "Hyperosmolar state has minimal ketosis and much higher glucose. The triad here — hyperglycemia, gap acidosis, ketosis — is ketoacidosis.",
      conceptCode: "ENDO.DKA.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the first therapeutic step?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Intravenous isotonic fluid resuscitation" },
        { key: "b", text: "An immediate intravenous insulin bolus before anything else" },
        { key: "c", text: "Intravenous sodium bicarbonate" },
        { key: "d", text: "Subcutaneous long-acting insulin alone" },
      ], correctKey: "a" },
      correctFeedback: "Fluids restore perfusion and begin lowering glucose before insulin is introduced.",
      incorrectFeedback: "Insulin before fluid and a potassium check risks profound hypokalemia and worsening hypotension.",
      whyCorrect:
        "These patients are several litres down from osmotic diuresis and vomiting. Restoring intravascular volume improves renal perfusion, which clears glucose and ketones on its own, and it prevents the abrupt drop in blood pressure that follows when insulin shifts fluid intracellularly.",
      caseEvidence:
        "Heart rate 118, blood pressure 104/64, dry mucous membranes and a day of vomiting with polyuria — all point to significant volume depletion.",
      whyOthersWrong:
        "An immediate insulin bolus drives potassium into cells before you know the true deficit and worsens hypotension. Bicarbonate does not improve outcomes at this pH. Subcutaneous long-acting insulin alone cannot close an open anion gap.",
      detailedExplanation:
        "The order in ketoacidosis is fluids, then a potassium check, then insulin. Each step exists to make the next one safe.",
      conceptCode: "ENDO.DKA.02",
    },
    {
      stage: "ROUNDS",
      promptText: "What determines when the intravenous insulin infusion can be stopped?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Closure of the anion gap with resolution of ketosis, after subcutaneous insulin has been given and allowed to take effect" },
        { key: "b", text: "As soon as the glucose falls below 200" },
        { key: "c", text: "After a fixed 24 hours of infusion" },
        { key: "d", text: "As soon as the patient feels well enough to eat" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Glucose normalizes long before ketogenesis stops — the anion gap is the endpoint that matters.",
      incorrectFeedback: "Stopping the infusion when glucose normalizes but the gap is still open causes rebound ketoacidosis. Follow the gap.",
      conceptCode: "ENDO.DKA.04",
    },
    {
      stage: "ROUNDS",
      promptText: "Why can total-body potassium be severely depleted when the serum potassium reads 5.3?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Acidosis and insulin deficiency shift potassium out of cells while osmotic diuresis wastes it in the urine" },
        { key: "b", text: "Laboratory hemolysis falsely elevates every potassium measurement in ketoacidosis" },
        { key: "c", text: "The kidney actively retains potassium during ketoacidosis" },
        { key: "d", text: "Potassium binds to ketone bodies and is measured twice" },
      ], correctKey: "a" },
      correctFeedback: "Serum potassium reports distribution, not total-body stores.",
      incorrectFeedback: "Potassium has moved out of cells while the osmotic diuresis has been wasting it in the urine for days.",
      whyCorrect:
        "Two processes run in parallel. Acidosis and insulin deficiency move potassium from the intracellular to the extracellular space, which raises the measured value. Meanwhile the osmotic diuresis has been excreting potassium for days, depleting total-body stores. The serum number reflects only the first process.",
      caseEvidence:
        "Potassium 5.3 with a bicarbonate of 10 and an anion gap of 25, after a day of polyuria and vomiting.",
      whyOthersWrong:
        "Haemolysis would be a sporadic pre-analytic artefact, not a consistent feature of ketoacidosis. The kidney is wasting potassium here, not retaining it. Potassium does not bind ketone bodies.",
      detailedExplanation:
        "This is why insulin is withheld until potassium is known to be above roughly 3.3: starting it reverses the shift and can unmask a profound deficit within an hour.",
      conceptCode: "ENDO.DKA.03",
    },
    {
      stage: "ROUNDS",
      promptText: "What must happen before the transition to subcutaneous insulin?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Give subcutaneous insulin and overlap it with the infusion for one to two hours before stopping the drip, with the patient tolerating oral intake" },
        { key: "b", text: "Stop the infusion first, then order subcutaneous insulin when the next glucose returns" },
        { key: "c", text: "Stop the infusion and use a correction scale alone" },
        { key: "d", text: "Discharge her on her previous regimen without overlap" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Intravenous insulin has a very short half-life. Without overlap she is briefly insulin-deficient and the gap reopens.",
      incorrectFeedback: "The overlap is the whole point: subcutaneous insulin must be active before the infusion stops.",
      conceptCode: "ENDO.DKA.05",
    },
    {
      stage: "DISCHARGE",
      promptText: "Her gap has closed and she is eating. What is essential before discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Address the cost barrier to her insulin, confirm a supply she can actually obtain, review sick-day rules, and arrange close follow-up" },
        { key: "b", text: "Discharge on the same regimen she could not afford" },
        { key: "c", text: "Prescribe an oral hypoglycemic agent instead of insulin" },
        { key: "d", text: "Arrange a repeat anion gap in one week as the only follow-up" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The precipitant was insulin she could not obtain. Discharging without solving that guarantees she comes back.",
      incorrectFeedback: "Type 1 diabetes requires insulin, and this episode was caused by not having it. The discharge plan must fix access and teach sick-day management.",
      conceptCode: "ENDO.DKA.06",
    },
  ],
};
