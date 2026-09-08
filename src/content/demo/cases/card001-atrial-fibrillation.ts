/**
 * DEMO CASE 01 — Atrial fibrillation with rapid ventricular response.
 *
 * This file is the reference example for authoring a case. Copy it, change the
 * codes, and keep the same shape:
 *
 *   concepts     -> what mastery this case moves
 *   findings     -> data the learner can uncover (initiallyVisible or gated by
 *                   the action in triggerActionCode)
 *   actionRules  -> the deterministic response to every action worth taking,
 *                   plus its classification for scoring
 *   prompts      -> ADMISSION (diagnosis/disposition), ROUNDS (retrieval) and
 *                   DISCHARGE questions, answered deterministically
 *
 * Synthetic teaching content authored for this demo.
 */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_CARD_001: CaseTemplateInput = {
  code: "DEMO-CARD-001",
  title: "Atrial Fibrillation With Rapid Ventricular Response",
  specialty: "Internal Medicine",
  topic: "Cardiology",
  primaryDiagnosis: "Atrial fibrillation with rapid ventricular response",
  difficulty: 2,
  step3Importance: 5,

  handoffScript:
    "Room assignment for a new patient. This is a 67-year-old woman with hypertension who came in overnight with palpitations and mild lightheadedness. Her heart rate was 138 and irregular, blood pressure 128 over 76, and she was breathing comfortably on room air. The electrocardiogram showed an irregularly irregular narrow-complex rhythm with no discrete P waves, consistent with atrial fibrillation. She remained alert with warm extremities and no chest pain, so she was treated as stable and given a rate-controlling agent rather than cardioversion. Her rate is now in the low 90s. Overnight team started her on telemetry. The open questions for today are her long-term rhythm strategy and whether she needs anticoagulation.",
  dailySignout:
    "Room 421 equivalent, 67-year-old woman with atrial fibrillation and rapid ventricular response, now rate controlled in the 80s to 90s on telemetry. No chest pain, no hypotension, no overnight events.",
  admissionOpening:
    "A 67-year-old woman presents to the emergency department with palpitations and lightheadedness that began about three hours ago. She is awake, speaking in full sentences, and asks whether her heart is going to stop.",
  teachingPoint:
    "The first branch point in atrial fibrillation is not which drug to use — it is whether the patient is hemodynamically stable. Instability means immediate synchronized cardioversion; stability means rate control and a deliberate conversation about stroke risk.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "CARD.AF.01", weight: 1 },
    { code: "CARD.AF.02", weight: 1 },
    { code: "CARD.AF.03", weight: 0.8 },
    { code: "CARD.AF.04", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "138, irregularly irregular", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "128/76", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "18", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "98% on room air", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "36.9", units: "C", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Palpitations and lightheadedness for three hours", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Hypertension, treated for eight years. No prior arrhythmia.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Review of systems", value: "No chest pain, no syncope, no fever, no leg swelling. No recent illness.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "Lisinopril. No anticoagulant. No over-the-counter stimulants.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "HISTORY", label: "Social history", value: "Two glasses of wine weekly. Never smoker.", triggerActionCode: "HX_SOCIAL" },
    { category: "EXAM", label: "General appearance", value: "Alert, comfortable, warm and well perfused extremities", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Irregularly irregular rhythm, no murmur, lungs clear, no jugular venous distension", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "ECG", label: "12-lead ECG", value: "Irregularly irregular narrow-complex rhythm at 138 without discrete P waves. No ST elevation.", triggerActionCode: "ORDER_ECG" },
    { category: "LAB", label: "Basic metabolic panel", value: "Sodium 139, potassium 4.1, creatinine 0.9, magnesium 2.0", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "TSH", value: "1.8", units: "mIU/L", referenceRange: "0.4-4.0", triggerActionCode: "ORDER_TSH" },
    { category: "LAB", label: "Complete blood count", value: "Hemoglobin 13.4, white count 7.2, platelets 240", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Troponin", value: "Undetectable", triggerActionCode: "ORDER_TROPONIN" },
    { category: "IMAGING", label: "Chest radiograph", value: "No infiltrate, normal cardiac silhouette", triggerActionCode: "ORDER_CXR" },
    { category: "IMAGING", label: "Echocardiogram", value: "Left ventricular ejection fraction 55%, mild left atrial enlargement, no valvular disease", triggerActionCode: "ORDER_ECHO" },
  ],

  actionRules: [
    { actionCode: "ORDER_ECG", classification: "REQUIRED", resultText: "Irregularly irregular narrow-complex rhythm at 138 without discrete P waves. No ST elevation.", feedbackText: "The ECG is the diagnostic study here and it is required before any rhythm decision.", conceptCode: "CARD.AF.01" },
    { actionCode: "EXAM_GENERAL", classification: "REQUIRED", resultText: "Alert and comfortable, speaking in full sentences, warm and well perfused. No hypotension, no altered mental status, no ischemic chest pain.", feedbackText: "This examination establishes hemodynamic stability, which decides between rate control and immediate cardioversion.", conceptCode: "CARD.AF.02" },
    { actionCode: "GIVE_BETA_BLOCKER", classification: "REQUIRED", resultText: "Intravenous metoprolol given. Ventricular rate falls to 92 with stable blood pressure and resolution of lightheadedness.", feedbackText: "Rate control with a beta blocker is appropriate first-line therapy in stable atrial fibrillation with rapid ventricular response.", conceptCode: "CARD.AF.03" },
    { actionCode: "GIVE_CALCIUM_CHANNEL_BLOCKER", classification: "APPROPRIATE", resultText: "Intravenous diltiazem given. Ventricular rate falls to 95 with stable blood pressure.", feedbackText: "A nondihydropyridine calcium channel blocker is a reasonable alternative for rate control when systolic function is preserved.", conceptCode: "CARD.AF.03" },
    { actionCode: "ORDER_BMP", classification: "APPROPRIATE", resultText: "Sodium 139, potassium 4.1, creatinine 0.9, magnesium 2.0.", feedbackText: "Electrolytes and renal function are worth checking; they influence drug choice and correctable triggers.", conceptCode: "CARD.AF.03" },
    { actionCode: "ORDER_TSH", classification: "APPROPRIATE", resultText: "TSH 1.8 mIU/L, within the reference range.", feedbackText: "Thyrotoxicosis is a reversible precipitant of atrial fibrillation and is worth excluding once.", conceptCode: "CARD.AF.01" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "Hemoglobin 13.4, white count 7.2, platelets 240.", feedbackText: "Anemia and infection are common precipitants of a rapid ventricular response.", conceptCode: "CARD.AF.01" },
    { actionCode: "ORDER_ECHO", classification: "APPROPRIATE", resultText: "Ejection fraction 55%, mild left atrial enlargement, no valvular disease.", feedbackText: "Echocardiography informs both rate-control drug choice and stroke-risk assessment.", conceptCode: "CARD.AF.04" },
    { actionCode: "ORDER_TROPONIN", classification: "OPTIONAL", resultText: "Troponin undetectable.", feedbackText: "Reasonable when ischemia is a consideration, though this presentation is not an ischemic one." },
    { actionCode: "ORDER_CXR", classification: "OPTIONAL", resultText: "No infiltrate, normal cardiac silhouette.", feedbackText: "Low yield here, but not harmful." },
    { actionCode: "HX_ADDITIONAL", classification: "APPROPRIATE", resultText: "Hypertension for eight years, no prior arrhythmia. No chest pain, syncope, fever or leg swelling.", feedbackText: "History establishes that this is a first documented episode." },
    { actionCode: "HX_MEDICATIONS", classification: "APPROPRIATE", resultText: "Lisinopril only. No anticoagulant, no stimulants.", feedbackText: "The absence of an anticoagulant is the finding that matters for the discharge plan." },
    { actionCode: "ADMIT_TELEMETRY", classification: "REQUIRED", resultText: "Admitted to a monitored telemetry bed.", feedbackText: "New atrial fibrillation with a rapid ventricular response warrants continuous rhythm monitoring.", conceptCode: "CARD.AF.02" },
    { actionCode: "GIVE_CARDIOVERSION", classification: "CONTRAINDICATED", resultText: "The patient is normotensive, alert and without ischemia. Immediate cardioversion is not indicated and carries unnecessary sedation and thromboembolic risk.", feedbackText: "Immediate synchronized cardioversion is reserved for hemodynamic instability: hypotension, altered mental status, ischemic chest pain or acute heart failure.", conceptCode: "CARD.AF.02" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "Discharge before rate control and a documented anticoagulation decision would be unsafe.", feedbackText: "New atrial fibrillation with a rate of 138 needs rate control and a stroke-risk assessment before discharge.", conceptCode: "CARD.AF.04" },
    { actionCode: "ORDER_CT_HEAD", classification: "UNNECESSARY", resultText: "No acute intracranial abnormality.", feedbackText: "Lightheadedness in the setting of a documented tachyarrhythmia does not require head imaging." },
    { actionCode: "ORDER_CTA_CHEST", classification: "UNNECESSARY", resultText: "No pulmonary embolism identified.", feedbackText: "There is no pretest probability supporting this study." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: {
        kind: "DIAGNOSIS",
        choices: [
          { key: "afib_rvr", text: "Atrial fibrillation with rapid ventricular response" },
          { key: "svt", text: "Paroxysmal supraventricular tachycardia" },
          { key: "sinus_tach", text: "Sinus tachycardia" },
          { key: "vtach", text: "Ventricular tachycardia" },
        ],
        correctKey: "afib_rvr",
      },
      correctFeedback:
        "Correct. An irregularly irregular narrow-complex rhythm without discrete P waves is atrial fibrillation, and a rate of 138 makes it a rapid ventricular response.",
      incorrectFeedback:
        "The rhythm is irregularly irregular with no discrete P waves and a narrow QRS. That combination defines atrial fibrillation with rapid ventricular response.",
      conceptCode: "CARD.AF.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: {
        kind: "DISPOSITION",
        choices: [
          { key: "tele", text: "Admit to a telemetry bed" },
          { key: "floor", text: "Admit to an unmonitored medical floor bed" },
          { key: "icu", text: "Admit to the intensive care unit" },
          { key: "home", text: "Discharge home with cardiology follow-up" },
        ],
        correctKey: "tele",
      },
      correctFeedback:
        "Correct. New atrial fibrillation with a rapid ventricular response needs continuous rhythm monitoring while rate control is established.",
      incorrectFeedback:
        "She is stable, so the intensive care unit is excessive, but a new rapid arrhythmia still needs telemetry before discharge is considered.",
      conceptCode: "CARD.AF.02",
    },
    {
      stage: "ROUNDS",
      promptText:
        "Which finding in this patient would require immediate synchronized cardioversion rather than rate control?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: {
        kind: "MULTIPLE_CHOICE",
        choices: [
          { key: "a", text: "Systolic blood pressure of 72 with cool extremities and confusion" },
          { key: "b", text: "A ventricular rate above 130" },
          { key: "c", text: "Palpitations that the patient finds distressing" },
          { key: "d", text: "A first documented episode of atrial fibrillation" },
        ],
        correctKey: "a",
      },
      correctFeedback:
        "Correct. Hemodynamic instability — hypotension, hypoperfusion, altered mental status, ischemia or acute heart failure — is what converts this from a rate-control problem into an immediate electrical one.",
      incorrectFeedback:
        "Rate alone does not define instability. Cardioversion is driven by hypotension, hypoperfusion, altered mental status, ongoing ischemia or acute pulmonary edema.",
      conceptCode: "CARD.AF.02",
    },
    {
      stage: "ROUNDS",
      promptText:
        "Her rate is now controlled. What is the major long-term issue that must be addressed before she leaves the hospital?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: {
        kind: "MULTIPLE_CHOICE",
        choices: [
          { key: "a", text: "Thromboembolic risk assessment and an anticoagulation decision" },
          { key: "b", text: "Scheduling an exercise stress test" },
          { key: "c", text: "Starting an antiarrhythmic to guarantee sinus rhythm" },
          { key: "d", text: "Arranging a sleep study before discharge" },
        ],
        correctKey: "a",
      },
      correctFeedback:
        "Correct. Rate control treats today's symptoms; stroke prevention is what changes her long-term outcome.",
      incorrectFeedback:
        "The dominant long-term risk in atrial fibrillation is thromboembolic stroke. That assessment cannot be deferred to the outpatient setting without an explicit plan.",
      conceptCode: "CARD.AF.04",
    },
    {
      stage: "ROUNDS",
      promptText: "How should her thromboembolic risk be assessed?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: {
        kind: "MULTIPLE_CHOICE",
        choices: [
          { key: "a", text: "Apply a validated clinical risk score based on age, sex and comorbidities, then weigh it against bleeding risk" },
          { key: "b", text: "Anticoagulate every patient with atrial fibrillation regardless of risk profile" },
          { key: "c", text: "Base the decision on how fast the ventricular rate was at presentation" },
          { key: "d", text: "Base the decision on whether she converts to sinus rhythm during this admission" },
        ],
        correctKey: "a",
      },
      correctFeedback:
        "Correct. A validated score stratifies stroke risk; the decision is then balanced against bleeding risk and patient preference.",
      incorrectFeedback:
        "Stroke risk in atrial fibrillation tracks with clinical risk factors — not with the presenting heart rate, and not with whether the rhythm happens to convert.",
      conceptCode: "CARD.AF.04",
    },
    {
      stage: "DISCHARGE",
      promptText:
        "She is rate controlled and asymptomatic. What is essential to settle before she goes home?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: {
        kind: "MULTIPLE_CHOICE",
        choices: [
          { key: "a", text: "A documented anticoagulation decision and cardiology follow-up" },
          { key: "b", text: "A normal repeat echocardiogram" },
          { key: "c", text: "Confirmation that she has returned to sinus rhythm" },
          { key: "d", text: "A 30-day event monitor before any medication changes" },
        ],
        correctKey: "a",
      },
      correctFeedback:
        "Correct. The discharge deliverables are a rate-control regimen, an explicit anticoagulation decision, and follow-up to revisit rhythm strategy.",
      incorrectFeedback:
        "Patients are routinely discharged still in atrial fibrillation. What cannot be left unresolved is the stroke-prevention plan and the follow-up that owns it.",
      conceptCode: "CARD.AF.04",
    },
  ],
};
