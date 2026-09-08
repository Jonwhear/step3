/** DEMO CASE 10 — Generalized convulsive status epilepticus. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_NEURO_002: CaseTemplateInput = {
  code: "DEMO-NEURO-002",
  title: "Generalized Convulsive Status Epilepticus",
  specialty: "Neurology",
  topic: "Seizure",
  primaryDiagnosis: "Generalized convulsive status epilepticus",
  difficulty: 4,
  step3Importance: 5,

  handoffScript:
    "This is a 34-year-old man with a known seizure disorder who was brought in with continuous generalized tonic-clonic activity that had been going for more than five minutes before arrival. Airway was managed with positioning and suction, oxygen was applied and he had good saturations. A bedside glucose was 96. He received an adequately dosed intravenous benzodiazepine, and when convulsions continued at about the eight minute mark, a second-line antiseizure medication was loaded. Seizure activity stopped after that. He is postictal but protecting his airway. He admits, now that he is waking up, that he ran out of his antiseizure medication about a week ago. Continuous electroencephalography was started to make sure he is not in nonconvulsive status.",
  dailySignout:
    "34-year-old man post status epilepticus, seizure free since loading of second-line therapy. Waking appropriately and protecting his airway. Continuous electroencephalography in place. Precipitant identified as medication nonadherence.",
  admissionOpening:
    "A 34-year-old man is brought in by ambulance with continuous generalized tonic-clonic activity that began more than five minutes ago and has not stopped.",
  teachingPoint:
    "Status epilepticus is a timed algorithm, not a diagnostic puzzle. Stabilize the airway, check a glucose, give an adequately dosed benzodiazepine, and if seizures persist, load a second-line antiseizure medication. Underdosing the benzodiazepine is the most common error.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "NEURO.SZ.01", weight: 1 },
    { code: "NEURO.SZ.02", weight: 1 },
    { code: "NEURO.SZ.03", weight: 1 },
    { code: "NEURO.SZ.04", weight: 1 },
    { code: "NEURO.SZ.05", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "128", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "158/92", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "Irregular during convulsions", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "91% before positioning and oxygen, 98% after", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "37.8", units: "C", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Continuous generalized tonic-clonic seizure for more than five minutes", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Epilepsy diagnosed at age 19, previously well controlled on a single agent.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "He ran out of his antiseizure medication about a week ago and did not refill it.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "Neurologic examination", value: "Postictal after treatment: drowsy but arousable, moving all extremities, no focal deficit, gag intact", triggerActionCode: "EXAM_NEUROLOGIC" },
    { category: "LAB", label: "Bedside glucose", value: "96", units: "mg/dL", triggerActionCode: "ORDER_GLUCOSE" },
    { category: "LAB", label: "Basic metabolic panel", value: "Sodium 138, calcium 9.1, magnesium 2.0, creatinine 1.0, bicarbonate 18", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Toxicology screen", value: "Negative for cocaine, amphetamines and opioids", triggerActionCode: "ORDER_TOX_SCREEN" },
    { category: "LAB", label: "Serum ethanol level", value: "Undetectable", triggerActionCode: "ORDER_ETHANOL_LEVEL" },
    { category: "IMAGING", label: "Noncontrast head CT", value: "No hemorrhage, mass or acute structural lesion", triggerActionCode: "ORDER_CT_HEAD" },
    { category: "OTHER", label: "Continuous EEG", value: "No ongoing electrographic seizure activity after second-line loading; diffuse postictal slowing", triggerActionCode: "ORDER_EEG" },
  ],

  actionRules: [
    { actionCode: "GIVE_OXYGEN", classification: "REQUIRED", resultText: "Airway positioned, suction applied and oxygen given. Saturation improves from 91% to 98%.", feedbackText: "Airway, breathing and circulation come before any drug in status epilepticus.", conceptCode: "NEURO.SZ.02" },
    { actionCode: "ORDER_GLUCOSE", classification: "REQUIRED", resultText: "Bedside glucose 96 mg/dL. Hypoglycemia excluded.", feedbackText: "Hypoglycemia is an immediately correctable cause and takes seconds to exclude.", conceptCode: "NEURO.SZ.02" },
    { actionCode: "GIVE_BENZODIAZEPINE", classification: "REQUIRED", resultText: "An adequately dosed intravenous benzodiazepine is given. Convulsive activity decreases but has not fully stopped at three minutes.", feedbackText: "Benzodiazepines are the first-line abortive therapy, and underdosing is the most common treatment failure.", conceptCode: "NEURO.SZ.03" },
    { actionCode: "GIVE_ANTISEIZURE_MEDICATION", classification: "REQUIRED", resultText: "A second-line antiseizure medication is loaded intravenously. Convulsive activity stops within four minutes.", feedbackText: "When seizures persist after adequate benzodiazepine dosing, a non-benzodiazepine antiseizure medication is loaded without further delay.", conceptCode: "NEURO.SZ.04" },
    { actionCode: "ORDER_BMP", classification: "REQUIRED", resultText: "Sodium 138, calcium 9.1, magnesium 2.0, creatinine 1.0, bicarbonate 18.", feedbackText: "Hyponatremia, hypocalcemia and other metabolic derangements are correctable precipitants.", conceptCode: "NEURO.SZ.05" },
    { actionCode: "ORDER_CT_HEAD", classification: "APPROPRIATE", resultText: "No hemorrhage, mass or acute structural lesion.", feedbackText: "Structural imaging is obtained once the seizure is controlled, particularly for a first seizure or a change in pattern.", conceptCode: "NEURO.SZ.05" },
    { actionCode: "ORDER_TOX_SCREEN", classification: "APPROPRIATE", resultText: "Negative for cocaine, amphetamines and opioids.", feedbackText: "Intoxication and withdrawal are common seizure precipitants.", conceptCode: "NEURO.SZ.05" },
    { actionCode: "ORDER_ETHANOL_LEVEL", classification: "APPROPRIATE", resultText: "Serum ethanol undetectable.", feedbackText: "Alcohol withdrawal is a leading cause of adult seizures.", conceptCode: "NEURO.SZ.05" },
    { actionCode: "ORDER_EEG", classification: "APPROPRIATE", resultText: "No ongoing electrographic seizure activity; diffuse postictal slowing.", feedbackText: "A patient who does not wake up promptly after convulsions stop may be in nonconvulsive status, which only electroencephalography detects.", conceptCode: "NEURO.SZ.01" },
    { actionCode: "HX_MEDICATIONS", classification: "REQUIRED", resultText: "He ran out of his antiseizure medication about a week ago and did not refill it.", feedbackText: "Medication nonadherence is the most common precipitant in a known epileptic and is directly addressable.", conceptCode: "NEURO.SZ.05" },
    { actionCode: "CONSULT_NEUROLOGY", classification: "APPROPRIATE", resultText: "Neurology consulted for ongoing management and regimen adjustment.", feedbackText: "Specialist involvement helps with regimen optimization and driving and safety counseling." },
    { actionCode: "ADMIT_ICU", classification: "APPROPRIATE", resultText: "Admitted to a monitored setting with continuous electroencephalography.", feedbackText: "Post-status patients need airway and neurologic monitoring." },
    { actionCode: "GIVE_DEXTROSE", classification: "OPTIONAL", resultText: "Not required; his glucose is 96. Dextrose would be given immediately if hypoglycemia were found.", feedbackText: "Give dextrose only after the glucose is known or if measurement is unavailable." },
    { actionCode: "ORDER_MRI_BRAIN", classification: "OPTIONAL", resultText: "No acute structural abnormality; chronic changes consistent with his known epilepsy.", feedbackText: "Useful for characterizing an epileptogenic focus, but not part of the acute algorithm." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "He is postictal after status epilepticus and requires airway and neurologic monitoring.", feedbackText: "Status epilepticus is a neurologic emergency requiring admission.", conceptCode: "NEURO.SZ.01" },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "UNNECESSARY", resultText: "No meningeal signs, no fever above 38, and a clear metabolic explanation. Empiric antibiotics are not indicated here.", feedbackText: "Reserve empiric antimicrobials for suspected central nervous system infection." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What medication is given first?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "An adequately dosed intravenous benzodiazepine" },
        { key: "b", text: "An intravenous loading dose of a second-line antiseizure medication" },
        { key: "c", text: "An intravenous anesthetic infusion" },
        { key: "d", text: "Oral antiseizure medication once he stops convulsing" },
      ], correctKey: "a" },
      correctFeedback: "Correct. A benzodiazepine at an adequate dose is first-line, after airway stabilization and a glucose check.",
      incorrectFeedback: "Second-line agents come after an adequately dosed benzodiazepine has failed. Anesthetic infusion is reserved for refractory status.",
      conceptCode: "NEURO.SZ.03",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "icu", text: "Admit to a monitored setting with continuous electroencephalography" },
        { key: "floor", text: "Admit to an unmonitored floor bed" },
        { key: "home", text: "Discharge once he is awake in the emergency department" },
        { key: "obs", text: "Observation with no neurologic monitoring" },
      ], correctKey: "icu" },
      correctFeedback: "Correct. He needs airway monitoring, neurologic checks and electroencephalography to exclude nonconvulsive status.",
      incorrectFeedback: "After status epilepticus a patient needs monitored care until fully awake and confirmed free of ongoing electrographic seizures.",
      conceptCode: "NEURO.SZ.01",
    },
    {
      stage: "ROUNDS",
      promptText: "Convulsions persisted after an adequate benzodiazepine dose. What comes next?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Load an intravenous non-benzodiazepine antiseizure medication without further delay" },
        { key: "b", text: "Repeat the same benzodiazepine dose four more times before escalating" },
        { key: "c", text: "Wait 30 minutes to see whether it stops on its own" },
        { key: "d", text: "Start an oral antiseizure medication" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Escalation is by the clock. Prolonged seizure activity causes neuronal injury and becomes progressively harder to abort.",
      incorrectFeedback: "The algorithm escalates on a timeline. After adequate benzodiazepine dosing fails, a second-line agent is loaded immediately.",
      conceptCode: "NEURO.SZ.04",
    },
    {
      stage: "ROUNDS",
      promptText: "Which precipitating causes should be investigated?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Medication nonadherence, metabolic derangement, intoxication or withdrawal, infection, and structural lesions" },
        { key: "b", text: "Only structural brain lesions" },
        { key: "c", text: "Only psychiatric causes" },
        { key: "d", text: "No investigation is needed in a known epileptic" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The differential is broad even in a known epileptic, and nonadherence is the single most common culprit.",
      incorrectFeedback: "Even in known epilepsy the precipitant must be sought — most often a missed medication, but metabolic, toxic, infectious and structural causes all need consideration.",
      conceptCode: "NEURO.SZ.05",
    },
    {
      stage: "ROUNDS",
      promptText: "He stopped convulsing 40 minutes ago but is not waking up. What should you consider?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Nonconvulsive status epilepticus, which requires electroencephalography to detect" },
        { key: "b", text: "That a prolonged postictal state never requires investigation" },
        { key: "c", text: "That he should be discharged once vital signs normalize" },
        { key: "d", text: "That the benzodiazepine dose was too low and should be repeated indefinitely" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Ongoing electrographic seizure activity without visible convulsions is a real and treatable cause of persistent obtundation.",
      incorrectFeedback: "Persistent depressed consciousness after convulsions stop should prompt electroencephalography to exclude nonconvulsive status.",
      conceptCode: "NEURO.SZ.01",
    },
    {
      stage: "DISCHARGE",
      promptText: "He is at neurologic baseline. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A regimen he can obtain and adhere to, neurology follow-up, and counseling on driving and safety restrictions" },
        { key: "b", text: "The same prescription he was unable to refill" },
        { key: "c", text: "No medication, since he is seizure free" },
        { key: "d", text: "Instructions to resume driving immediately" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The precipitant was a refill he did not get. Fixing access, arranging follow-up and giving safety counseling are the discharge deliverables.",
      incorrectFeedback: "Discharging with the same unfilled prescription and no safety counseling reproduces the admission.",
      conceptCode: "NEURO.SZ.05",
    },
  ],
};
