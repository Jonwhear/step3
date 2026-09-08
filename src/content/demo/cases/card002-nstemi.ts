/** DEMO CASE 02 — Non-ST elevation myocardial infarction. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_CARD_002: CaseTemplateInput = {
  code: "DEMO-CARD-002",
  title: "Non-ST Elevation Myocardial Infarction",
  specialty: "Internal Medicine",
  topic: "Cardiology",
  primaryDiagnosis: "Non-ST elevation myocardial infarction",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "Next patient is a 58-year-old man with type 2 diabetes and hyperlipidemia who came in last evening with substernal pressure radiating to the left arm, associated with diaphoresis. His initial electrocardiogram showed ST depressions in the lateral leads without ST elevation, and his troponin came back elevated with a rising second value. He was given aspirin in the emergency department and started on therapeutic anticoagulation and a high-intensity statin. He has been chest pain free since around midnight, hemodynamically stable, on telemetry. Cardiology has seen him and plans invasive evaluation. Today's work is continuing medical therapy and getting his secondary prevention right.",
  dailySignout:
    "58-year-old man with non-ST elevation myocardial infarction, chest pain free overnight on aspirin, anticoagulation and a statin, awaiting invasive evaluation. Hemodynamically stable on telemetry.",
  admissionOpening:
    "A 58-year-old man with diabetes and hyperlipidemia arrives in the emergency department with 45 minutes of substernal chest pressure radiating to the left arm, with nausea and sweating.",
  teachingPoint:
    "The ECG sorts acute coronary syndrome into two management pathways. ST elevation means emergent reperfusion. ST depression with elevated troponin means aggressive medical therapy plus risk-stratified invasive evaluation — the therapy starts immediately even though the catheterization does not.",

  minimumRoundsBeforeDischarge: 3,

  concepts: [
    { code: "CARD.ACS.01", weight: 1 },
    { code: "CARD.ACS.02", weight: 1 },
    { code: "CARD.ACS.03", weight: 1 },
    { code: "CARD.ACS.04", weight: 0.8 },
    { code: "CARD.ACS.05", weight: 1 },
    { code: "CARD.CP.01", weight: 0.6 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "88", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "146/84", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "18", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "97% on room air", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Substernal chest pressure radiating to the left arm for 45 minutes", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Type 2 diabetes, hyperlipidemia, 20 pack-year smoking history. No prior coronary disease.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "Metformin and atorvastatin 10 mg. No antiplatelet therapy.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Regular rate and rhythm, no murmur or gallop, lungs clear, no jugular venous distension", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "ECG", label: "12-lead ECG", value: "Normal sinus rhythm with 1.5 mm horizontal ST depressions in leads V5, V6, I and aVL. No ST elevation.", triggerActionCode: "ORDER_ECG" },
    { category: "LAB", label: "Troponin", value: "Initial 0.42 ng/mL, rising to 1.86 ng/mL at three hours", referenceRange: "<0.04", triggerActionCode: "ORDER_TROPONIN" },
    { category: "LAB", label: "Complete blood count", value: "Hemoglobin 14.6, platelets 265, white count 8.1", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Basic metabolic panel", value: "Creatinine 1.0, potassium 4.3, glucose 186", triggerActionCode: "ORDER_BMP" },
    { category: "IMAGING", label: "Chest radiograph", value: "No pulmonary edema, normal mediastinum", triggerActionCode: "ORDER_CXR" },
    { category: "IMAGING", label: "Echocardiogram", value: "Ejection fraction 48% with lateral wall hypokinesis", triggerActionCode: "ORDER_ECHO" },
  ],

  actionRules: [
    { actionCode: "ORDER_ECG", classification: "REQUIRED", resultText: "Sinus rhythm with 1.5 mm horizontal ST depressions in V5, V6, I and aVL. No ST elevation.", feedbackText: "The ECG must be obtained and interpreted within minutes of arrival; it decides between emergent reperfusion and the non-ST-elevation pathway.", conceptCode: "CARD.ACS.02" },
    { actionCode: "GIVE_ASPIRIN", classification: "REQUIRED", resultText: "Chewable aspirin 325 mg given.", feedbackText: "Aspirin is given immediately in suspected acute coronary syndrome unless there is a true contraindication.", conceptCode: "CARD.ACS.03" },
    { actionCode: "ORDER_TROPONIN", classification: "REQUIRED", resultText: "Initial troponin 0.42 ng/mL, rising to 1.86 ng/mL at three hours.", feedbackText: "A rising troponin with ischemic symptoms and ST depression establishes non-ST elevation myocardial infarction.", conceptCode: "CARD.ACS.04" },
    { actionCode: "GIVE_HEPARIN", classification: "REQUIRED", resultText: "Therapeutic anticoagulation started.", feedbackText: "Anticoagulation is standard in non-ST elevation myocardial infarction while awaiting invasive evaluation.", conceptCode: "CARD.ACS.03" },
    { actionCode: "CONSULT_CARDIOLOGY", classification: "REQUIRED", resultText: "Cardiology evaluates and plans invasive coronary angiography during this admission.", feedbackText: "Elevated troponin with dynamic ECG changes places him in a risk group that benefits from an invasive strategy.", conceptCode: "CARD.ACS.04" },
    { actionCode: "GIVE_STATIN", classification: "REQUIRED", resultText: "High-intensity statin started.", feedbackText: "High-intensity statin therapy is part of secondary prevention and is started during the admission, not deferred.", conceptCode: "CARD.ACS.05" },
    { actionCode: "GIVE_BETA_BLOCKER", classification: "APPROPRIATE", resultText: "Oral beta blocker started; heart rate 68, blood pressure 128/76.", feedbackText: "A beta blocker reduces ischemia and recurrent events once the patient is not in cardiogenic shock.", conceptCode: "CARD.ACS.05" },
    { actionCode: "GIVE_NITROGLYCERIN", classification: "APPROPRIATE", resultText: "Sublingual nitroglycerin given; chest pressure improves from 7 out of 10 to 3 out of 10.", feedbackText: "Nitrates relieve ischemic pain but do not change mortality." },
    { actionCode: "ADMIT_TELEMETRY", classification: "REQUIRED", resultText: "Admitted to a monitored cardiac bed.", feedbackText: "Continuous rhythm monitoring is required after myocardial infarction because of arrhythmia risk.", conceptCode: "CARD.ACS.01" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "Hemoglobin 14.6, platelets 265, white count 8.1.", feedbackText: "Baseline hemoglobin and platelets matter before anticoagulation." },
    { actionCode: "ORDER_BMP", classification: "APPROPRIATE", resultText: "Creatinine 1.0, potassium 4.3, glucose 186.", feedbackText: "Renal function guides contrast and anticoagulant dosing." },
    { actionCode: "ORDER_ECHO", classification: "APPROPRIATE", resultText: "Ejection fraction 48% with lateral wall hypokinesis.", feedbackText: "Assessing ventricular function after infarction informs both prognosis and chronic therapy.", conceptCode: "CARD.ACS.05" },
    { actionCode: "ORDER_CXR", classification: "OPTIONAL", resultText: "No pulmonary edema, normal mediastinum.", feedbackText: "Useful to look for pulmonary edema and alternative causes of chest pain." },
    { actionCode: "GIVE_THROMBOLYSIS", classification: "CONTRAINDICATED", resultText: "Thrombolysis is not given. There is no ST elevation, and thrombolytics increase bleeding without benefit in non-ST elevation myocardial infarction.", feedbackText: "Fibrinolytic therapy is indicated only for ST-elevation infarction when timely catheterization is unavailable. In non-ST-elevation disease it causes harm.", conceptCode: "CARD.ACS.02" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "Discharging a patient with a rising troponin and ongoing ischemic risk would be unsafe.", feedbackText: "Confirmed myocardial infarction requires admission, monitoring and definitive risk stratification.", conceptCode: "CARD.ACS.01" },
    { actionCode: "ORDER_CT_HEAD", classification: "UNNECESSARY", resultText: "No acute intracranial abnormality.", feedbackText: "There is nothing in this presentation to justify head imaging." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "nstemi", text: "Non-ST elevation myocardial infarction" },
        { key: "stemi", text: "ST-elevation myocardial infarction" },
        { key: "angina", text: "Stable angina pectoris" },
        { key: "pericarditis", text: "Acute pericarditis" },
      ], correctKey: "nstemi" },
      correctFeedback: "Correct. Ischemic symptoms plus ST depression plus a rising troponin, without ST elevation, defines non-ST elevation myocardial infarction.",
      incorrectFeedback: "There is no ST elevation, and the troponin is rising with ischemic symptoms. That is non-ST elevation myocardial infarction.",
      conceptCode: "CARD.ACS.02",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "tele", text: "Admit to a monitored cardiac bed" },
        { key: "floor", text: "Admit to an unmonitored floor bed" },
        { key: "obs", text: "Observation unit with a repeat troponin in six hours" },
        { key: "home", text: "Discharge home with outpatient stress testing" },
      ], correctKey: "tele" },
      correctFeedback: "Correct. Confirmed infarction requires monitored admission while an invasive strategy is arranged.",
      incorrectFeedback: "The troponin is already diagnostic. This is not an observation or discharge pathway — he needs a monitored bed.",
      conceptCode: "CARD.ACS.01",
    },
    {
      stage: "ROUNDS",
      promptText: "Which medications should be continued while he awaits definitive invasive management?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Aspirin, therapeutic anticoagulation, a high-intensity statin and a beta blocker" },
        { key: "b", text: "Aspirin alone, holding everything else until after catheterization" },
        { key: "c", text: "A thrombolytic infusion until catheterization" },
        { key: "d", text: "Antibiotics and intravenous fluids" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Medical therapy is not a waiting room — antiplatelet therapy, anticoagulation, statin and beta blockade all start before the catheterization.",
      incorrectFeedback: "Aggressive medical therapy runs in parallel with the plan for invasive evaluation, not after it.",
      conceptCode: "CARD.ACS.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Which of the following would change management toward emergent reperfusion?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "New ST elevation on a repeat ECG, or refractory ischemia with hemodynamic instability" },
        { key: "b", text: "A troponin that continues to rise as expected" },
        { key: "c", text: "A fasting glucose above 180" },
        { key: "d", text: "A heart rate that falls to 58 on the beta blocker" },
      ], correctKey: "a" },
      correctFeedback: "Correct. New ST elevation, refractory ischemia, hemodynamic instability or malignant arrhythmia all convert this into an emergency.",
      incorrectFeedback: "A predictably rising troponin is expected in infarction. It is a new ECG change or clinical deterioration that triggers emergent reperfusion.",
      conceptCode: "CARD.ACS.02",
    },
    {
      stage: "ROUNDS",
      promptText: "Which therapies reduce his risk of recurrent cardiovascular events after discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Antiplatelet therapy, high-intensity statin, beta blocker, blood pressure and diabetes control, and smoking cessation" },
        { key: "b", text: "A daily multivitamin and an annual stress test" },
        { key: "c", text: "Long-term antibiotic prophylaxis" },
        { key: "d", text: "Strict bed rest for six weeks" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Secondary prevention is a bundle, and every element is started or planned before he leaves.",
      incorrectFeedback: "Secondary prevention after infarction is antiplatelet therapy, high-intensity statin, beta blockade, risk-factor control and smoking cessation.",
      conceptCode: "CARD.ACS.05",
    },
    {
      stage: "DISCHARGE",
      promptText: "What must be in place at discharge after myocardial infarction?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Antiplatelet therapy and statin with cardiology follow-up, plus cardiac rehabilitation referral and smoking cessation counseling" },
        { key: "b", text: "A prescription for as-needed nitroglycerin only" },
        { key: "c", text: "Instructions to return in six months if symptoms recur" },
        { key: "d", text: "Discharge with no medication changes since he is pain free" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Pain-free is not the discharge criterion — the secondary prevention bundle and follow-up ownership are.",
      incorrectFeedback: "The discharge deliverables are the full secondary prevention regimen, cardiac rehabilitation and a defined follow-up plan.",
      conceptCode: "CARD.ACS.05",
    },
  ],
};
