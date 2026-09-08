/** DEMO CASE 09 — Acute ischemic stroke. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_NEURO_001: CaseTemplateInput = {
  code: "DEMO-NEURO-001",
  title: "Acute Ischemic Stroke",
  specialty: "Neurology",
  topic: "Stroke",
  primaryDiagnosis: "Acute ischemic stroke",
  difficulty: 4,
  step3Importance: 5,

  handoffScript:
    "This is a 70-year-old man who was brought in after his wife noticed he could not speak properly and his right arm went weak. Last known well was 50 minutes before arrival, which she is confident about because they were eating dinner together. A code stroke was called from the door. His bedside glucose was 104, so hypoglycemia was excluded immediately. Noncontrast head computed tomography showed no hemorrhage and no established large infarct. He was evaluated for reperfusion within the window. His blood pressure was 172 over 94. He has a bedside swallow screen ordered and is nothing by mouth until it is done. Overnight he has been neurologically stable with mild residual expressive aphasia and right arm weakness.",
  dailySignout:
    "70-year-old man with acute ischemic stroke, neurologically stable overnight with residual expressive aphasia and mild right arm weakness. Nothing by mouth pending swallow screen. Blood pressure managed permissively.",
  admissionOpening:
    "A 70-year-old man is brought to the emergency department by his wife after the abrupt onset of difficulty speaking and right arm weakness. He is awake and follows commands but cannot name objects.",
  teachingPoint:
    "Two numbers decide everything in acute stroke: the last-known-well time and the bedside glucose. One determines reperfusion eligibility; the other excludes the most common reversible mimic. Both are obtained before imaging is even reported.",

  minimumRoundsBeforeDischarge: 3,

  concepts: [
    { code: "NEURO.STROKE.01", weight: 1 },
    { code: "NEURO.STROKE.02", weight: 1 },
    { code: "NEURO.STROKE.03", weight: 1 },
    { code: "NEURO.STROKE.04", weight: 0.8 },
    { code: "NEURO.STROKE.05", weight: 1 },
    { code: "NEURO.STROKE.06", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Blood pressure", value: "172/94", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "84, irregular", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "16", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "97% on room air", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Abrupt aphasia and right arm weakness", initiallyVisible: true },
    { category: "HISTORY", label: "Last known well", value: "50 minutes before arrival, witnessed by his wife at dinner", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Hypertension, hyperlipidemia. Palpitations noted at prior visits but never worked up.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "Amlodipine and simvastatin. No antiplatelet or anticoagulant.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "Neurologic examination", value: "Expressive aphasia with intact comprehension, right facial droop, right arm drift with 3 out of 5 strength, right leg 5 out of 5", triggerActionCode: "EXAM_NEUROLOGIC" },
    { category: "LAB", label: "Bedside glucose", value: "104", units: "mg/dL", triggerActionCode: "ORDER_GLUCOSE" },
    { category: "IMAGING", label: "Noncontrast head CT", value: "No intracranial hemorrhage. No established large territory infarct. Old small-vessel changes.", triggerActionCode: "ORDER_CT_HEAD" },
    { category: "ECG", label: "12-lead ECG", value: "Atrial fibrillation with a controlled ventricular response", triggerActionCode: "ORDER_ECG" },
    { category: "IMAGING", label: "MRI brain", value: "Acute infarct in the left middle cerebral artery territory involving the inferior frontal region", triggerActionCode: "ORDER_MRI_BRAIN" },
    { category: "OTHER", label: "Bedside swallow screen", value: "Failed initial screen with a wet voice after water; speech pathology evaluation arranged", triggerActionCode: "ORDER_SWALLOW_SCREEN" },
    { category: "LAB", label: "Coagulation studies", value: "INR 1.0, platelets 232", triggerActionCode: "ORDER_COAGS" },
    { category: "IMAGING", label: "Echocardiogram", value: "Left atrial enlargement, ejection fraction 55%, no intracardiac thrombus seen", triggerActionCode: "ORDER_ECHO" },
  ],

  actionRules: [
    { actionCode: "ORDER_GLUCOSE", classification: "REQUIRED", resultText: "Bedside glucose 104 mg/dL. Hypoglycemia excluded.", feedbackText: "Hypoglycemia is the most common fully reversible stroke mimic and takes seconds to exclude.", conceptCode: "NEURO.STROKE.02" },
    { actionCode: "ORDER_CT_HEAD", classification: "REQUIRED", resultText: "No intracranial hemorrhage. No established large territory infarct.", feedbackText: "Noncontrast computed tomography is performed immediately because hemorrhage absolutely contraindicates thrombolysis.", conceptCode: "NEURO.STROKE.03" },
    { actionCode: "EXAM_NEUROLOGIC", classification: "REQUIRED", resultText: "Expressive aphasia with intact comprehension, right facial droop, right arm 3 out of 5, right leg 5 out of 5.", feedbackText: "A structured deficit examination establishes severity and localizes the lesion.", conceptCode: "NEURO.STROKE.01" },
    { actionCode: "CONSULT_NEUROLOGY", classification: "REQUIRED", resultText: "Code stroke activated; neurology at the bedside within minutes and reperfusion eligibility assessed.", feedbackText: "Time is brain. Parallel activation of the stroke team is standard.", conceptCode: "NEURO.STROKE.01" },
    { actionCode: "GIVE_THROMBOLYSIS", classification: "APPROPRIATE", resultText: "He is within the treatment window with no hemorrhage and no exclusion criteria. Thrombolysis is administered per protocol with blood pressure lowered below the required threshold first.", feedbackText: "Reperfusion within the window is the single most impactful acute intervention when no contraindication exists.", conceptCode: "NEURO.STROKE.03" },
    { actionCode: "ORDER_SWALLOW_SCREEN", classification: "REQUIRED", resultText: "Failed initial bedside screen with a wet voice after water. Kept nothing by mouth; speech pathology evaluation arranged.", feedbackText: "A swallow screen before any oral intake prevents aspiration pneumonia, the most common preventable complication after stroke.", conceptCode: "NEURO.STROKE.05" },
    { actionCode: "ORDER_ECG", classification: "REQUIRED", resultText: "Atrial fibrillation with a controlled ventricular response.", feedbackText: "Identifying atrial fibrillation changes secondary prevention from antiplatelet therapy to anticoagulation.", conceptCode: "NEURO.STROKE.06" },
    { actionCode: "ORDER_MRI_BRAIN", classification: "APPROPRIATE", resultText: "Acute infarct in the left middle cerebral artery territory involving the inferior frontal region.", feedbackText: "MRI confirms and characterizes the infarct but must not delay acute reperfusion decisions." },
    { actionCode: "ORDER_ECHO", classification: "APPROPRIATE", resultText: "Left atrial enlargement, ejection fraction 55%, no intracardiac thrombus seen.", feedbackText: "Part of determining stroke mechanism, which drives secondary prevention.", conceptCode: "NEURO.STROKE.06" },
    { actionCode: "ORDER_COAGS", classification: "APPROPRIATE", resultText: "INR 1.0, platelets 232.", feedbackText: "Coagulation parameters are checked before thrombolysis." },
    { actionCode: "GIVE_ANTIHYPERTENSIVE_IV", classification: "OPTIONAL", resultText: "Blood pressure lowered to below the protocol threshold specifically to permit thrombolysis.", feedbackText: "Blood pressure is otherwise left permissively elevated in acute ischemic stroke to maintain penumbral perfusion.", conceptCode: "NEURO.STROKE.04" },
    { actionCode: "GIVE_HEPARIN", classification: "CONTRAINDICATED", resultText: "Immediate therapeutic anticoagulation in the acute phase increases hemorrhagic transformation without reducing recurrent stroke.", feedbackText: "Anticoagulation for cardioembolic stroke is started after a delay proportional to infarct size, not on day one.", conceptCode: "NEURO.STROKE.06" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "He has an acute neurologic deficit, a failed swallow screen and no secondary prevention plan.", feedbackText: "Acute stroke requires admission to a monitored stroke unit.", conceptCode: "NEURO.STROKE.05" },
    { actionCode: "ADMIT_ICU", classification: "APPROPRIATE", resultText: "Admitted to a stroke unit with frequent neurologic checks after thrombolysis.", feedbackText: "Post-thrombolysis patients need frequent neurologic and blood pressure monitoring." },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "UNNECESSARY", resultText: "No acute intra-abdominal abnormality.", feedbackText: "Nothing in this presentation warrants abdominal imaging." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "stroke", text: "Acute ischemic stroke" },
        { key: "ich", text: "Intracerebral hemorrhage" },
        { key: "hypoglycemia", text: "Hypoglycemia" },
        { key: "todd", text: "Postictal Todd paralysis" },
      ], correctKey: "stroke" },
      correctFeedback: "Correct. Abrupt focal deficit with a normal glucose and no hemorrhage on computed tomography.",
      incorrectFeedback: "The glucose is normal and the head computed tomography shows no blood, so this is an ischemic event.",
      conceptCode: "NEURO.STROKE.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What single piece of history most determines management?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "The last-known-well time" },
        { key: "b", text: "His baseline blood pressure at home" },
        { key: "c", text: "His cholesterol level last year" },
        { key: "d", text: "Whether he has a family history of stroke" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Reperfusion eligibility is defined by time from last known well, and nothing else substitutes for it.",
      incorrectFeedback: "Everything acute hinges on how long ago he was last known to be at neurologic baseline.",
      conceptCode: "NEURO.STROKE.01",
    },
    {
      stage: "ROUNDS",
      promptText: "Why is a noncontrast head CT performed immediately rather than MRI?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "It is fast and reliably excludes intracranial hemorrhage, which absolutely contraindicates thrombolysis" },
        { key: "b", text: "It shows acute ischemia more clearly than MRI" },
        { key: "c", text: "It measures cerebral blood flow directly" },
        { key: "d", text: "It is required before any neurologic examination" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Computed tomography is poor at showing early ischemia but excellent and fast at excluding blood, which is exactly what the decision requires.",
      incorrectFeedback: "The purpose is not to see the infarct — it is to rule out hemorrhage quickly enough to act within the window.",
      conceptCode: "NEURO.STROKE.03",
    },
    {
      stage: "ROUNDS",
      promptText: "What must be addressed before he is allowed anything by mouth?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A bedside dysphagia screen, with formal swallow evaluation if it is failed" },
        { key: "b", text: "A repeat head computed tomography" },
        { key: "c", text: "Normalization of his blood pressure" },
        { key: "d", text: "Resolution of his aphasia" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Aspiration pneumonia is the most common preventable complication after stroke, and the screen takes minutes.",
      incorrectFeedback: "The gate on oral intake is the swallow screen, not imaging or blood pressure.",
      conceptCode: "NEURO.STROKE.05",
    },
    {
      stage: "ROUNDS",
      promptText: "His ECG shows atrial fibrillation. How does that change secondary prevention?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "It identifies a cardioembolic mechanism, so anticoagulation rather than antiplatelet therapy becomes the long-term strategy, started after an appropriate delay" },
        { key: "b", text: "It has no bearing on secondary prevention" },
        { key: "c", text: "It means aspirin alone is sufficient indefinitely" },
        { key: "d", text: "It means no prevention is needed once the rhythm is rate controlled" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Mechanism drives prevention, and a cardioembolic source calls for anticoagulation once hemorrhagic transformation risk has passed.",
      incorrectFeedback: "Cardioembolic stroke is prevented with anticoagulation, not antiplatelet therapy. The timing is delayed based on infarct size.",
      conceptCode: "NEURO.STROKE.06",
    },
    {
      stage: "DISCHARGE",
      promptText: "He is neurologically stable and passed a repeat swallow evaluation. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Mechanism-directed antithrombotic therapy, a high-intensity statin, blood pressure control, rehabilitation services and neurology follow-up" },
        { key: "b", text: "Aspirin alone with no follow-up" },
        { key: "c", text: "Bed rest for six weeks with no therapy services" },
        { key: "d", text: "No changes since his deficits are improving" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Secondary prevention plus rehabilitation is what determines his functional outcome and recurrence risk.",
      incorrectFeedback: "Stroke discharge requires mechanism-directed antithrombotic therapy, a statin, blood pressure control and rehabilitation.",
      conceptCode: "NEURO.STROKE.06",
    },
  ],
};
