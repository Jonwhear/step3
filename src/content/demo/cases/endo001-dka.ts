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
    { category: "EXAM", label: "General appearance", value: "Dry mucous membranes, deep regular respirations, fruity breath odor, alert", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Abdomen", value: "Diffusely tender without guarding or rebound", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "LAB", label: "Bedside glucose", value: "480", units: "mg/dL", triggerActionCode: "ORDER_GLUCOSE" },
    { category: "LAB", label: "Basic metabolic panel", value: "Sodium 132, potassium 5.3, chloride 97, bicarbonate 10, anion gap 25, creatinine 1.2, glucose 480", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Serum ketones", value: "Strongly positive; beta-hydroxybutyrate 5.8 mmol/L", triggerActionCode: "ORDER_KETONES" },
    { category: "LAB", label: "Venous blood gas", value: "pH 7.19, pCO2 24", triggerActionCode: "ORDER_ABG" },
    { category: "LAB", label: "Complete blood count", value: "White count 14.2 without left shift, hemoglobin 14.1", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Urinalysis", value: "Large ketones and glucose. No nitrites, no leukocyte esterase.", triggerActionCode: "ORDER_URINALYSIS" },
    { category: "IMAGING", label: "Chest radiograph", value: "Clear lung fields. No infiltrate.", triggerActionCode: "ORDER_CXR" },
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
      correctFeedback: "Correct. Fluids restore perfusion and begin lowering glucose before insulin is introduced.",
      incorrectFeedback: "Insulin before fluid and a potassium check risks profound hypokalemia and worsening hypotension. Fluids come first.",
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
      correctFeedback: "Correct. Serum potassium reports distribution, not total-body stores. Insulin reverses the shift and unmasks the deficit.",
      incorrectFeedback: "Potassium has moved out of cells while the osmotic diuresis has been dumping it in the urine for days. The serum value is misleading.",
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
