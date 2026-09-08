/** DEMO CASE 12 — Alcohol withdrawal. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_PSYCH_002: CaseTemplateInput = {
  code: "DEMO-PSYCH-002",
  title: "Alcohol Withdrawal",
  specialty: "Psychiatry",
  topic: "Substance Use",
  primaryDiagnosis: "Alcohol withdrawal syndrome",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "This is a 46-year-old man admitted two days ago after a fall, who drinks roughly a pint of spirits daily and had his last drink about 36 hours ago. Overnight he developed a coarse tremor, anxiety, sweating and a heart rate in the 110s. He is oriented and not hallucinating. He was placed on a symptom-triggered benzodiazepine protocol using a standardized withdrawal scale and has required three doses. He received thiamine before any glucose-containing fluids, along with folate and a multivitamin. Watch him carefully over the next 24 to 48 hours, because that is the window where withdrawal seizures and delirium tremens appear.",
  dailySignout:
    "46-year-old man in alcohol withdrawal on a symptom-triggered benzodiazepine protocol. Tremor and tachycardia improving with dosing. Thiamine given. Oriented, no hallucinations, no seizures.",
  admissionOpening:
    "A 46-year-old man hospitalized after a fall becomes anxious and tremulous 36 hours after his last drink. His hands are shaking and his shirt is soaked with sweat.",
  teachingPoint:
    "Two things prevent the deaths in alcohol withdrawal: adequate symptom-triggered benzodiazepine dosing, and thiamine given before any glucose. Both are simple and both are forgotten under time pressure.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "PSYCH.ETOH.01", weight: 1 },
    { code: "PSYCH.ETOH.02", weight: 1 },
    { code: "PSYCH.ETOH.03", weight: 1 },
    { code: "PSYCH.ETOH.04", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "112", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "158/94", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "37.4", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "20", units: "breaths/min", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Tremor, anxiety and sweating 36 hours after his last drink", initiallyVisible: true },
    { category: "HISTORY", label: "Social history", value: "Approximately one pint of spirits daily for eight years. Two prior withdrawal episodes, one with a seizure.", triggerActionCode: "HX_SOCIAL" },
    { category: "HISTORY", label: "Past medical history", value: "No known liver disease. Admitted after a mechanical fall with no head injury.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "General appearance", value: "Diaphoretic, coarse resting tremor of the outstretched hands, anxious but fully oriented", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Neurologic examination", value: "Oriented to person, place and time. No hallucinations. Attention intact. No focal deficit.", triggerActionCode: "EXAM_NEUROLOGIC" },
    { category: "LAB", label: "Comprehensive metabolic panel", value: "Magnesium 1.5, potassium 3.3, AST 88, ALT 44, albumin 3.4", triggerActionCode: "ORDER_CMP" },
    { category: "LAB", label: "Serum ethanol level", value: "Undetectable", triggerActionCode: "ORDER_ETHANOL_LEVEL" },
    { category: "LAB", label: "Complete blood count", value: "Mean corpuscular volume 102, platelets 132, hemoglobin 13.4", triggerActionCode: "ORDER_CBC" },
    { category: "IMAGING", label: "Noncontrast head CT", value: "No acute intracranial hemorrhage after his fall", triggerActionCode: "ORDER_CT_HEAD" },
  ],

  actionRules: [
    { actionCode: "GIVE_BENZODIAZEPINE", classification: "REQUIRED", resultText: "Symptom-triggered benzodiazepine dosing started using a standardized withdrawal scale. Tremor and tachycardia improve after three doses.", feedbackText: "Benzodiazepines are first-line because they are cross-tolerant with alcohol at the same receptor. Symptom-triggered dosing uses less drug than fixed schedules.", conceptCode: "PSYCH.ETOH.02" },
    { actionCode: "GIVE_THIAMINE", classification: "REQUIRED", resultText: "Thiamine given intravenously before any glucose-containing fluid, along with folate and a multivitamin.", feedbackText: "Glucose given to a thiamine-deficient patient can precipitate Wernicke encephalopathy. Thiamine goes first.", conceptCode: "PSYCH.ETOH.03" },
    { actionCode: "EXAM_GENERAL", classification: "REQUIRED", resultText: "Diaphoretic with a coarse resting tremor, anxious but fully oriented and not hallucinating.", feedbackText: "Serial examination using a structured scale is how withdrawal severity is tracked and dosing is titrated.", conceptCode: "PSYCH.ETOH.01" },
    { actionCode: "ORDER_CMP", classification: "APPROPRIATE", resultText: "Magnesium 1.5, potassium 3.3, AST 88, ALT 44, albumin 3.4.", feedbackText: "Electrolyte depletion is common in chronic alcohol use and lowers the seizure threshold.", conceptCode: "PSYCH.ETOH.04" },
    { actionCode: "GIVE_POTASSIUM", classification: "APPROPRIATE", resultText: "Potassium and magnesium repleted.", feedbackText: "Repleting magnesium and potassium reduces arrhythmia and seizure risk.", conceptCode: "PSYCH.ETOH.04" },
    { actionCode: "ORDER_ETHANOL_LEVEL", classification: "APPROPRIATE", resultText: "Serum ethanol undetectable, consistent with the reported timeline.", feedbackText: "Confirms he has actually cleared alcohol, which fits the withdrawal timeline." },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "Mean corpuscular volume 102, platelets 132, hemoglobin 13.4.", feedbackText: "Macrocytosis and thrombocytopenia are common markers of chronic use." },
    { actionCode: "HX_SOCIAL", classification: "REQUIRED", resultText: "Approximately one pint of spirits daily for eight years, with two prior withdrawal episodes, one involving a seizure.", feedbackText: "A prior withdrawal seizure is the strongest predictor of another one and raises the monitoring intensity.", conceptCode: "PSYCH.ETOH.04" },
    { actionCode: "ORDER_CT_HEAD", classification: "APPROPRIATE", resultText: "No acute intracranial hemorrhage after his fall.", feedbackText: "Reasonable given the fall and the elevated bleeding risk in chronic alcohol use." },
    { actionCode: "CONSULT_PSYCHIATRY", classification: "APPROPRIATE", resultText: "Addiction medicine consulted to discuss relapse prevention pharmacotherapy and treatment referral.", feedbackText: "The admission is an opportunity to start treatment for the underlying use disorder." },
    { actionCode: "ADMIT_FLOOR", classification: "REQUIRED", resultText: "Continued on the medical floor with frequent withdrawal scale assessments.", feedbackText: "Frequent structured reassessment is what keeps symptom-triggered dosing safe.", conceptCode: "PSYCH.ETOH.02" },
    { actionCode: "GIVE_DEXTROSE", classification: "CONTRAINDICATED", resultText: "Giving glucose before thiamine in a chronically alcohol-dependent patient can precipitate Wernicke encephalopathy.", feedbackText: "If glucose is needed urgently, give thiamine first or concurrently — never glucose alone.", conceptCode: "PSYCH.ETOH.03" },
    { actionCode: "GIVE_STEROID", classification: "UNNECESSARY", resultText: "Corticosteroids have no role in uncomplicated alcohol withdrawal.", feedbackText: "Not part of withdrawal management." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "He is 36 hours from his last drink with active autonomic hyperactivity — squarely inside the window for seizures and delirium tremens.", feedbackText: "Discharge during active withdrawal, especially with a prior withdrawal seizure, is unsafe.", conceptCode: "PSYCH.ETOH.04" },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the first-line treatment?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Symptom-triggered benzodiazepines guided by a standardized withdrawal scale" },
        { key: "b", text: "An antipsychotic as monotherapy" },
        { key: "c", text: "Beta blockers alone to control the tachycardia" },
        { key: "d", text: "Intravenous alcohol infusion" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Benzodiazepines are cross-tolerant with alcohol and are the only agents shown to prevent withdrawal seizures and delirium.",
      incorrectFeedback: "Beta blockers mask the autonomic signs that guide dosing without preventing seizures. Antipsychotics lower the seizure threshold.",
      conceptCode: "PSYCH.ETOH.02",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "floor", text: "Medical floor with frequent structured withdrawal assessments" },
        { key: "home", text: "Discharge home with an oral benzodiazepine taper" },
        { key: "psych", text: "Transfer to a freestanding psychiatric unit without medical monitoring" },
        { key: "obs", text: "Observation with no withdrawal scale monitoring" },
      ], correctKey: "floor" },
      correctFeedback: "Correct. He has a prior withdrawal seizure and active autonomic hyperactivity, so he needs medical monitoring through the high-risk window.",
      incorrectFeedback: "With active withdrawal and a prior withdrawal seizure, he needs medical monitoring rather than discharge or a non-medical setting.",
      conceptCode: "PSYCH.ETOH.04",
    },
    {
      stage: "ROUNDS",
      promptText: "Why is thiamine given, and when?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "To prevent Wernicke encephalopathy, given before or with any glucose-containing fluid" },
        { key: "b", text: "To treat the tremor directly" },
        { key: "c", text: "To reverse the effects of benzodiazepines" },
        { key: "d", text: "Only after a thiamine level returns low" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Thiamine is a cofactor in glucose metabolism, and a glucose load in a deficient patient can precipitate encephalopathy.",
      incorrectFeedback: "Waiting for a level defeats the purpose. Thiamine is given empirically, before or with glucose.",
      conceptCode: "PSYCH.ETOH.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Which findings suggest that withdrawal is becoming severe?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Confusion and disorientation, hallucinations, marked autonomic hyperactivity, fever, or seizures" },
        { key: "b", text: "A mild hand tremor that improves with each benzodiazepine dose" },
        { key: "c", text: "A request for something to help him sleep" },
        { key: "d", text: "A heart rate that falls from 112 to 88 after treatment" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Disorientation with hallucinations and severe autonomic hyperactivity is delirium tremens, which carries real mortality.",
      incorrectFeedback: "Improvement with dosing is reassuring. The alarming features are altered sensorium, hallucinations, fever and seizures.",
      conceptCode: "PSYCH.ETOH.04",
    },
    {
      stage: "ROUNDS",
      promptText: "During which window is he at highest risk for delirium tremens?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Roughly 48 to 96 hours after his last drink" },
        { key: "b", text: "Within the first two hours after his last drink" },
        { key: "c", text: "Two weeks after his last drink" },
        { key: "d", text: "Only while he is still intoxicated" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Tremor and anxiety come early; seizures peak around 12 to 48 hours; delirium tremens typically appears at 48 to 96 hours.",
      incorrectFeedback: "The syndrome unfolds on a timeline. Delirium tremens is a later phenomenon, typically two to four days after the last drink.",
      conceptCode: "PSYCH.ETOH.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "He is through the high-risk window with a normal examination. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Ongoing thiamine and vitamin supplementation, an offer of relapse prevention pharmacotherapy, referral to treatment, and follow-up" },
        { key: "b", text: "A long outpatient benzodiazepine prescription with no follow-up" },
        { key: "c", text: "No intervention, since the withdrawal has resolved" },
        { key: "d", text: "Advice to resume drinking at a lower level to avoid future withdrawal" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Treating the withdrawal without addressing the use disorder means he returns with the same problem.",
      incorrectFeedback: "Surviving withdrawal is not treatment of the underlying disorder. Offer pharmacotherapy and a referral, and continue vitamin supplementation.",
      conceptCode: "PSYCH.ETOH.01",
    },
  ],
};
