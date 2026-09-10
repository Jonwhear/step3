/** DEMO CASE 04 — Community-acquired pneumonia. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_PULM_001: CaseTemplateInput = {
  code: "DEMO-PULM-001",
  title: "Community-Acquired Pneumonia",
  specialty: "Internal Medicine",
  topic: "Pulmonology",
  primaryDiagnosis: "Community-acquired pneumonia",
  difficulty: 2,
  step3Importance: 5,

  handoffScript:
    "Next is a 72-year-old woman admitted overnight with community-acquired pneumonia. She presented with two days of fever, productive cough and increasing shortness of breath. In the emergency department her temperature was 38.6, heart rate 104, and her oxygen saturation was 88 percent on room air. Chest radiograph showed a right lower lobe infiltrate. Blood cultures were drawn and she was started on ceftriaxone and azithromycin. She is currently requiring two liters of oxygen by nasal cannula with saturations around 95 percent. She is eating and drinking. Today the questions are whether she can come off oxygen, when to switch to oral antibiotics, and what she needs for prevention before she leaves.",
  dailySignout:
    "72-year-old woman with community-acquired pneumonia, right lower lobe infiltrate, on ceftriaxone and azithromycin. Still requiring two liters of oxygen. Afebrile since yesterday evening, eating well.",
  admissionOpening:
    "A 72-year-old woman presents with two days of fever, productive cough and worsening shortness of breath. She looks tired but is speaking in full sentences.",
  teachingPoint:
    "Pneumonia management is three separate decisions made in sequence: does she have pneumonia, how sick is she (which sets the site of care), and what empiric coverage does that site of care demand.",

  minimumRoundsBeforeDischarge: 2,

  patientAgeYears: 72,
  patientSex: "F",
  chiefComplaint: "Fever, productive cough and shortness of breath",
  codeStatus: "Full code",
  allergies: "No known drug allergies",

  concepts: [
    { code: "PULM.CAP.01", weight: 1 },
    { code: "PULM.CAP.02", weight: 1 },
    { code: "PULM.CAP.03", weight: 1 },
    { code: "PULM.CAP.04", weight: 1 },
    { code: "PULM.CAP.05", weight: 0.6 },
  ],

  findings: [
    { category: "VITAL", label: "Temperature", value: "38.6", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "104", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "118/70", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "26", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "88% on room air", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Two days of fever, productive cough and shortness of breath", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Hypertension and osteoarthritis. Lives independently. No recent hospitalization or antibiotics.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Vaccination history", value: "No pneumococcal or influenza vaccination in the past five years.", triggerActionCode: "HX_SOCIAL" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Bronchial breath sounds and crackles at the right base with dullness to percussion", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "EXAM", label: "General appearance", value: "Alert and oriented, mildly tachypneic, no accessory muscle use", triggerActionCode: "EXAM_GENERAL" },
    { category: "LAB", label: "Blood cultures", value: "Two sets drawn before antibiotics; no growth at 48 hours", triggerActionCode: "ORDER_BLOOD_CULTURES", clinicalRole: "KEY_NEGATIVE" },
  ],

  labs: [
    { labCode: "WBC", value: "16.4", triggerActionCode: "ORDER_CBC", collectedLabel: "On arrival", clinicalRole: "KEY_POSITIVE" },
    { labCode: "NEUT_PCT", value: "84", triggerActionCode: "ORDER_CBC", collectedLabel: "On arrival", clinicalRole: "KEY_POSITIVE" },
    { labCode: "HGB", value: "12.8", triggerActionCode: "ORDER_CBC", collectedLabel: "On arrival" },
    { labCode: "PLT", value: "310", triggerActionCode: "ORDER_CBC", collectedLabel: "On arrival" },
    { labCode: "NA", value: "136", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival" },
    { labCode: "K", value: "4.1", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival" },
    { labCode: "BUN", value: "22", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival", clinicalRole: "CONTEXT" },
    { labCode: "CR", value: "1.0", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival", clinicalRole: "KEY_NEGATIVE" },
    { labCode: "GLU", value: "108", triggerActionCode: "ORDER_BMP", collectedLabel: "On arrival", clinicalRole: "DISTRACTOR" },
    { labCode: "LACTATE", value: "1.6", triggerActionCode: "ORDER_LACTATE", collectedLabel: "On arrival", clinicalRole: "KEY_NEGATIVE" },
  ],

  imaging: [
    {
      studyName: "Chest radiograph, PA and lateral",
      modality: "XRAY",
      performedLabel: "Emergency department, on arrival",
      impression:
        "Dense right lower lobe consolidation consistent with pneumonia. No pleural effusion or pneumothorax.",
      findingsText:
        "There is dense airspace consolidation in the right lower lobe with air bronchograms. The left lung is clear. No pleural effusion. Cardiomediastinal silhouette is normal in size and contour. No pneumothorax.",
      triggerActionCode: "ORDER_CXR",
      clinicalRole: "KEY_POSITIVE",
    },
  ],

  problems: [
    {
      label: "Community-acquired pneumonia",
      assessmentText:
        "72-year-old with fever, productive cough, hypoxaemia and a right lower lobe consolidation. CURB-65 supports inpatient management.",
      isPrimary: true,
      conceptCode: "PULM.CAP.01",
      options: [
        { label: "Blood cultures before antibiotics", classification: "REQUIRED", actionCode: "ORDER_BLOOD_CULTURES", feedbackText: "Drawn first when it does not delay therapy." },
        { label: "Empiric ceftriaxone plus azithromycin", classification: "REQUIRED", actionCode: "GIVE_ANTIBIOTICS", feedbackText: "Standard inpatient, non-ICU coverage including atypicals." },
        { label: "Chest radiograph", classification: "REQUIRED", actionCode: "ORDER_CXR", feedbackText: "Confirms the diagnosis and defines the extent." },
        { label: "Supplemental oxygen to maintain saturation above 92%", classification: "REQUIRED", feedbackText: "She was 88% on room air on arrival." },
        { label: "Assess severity to set the site of care", classification: "REQUIRED", feedbackText: "Severity scoring is what decides ward versus ICU versus home." },
        { label: "Serum lactate", classification: "APPROPRIATE", actionCode: "ORDER_LACTATE", feedbackText: "Reasonable given fever and tachycardia." },
        { label: "Switch to oral therapy once clinically stable and afebrile", classification: "APPROPRIATE", feedbackText: "Stability, not a fixed number of intravenous days, drives the switch." },
        { label: "Routine CT chest", classification: "UNNECESSARY", feedbackText: "The radiograph already answered the question." },
        { label: "Antipseudomonal and MRSA coverage", classification: "UNNECESSARY", feedbackText: "No risk factors here; broadening adds toxicity without benefit." },
        { label: "Discharge home on arrival", classification: "CONTRAINDICATED", feedbackText: "She was hypoxaemic at 88% on room air." },
      ],
    },
    {
      label: "Hypoxaemic respiratory failure",
      assessmentText: "Requiring two litres by nasal cannula, improving.",
      options: [
        { label: "Titrate oxygen and trial room air when stable", classification: "REQUIRED", feedbackText: "Coming off oxygen is one of the discharge criteria." },
        { label: "Continuous pulse oximetry", classification: "APPROPRIATE", feedbackText: "Reasonable while still oxygen-dependent." },
        { label: "Intubation now", classification: "CONTRAINDICATED", feedbackText: "She is speaking in full sentences on low-flow oxygen." },
      ],
    },
    {
      label: "Preventive care",
      assessmentText: "Admission is an opportunity to close vaccination gaps before discharge.",
      options: [
        { label: "Pneumococcal vaccination per age-based schedule", classification: "REQUIRED", feedbackText: "Frequently missed, and the admission is the opportunity." },
        { label: "Influenza vaccination if in season", classification: "APPROPRIATE", feedbackText: "Same reasoning." },
        { label: "Defer all vaccination to primary care", classification: "UNNECESSARY", feedbackText: "This is how these get missed entirely." },
      ],
    },
  ],

  actionRules: [
    { actionCode: "ORDER_CXR", classification: "REQUIRED", resultText: "Dense right lower lobe consolidation. No pleural effusion.", feedbackText: "A radiographic infiltrate is what separates pneumonia from bronchitis, and it is required for the diagnosis.", conceptCode: "PULM.CAP.01" },
    { actionCode: "GIVE_CEFTRIAXONE", classification: "REQUIRED", resultText: "Ceftriaxone started.", feedbackText: "A beta-lactam covers typical pathogens including pneumococcus in the non-critically ill inpatient.", conceptCode: "PULM.CAP.03" },
    { actionCode: "GIVE_AZITHROMYCIN", classification: "REQUIRED", resultText: "Azithromycin added.", feedbackText: "A macrolide adds atypical coverage; the combination is standard empiric inpatient therapy.", conceptCode: "PULM.CAP.03" },
    { actionCode: "GIVE_OXYGEN", classification: "REQUIRED", resultText: "Two liters by nasal cannula; saturation improves from 88% to 95%.", feedbackText: "Hypoxemia is corrected first, and the ongoing oxygen requirement is one of the discharge criteria.", conceptCode: "PULM.CAP.02" },
    { actionCode: "ORDER_BLOOD_CULTURES", classification: "APPROPRIATE", resultText: "Two sets drawn before antibiotics; no growth at 48 hours.", feedbackText: "Cultures are reasonable in hospitalized pneumonia and should not delay antibiotics.", conceptCode: "PULM.CAP.03" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "White count 16.4 with left shift, hemoglobin 12.8, platelets 310.", feedbackText: "Supports the infectious diagnosis and contributes to severity assessment." },
    { actionCode: "ORDER_BMP", classification: "APPROPRIATE", resultText: "Sodium 136, creatinine 1.0, blood urea nitrogen 22, glucose 108.", feedbackText: "Blood urea nitrogen and renal function feed directly into severity scoring.", conceptCode: "PULM.CAP.02" },
    { actionCode: "ORDER_LACTATE", classification: "APPROPRIATE", resultText: "Lactate 1.6 mmol/L.", feedbackText: "A normal lactate argues against occult hypoperfusion." },
    { actionCode: "EXAM_CARDIOPULMONARY", classification: "REQUIRED", resultText: "Bronchial breath sounds and crackles at the right base with dullness to percussion.", feedbackText: "Focal findings localize the process and support the radiographic diagnosis.", conceptCode: "PULM.CAP.01" },
    { actionCode: "ADMIT_FLOOR", classification: "REQUIRED", resultText: "Admitted to a general medical bed with continuous pulse oximetry.", feedbackText: "She needs supplemental oxygen but has no organ failure or shock, so a general ward bed is appropriate.", conceptCode: "PULM.CAP.02" },
    { actionCode: "GIVE_VACCINATION", classification: "APPROPRIATE", resultText: "Pneumococcal and influenza vaccination ordered for administration before discharge.", feedbackText: "Hospitalization is a reliable opportunity to close vaccination gaps.", conceptCode: "PULM.CAP.05" },
    { actionCode: "ADMIT_ICU", classification: "UNNECESSARY", resultText: "She is normotensive with no organ failure and corrects readily on low-flow oxygen. Intensive care is not required.", feedbackText: "Intensive care is for shock, respiratory failure requiring ventilation, or multiple minor severity criteria.", conceptCode: "PULM.CAP.02" },
    { actionCode: "GIVE_STEROID", classification: "UNNECESSARY", resultText: "No indication for systemic corticosteroids in uncomplicated pneumonia without obstructive lung disease or shock.", feedbackText: "Steroids are not routine therapy for community-acquired pneumonia." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "She still requires supplemental oxygen and is febrile. Discharge now risks decompensation at home.", feedbackText: "Discharge requires clinical stability: afebrile, adequate oxygenation at her baseline, and tolerating oral intake.", conceptCode: "PULM.CAP.04" },
    { actionCode: "ORDER_CTA_CHEST", classification: "UNNECESSARY", resultText: "No pulmonary embolism. Right lower lobe consolidation again noted.", feedbackText: "The radiograph already explains her hypoxemia; there is no unexplained gap requiring further imaging." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "cap", text: "Community-acquired pneumonia" },
        { key: "hf", text: "Acute decompensated heart failure" },
        { key: "bronchitis", text: "Acute bronchitis" },
        { key: "pe", text: "Pulmonary embolism" },
      ], correctKey: "cap" },
      correctFeedback: "Correct. Fever, productive cough, focal examination findings and a lobar infiltrate on radiograph.",
      incorrectFeedback: "Fever with focal consolidation on chest radiograph is pneumonia; bronchitis has no infiltrate and heart failure gives bilateral congestion rather than lobar consolidation.",
      conceptCode: "PULM.CAP.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "floor", text: "Admit to a general medical floor bed" },
        { key: "icu", text: "Admit to the intensive care unit" },
        { key: "home", text: "Discharge home on oral antibiotics" },
        { key: "obs", text: "Observation unit with no antibiotics pending cultures" },
      ], correctKey: "floor" },
      correctFeedback: "Correct. Her hypoxemia requires admission, but she has no shock or respiratory failure.",
      incorrectFeedback: "An oxygen requirement rules out discharge; the absence of shock or ventilatory failure rules out intensive care.",
      conceptCode: "PULM.CAP.02",
    },
    {
      stage: "ROUNDS",
      promptText: "What parameters determine that she is ready for discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Afebrile with stable vital signs, adequate oxygenation at her baseline, and tolerating oral intake and medications" },
        { key: "b", text: "Complete clearing of the infiltrate on repeat chest radiograph" },
        { key: "c", text: "A normal white blood cell count" },
        { key: "d", text: "Negative blood cultures at five days" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Discharge is a clinical stability decision. Radiographic clearing lags weeks behind recovery.",
      incorrectFeedback: "Infiltrates take weeks to resolve radiographically. Discharge readiness is defined by clinical stability, not by imaging.",
      conceptCode: "PULM.CAP.04",
    },
    {
      stage: "ROUNDS",
      promptText: "When can intravenous antibiotics be switched to oral therapy?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Once she is clinically improving, hemodynamically stable, afebrile and able to absorb oral medication" },
        { key: "b", text: "Only after a full seven days of intravenous therapy" },
        { key: "c", text: "Only after blood cultures finalize as negative" },
        { key: "d", text: "Only after the infiltrate clears radiographically" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Early transition to oral therapy in an improving patient shortens the stay without worsening outcomes.",
      incorrectFeedback: "There is no fixed intravenous duration. The switch is driven by clinical improvement and a functioning gut.",
      conceptCode: "PULM.CAP.03",
    },
    {
      stage: "ROUNDS",
      promptText: "What preventive measures should be addressed during this admission?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Pneumococcal and influenza vaccination, and smoking cessation counseling if applicable" },
        { key: "b", text: "Long-term prophylactic antibiotics" },
        { key: "c", text: "A daily inhaled corticosteroid" },
        { key: "d", text: "Home supplemental oxygen for all patients after pneumonia" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Vaccination status is easy to close during an admission and easy to forget.",
      incorrectFeedback: "Prevention after pneumonia is vaccination and smoking cessation — not chronic antibiotics or inhaled steroids.",
      conceptCode: "PULM.CAP.05",
    },
    {
      stage: "DISCHARGE",
      promptText: "She is afebrile and saturating 95% on room air. What completes the discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "An oral antibiotic to complete the course, vaccination before she leaves, and a follow-up appointment with return precautions" },
        { key: "b", text: "A repeat chest radiograph before she leaves the building" },
        { key: "c", text: "Two more days of intravenous antibiotics regardless of her status" },
        { key: "d", text: "Home oxygen for one month" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Complete the antibiotic course orally, close the vaccination gap, and make follow-up explicit.",
      incorrectFeedback: "She meets clinical stability criteria. What remains is finishing the antibiotic course orally, vaccinating, and arranging follow-up.",
      conceptCode: "PULM.CAP.04",
    },
  ],
};
