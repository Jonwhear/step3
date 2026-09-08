/** DEMO CASE 20 — Anaphylaxis. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_EM_002: CaseTemplateInput = {
  code: "DEMO-EM-002",
  title: "Anaphylaxis",
  specialty: "Emergency Medicine",
  topic: "Allergy",
  primaryDiagnosis: "Anaphylaxis",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "This is a 38-year-old man who came in by ambulance after eating at a restaurant. Within about ten minutes of the meal he developed diffuse hives, wheezing, swelling of his lips and tongue, and felt faint. His blood pressure on arrival was 84 over 52 with a heart rate of 124 and audible wheeze. He was given intramuscular epinephrine in the anterolateral thigh immediately, followed by intravenous fluids, and he received an antihistamine and a corticosteroid as adjuncts. His blood pressure came up to 112 over 70 after the epinephrine and a fluid bolus, and his wheeze and tongue swelling have largely resolved. He is being observed for a biphasic reaction. He has never had a reaction like this before and does not have an epinephrine autoinjector.",
  dailySignout:
    "38-year-old man with food-triggered anaphylaxis, responded to intramuscular epinephrine and fluids. Airway swelling and wheeze resolved, blood pressure normalized. Under observation for biphasic reaction.",
  admissionOpening:
    "A 38-year-old man is brought in by ambulance minutes after eating at a restaurant. He has hives all over his torso, audible wheeze, swelling of his lips and tongue, and he says he feels like he is going to pass out.",
  teachingPoint:
    "Epinephrine is the only drug that treats anaphylaxis. Antihistamines and steroids treat the hives and may reduce a late reaction, but they do nothing for the airway or the blood pressure — and giving them first is the classic fatal delay.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "EM.ANA.01", weight: 1 },
    { code: "EM.ANA.02", weight: 1 },
    { code: "EM.ANA.03", weight: 1 },
    { code: "EM.ANA.04", weight: 1 },
    { code: "EM.ANA.05", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Blood pressure", value: "84/52", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "124", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "26", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "93% on room air", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Hives, wheeze, lip and tongue swelling and near-syncope minutes after eating", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "Ate a dish that likely contained tree nuts. Mild oral itching with nuts in the past but never a systemic reaction. No epinephrine autoinjector.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "General appearance", value: "Diffuse urticaria over the trunk and arms, visible lip and tongue swelling, anxious and diaphoretic", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Diffuse expiratory wheeze, tachycardic, no stridor at rest but voice is slightly muffled", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "LAB", label: "Basic metabolic panel", value: "Sodium 140, potassium 3.9, creatinine 1.0, bicarbonate 22", triggerActionCode: "ORDER_BMP" },
    { category: "ECG", label: "12-lead ECG", value: "Sinus tachycardia without ischemic changes", triggerActionCode: "ORDER_ECG" },
  ],

  actionRules: [
    { actionCode: "GIVE_EPINEPHRINE_IM", classification: "REQUIRED", resultText: "Intramuscular epinephrine given into the anterolateral thigh. Within five minutes the wheeze diminishes, tongue swelling begins to recede, and blood pressure rises to 104/64.", feedbackText: "Intramuscular epinephrine into the thigh is first-line and is given immediately. Delay is the single most important predictor of a fatal outcome.", conceptCode: "EM.ANA.02" },
    { actionCode: "EXAM_GENERAL", classification: "REQUIRED", resultText: "Diffuse urticaria, visible lip and tongue swelling, anxious and diaphoretic, muffled voice.", feedbackText: "Rapid multisystem involvement after an exposure is the diagnosis; no test is required.", conceptCode: "EM.ANA.01" },
    { actionCode: "EXAM_CARDIOPULMONARY", classification: "REQUIRED", resultText: "Diffuse expiratory wheeze, tachycardic, no stridor at rest but the voice is slightly muffled.", feedbackText: "A muffled voice, tongue swelling or stridor signals a threatened airway that can close quickly.", conceptCode: "EM.ANA.03" },
    { actionCode: "GIVE_IV_FLUIDS", classification: "REQUIRED", resultText: "Intravenous crystalloid bolus given. Blood pressure improves further to 112/70.", feedbackText: "Massive capillary leak causes distributive shock; fluid supports the circulation alongside epinephrine.", conceptCode: "EM.ANA.02" },
    { actionCode: "GIVE_OXYGEN", classification: "APPROPRIATE", resultText: "Supplemental oxygen given; saturation improves to 98%.", feedbackText: "Given for hypoxemia while the reaction is treated." },
    { actionCode: "GIVE_ANTIHISTAMINE", classification: "APPROPRIATE", resultText: "Antihistamine given as an adjunct after epinephrine. Urticaria and itching improve over the following hour.", feedbackText: "Antihistamines relieve cutaneous symptoms only. They are adjunctive and never a substitute for epinephrine.", conceptCode: "EM.ANA.04" },
    { actionCode: "GIVE_STEROID", classification: "APPROPRIATE", resultText: "Corticosteroid given as an adjunct.", feedbackText: "Steroids have a slow onset and no role in the acute reversal of anaphylaxis; they are given as an adjunct only.", conceptCode: "EM.ANA.04" },
    { actionCode: "GIVE_BRONCHODILATOR", classification: "APPROPRIATE", resultText: "Nebulized bronchodilator given for persistent wheeze after epinephrine.", feedbackText: "An adjunct for bronchospasm that persists after epinephrine." },
    { actionCode: "ADMIT_OBSERVATION", classification: "REQUIRED", resultText: "Observed for a biphasic reaction, which can occur hours after apparent resolution.", feedbackText: "Biphasic reactions occur in a minority of patients and can be severe, so a period of observation is standard.", conceptCode: "EM.ANA.05" },
    { actionCode: "GIVE_VACCINATION", classification: "OPTIONAL", resultText: "Not applicable to this presentation.", feedbackText: "Preventive counseling here means allergen avoidance and autoinjector training rather than vaccination." },
    { actionCode: "ORDER_BMP", classification: "OPTIONAL", resultText: "Sodium 140, potassium 3.9, creatinine 1.0, bicarbonate 22.", feedbackText: "Laboratory studies do not diagnose anaphylaxis and must never delay epinephrine." },
    { actionCode: "ORDER_ECG", classification: "OPTIONAL", resultText: "Sinus tachycardia without ischemic changes.", feedbackText: "Reasonable in older patients or after epinephrine, but not part of the diagnosis." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "Discharging immediately after the reaction, without observation and without an epinephrine autoinjector, risks a fatal biphasic reaction at home.", feedbackText: "Observation plus an autoinjector, an action plan and allergy follow-up are mandatory before discharge.", conceptCode: "EM.ANA.05" },
    { actionCode: "ORDER_CT_HEAD", classification: "UNNECESSARY", resultText: "No acute intracranial abnormality.", feedbackText: "The near-syncope is from distributive shock, not an intracranial process." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the first medication to give?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Intramuscular epinephrine into the anterolateral thigh" },
        { key: "b", text: "Intravenous diphenhydramine" },
        { key: "c", text: "Intravenous methylprednisolone" },
        { key: "d", text: "Nebulized albuterol" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Epinephrine reverses the airway edema, bronchospasm and vasodilatory shock. Nothing else does.",
      incorrectFeedback: "Antihistamines, steroids and bronchodilators are adjuncts. Giving them first is the delay that kills people in anaphylaxis.",
      conceptCode: "EM.ANA.02",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "obs", text: "Observation for a biphasic reaction before discharge with an autoinjector" },
        { key: "home", text: "Immediate discharge once the hives fade" },
        { key: "icu", text: "Intensive care admission for all patients with anaphylaxis" },
        { key: "floor", text: "Admit for a week of intravenous steroids" },
      ], correctKey: "obs" },
      correctFeedback: "Correct. He responded well, but a biphasic reaction can occur hours later, so observation precedes a well-equipped discharge.",
      incorrectFeedback: "He responded to a single dose of epinephrine, so intensive care is not required; but immediate discharge before an observation period is unsafe.",
      conceptCode: "EM.ANA.05",
    },
    {
      stage: "ROUNDS",
      promptText: "Which medications are adjunctive only in anaphylaxis?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Antihistamines and corticosteroids" },
        { key: "b", text: "Epinephrine" },
        { key: "c", text: "Intravenous fluids in a hypotensive patient" },
        { key: "d", text: "Supplemental oxygen in a hypoxemic patient" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Antihistamines treat the skin and steroids act too slowly to matter acutely.",
      incorrectFeedback: "Epinephrine, fluids and oxygen are core resuscitation. Antihistamines and steroids are the adjuncts.",
      conceptCode: "EM.ANA.04",
    },
    {
      stage: "ROUNDS",
      promptText: "Which findings suggest the airway is threatened?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Stridor, a muffled or hoarse voice, tongue or oropharyngeal swelling, and difficulty handling secretions" },
        { key: "b", text: "Urticaria on the trunk" },
        { key: "c", text: "A heart rate of 124" },
        { key: "d", text: "Nausea after the meal" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Voice change and tongue swelling mean the airway is narrowing, and it can close faster than you can prepare for it.",
      incorrectFeedback: "Skin findings and tachycardia are not airway findings. Voice change, stridor and tongue swelling are.",
      conceptCode: "EM.ANA.03",
    },
    {
      stage: "ROUNDS",
      promptText: "What defines anaphylaxis clinically?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Rapid onset of illness with involvement of two or more organ systems after a likely allergen, or hypotension after exposure to a known allergen" },
        { key: "b", text: "Urticaria alone, without other findings" },
        { key: "c", text: "A positive skin test to a food allergen" },
        { key: "d", text: "An elevated serum tryptase level, which is required for the diagnosis" },
      ], correctKey: "a" },
      correctFeedback: "Correct. It is a clinical diagnosis made at the bedside — no laboratory test is required, and waiting for one causes harm.",
      incorrectFeedback: "Tryptase may support the diagnosis retrospectively but is never required. Anaphylaxis is diagnosed clinically and treated immediately.",
      conceptCode: "EM.ANA.01",
    },
    {
      stage: "DISCHARGE",
      promptText: "He has been observed without a biphasic reaction. What must he receive at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Two epinephrine autoinjectors with training in their use, a written action plan, allergen avoidance counseling and allergy referral" },
        { key: "b", text: "A prescription for oral antihistamines alone" },
        { key: "c", text: "A prescription for oral steroids alone" },
        { key: "d", text: "No prescription, since the reaction has resolved" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The next reaction may be faster and more severe. He needs epinephrine in hand, training to use it, and a plan.",
      incorrectFeedback: "Antihistamines and steroids will not save him from a second reaction. He needs epinephrine autoinjectors, training, an action plan and allergy follow-up.",
      conceptCode: "EM.ANA.05",
    },
  ],
};
