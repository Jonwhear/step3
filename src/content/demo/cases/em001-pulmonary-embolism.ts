/** DEMO CASE 19 — Pulmonary embolism. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_EM_001: CaseTemplateInput = {
  code: "DEMO-EM-001",
  title: "Pulmonary Embolism",
  specialty: "Emergency Medicine",
  topic: "Cardiopulmonary",
  primaryDiagnosis: "Acute pulmonary embolism",
  difficulty: 4,
  step3Importance: 5,

  handoffScript:
    "This is a 54-year-old woman who is one week out from a total knee replacement and came in with sudden pleuritic chest pain and shortness of breath. Her heart rate was 108, blood pressure 124 over 78, respiratory rate 24, and her saturation was 92 percent on room air. Recent surgery and immobilization put her in a high pretest probability group, so we went straight to computed tomography pulmonary angiography rather than a D-dimer. It showed segmental pulmonary emboli in the right lower lobe with no evidence of right heart strain. Her troponin is normal. She was started on therapeutic anticoagulation. She is normotensive and comfortable on two liters of oxygen.",
  dailySignout:
    "54-year-old woman with segmental pulmonary embolism one week post knee arthroplasty. Hemodynamically stable, no right heart strain, on therapeutic anticoagulation. Oxygen requirement decreasing.",
  admissionOpening:
    "A 54-year-old woman presents with sudden pleuritic chest pain and shortness of breath that started this morning. She had a total knee replacement one week ago and has been mostly sitting since.",
  teachingPoint:
    "Pretest probability determines the test. In a high-probability patient, a D-dimer is the wrong test — it will not lower the probability enough to matter, and it delays the imaging you were always going to need.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "EM.PE.01", weight: 1 },
    { code: "EM.PE.02", weight: 1 },
    { code: "EM.PE.03", weight: 1 },
    { code: "EM.PE.04", weight: 1 },
    { code: "EM.PE.05", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "108", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "124/78", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "24", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "92% on room air", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "37.2", units: "C", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Sudden pleuritic chest pain and dyspnea", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "Total knee replacement one week ago with limited mobility since. No hemoptysis. No prior venous thromboembolism. Not on hormonal therapy.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Tachycardic with a regular rhythm, clear lung fields, no murmur, no jugular venous distension", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "EXAM", label: "Extremities", value: "Right knee surgical site healing well. Mild right calf swelling without erythema.", triggerActionCode: "EXAM_GENERAL" },
    { category: "IMAGING", label: "CT pulmonary angiography", value: "Segmental pulmonary emboli in the right lower lobe. No right ventricular enlargement.", triggerActionCode: "ORDER_CTA_CHEST" },
    { category: "ECG", label: "12-lead ECG", value: "Sinus tachycardia. No right heart strain pattern.", triggerActionCode: "ORDER_ECG" },
    { category: "LAB", label: "Troponin", value: "Undetectable", triggerActionCode: "ORDER_TROPONIN" },
    { category: "IMAGING", label: "Chest radiograph", value: "No infiltrate, no pneumothorax, no effusion", triggerActionCode: "ORDER_CXR" },
    { category: "IMAGING", label: "Lower extremity venous ultrasound", value: "Acute deep vein thrombosis in the right popliteal vein", triggerActionCode: "ORDER_LOWER_EXTREMITY_US" },
    { category: "IMAGING", label: "Echocardiogram", value: "Normal right ventricular size and function", triggerActionCode: "ORDER_ECHO" },
  ],

  actionRules: [
    { actionCode: "ORDER_CTA_CHEST", classification: "REQUIRED", resultText: "Segmental pulmonary emboli in the right lower lobe. No right ventricular enlargement.", feedbackText: "In a high pretest probability patient, proceed directly to definitive imaging.", conceptCode: "EM.PE.02" },
    { actionCode: "GIVE_HEPARIN", classification: "REQUIRED", resultText: "Therapeutic anticoagulation started.", feedbackText: "Anticoagulation is started promptly when suspicion is high and bleeding risk is acceptable, without waiting for imaging in a high-probability patient.", conceptCode: "EM.PE.03" },
    { actionCode: "GIVE_OXYGEN", classification: "REQUIRED", resultText: "Two liters by nasal cannula; saturation improves to 96%.", feedbackText: "Correct hypoxemia while diagnosis and treatment proceed." },
    { actionCode: "ORDER_ECG", classification: "APPROPRIATE", resultText: "Sinus tachycardia. No right heart strain pattern.", feedbackText: "Screens for alternative causes and for signs of right ventricular strain.", conceptCode: "EM.PE.04" },
    { actionCode: "ORDER_TROPONIN", classification: "APPROPRIATE", resultText: "Troponin undetectable.", feedbackText: "An elevated troponin with right ventricular dysfunction identifies intermediate-risk embolism.", conceptCode: "EM.PE.04" },
    { actionCode: "ORDER_ECHO", classification: "APPROPRIATE", resultText: "Normal right ventricular size and function.", feedbackText: "Right ventricular assessment is the core of risk stratification in normotensive patients.", conceptCode: "EM.PE.04" },
    { actionCode: "ORDER_CXR", classification: "APPROPRIATE", resultText: "No infiltrate, no pneumothorax, no effusion.", feedbackText: "Excludes alternative causes of pleuritic pain and dyspnea." },
    { actionCode: "ORDER_LOWER_EXTREMITY_US", classification: "APPROPRIATE", resultText: "Acute deep vein thrombosis in the right popliteal vein.", feedbackText: "Identifies the source and would support treatment if chest imaging were contraindicated.", conceptCode: "EM.PE.02" },
    { actionCode: "HX_ADDITIONAL", classification: "REQUIRED", resultText: "Total knee replacement one week ago with limited mobility since. No prior venous thromboembolism.", feedbackText: "The provoking factor determines pretest probability now and duration of anticoagulation later.", conceptCode: "EM.PE.01" },
    { actionCode: "ADMIT_TELEMETRY", classification: "REQUIRED", resultText: "Admitted to a monitored bed for anticoagulation and observation.", feedbackText: "Monitoring allows early detection of hemodynamic deterioration.", conceptCode: "EM.PE.04" },
    { actionCode: "ORDER_DDIMER", classification: "UNNECESSARY", resultText: "D-dimer elevated at 2,400 ng/mL — as expected one week after major orthopedic surgery. This result does not change management.", feedbackText: "D-dimer is a rule-out test for low and intermediate pretest probability. In a high-probability patient it cannot exclude the diagnosis and only delays imaging.", conceptCode: "EM.PE.01" },
    { actionCode: "GIVE_THROMBOLYSIS", classification: "CONTRAINDICATED", resultText: "She is normotensive with a normal right ventricle and normal troponin. Thrombolysis here adds major bleeding risk — particularly one week after surgery — with no benefit.", feedbackText: "Systemic thrombolysis is reserved for high-risk embolism, defined by hypotension or shock.", conceptCode: "EM.PE.04" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "She is hypoxemic and tachycardic with a new pulmonary embolism and no established anticoagulation plan.", feedbackText: "Immediate discharge is inappropriate before anticoagulation is established and risk is assessed.", conceptCode: "EM.PE.03" },
    { actionCode: "ORDER_CT_HEAD", classification: "UNNECESSARY", resultText: "No acute intracranial abnormality.", feedbackText: "No neurologic symptoms to justify this study." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "Given her recent surgery and immobilization, what is the correct diagnostic approach?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "High pretest probability, so proceed directly to CT pulmonary angiography" },
        { key: "b", text: "Send a D-dimer first and image only if it is elevated" },
        { key: "c", text: "Observe with serial ECGs and no imaging" },
        { key: "d", text: "Send her home with outpatient imaging next week" },
      ], correctKey: "a" },
      correctFeedback: "Correct. A D-dimer will be elevated after recent surgery regardless, and a negative result would not be low enough to rule out embolism in a high-probability patient.",
      incorrectFeedback: "D-dimer is a rule-out test for lower probability patients. Here it wastes time and cannot change the plan.",
      conceptCode: "EM.PE.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "tele", text: "Admit to a monitored bed on therapeutic anticoagulation" },
        { key: "icu", text: "Intensive care admission for thrombolysis" },
        { key: "home", text: "Discharge home with an oral anticoagulant and next-week follow-up" },
        { key: "obs", text: "Observation with no anticoagulation pending repeat imaging" },
      ], correctKey: "tele" },
      correctFeedback: "Correct. She is hypoxemic and tachycardic, so she needs monitored admission — but she is not high risk and needs no thrombolysis.",
      incorrectFeedback: "She is normotensive with a normal right ventricle, so intensive care and thrombolysis are not indicated; but hypoxemia and tachycardia argue against immediate discharge.",
      conceptCode: "EM.PE.04",
    },
    {
      stage: "ROUNDS",
      promptText: "What makes a pulmonary embolism high risk?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Hemodynamic instability — sustained hypotension, shock or cardiac arrest" },
        { key: "b", text: "Any clot visible on CT pulmonary angiography" },
        { key: "c", text: "An oxygen saturation below 95 percent" },
        { key: "d", text: "Any degree of pleuritic chest pain" },
      ], correctKey: "a" },
      correctFeedback: "Correct. High risk is defined hemodynamically, not by clot burden on the scan.",
      incorrectFeedback: "Clot burden and saturation do not define risk category. Sustained hypotension or shock does.",
      conceptCode: "EM.PE.04",
    },
    {
      stage: "ROUNDS",
      promptText: "When is systemic thrombolysis considered?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "In high-risk embolism with hemodynamic instability, when bleeding risk is acceptable" },
        { key: "b", text: "In every confirmed pulmonary embolism" },
        { key: "c", text: "In any patient with right ventricular strain regardless of blood pressure" },
        { key: "d", text: "Whenever the D-dimer is markedly elevated" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Thrombolysis is reserved for hemodynamic instability, where its bleeding risk is outweighed by mortality benefit.",
      incorrectFeedback: "Thrombolysis carries substantial bleeding risk, particularly after recent surgery. It is reserved for high-risk, hemodynamically unstable embolism.",
      conceptCode: "EM.PE.04",
    },
    {
      stage: "ROUNDS",
      promptText: "How does the provoking factor influence the duration of anticoagulation?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A transient major provoking factor such as recent surgery supports a limited defined course, while unprovoked events are considered for extended therapy" },
        { key: "b", text: "Every patient receives lifelong anticoagulation" },
        { key: "c", text: "Every patient stops anticoagulation after two weeks" },
        { key: "d", text: "Duration depends only on the size of the clot on imaging" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Her embolism was provoked by a transient major risk factor, which supports a defined finite course.",
      incorrectFeedback: "Duration is driven by whether the event was provoked by a transient factor, provoked by a persistent one, or unprovoked — not by clot size.",
      conceptCode: "EM.PE.05",
    },
    {
      stage: "DISCHARGE",
      promptText: "She is off oxygen with a normal heart rate on anticoagulation. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A defined anticoagulation regimen and duration, bleeding precautions, and follow-up to reassess at the end of the course" },
        { key: "b", text: "Anticoagulation with no defined duration or follow-up plan" },
        { key: "c", text: "An inferior vena cava filter for all patients" },
        { key: "d", text: "Aspirin alone" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The duration decision and its owner must be explicit, or she will either stop too early or continue indefinitely by accident.",
      incorrectFeedback: "Aspirin is inadequate treatment, and a filter is not indicated when anticoagulation is possible. The discharge deliverable is a defined regimen with a defined duration and follow-up.",
      conceptCode: "EM.PE.05",
    },
  ],
};
