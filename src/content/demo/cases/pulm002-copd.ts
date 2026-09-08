/** DEMO CASE 05 — Acute COPD exacerbation. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_PULM_002: CaseTemplateInput = {
  code: "DEMO-PULM-002",
  title: "Acute COPD Exacerbation",
  specialty: "Internal Medicine",
  topic: "Pulmonology",
  primaryDiagnosis: "Acute exacerbation of chronic obstructive pulmonary disease",
  difficulty: 3,
  step3Importance: 4,

  handoffScript:
    "This is a 65-year-old man with a 45 pack-year smoking history and known chronic obstructive pulmonary disease, admitted overnight with three days of worsening breathlessness, wheezing, and increased sputum that has turned yellow. On arrival he was tachypneic at 28 with diffuse wheeze and a prolonged expiratory phase. His saturation was 84 percent on room air. He was given nebulized albuterol and ipratropium, systemic steroids, and an antibiotic. His blood gas showed a pH of 7.33 with a carbon dioxide of 54. He improved with treatment and did not require noninvasive ventilation. He is now on one to two liters of oxygen with saturations of 90 to 92 percent. Watch him closely for fatigue and rising carbon dioxide.",
  dailySignout:
    "65-year-old man with COPD exacerbation on scheduled bronchodilators, systemic steroids and antibiotics. Oxygen titrated to a saturation target of 88 to 92 percent. No noninvasive ventilation required overnight.",
  admissionOpening:
    "A 65-year-old man with a long smoking history presents with three days of worsening shortness of breath and wheezing. He is speaking in short phrases and using his accessory muscles.",
  teachingPoint:
    "In COPD the oxygen target is deliberately modest — 88 to 92 percent. Driving the saturation to 100 percent can worsen carbon dioxide retention. Watch the pH, not just the saturation.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "PULM.COPD.01", weight: 1 },
    { code: "PULM.COPD.02", weight: 1 },
    { code: "PULM.COPD.03", weight: 1 },
    { code: "PULM.COPD.04", weight: 1 },
    { code: "PULM.COPD.05", weight: 0.8 },
  ],

  findings: [
    { category: "VITAL", label: "Temperature", value: "37.2", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "108", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "142/86", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "28", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "84% on room air", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Three days of worsening dyspnea, wheeze and increased purulent sputum", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "COPD with two exacerbations in the past year. 45 pack-year smoking history, still smoking.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "Uses an albuterol inhaler only. No maintenance inhaler. Poor inhaler technique on demonstration.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Diffuse expiratory wheeze with prolonged expiratory phase, decreased air movement, accessory muscle use", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "EXAM", label: "General appearance", value: "Sitting forward, speaking in short phrases, alert and oriented", triggerActionCode: "EXAM_GENERAL" },
    { category: "LAB", label: "Arterial blood gas", value: "pH 7.33, pCO2 54, pO2 58, bicarbonate 28", triggerActionCode: "ORDER_ABG" },
    { category: "IMAGING", label: "Chest radiograph", value: "Hyperinflation with flattened diaphragms. No infiltrate or pneumothorax.", triggerActionCode: "ORDER_CXR" },
    { category: "LAB", label: "Complete blood count", value: "White count 11.2, hemoglobin 15.8, platelets 244", triggerActionCode: "ORDER_CBC" },
    { category: "ECG", label: "12-lead ECG", value: "Sinus tachycardia. No ischemic changes.", triggerActionCode: "ORDER_ECG" },
  ],

  actionRules: [
    { actionCode: "GIVE_BRONCHODILATOR", classification: "REQUIRED", resultText: "Nebulized albuterol and ipratropium given. Air movement improves and the respiratory rate falls to 22.", feedbackText: "Inhaled short-acting bronchodilators are the immediate first-line therapy in an exacerbation.", conceptCode: "PULM.COPD.01" },
    { actionCode: "GIVE_STEROID", classification: "REQUIRED", resultText: "Systemic corticosteroid given.", feedbackText: "A short course of systemic corticosteroid shortens recovery and reduces treatment failure.", conceptCode: "PULM.COPD.02" },
    { actionCode: "GIVE_OXYGEN", classification: "REQUIRED", resultText: "Oxygen titrated to a target saturation of 88 to 92 percent; he settles at 90% on 1.5 L.", feedbackText: "Oxygen is titrated to a modest target in COPD rather than maximized.", conceptCode: "PULM.COPD.03" },
    { actionCode: "ORDER_ABG", classification: "REQUIRED", resultText: "pH 7.33, pCO2 54, pO2 58, bicarbonate 28.", feedbackText: "The blood gas identifies respiratory acidosis, which is what decides whether noninvasive ventilation is needed.", conceptCode: "PULM.COPD.04" },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "APPROPRIATE", resultText: "Antibiotic started for increased sputum purulence and volume with worsened dyspnea.", feedbackText: "Antibiotics are indicated when the cardinal symptoms — increased dyspnea, sputum volume and sputum purulence — are present.", conceptCode: "PULM.COPD.05" },
    { actionCode: "ORDER_CXR", classification: "APPROPRIATE", resultText: "Hyperinflation with flattened diaphragms. No infiltrate or pneumothorax.", feedbackText: "The radiograph excludes pneumonia and pneumothorax as alternative explanations." },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "White count 11.2, hemoglobin 15.8, platelets 244.", feedbackText: "Secondary polycythemia is common in chronic hypoxemia." },
    { actionCode: "ORDER_ECG", classification: "APPROPRIATE", resultText: "Sinus tachycardia. No ischemic changes.", feedbackText: "Useful to screen for arrhythmia and ischemia contributing to dyspnea." },
    { actionCode: "GIVE_NONINVASIVE_VENTILATION", classification: "APPROPRIATE", resultText: "Noninvasive ventilation is available and would be started if his pH falls further or he tires. He improved on bronchodilators and did not require it tonight.", feedbackText: "Noninvasive ventilation is indicated for respiratory acidosis or severe dyspnea with increased work of breathing, and it reduces the need for intubation.", conceptCode: "PULM.COPD.04" },
    { actionCode: "ADMIT_FLOOR", classification: "REQUIRED", resultText: "Admitted to a monitored medical bed with respiratory therapy following.", feedbackText: "He needs inpatient bronchodilator therapy and close observation for fatigue.", conceptCode: "PULM.COPD.04" },
    { actionCode: "GIVE_VACCINATION", classification: "APPROPRIATE", resultText: "Influenza and pneumococcal vaccination ordered; smoking cessation counseling and pharmacotherapy offered.", feedbackText: "Smoking cessation is the single intervention that most changes the natural history of COPD.", conceptCode: "PULM.COPD.05" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "He remains tachypneic with respiratory acidosis and an oxygen requirement above baseline. Discharge would be unsafe.", feedbackText: "Discharge requires return toward his baseline function and oxygen requirement with a tolerated oral regimen.", conceptCode: "PULM.COPD.04" },
    { actionCode: "GIVE_BENZODIAZEPINE", classification: "CONTRAINDICATED", resultText: "Sedation in a patient with rising carbon dioxide blunts respiratory drive and risks precipitating respiratory failure.", feedbackText: "Anxiolysis is tempting in a breathless patient but dangerous in hypercapnic respiratory failure.", conceptCode: "PULM.COPD.04" },
    { actionCode: "ORDER_CTA_CHEST", classification: "OPTIONAL", resultText: "No pulmonary embolism identified. Emphysematous changes noted.", feedbackText: "Reasonable only when the presentation is atypical for an exacerbation; pretest probability here is low." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "copd", text: "Acute exacerbation of chronic obstructive pulmonary disease" },
        { key: "cap", text: "Community-acquired pneumonia" },
        { key: "adhf", text: "Acute decompensated heart failure" },
        { key: "ptx", text: "Spontaneous pneumothorax" },
      ], correctKey: "copd" },
      correctFeedback: "Correct. Known COPD with increased dyspnea, sputum volume and purulence, diffuse wheeze and hyperinflation without an infiltrate.",
      incorrectFeedback: "There is no infiltrate and no congestion. Diffuse wheeze with the three cardinal symptoms in a known smoker defines a COPD exacerbation.",
      conceptCode: "PULM.COPD.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What oxygen target should be used?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Titrate to a saturation of 88 to 92 percent" },
        { key: "b", text: "Titrate to a saturation of 100 percent" },
        { key: "c", text: "Withhold oxygen entirely to preserve respiratory drive" },
        { key: "d", text: "Give high-flow oxygen at 15 liters by nonrebreather for everyone" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Excess oxygen worsens hypercapnia in COPD, and withholding it altogether causes hypoxemic harm.",
      incorrectFeedback: "The target is deliberately modest: enough to correct dangerous hypoxemia, not so much that carbon dioxide climbs.",
      conceptCode: "PULM.COPD.03",
    },
    {
      stage: "ROUNDS",
      promptText: "When is noninvasive positive pressure ventilation appropriate in this patient?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "When he has respiratory acidosis or severe dyspnea with increased work of breathing, and he can protect his airway" },
        { key: "b", text: "Only after he has already been intubated" },
        { key: "c", text: "In every COPD exacerbation regardless of blood gas" },
        { key: "d", text: "Only when the oxygen saturation falls below 70 percent" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Noninvasive ventilation used early in respiratory acidosis reduces intubation rates and mortality.",
      incorrectFeedback: "The trigger is respiratory acidosis or severe work of breathing in a patient who can protect the airway — not saturation alone.",
      conceptCode: "PULM.COPD.04",
    },
    {
      stage: "ROUNDS",
      promptText: "Which findings suggest impending respiratory failure?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A quiet chest with poor air movement, rising carbon dioxide, falling pH, somnolence and paradoxical abdominal motion" },
        { key: "b", text: "Loud diffuse wheeze throughout both lung fields" },
        { key: "c", text: "A respiratory rate that falls from 28 to 22 as the patient improves clinically" },
        { key: "d", text: "A single episode of coughing productive of yellow sputum" },
      ], correctKey: "a" },
      correctFeedback: "Correct. A silent chest means air is not moving. Loud wheeze at least means ventilation is occurring.",
      incorrectFeedback: "The worrying signs are the quiet ones: diminished air movement, hypercapnia with acidosis, and a patient who is becoming sleepy.",
      conceptCode: "PULM.COPD.04",
    },
    {
      stage: "ROUNDS",
      promptText: "What preventive intervention most changes his long-term course?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Smoking cessation, supported with counseling and pharmacotherapy" },
        { key: "b", text: "Long-term daily oral corticosteroids" },
        { key: "c", text: "Chronic prophylactic antibiotics for all patients" },
        { key: "d", text: "Annual chest radiographs" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Cessation is the only intervention that meaningfully slows the decline in lung function.",
      incorrectFeedback: "Chronic systemic steroids cause harm without benefit here. Smoking cessation is what alters the trajectory of the disease.",
      conceptCode: "PULM.COPD.05",
    },
    {
      stage: "DISCHARGE",
      promptText: "He is back to his baseline oxygen requirement. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A maintenance inhaler regimen with technique taught and confirmed, a steroid course, smoking cessation support, vaccination and early follow-up" },
        { key: "b", text: "An albuterol inhaler alone, as he has been using" },
        { key: "c", text: "Indefinite oral corticosteroids" },
        { key: "d", text: "A referral for lung transplantation evaluation for all exacerbations" },
      ], correctKey: "a" },
      correctFeedback: "Correct. He arrived with no maintenance inhaler and poor technique — leaving that unchanged guarantees the next admission.",
      incorrectFeedback: "The gap that brought him in was the absence of maintenance therapy and poor inhaler technique. The discharge plan has to close it.",
      conceptCode: "PULM.COPD.05",
    },
  ],
};
