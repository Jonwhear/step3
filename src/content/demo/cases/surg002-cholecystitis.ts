/** DEMO CASE 18 — Acute cholecystitis. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_SURG_002: CaseTemplateInput = {
  code: "DEMO-SURG-002",
  title: "Acute Cholecystitis",
  specialty: "Surgery",
  topic: "Biliary Disease",
  primaryDiagnosis: "Acute cholecystitis",
  difficulty: 3,
  step3Importance: 4,

  handoffScript:
    "This is a 45-year-old woman with a history of intermittent right upper quadrant pain after fatty meals, which has typically resolved within an hour or two. Yesterday the pain started the same way but never went away. It has now been going for about 14 hours and she has developed a fever of 38.4. On examination she has a clearly positive Murphy sign. White count was 15,600. Right upper quadrant ultrasound showed gallstones with a thickened gallbladder wall at 5 millimeters and pericholecystic fluid, and no common bile duct dilation. Her bilirubin is normal. She was made nothing by mouth, given fluids, analgesia and antibiotics, and surgery plans cholecystectomy during this admission.",
  dailySignout:
    "45-year-old woman with acute cholecystitis, on antibiotics and analgesia, nothing by mouth awaiting cholecystectomy this admission. Bilirubin normal, no duct dilation. Fever improving.",
  admissionOpening:
    "A 45-year-old woman presents with 14 hours of constant right upper quadrant pain and fever. She says she has had this pain before after fatty meals, but it has always gone away within an hour or two.",
  teachingPoint:
    "Biliary colic and cholecystitis start the same way. What separates them is duration and inflammation: colic resolves in a few hours with no fever or leukocytosis, while cholecystitis is persistent pain with systemic signs of inflammation and a positive Murphy sign.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "SURG.CHOLE.01", weight: 1 },
    { code: "SURG.CHOLE.02", weight: 1 },
    { code: "SURG.CHOLE.03", weight: 1 },
    { code: "SURG.CHOLE.04", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Temperature", value: "38.4", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "102", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "132/80", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "18", units: "breaths/min", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Fourteen hours of constant right upper quadrant pain with fever", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "Recurrent postprandial right upper quadrant pain over six months, previously resolving within one to two hours. No jaundice, no dark urine, no pale stools.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "Abdomen", value: "Right upper quadrant tenderness with inspiratory arrest on palpation, a positive Murphy sign. No jaundice, no rigidity.", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "EXAM", label: "General appearance", value: "Uncomfortable, febrile, mildly tachycardic, not jaundiced", triggerActionCode: "EXAM_GENERAL" },
    { category: "IMAGING", label: "Right upper quadrant ultrasound", value: "Multiple gallstones, gallbladder wall thickening to 5 mm, pericholecystic fluid, sonographic Murphy sign. Common bile duct 4 mm, not dilated.", triggerActionCode: "ORDER_RUQ_ULTRASOUND" },
    { category: "LAB", label: "Complete blood count", value: "White count 15,600 with a left shift, hemoglobin 13.2", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Comprehensive metabolic panel", value: "Total bilirubin 0.9, alkaline phosphatase 96, AST 34, ALT 30, creatinine 0.8", triggerActionCode: "ORDER_CMP" },
    { category: "LAB", label: "Blood cultures", value: "Two sets drawn; no growth at 48 hours", triggerActionCode: "ORDER_BLOOD_CULTURES" },
  ],

  actionRules: [
    { actionCode: "ORDER_RUQ_ULTRASOUND", classification: "REQUIRED", resultText: "Multiple gallstones, gallbladder wall thickening to 5 mm, pericholecystic fluid, sonographic Murphy sign. Common bile duct 4 mm, not dilated.", feedbackText: "Ultrasound is the initial imaging study of choice for biliary disease: no radiation, high sensitivity for stones, and it visualizes the duct.", conceptCode: "SURG.CHOLE.02" },
    { actionCode: "EXAM_ABDOMEN", classification: "REQUIRED", resultText: "Right upper quadrant tenderness with inspiratory arrest on palpation — a positive Murphy sign. No jaundice or rigidity.", feedbackText: "A positive Murphy sign in a patient with persistent pain and fever is the clinical hallmark.", conceptCode: "SURG.CHOLE.01" },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "REQUIRED", resultText: "Intravenous antibiotics with enteric gram-negative and anaerobic coverage started.", feedbackText: "Antibiotics are indicated once there is inflammation with systemic signs, and they precede surgery.", conceptCode: "SURG.CHOLE.03" },
    { actionCode: "GIVE_NPO_IVF", classification: "REQUIRED", resultText: "Kept nothing by mouth with intravenous maintenance fluids.", feedbackText: "Bowel rest and fluids while cholecystectomy is arranged." },
    { actionCode: "GIVE_ANALGESIA", classification: "REQUIRED", resultText: "Analgesia given with good effect.", feedbackText: "Pain control is a standard part of management and does not obscure the diagnosis." },
    { actionCode: "CONSULT_SURGERY", classification: "REQUIRED", resultText: "Surgery evaluates and plans laparoscopic cholecystectomy during this admission.", feedbackText: "Early cholecystectomy during the index admission is preferred over delayed interval surgery in appropriate candidates.", conceptCode: "SURG.CHOLE.03" },
    { actionCode: "ORDER_CMP", classification: "REQUIRED", resultText: "Total bilirubin 0.9, alkaline phosphatase 96, AST 34, ALT 30, creatinine 0.8.", feedbackText: "Normal bilirubin and alkaline phosphatase argue against common bile duct obstruction.", conceptCode: "SURG.CHOLE.04" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "White count 15,600 with a left shift, hemoglobin 13.2.", feedbackText: "Leukocytosis supports inflammation rather than simple colic.", conceptCode: "SURG.CHOLE.01" },
    { actionCode: "ORDER_BLOOD_CULTURES", classification: "APPROPRIATE", resultText: "Two sets drawn; no growth at 48 hours.", feedbackText: "Reasonable in a febrile patient with a biliary source." },
    { actionCode: "ADMIT_FLOOR", classification: "REQUIRED", resultText: "Admitted to a surgical bed for antibiotics and planned cholecystectomy.", feedbackText: "She requires inpatient management and definitive surgery during this admission.", conceptCode: "SURG.CHOLE.03" },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "OPTIONAL", resultText: "Gallbladder wall thickening with pericholecystic inflammatory changes, consistent with the ultrasound.", feedbackText: "Not first-line for biliary disease, but useful when the diagnosis remains uncertain or complications are suspected." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "She is febrile with a leukocytosis and imaging evidence of an acutely inflamed gallbladder. Discharge risks perforation and sepsis.", feedbackText: "Acute cholecystitis requires admission, antibiotics and definitive management.", conceptCode: "SURG.CHOLE.01" },
    { actionCode: "ORDER_ENDOSCOPY", classification: "UNNECESSARY", resultText: "Not indicated. Her bilirubin is normal and the common bile duct is not dilated.", feedbackText: "Endoscopic intervention is for suspected common bile duct stones, which this presentation does not support.", conceptCode: "SURG.CHOLE.04" },
    { actionCode: "ORDER_ECG", classification: "OPTIONAL", resultText: "Normal sinus rhythm.", feedbackText: "Reasonable as preoperative assessment or when inferior ischemia is a consideration for upper abdominal pain." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "chole", text: "Acute cholecystitis" },
        { key: "colic", text: "Biliary colic" },
        { key: "cholangitis", text: "Ascending cholangitis" },
        { key: "pud", text: "Peptic ulcer disease" },
      ], correctKey: "chole" },
      correctFeedback: "Correct. Persistent pain beyond several hours with fever, leukocytosis, a positive Murphy sign and an inflamed gallbladder on ultrasound.",
      incorrectFeedback: "Cholangitis requires jaundice with duct obstruction, which she does not have. Colic resolves within hours without fever. This is cholecystitis.",
      conceptCode: "SURG.CHOLE.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the initial imaging study of choice?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Right upper quadrant ultrasound" },
        { key: "b", text: "CT of the abdomen and pelvis with contrast" },
        { key: "c", text: "Plain abdominal radiograph" },
        { key: "d", text: "MRI of the abdomen" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Ultrasound is fast, radiation-free, and highly sensitive for stones, wall thickening and duct dilation.",
      incorrectFeedback: "Most gallstones are not visible on plain radiographs, and computed tomography is less sensitive for stones than ultrasound.",
      conceptCode: "SURG.CHOLE.02",
    },
    {
      stage: "ROUNDS",
      promptText: "What distinguishes biliary colic from acute cholecystitis?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Colic is self-limited pain lasting a few hours without fever or leukocytosis; cholecystitis is persistent pain with systemic inflammation and a positive Murphy sign" },
        { key: "b", text: "Colic always causes jaundice" },
        { key: "c", text: "Cholecystitis never involves gallstones" },
        { key: "d", text: "Colic is always more severe than cholecystitis" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Duration plus inflammation is the distinction, and it changes management from outpatient referral to admission and surgery.",
      incorrectFeedback: "The difference is duration and the presence of inflammation. Neither condition typically causes jaundice, and most cholecystitis is caused by stones.",
      conceptCode: "SURG.CHOLE.01",
    },
    {
      stage: "ROUNDS",
      promptText: "What is the definitive treatment?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Cholecystectomy, preferably during this admission in appropriate surgical candidates" },
        { key: "b", text: "A prolonged course of oral antibiotics alone" },
        { key: "c", text: "Oral bile acid dissolution therapy" },
        { key: "d", text: "A low-fat diet indefinitely with no surgery" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Early cholecystectomy during the index admission reduces recurrence and readmission compared with delayed surgery.",
      incorrectFeedback: "Antibiotics treat the current inflammation but the stones remain. Cholecystectomy is definitive.",
      conceptCode: "SURG.CHOLE.03",
    },
    {
      stage: "ROUNDS",
      promptText: "When should common bile duct obstruction be suspected?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Jaundice with an elevated bilirubin and alkaline phosphatase, or a dilated common bile duct on imaging" },
        { key: "b", text: "Any right upper quadrant pain" },
        { key: "c", text: "A white count above 15,000" },
        { key: "d", text: "A positive Murphy sign alone" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Cholestatic laboratory abnormalities or a dilated duct change the plan to include ductal evaluation before or during surgery.",
      incorrectFeedback: "Duct obstruction announces itself with cholestasis — jaundice, a rising bilirubin and alkaline phosphatase, or a dilated duct on imaging.",
      conceptCode: "SURG.CHOLE.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "She has undergone cholecystectomy and is tolerating a diet. What completes the discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Wound care, activity guidance, oral analgesia, surgical follow-up, and return precautions for fever, jaundice or worsening pain" },
        { key: "b", text: "Lifelong daily antibiotics" },
        { key: "c", text: "A strict fat-free diet permanently" },
        { key: "d", text: "No follow-up, since the gallbladder is gone" },
      ], correctKey: "a" },
      correctFeedback: "Correct. New jaundice after cholecystectomy would suggest a retained duct stone, which is why the return precautions matter.",
      incorrectFeedback: "Antibiotics are stopped after surgery in uncomplicated disease and dietary restriction is unnecessary. Follow-up and return precautions are what matter.",
      conceptCode: "SURG.CHOLE.04",
    },
  ],
};
