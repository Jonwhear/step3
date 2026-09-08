/** DEMO CASE 08 — Pyelonephritis with sepsis. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_ID_001: CaseTemplateInput = {
  code: "DEMO-ID-001",
  title: "Acute Pyelonephritis With Sepsis",
  specialty: "Internal Medicine",
  topic: "Infectious Disease",
  primaryDiagnosis: "Acute pyelonephritis with sepsis",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "Next is a 49-year-old woman who came in with two days of dysuria that progressed to fever, shaking chills and left flank pain. On arrival her temperature was 39.1, heart rate 122, blood pressure 88 over 54, and her lactate was 3.4. Urinalysis showed pyuria with nitrites. Blood and urine cultures were drawn, she received thirty milliliters per kilogram of balanced crystalloid, and broad-spectrum antibiotics were given within an hour. Her blood pressure came up to 108 over 66 after fluids and her lactate is down to 1.9. She is making good urine. If she does not continue to improve, the thing to think about is an obstructing stone.",
  dailySignout:
    "49-year-old woman with pyelonephritis and sepsis, responded to fluid resuscitation and broad-spectrum antibiotics. Blood pressure and lactate improved. Cultures pending.",
  admissionOpening:
    "A 49-year-old woman presents with two days of burning with urination that has progressed to fever, shaking chills and left-sided back pain. She looks unwell and is shivering.",
  teachingPoint:
    "Sepsis is a time-critical bundle: cultures, lactate, fluids and antibiotics, then reassess. The reassessment is the step most often skipped — and in urinary sepsis, a patient who does not improve has an obstruction until proven otherwise.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "ID.SEPSIS.01", weight: 1 },
    { code: "ID.SEPSIS.02", weight: 1 },
    { code: "ID.SEPSIS.03", weight: 1 },
    { code: "ID.SEPSIS.04", weight: 1 },
    { code: "ID.PYELO.01", weight: 1 },
    { code: "ID.PYELO.02", weight: 0.8 },
  ],

  findings: [
    { category: "VITAL", label: "Temperature", value: "39.1", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "122", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "88/54", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "24", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "96% on room air", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Two days of dysuria progressing to fever, rigors and left flank pain", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Recurrent urinary tract infections. No known kidney stones. Not pregnant.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "General appearance", value: "Ill-appearing, shivering, warm flushed skin, alert", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Abdomen and back", value: "Marked left costovertebral angle tenderness, suprapubic tenderness, no peritoneal signs", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "LAB", label: "Urinalysis", value: "Large leukocyte esterase, positive nitrites, 50 to 100 white cells per high-power field, bacteria present", triggerActionCode: "ORDER_URINALYSIS" },
    { category: "LAB", label: "Serum lactate", value: "3.4 initially, 1.9 after resuscitation", units: "mmol/L", referenceRange: "<2.0", triggerActionCode: "ORDER_LACTATE" },
    { category: "LAB", label: "Complete blood count", value: "White count 19.8 with left shift, hemoglobin 12.2, platelets 178", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Basic metabolic panel", value: "Creatinine 1.4 (baseline 0.8), bicarbonate 20, sodium 136", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Blood cultures", value: "Two sets drawn before antibiotics; gram-negative rods at 18 hours", triggerActionCode: "ORDER_BLOOD_CULTURES" },
    { category: "IMAGING", label: "Renal ultrasound", value: "No hydronephrosis and no obstructing stone. Left kidney mildly echogenic.", triggerActionCode: "ORDER_RENAL_ULTRASOUND" },
  ],

  actionRules: [
    { actionCode: "ORDER_BLOOD_CULTURES", classification: "REQUIRED", resultText: "Two sets drawn before antibiotics; gram-negative rods grow at 18 hours.", feedbackText: "Cultures are obtained before antibiotics when it can be done without delaying therapy.", conceptCode: "ID.SEPSIS.02" },
    { actionCode: "ORDER_LACTATE", classification: "REQUIRED", resultText: "Lactate 3.4 mmol/L, falling to 1.9 after resuscitation.", feedbackText: "Lactate identifies occult hypoperfusion and its clearance is a useful measure of response.", conceptCode: "ID.SEPSIS.01" },
    { actionCode: "GIVE_IV_FLUIDS", classification: "REQUIRED", resultText: "Thirty milliliters per kilogram of balanced crystalloid given. Blood pressure rises to 108/66 and heart rate falls to 98.", feedbackText: "Early adequate fluid resuscitation is the intervention with the clearest benefit in sepsis-related hypotension.", conceptCode: "ID.SEPSIS.03" },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "REQUIRED", resultText: "Broad-spectrum intravenous antibiotics with gram-negative coverage given within one hour of recognition.", feedbackText: "Every hour of delay in appropriate antibiotics worsens outcomes in septic shock.", conceptCode: "ID.SEPSIS.04" },
    { actionCode: "ORDER_URINALYSIS", classification: "REQUIRED", resultText: "Large leukocyte esterase, positive nitrites, 50 to 100 white cells per high-power field, bacteria present. Urine culture sent.", feedbackText: "This localizes the source, which is required to choose targeted therapy and to consider source control.", conceptCode: "ID.PYELO.01" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "White count 19.8 with left shift, hemoglobin 12.2, platelets 178.", feedbackText: "Supports infection and gives a baseline for following the course." },
    { actionCode: "ORDER_BMP", classification: "APPROPRIATE", resultText: "Creatinine 1.4 (baseline 0.8), bicarbonate 20, sodium 136.", feedbackText: "Acute kidney injury is organ dysfunction and confirms this meets sepsis criteria.", conceptCode: "ID.SEPSIS.01" },
    { actionCode: "ORDER_RENAL_ULTRASOUND", classification: "APPROPRIATE", resultText: "No hydronephrosis and no obstructing stone. Left kidney mildly echogenic.", feedbackText: "Imaging looks for an obstructing stone or abscess requiring drainage — mandatory if she fails to improve.", conceptCode: "ID.PYELO.01" },
    { actionCode: "ADMIT_ICU", classification: "APPROPRIATE", resultText: "Admitted to a monitored bed for close hemodynamic observation after initial resuscitation.", feedbackText: "Hypotension responsive to fluids still warrants a closely monitored setting." },
    { actionCode: "ADMIT_FLOOR", classification: "OPTIONAL", resultText: "Admitted to a general medical bed with frequent vital signs.", feedbackText: "Acceptable only if the blood pressure response to fluids is sustained and monitoring is frequent." },
    { actionCode: "CONSULT_UROLOGY", classification: "APPROPRIATE", resultText: "Urology available should imaging demonstrate obstruction requiring decompression.", feedbackText: "An obstructed infected kidney needs drainage; antibiotics alone will fail.", conceptCode: "ID.PYELO.01" },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "APPROPRIATE", resultText: "No perinephric abscess or obstructing calculus. Findings consistent with pyelonephritis.", feedbackText: "Cross-sectional imaging is indicated when the patient fails to improve on appropriate antibiotics." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "She is hypotensive and febrile with an elevated lactate. Discharge would be dangerous.", feedbackText: "Sepsis with hypotension requires admission and intravenous therapy.", conceptCode: "ID.SEPSIS.01" },
    { actionCode: "GIVE_STEROID", classification: "UNNECESSARY", resultText: "Corticosteroids are reserved for shock refractory to fluids and vasopressors. Her pressure responded to fluid.", feedbackText: "Not indicated in fluid-responsive sepsis." },
    { actionCode: "ORDER_CT_HEAD", classification: "UNNECESSARY", resultText: "No acute intracranial abnormality.", feedbackText: "There is no neurologic finding requiring imaging." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "pyelo_sepsis", text: "Acute pyelonephritis with sepsis" },
        { key: "cystitis", text: "Uncomplicated cystitis" },
        { key: "nephrolithiasis", text: "Uncomplicated nephrolithiasis" },
        { key: "pid", text: "Pelvic inflammatory disease" },
      ], correctKey: "pyelo_sepsis" },
      correctFeedback: "Correct. Fever with flank pain and pyuria is pyelonephritis; hypotension, tachycardia, an elevated lactate and acute kidney injury make it sepsis.",
      incorrectFeedback: "Cystitis does not cause fever, rigors, flank pain or hypotension. Upper tract infection with organ dysfunction is pyelonephritis with sepsis.",
      conceptCode: "ID.PYELO.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What must happen within the first hour?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Cultures, a lactate, intravenous fluid resuscitation and broad-spectrum antibiotics" },
        { key: "b", text: "A CT scan before any antibiotics are given" },
        { key: "c", text: "Waiting for the urine culture to return before treating" },
        { key: "d", text: "Oral antibiotics and reassessment in the morning" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The sepsis bundle is time-critical, and antibiotics should not wait on imaging or final cultures.",
      incorrectFeedback: "Antibiotic delay costs lives in sepsis. Cultures and lactate are drawn, fluids are started, and antibiotics are given promptly.",
      conceptCode: "ID.SEPSIS.04",
    },
    {
      stage: "ROUNDS",
      promptText: "What should be reassessed after the initial fluid resuscitation?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Blood pressure, heart rate, mental status, urine output, perfusion and a repeat lactate" },
        { key: "b", text: "Only the white blood cell count" },
        { key: "c", text: "Only the temperature curve" },
        { key: "d", text: "Nothing until the following morning" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Reassessment of perfusion after resuscitation is the step that decides whether vasopressors are needed.",
      incorrectFeedback: "The white count and fever curve lag. Perfusion measures and lactate clearance tell you whether the resuscitation worked.",
      conceptCode: "ID.SEPSIS.03",
    },
    {
      stage: "ROUNDS",
      promptText: "She remains febrile at 48 hours despite appropriate antibiotics. What should be suspected?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Urinary obstruction or a perinephric abscess requiring drainage, or a resistant organism" },
        { key: "b", text: "That the antibiotic simply needs more time and nothing should change" },
        { key: "c", text: "That the fever is a drug reaction and antibiotics should stop" },
        { key: "d", text: "That she needs a higher fluid rate indefinitely" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Antibiotics cannot sterilize an obstructed or undrained collection. Imaging is mandatory when a patient fails to improve.",
      incorrectFeedback: "Failure to defervesce on appropriate antibiotics means a source-control problem — obstruction or abscess — until imaging proves otherwise.",
      conceptCode: "ID.PYELO.01",
    },
    {
      stage: "ROUNDS",
      promptText: "When can she transition from intravenous to oral antibiotic therapy?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "When she is afebrile and clinically improving, tolerating oral intake, with an organism susceptible to an available oral agent" },
        { key: "b", text: "Only after a full 14 days of intravenous therapy" },
        { key: "c", text: "As soon as her white count normalizes regardless of fever" },
        { key: "d", text: "Only after a repeat negative urine culture" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Clinical improvement plus a susceptible organism and a functioning gut permit the switch.",
      incorrectFeedback: "There is no mandated intravenous duration. Defervescence, clinical improvement and culture susceptibility drive the transition.",
      conceptCode: "ID.PYELO.02",
    },
    {
      stage: "DISCHARGE",
      promptText: "She is afebrile with a normal blood pressure and a susceptible organism. What completes the discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "An oral antibiotic matched to culture susceptibilities to complete the course, with follow-up and explicit return precautions" },
        { key: "b", text: "No antibiotics, since she is afebrile" },
        { key: "c", text: "A peripherally inserted central catheter for six weeks of intravenous therapy" },
        { key: "d", text: "Indefinite daily antibiotic prophylaxis" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Complete the course orally with a culture-directed agent and make the follow-up explicit.",
      incorrectFeedback: "Pyelonephritis requires a full treatment course. It is completed orally with a culture-directed agent once she is stable.",
      conceptCode: "ID.PYELO.02",
    },
  ],
};
