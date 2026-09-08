/** DEMO CASE 15 — Preeclampsia with severe features. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_OB_001: CaseTemplateInput = {
  code: "DEMO-OB-001",
  title: "Preeclampsia With Severe Features",
  specialty: "OB/GYN",
  topic: "Obstetrics",
  primaryDiagnosis: "Preeclampsia with severe features",
  difficulty: 4,
  step3Importance: 5,

  handoffScript:
    "This is a 32-year-old first-time mother at 35 weeks who came to triage last night with a headache that would not respond to acetaminophen. Her blood pressure was 168 over 112, repeated 15 minutes later at 166 over 108. Her liver enzymes came back elevated at about three times the upper limit and her platelets were 118. She has a severe-range blood pressure plus severe features, so magnesium sulfate was started for seizure prophylaxis and she received intravenous labetalol, which brought her pressure down to 148 over 92. Continuous fetal monitoring shows a category one tracing. Obstetrics is planning delivery. Remember magnesium is for the seizures, not the blood pressure.",
  dailySignout:
    "32-year-old G1P0 at 35 weeks with preeclampsia with severe features. On magnesium sulfate for seizure prophylaxis with blood pressure controlled after intravenous labetalol. Reassuring fetal tracing. Delivery planned.",
  admissionOpening:
    "A 32-year-old woman pregnant for the first time, at 35 weeks gestation, comes to obstetric triage with a persistent headache and some blurred vision. She is uncomfortable and rubbing her temples.",
  teachingPoint:
    "Magnesium sulfate prevents eclamptic seizures. It is not an antihypertensive. Severe-range blood pressure needs a separate, fast-acting agent, and both are given while delivery — the only definitive treatment — is arranged.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "OB.PREE.01", weight: 1 },
    { code: "OB.PREE.02", weight: 1 },
    { code: "OB.PREE.03", weight: 1 },
    { code: "OB.PREE.04", weight: 1 },
    { code: "OB.PREE.05", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Blood pressure", value: "168/112, repeated at 166/108 fifteen minutes later", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "92", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "18", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Gestational age", value: "35 weeks 2 days by early ultrasound dating", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Persistent headache unresponsive to acetaminophen, with blurred vision", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "First pregnancy. No chronic hypertension. Blood pressures normal through 30 weeks. No epigastric pain initially, now mild right upper quadrant discomfort.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "General examination", value: "Brisk deep tendon reflexes without clonus. Mild facial and hand edema. No papilledema.", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Abdomen", value: "Gravid uterus consistent with dates, mild right upper quadrant tenderness, no contractions", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "LAB", label: "Preeclampsia laboratory panel", value: "AST 128, ALT 116, platelets 118,000, creatinine 0.9, LDH 260", triggerActionCode: "ORDER_LFT_PREECLAMPSIA" },
    { category: "LAB", label: "Urine protein-to-creatinine ratio", value: "0.6", referenceRange: "<0.3", triggerActionCode: "ORDER_URINE_PROTEIN" },
    { category: "LAB", label: "Complete blood count", value: "Hemoglobin 11.8, platelets 118,000", triggerActionCode: "ORDER_CBC" },
    { category: "OTHER", label: "Continuous fetal monitoring", value: "Category one tracing with a baseline of 140, moderate variability and accelerations present", triggerActionCode: "ORDER_FETAL_MONITORING" },
    { category: "LAB", label: "Serum magnesium level", value: "5.4 mg/dL on infusion, within therapeutic range with reflexes present", triggerActionCode: "ORDER_MAGNESIUM_LEVEL" },
  ],

  actionRules: [
    { actionCode: "ORDER_LFT_PREECLAMPSIA", classification: "REQUIRED", resultText: "AST 128, ALT 116, platelets 118,000, creatinine 0.9, LDH 260.", feedbackText: "Transaminitis and thrombocytopenia are severe features and change management even without severe-range blood pressure.", conceptCode: "OB.PREE.01" },
    { actionCode: "GIVE_MAGNESIUM", classification: "REQUIRED", resultText: "Magnesium sulfate loading dose and infusion started for seizure prophylaxis. Reflexes and respiratory rate monitored.", feedbackText: "Magnesium sulfate reduces the risk of eclamptic seizure. It is prophylaxis, not blood pressure treatment.", conceptCode: "OB.PREE.02" },
    { actionCode: "GIVE_ANTIHYPERTENSIVE_IV", classification: "REQUIRED", resultText: "Intravenous labetalol given for persistent severe-range hypertension. Blood pressure falls to 148/92.", feedbackText: "Severe-range blood pressure that persists on repeat measurement must be treated promptly to reduce maternal stroke risk.", conceptCode: "OB.PREE.03" },
    { actionCode: "ORDER_FETAL_MONITORING", classification: "REQUIRED", resultText: "Category one tracing with a baseline of 140, moderate variability and accelerations present.", feedbackText: "There are two patients. Fetal status is monitored continuously alongside maternal assessment.", conceptCode: "OB.PREE.05" },
    { actionCode: "CONSULT_OBGYN", classification: "REQUIRED", resultText: "Obstetrics at the bedside; delivery planned given severe features at 35 weeks.", feedbackText: "Delivery is the only definitive treatment and its timing is an obstetric decision.", conceptCode: "OB.PREE.04" },
    { actionCode: "ADMIT_LABOR_AND_DELIVERY", classification: "REQUIRED", resultText: "Admitted to labor and delivery for magnesium, blood pressure control, and delivery planning.", feedbackText: "She needs a setting with continuous fetal and maternal monitoring and immediate access to delivery.", conceptCode: "OB.PREE.04" },
    { actionCode: "ORDER_URINE_PROTEIN", classification: "APPROPRIATE", resultText: "Urine protein-to-creatinine ratio 0.6.", feedbackText: "Proteinuria supports the diagnosis, but its absence does not exclude preeclampsia when severe features are present.", conceptCode: "OB.PREE.01" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "Hemoglobin 11.8, platelets 118,000.", feedbackText: "Thrombocytopenia is both a severe feature and a consideration for regional anesthesia." },
    { actionCode: "ORDER_MAGNESIUM_LEVEL", classification: "APPROPRIATE", resultText: "Serum magnesium 5.4 mg/dL, therapeutic, with reflexes present.", feedbackText: "Magnesium toxicity is monitored clinically by reflexes and respiratory rate, with levels as a supplement.", conceptCode: "OB.PREE.02" },
    { actionCode: "EXAM_GENERAL", classification: "REQUIRED", resultText: "Brisk deep tendon reflexes without clonus, mild facial and hand edema, no papilledema.", feedbackText: "Reflexes serve double duty: neurologic irritability at baseline and magnesium toxicity monitoring during infusion.", conceptCode: "OB.PREE.02" },
    { actionCode: "GIVE_CALCIUM_GLUCONATE", classification: "OPTIONAL", resultText: "Calcium gluconate is kept at the bedside as the antidote should magnesium toxicity develop. Not required at present.", feedbackText: "Calcium gluconate reverses magnesium toxicity and should be immediately available whenever magnesium is infusing.", conceptCode: "OB.PREE.02" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "Severe-range hypertension with severe features at 35 weeks cannot be managed at home. Discharge risks eclampsia, stroke and fetal death.", feedbackText: "Preeclampsia with severe features requires admission and delivery planning.", conceptCode: "OB.PREE.04" },
    { actionCode: "GIVE_IV_FLUIDS", classification: "OPTIONAL", resultText: "Maintenance fluids only. Aggressive fluid administration in preeclampsia risks pulmonary edema.", feedbackText: "These patients have low oncotic pressure and capillary leak; fluid is given cautiously." },
    { actionCode: "ORDER_CT_HEAD", classification: "UNNECESSARY", resultText: "No acute intracranial abnormality.", feedbackText: "The headache is fully explained by preeclampsia. Imaging is reserved for focal deficits or seizures atypical for eclampsia." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "severe_pree", text: "Preeclampsia with severe features" },
        { key: "gest_htn", text: "Gestational hypertension without severe features" },
        { key: "chronic_htn", text: "Chronic hypertension" },
        { key: "migraine", text: "Migraine headache in pregnancy" },
      ], correctKey: "severe_pree" },
      correctFeedback: "Correct. Severe-range blood pressure after 20 weeks, plus headache, visual symptoms, transaminitis and thrombocytopenia.",
      incorrectFeedback: "Her pressures were normal through 30 weeks, excluding chronic hypertension, and she has severe features — neurologic symptoms plus laboratory abnormalities.",
      conceptCode: "OB.PREE.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What are the two immediate pharmacologic priorities?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Magnesium sulfate for seizure prophylaxis and a fast-acting intravenous antihypertensive for the severe-range blood pressure" },
        { key: "b", text: "Magnesium sulfate alone, which will also lower her blood pressure" },
        { key: "c", text: "An oral antihypertensive alone with outpatient follow-up" },
        { key: "d", text: "Immediate diuresis" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Two separate problems, two separate drugs, both given without delay.",
      incorrectFeedback: "Magnesium is not an antihypertensive. Severe-range blood pressure needs its own fast-acting agent alongside the magnesium.",
      conceptCode: "OB.PREE.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Why is magnesium sulfate given?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "To prevent eclamptic seizures" },
        { key: "b", text: "To lower blood pressure" },
        { key: "c", text: "To accelerate fetal lung maturity" },
        { key: "d", text: "To correct the thrombocytopenia" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Seizure prophylaxis, nothing else. Its effect on blood pressure is negligible.",
      incorrectFeedback: "Magnesium is seizure prophylaxis. Corticosteroids are what accelerate fetal lung maturity, and neither lowers blood pressure meaningfully.",
      conceptCode: "OB.PREE.02",
    },
    {
      stage: "ROUNDS",
      promptText: "Which blood pressure range requires urgent pharmacologic treatment in pregnancy?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Systolic at or above 160 or diastolic at or above 110, persisting on repeat measurement" },
        { key: "b", text: "Systolic at or above 130 on a single reading" },
        { key: "c", text: "Only when the systolic exceeds 200" },
        { key: "d", text: "Only when the patient reports a headache" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Severe-range values that persist on repeat are treated promptly to reduce the risk of maternal intracranial hemorrhage.",
      incorrectFeedback: "The severe-range threshold is 160 systolic or 110 diastolic, confirmed on repeat measurement, and it is treated within the hour.",
      conceptCode: "OB.PREE.03",
    },
    {
      stage: "ROUNDS",
      promptText: "What is the definitive treatment for preeclampsia?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Delivery, with timing balancing gestational age against maternal and fetal risk" },
        { key: "b", text: "Indefinite magnesium sulfate infusion" },
        { key: "c", text: "Long-term oral antihypertensive therapy with expectant management to term" },
        { key: "d", text: "Bed rest until 40 weeks" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Everything else is temporizing. At 35 weeks with severe features, delivery is indicated.",
      incorrectFeedback: "Medications control the manifestations but not the disease. Only delivery is definitive.",
      conceptCode: "OB.PREE.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "She has delivered and her blood pressure is improving. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Early postpartum blood pressure follow-up, warning signs for postpartum preeclampsia and eclampsia, and counseling on future pregnancy and cardiovascular risk" },
        { key: "b", text: "No follow-up, since delivery cures the condition immediately" },
        { key: "c", text: "Continued magnesium sulfate at home" },
        { key: "d", text: "Instructions to avoid all future pregnancies" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Preeclampsia and eclampsia can present or worsen in the postpartum period, so early follow-up and explicit warning signs are essential.",
      incorrectFeedback: "Delivery starts the resolution but does not end the risk. Postpartum preeclampsia is real, so early blood pressure follow-up and warning signs are required.",
      conceptCode: "OB.PREE.05",
    },
  ],
};
