/** DEMO CASE 03 — Acute decompensated heart failure. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_CARD_003: CaseTemplateInput = {
  code: "DEMO-CARD-003",
  title: "Acute Decompensated Heart Failure",
  specialty: "Internal Medicine",
  topic: "Cardiology",
  primaryDiagnosis: "Acute decompensated heart failure with reduced ejection fraction",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "This is a 74-year-old man with known heart failure with reduced ejection fraction, ejection fraction around 30 percent, admitted overnight with three days of worsening orthopnea, leg swelling and a six pound weight gain. On examination his jugular venous pressure was elevated, he had bilateral crackles at the bases and two plus pitting edema to the knees. Chest radiograph showed pulmonary vascular congestion. He was given intravenous furosemide in the emergency department and put out about a liter overnight. He is on two liters of oxygen by nasal cannula with saturations in the mid nineties. Today we need to keep diuresing him, watch his electrolytes and creatinine, and make sure his chronic regimen is optimized before he leaves.",
  dailySignout:
    "74-year-old man with acute decompensated heart failure, on intravenous loop diuretics with good urine output. Daily weights and strict intake and output ordered. Still requiring two liters of oxygen.",
  admissionOpening:
    "A 74-year-old man with known heart failure with reduced ejection fraction presents with three days of worsening shortness of breath when lying flat, swollen legs, and a six pound weight gain.",
  teachingPoint:
    "Decompensated heart failure is a volume problem first. Decongestion with intravenous loop diuretics relieves symptoms; it is the chronic guideline-directed regimen that changes how long the patient lives.",

  minimumRoundsBeforeDischarge: 3,

  concepts: [
    { code: "CARD.HF.01", weight: 1 },
    { code: "CARD.HF.02", weight: 1 },
    { code: "CARD.HF.03", weight: 1 },
    { code: "CARD.HF.04", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "96", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "138/82", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "24", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "91% on room air, 95% on 2 L nasal cannula", initiallyVisible: true },
    { category: "VITAL", label: "Weight", value: "94.2 kg, up 2.7 kg from dry weight", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Three days of orthopnea, leg swelling and weight gain", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Heart failure with reduced ejection fraction (ejection fraction 30%), hypertension, prior myocardial infarction", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "He ran out of his diuretic ten days ago and has been eating canned soup daily.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Jugular venous pressure elevated to the angle of the jaw, bibasilar crackles, S3 gallop", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "EXAM", label: "Extremities", value: "Two plus pitting edema to the knees bilaterally", triggerActionCode: "EXAM_GENERAL" },
    { category: "IMAGING", label: "Chest radiograph", value: "Cardiomegaly with pulmonary vascular congestion and small bilateral pleural effusions", triggerActionCode: "ORDER_CXR" },
    { category: "LAB", label: "BNP", value: "1840", units: "pg/mL", referenceRange: "<100", triggerActionCode: "ORDER_BNP" },
    { category: "LAB", label: "Basic metabolic panel", value: "Sodium 134, potassium 3.9, creatinine 1.3 (baseline 1.1), bicarbonate 26", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Troponin", value: "0.03 ng/mL, not rising", triggerActionCode: "ORDER_TROPONIN" },
    { category: "ECG", label: "12-lead ECG", value: "Sinus rhythm with old anterior Q waves. No acute ischemic changes.", triggerActionCode: "ORDER_ECG" },
    { category: "IMAGING", label: "Echocardiogram", value: "Ejection fraction 28%, global hypokinesis, moderate mitral regurgitation", triggerActionCode: "ORDER_ECHO" },
  ],

  actionRules: [
    { actionCode: "EXAM_CARDIOPULMONARY", classification: "REQUIRED", resultText: "Jugular venous pressure elevated to the angle of the jaw, bibasilar crackles, S3 gallop, two plus pitting edema to the knees.", feedbackText: "The volume examination is the diagnosis here. Jugular venous pressure is the single most useful bedside measure of filling pressure.", conceptCode: "CARD.HF.01" },
    { actionCode: "GIVE_LOOP_DIURETIC", classification: "REQUIRED", resultText: "Intravenous furosemide given. Urine output 1.4 L over the next six hours with improved orthopnea.", feedbackText: "Intravenous loop diuretics are the cornerstone of acute decongestion; oral absorption is unreliable in a congested gut.", conceptCode: "CARD.HF.02" },
    { actionCode: "ORDER_BMP", classification: "REQUIRED", resultText: "Sodium 134, potassium 3.9, creatinine 1.3 (baseline 1.1), bicarbonate 26.", feedbackText: "Electrolytes and renal function must be followed at least daily during aggressive diuresis.", conceptCode: "CARD.HF.03" },
    { actionCode: "ORDER_CXR", classification: "REQUIRED", resultText: "Cardiomegaly with pulmonary vascular congestion and small bilateral pleural effusions.", feedbackText: "The radiograph confirms congestion and screens for pneumonia as an alternative explanation.", conceptCode: "CARD.HF.01" },
    { actionCode: "GIVE_OXYGEN", classification: "APPROPRIATE", resultText: "Two liters by nasal cannula; saturation improves to 95%.", feedbackText: "Supplemental oxygen is given for hypoxemia, not routinely for dyspnea alone." },
    { actionCode: "ORDER_BNP", classification: "APPROPRIATE", resultText: "BNP 1840 pg/mL.", feedbackText: "Natriuretic peptides help when the cause of dyspnea is genuinely uncertain.", conceptCode: "CARD.HF.01" },
    { actionCode: "ORDER_ECHO", classification: "APPROPRIATE", resultText: "Ejection fraction 28%, global hypokinesis, moderate mitral regurgitation.", feedbackText: "Reassessing ventricular function guides which chronic therapies apply.", conceptCode: "CARD.HF.04" },
    { actionCode: "ORDER_ECG", classification: "APPROPRIATE", resultText: "Sinus rhythm with old anterior Q waves. No acute ischemic changes.", feedbackText: "Ischemia and arrhythmia are common precipitants of decompensation." },
    { actionCode: "ORDER_TROPONIN", classification: "APPROPRIATE", resultText: "Troponin 0.03 ng/mL, not rising.", feedbackText: "A flat troponin argues against an acute ischemic precipitant." },
    { actionCode: "HX_MEDICATIONS", classification: "REQUIRED", resultText: "He ran out of his diuretic ten days ago and has been eating canned soup daily.", feedbackText: "Medication nonadherence and dietary sodium are the two most common precipitants, and both are addressable before discharge.", conceptCode: "CARD.HF.04" },
    { actionCode: "GIVE_POTASSIUM", classification: "APPROPRIATE", resultText: "Potassium repleted to 4.2 during diuresis.", feedbackText: "Loop diuretics waste potassium and magnesium; both need active repletion.", conceptCode: "CARD.HF.03" },
    { actionCode: "GIVE_IV_FLUIDS", classification: "CONTRAINDICATED", resultText: "Intravenous fluids worsen his congestion. Oxygen requirement increases and crackles extend upward.", feedbackText: "This patient is volume overloaded. Giving fluid adds to the problem you are trying to treat.", conceptCode: "CARD.HF.01" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "He is still hypoxemic and volume overloaded. Discharge now would guarantee readmission.", feedbackText: "Discharge requires near-euvolemia, stable renal function and an oral regimen he tolerates.", conceptCode: "CARD.HF.02" },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "UNNECESSARY", resultText: "No infiltrate, no fever, no leukocytosis. Antibiotics are not indicated.", feedbackText: "Crackles in decompensated heart failure are congestion, not pneumonia, when there is no infiltrate or fever." },
    { actionCode: "ORDER_CTA_CHEST", classification: "UNNECESSARY", resultText: "No pulmonary embolism identified.", feedbackText: "The clinical picture is fully explained by volume overload." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "adhf", text: "Acute decompensated heart failure with volume overload" },
        { key: "pna", text: "Community-acquired pneumonia" },
        { key: "copd", text: "COPD exacerbation" },
        { key: "pe", text: "Acute pulmonary embolism" },
      ], correctKey: "adhf" },
      correctFeedback: "Correct. Elevated jugular venous pressure, an S3, peripheral edema, weight gain and radiographic congestion make this volume overload.",
      incorrectFeedback: "Elevated jugular venous pressure with an S3, edema and weight gain point to congestion rather than a primary pulmonary or infectious process.",
      conceptCode: "CARD.HF.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "tele", text: "Admit to a monitored bed for intravenous diuresis" },
        { key: "icu", text: "Admit to the intensive care unit for intubation" },
        { key: "home", text: "Discharge with an increased oral diuretic dose" },
        { key: "obs", text: "Observation with oral diuretics only" },
      ], correctKey: "tele" },
      correctFeedback: "Correct. He needs intravenous diuresis with monitoring, but he is not in respiratory failure.",
      incorrectFeedback: "He is hypoxemic and markedly congested, so he needs admission for intravenous therapy — but he is protecting his airway and does not need intensive care.",
      conceptCode: "CARD.HF.02",
    },
    {
      stage: "ROUNDS",
      promptText: "How do you assess whether he is responding to diuresis?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Daily standing weights, strict intake and output, and serial examination of jugular venous pressure and oxygen requirement" },
        { key: "b", text: "A repeat BNP every six hours" },
        { key: "c", text: "A daily chest radiograph" },
        { key: "d", text: "A repeat echocardiogram each morning" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Weight, intake and output, and the bedside volume examination are the practical measures that guide dosing.",
      incorrectFeedback: "Repeated imaging and biomarkers lag behind the clinical picture. Weights, intake and output, and the physical examination guide diuresis.",
      conceptCode: "CARD.HF.02",
    },
    {
      stage: "ROUNDS",
      promptText: "What must be monitored during aggressive diuresis?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Serum potassium, magnesium and renal function" },
        { key: "b", text: "Serum troponin every eight hours" },
        { key: "c", text: "Liver enzymes twice daily" },
        { key: "d", text: "Serum lipase daily" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Loop diuretics deplete potassium and magnesium, and over-diuresis raises creatinine.",
      incorrectFeedback: "The predictable harms of loop diuresis are electrolyte depletion and worsening renal function, so those are what you follow.",
      conceptCode: "CARD.HF.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Which class of chronic therapy reduces mortality in heart failure with reduced ejection fraction?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Neurohormonal blockade — renin-angiotensin system inhibition, evidence-based beta blockade and mineralocorticoid receptor antagonism" },
        { key: "b", text: "Loop diuretics at the highest tolerated dose" },
        { key: "c", text: "Long-term supplemental oxygen" },
        { key: "d", text: "Chronic intravenous inotropes for all patients" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Diuretics treat symptoms; neurohormonal blockade is what extends survival.",
      incorrectFeedback: "Loop diuretics make patients feel better but do not prolong life. The mortality benefit belongs to neurohormonal blockade.",
      conceptCode: "CARD.HF.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "He is near his dry weight on room air. What is essential before he goes home?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Transition to an oral diuretic he can obtain, optimize guideline-directed therapy, daily weight instructions, sodium counseling and early follow-up" },
        { key: "b", text: "A prescription for supplemental oxygen at home" },
        { key: "c", text: "A repeat echocardiogram in 48 hours" },
        { key: "d", text: "Instructions to restrict all fluid to 500 mL per day indefinitely" },
      ], correctKey: "a" },
      correctFeedback: "Correct. His admission was precipitated by running out of a diuretic and eating high-sodium food — the discharge plan has to fix both.",
      incorrectFeedback: "The discharge plan must address why he decompensated: medication access, sodium intake, weight monitoring and prompt follow-up.",
      conceptCode: "CARD.HF.04",
    },
  ],
};
