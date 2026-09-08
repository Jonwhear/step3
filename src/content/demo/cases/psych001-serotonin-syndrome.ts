/** DEMO CASE 11 — Serotonin syndrome. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_PSYCH_001: CaseTemplateInput = {
  code: "DEMO-PSYCH-001",
  title: "Serotonin Syndrome",
  specialty: "Psychiatry",
  topic: "Toxicology",
  primaryDiagnosis: "Serotonin syndrome",
  difficulty: 4,
  step3Importance: 4,

  handoffScript:
    "This is a 29-year-old woman on a long-standing selective serotonin reuptake inhibitor who was started on linezolid three days ago for a skin infection. Over the last 24 hours she became agitated and diaphoretic, and on examination she has hyperreflexia with sustained clonus at both ankles, more pronounced in the lower extremities than the upper. Her temperature was 38.7, heart rate 118, blood pressure 156 over 92. Both serotonergic agents were stopped immediately. She was given intravenous fluids and benzodiazepines with good effect on the agitation and the tachycardia. Her creatine kinase was mildly elevated at 480 and we are watching it. This is a drug interaction, and the key point is that linezolid has monoamine oxidase inhibitor activity.",
  dailySignout:
    "29-year-old woman with serotonin syndrome from a serotonin reuptake inhibitor combined with linezolid. Offending agents stopped, on supportive care and benzodiazepines. Clonus and rigidity improving, temperature normalizing.",
  admissionOpening:
    "A 29-year-old woman is brought in by her partner for agitation, sweating and shaking that began yesterday. She is restless on the stretcher and her legs keep jerking.",
  teachingPoint:
    "Serotonin syndrome and neuroleptic malignant syndrome look similar from across the room. The examination separates them: serotonin toxicity is hyperreflexia and clonus that come on within hours, while neuroleptic malignant syndrome is lead-pipe rigidity and hyporeflexia developing over days.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "PSYCH.SS.01", weight: 1 },
    { code: "PSYCH.SS.02", weight: 1 },
    { code: "PSYCH.SS.03", weight: 1 },
    { code: "PSYCH.SS.04", weight: 1 },
    { code: "PSYCH.SS.05", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Temperature", value: "38.7", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "118", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "156/92", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "22", units: "breaths/min", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "One day of agitation, sweating and involuntary leg movements", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Major depressive disorder, stable on a serotonin reuptake inhibitor for four years. Cellulitis treated as an outpatient.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "A selective serotonin reuptake inhibitor, plus linezolid started three days ago for cellulitis. No antipsychotics.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "Neurologic examination", value: "Hyperreflexia throughout with sustained ankle clonus, greater in the lower than upper extremities. Tremor. Agitated but oriented. Pupils dilated.", triggerActionCode: "EXAM_NEUROLOGIC" },
    { category: "EXAM", label: "General appearance", value: "Diaphoretic, restless, warm, hyperactive bowel sounds", triggerActionCode: "EXAM_GENERAL" },
    { category: "LAB", label: "Creatine kinase", value: "480", units: "U/L", referenceRange: "<200", triggerActionCode: "ORDER_CK" },
    { category: "LAB", label: "Basic metabolic panel", value: "Creatinine 0.9, bicarbonate 21, potassium 3.8", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Complete blood count", value: "White count 11.4, hemoglobin 13.0, platelets 268", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Toxicology screen", value: "Negative for cocaine, amphetamines and phencyclidine", triggerActionCode: "ORDER_TOX_SCREEN" },
    { category: "IMAGING", label: "Noncontrast head CT", value: "No acute intracranial abnormality", triggerActionCode: "ORDER_CT_HEAD" },
  ],

  actionRules: [
    { actionCode: "HX_MEDICATIONS", classification: "REQUIRED", resultText: "A selective serotonin reuptake inhibitor, plus linezolid started three days ago. Linezolid has monoamine oxidase inhibitor activity.", feedbackText: "The medication list is the diagnosis here. The temporal relationship to the new drug is the key finding.", conceptCode: "PSYCH.SS.04" },
    { actionCode: "EXAM_NEUROLOGIC", classification: "REQUIRED", resultText: "Hyperreflexia throughout with sustained ankle clonus, greater in the lower than upper extremities, plus tremor and dilated pupils.", feedbackText: "Lower-extremity predominant clonus with hyperreflexia is the single most discriminating finding for serotonin toxicity.", conceptCode: "PSYCH.SS.02" },
    { actionCode: "GIVE_BENZODIAZEPINE", classification: "REQUIRED", resultText: "Benzodiazepines given. Agitation settles, heart rate falls to 96, and muscular hyperactivity decreases.", feedbackText: "Benzodiazepines control agitation and muscular hyperactivity, which is what drives the hyperthermia.", conceptCode: "PSYCH.SS.05" },
    { actionCode: "GIVE_IV_FLUIDS", classification: "REQUIRED", resultText: "Intravenous fluids given for volume support and to protect the kidneys from rhabdomyolysis.", feedbackText: "Supportive care — fluids, cooling and sedation — is the mainstay of treatment.", conceptCode: "PSYCH.SS.05" },
    { actionCode: "ORDER_CK", classification: "APPROPRIATE", resultText: "Creatine kinase 480 U/L, mildly elevated.", feedbackText: "Sustained muscular hyperactivity causes rhabdomyolysis; the creatine kinase is followed serially.", conceptCode: "PSYCH.SS.05" },
    { actionCode: "ORDER_BMP", classification: "APPROPRIATE", resultText: "Creatinine 0.9, bicarbonate 21, potassium 3.8.", feedbackText: "Renal function and acid-base status are followed given the rhabdomyolysis risk." },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "White count 11.4, hemoglobin 13.0, platelets 268.", feedbackText: "Reasonable baseline given fever." },
    { actionCode: "ORDER_TOX_SCREEN", classification: "APPROPRIATE", resultText: "Negative for cocaine, amphetamines and phencyclidine.", feedbackText: "Sympathomimetic intoxication is on the differential for a hyperadrenergic, hyperthermic patient.", conceptCode: "PSYCH.SS.03" },
    { actionCode: "ORDER_CT_HEAD", classification: "OPTIONAL", resultText: "No acute intracranial abnormality.", feedbackText: "Reasonable when altered mental status is not fully explained, though the drug history explains this presentation." },
    { actionCode: "CONSULT_PSYCHIATRY", classification: "APPROPRIATE", resultText: "Psychiatry consulted to plan safe reintroduction of antidepressant therapy after resolution.", feedbackText: "She still needs treatment for depression; the plan for restarting it safely matters." },
    { actionCode: "ADMIT_ICU", classification: "APPROPRIATE", resultText: "Admitted to a monitored setting given hyperthermia and autonomic instability.", feedbackText: "Severe cases progress to hyperthermia above 41 degrees requiring paralysis and intubation." },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "UNNECESSARY", resultText: "Her fever is from muscular hyperactivity, not from an untreated infection. No new source is identified.", feedbackText: "Fever here is a toxidrome, not sepsis. The linezolid is the problem, not inadequate coverage." },
    { actionCode: "GIVE_ANTIHYPERTENSIVE_IV", classification: "UNNECESSARY", resultText: "Her blood pressure improves with sedation and fluids. Aggressive antihypertensives risk overshooting in a labile autonomic state.", feedbackText: "Treat the hyperadrenergic state with sedation rather than chasing individual vital signs." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "She is hyperthermic with autonomic instability and clonus. Discharge would be unsafe.", feedbackText: "Serotonin syndrome with fever and autonomic instability requires observation until it resolves.", conceptCode: "PSYCH.SS.01" },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "ss", text: "Serotonin syndrome" },
        { key: "nms", text: "Neuroleptic malignant syndrome" },
        { key: "anticholinergic", text: "Anticholinergic toxicity" },
        { key: "sepsis", text: "Sepsis from cellulitis" },
      ], correctKey: "ss" },
      correctFeedback: "Correct. Rapid onset after adding a second serotonergic agent, with hyperreflexia, clonus, diaphoresis and hyperthermia.",
      incorrectFeedback: "Neuroleptic malignant syndrome requires a dopamine antagonist and produces rigidity with hyporeflexia over days. This is rapid-onset hyperreflexia with clonus after a drug interaction.",
      conceptCode: "PSYCH.SS.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the first management step?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Stop all serotonergic agents and provide supportive care with benzodiazepines and fluids" },
        { key: "b", text: "Increase the dose of the serotonin reuptake inhibitor" },
        { key: "c", text: "Start an antipsychotic for the agitation" },
        { key: "d", text: "Give a physical restraint and no medication" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Removing the offending agents plus sedation and supportive care is the treatment.",
      incorrectFeedback: "Antipsychotics with dopamine antagonism can worsen the picture, and restraint alone increases isometric muscular activity and hyperthermia.",
      conceptCode: "PSYCH.SS.05",
    },
    {
      stage: "ROUNDS",
      promptText: "Which examination feature most strongly supports serotonin toxicity?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Hyperreflexia with clonus, more pronounced in the lower extremities" },
        { key: "b", text: "Lead-pipe rigidity with diminished reflexes" },
        { key: "c", text: "Dry skin with absent bowel sounds" },
        { key: "d", text: "Miosis with respiratory depression" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Lower-extremity predominant clonus is close to pathognomonic in the right drug context.",
      incorrectFeedback: "Dry skin with absent bowel sounds is anticholinergic; miosis with respiratory depression is opioid; rigidity with hyporeflexia is neuroleptic malignant syndrome.",
      conceptCode: "PSYCH.SS.02",
    },
    {
      stage: "ROUNDS",
      promptText: "How does this differ from neuroleptic malignant syndrome?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Serotonin syndrome develops within hours with hyperreflexia and clonus; neuroleptic malignant syndrome develops over days with lead-pipe rigidity and hyporeflexia after a dopamine antagonist" },
        { key: "b", text: "They are clinically indistinguishable and treated identically" },
        { key: "c", text: "Neuroleptic malignant syndrome is caused by serotonin reuptake inhibitors" },
        { key: "d", text: "Serotonin syndrome never causes fever" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Onset speed, the reflex examination and the drug class distinguish them.",
      incorrectFeedback: "The distinction is onset (hours versus days), reflexes (hyper versus hypo) and the offending drug class (serotonergic versus dopamine antagonist).",
      conceptCode: "PSYCH.SS.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Which medication combinations can precipitate this syndrome?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A serotonin reuptake inhibitor combined with a monoamine oxidase inhibitor, including linezolid, or with tramadol, triptans or certain antiemetics" },
        { key: "b", text: "A serotonin reuptake inhibitor combined with a proton pump inhibitor" },
        { key: "c", text: "A beta blocker combined with a statin" },
        { key: "d", text: "Metformin combined with an inhaled bronchodilator" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Linezolid is the classic hidden monoamine oxidase inhibitor prescribed by a clinician who is not thinking about psychiatry.",
      incorrectFeedback: "The risk comes from stacking serotonergic mechanisms — reuptake inhibition plus monoamine oxidase inhibition is the most dangerous combination.",
      conceptCode: "PSYCH.SS.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "Her clonus and fever have resolved. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Document the interaction, use a non-serotonergic antibiotic, plan the safe timing for restarting her antidepressant, and arrange psychiatry follow-up" },
        { key: "b", text: "Restart both drugs together at discharge" },
        { key: "c", text: "Stop her antidepressant permanently with no plan for her depression" },
        { key: "d", text: "No documentation is needed since the episode resolved" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The interaction must be documented so it is not repeated, and her depression still needs treatment.",
      incorrectFeedback: "Abandoning her depression treatment is not the answer, and neither is restarting the combination. Document the interaction and plan a safe reintroduction.",
      conceptCode: "PSYCH.SS.04",
    },
  ],
};
