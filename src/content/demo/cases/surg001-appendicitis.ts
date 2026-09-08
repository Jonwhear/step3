/** DEMO CASE 17 — Acute appendicitis. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_SURG_001: CaseTemplateInput = {
  code: "DEMO-SURG-001",
  title: "Acute Appendicitis",
  specialty: "Surgery",
  topic: "Acute Abdomen",
  primaryDiagnosis: "Acute appendicitis",
  difficulty: 2,
  step3Importance: 5,

  handoffScript:
    "This is a 22-year-old man who came in with about 18 hours of abdominal pain. It started around the umbilicus as a vague ache and over several hours moved to the right lower quadrant and became sharp. He has anorexia and nausea and vomited twice. His temperature was 37.9 and he had focal tenderness at McBurney point with voluntary guarding. White count was 14,200. Computed tomography showed a dilated appendix with wall thickening and periappendiceal fat stranding, no perforation and no abscess. He was kept nothing by mouth, given intravenous fluids, analgesia and preoperative antibiotics, and surgery took him for laparoscopic appendectomy overnight. He is now postoperative day zero, comfortable, and starting to ambulate.",
  dailySignout:
    "22-year-old man, postoperative day one from laparoscopic appendectomy for non-perforated appendicitis. Afebrile, tolerating clear liquids, pain controlled with oral analgesia, ambulating.",
  admissionOpening:
    "A 22-year-old man presents with 18 hours of abdominal pain that started around his umbilicus and has moved to the right lower quadrant. He has not wanted to eat since yesterday and has vomited twice.",
  teachingPoint:
    "The history does most of the work in appendicitis: periumbilical pain that migrates to the right lower quadrant, with anorexia preceding the vomiting. Imaging confirms it and looks for perforation, but the diagnosis is usually made before the scanner.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "SURG.APPY.01", weight: 1 },
    { code: "SURG.APPY.02", weight: 1 },
    { code: "SURG.APPY.03", weight: 1 },
    { code: "SURG.APPY.04", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Temperature", value: "37.9", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Heart rate", value: "96", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "126/78", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "16", units: "breaths/min", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Eighteen hours of pain migrating from the umbilicus to the right lower quadrant", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "Anorexia preceded the nausea. Two episodes of non-bilious vomiting. No diarrhea, no urinary symptoms, no prior abdominal surgery.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "Abdomen", value: "Focal tenderness at McBurney point with voluntary guarding and a positive Rovsing sign. No diffuse rigidity or rebound elsewhere.", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "EXAM", label: "General appearance", value: "Uncomfortable, lying still, reluctant to move on the stretcher", triggerActionCode: "EXAM_GENERAL" },
    { category: "LAB", label: "Complete blood count", value: "White count 14,200 with a left shift, hemoglobin 15.1, platelets 232", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Basic metabolic panel", value: "Sodium 139, potassium 4.0, creatinine 1.0, glucose 96", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Urinalysis", value: "Trace ketones, no nitrites, no leukocyte esterase, no hematuria", triggerActionCode: "ORDER_URINALYSIS" },
    { category: "IMAGING", label: "CT abdomen and pelvis", value: "Dilated appendix measuring 11 mm with wall thickening and periappendiceal fat stranding. No free air, no abscess, no perforation.", triggerActionCode: "ORDER_CT_ABDOMEN" },
  ],

  actionRules: [
    { actionCode: "EXAM_ABDOMEN", classification: "REQUIRED", resultText: "Focal tenderness at McBurney point with voluntary guarding and a positive Rovsing sign. No diffuse rigidity.", feedbackText: "Focal right lower quadrant tenderness with localized peritoneal signs is the key examination finding.", conceptCode: "SURG.APPY.01" },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "REQUIRED", resultText: "Dilated appendix measuring 11 mm with wall thickening and periappendiceal fat stranding. No free air, no abscess, no perforation.", feedbackText: "Cross-sectional imaging confirms the diagnosis and, importantly, excludes perforation and abscess in an adult.", conceptCode: "SURG.APPY.02" },
    { actionCode: "CONSULT_SURGERY", classification: "REQUIRED", resultText: "Surgery evaluates and plans laparoscopic appendectomy.", feedbackText: "Early surgical involvement shortens time to the operating room and reduces the risk of perforation.", conceptCode: "SURG.APPY.03" },
    { actionCode: "GIVE_NPO_IVF", classification: "REQUIRED", resultText: "Kept nothing by mouth with intravenous maintenance fluids in preparation for the operating room.", feedbackText: "Nothing by mouth with intravenous fluid is standard preoperative preparation.", conceptCode: "SURG.APPY.03" },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "REQUIRED", resultText: "Preoperative antibiotics with coverage for enteric organisms given.", feedbackText: "Preoperative antibiotics reduce surgical site infection and are given before incision.", conceptCode: "SURG.APPY.03" },
    { actionCode: "GIVE_ANALGESIA", classification: "REQUIRED", resultText: "Analgesia given with good effect. The examination remains focal and localized.", feedbackText: "Analgesia does not obscure the diagnosis and withholding it is both outdated and cruel.", conceptCode: "SURG.APPY.03" },
    { actionCode: "ORDER_CBC", classification: "APPROPRIATE", resultText: "White count 14,200 with a left shift, hemoglobin 15.1, platelets 232.", feedbackText: "Leukocytosis supports the diagnosis but its absence does not exclude appendicitis.", conceptCode: "SURG.APPY.01" },
    { actionCode: "ORDER_BMP", classification: "APPROPRIATE", resultText: "Sodium 139, potassium 4.0, creatinine 1.0, glucose 96.", feedbackText: "Preoperative baseline chemistry." },
    { actionCode: "ORDER_URINALYSIS", classification: "APPROPRIATE", resultText: "Trace ketones, no nitrites, no leukocyte esterase, no hematuria.", feedbackText: "Excludes urinary tract infection and ureteral stone, both of which mimic appendicitis.", conceptCode: "SURG.APPY.02" },
    { actionCode: "GIVE_ANTIEMETIC", classification: "APPROPRIATE", resultText: "Antiemetic given with resolution of nausea.", feedbackText: "Symptomatic relief while awaiting the operating room." },
    { actionCode: "ADMIT_OR", classification: "REQUIRED", resultText: "Taken for laparoscopic appendectomy. Findings confirm an acutely inflamed, non-perforated appendix.", feedbackText: "Appendectomy remains the definitive management for uncomplicated appendicitis in most patients.", conceptCode: "SURG.APPY.03" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "Discharging a patient with confirmed appendicitis before definitive management risks perforation and peritonitis.", feedbackText: "Confirmed appendicitis needs definitive treatment during this encounter.", conceptCode: "SURG.APPY.04" },
    { actionCode: "ORDER_CT_HEAD", classification: "UNNECESSARY", resultText: "No acute intracranial abnormality.", feedbackText: "Nothing here justifies head imaging." },
    { actionCode: "ORDER_ECG", classification: "UNNECESSARY", resultText: "Normal sinus rhythm.", feedbackText: "Not indicated in a young patient with a clear surgical abdomen and no cardiac symptoms." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "appy", text: "Acute appendicitis" },
        { key: "gastro", text: "Acute gastroenteritis" },
        { key: "stone", text: "Ureteral colic" },
        { key: "ibd", text: "Inflammatory bowel disease flare" },
      ], correctKey: "appy" },
      correctFeedback: "Correct. Migratory pain, anorexia preceding vomiting, focal right lower quadrant tenderness and confirmatory imaging.",
      incorrectFeedback: "Gastroenteritis causes diffuse pain with diarrhea, and ureteral colic causes colicky flank pain with hematuria. Migration with focal tenderness is appendicitis.",
      conceptCode: "SURG.APPY.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "or", text: "To the operating room for appendectomy after preoperative preparation" },
        { key: "home", text: "Discharge home with oral antibiotics and next-day follow-up" },
        { key: "obs", text: "Observation with serial examinations and no surgical consultation" },
        { key: "icu", text: "Intensive care admission" },
      ], correctKey: "or" },
      correctFeedback: "Correct. Uncomplicated appendicitis is managed operatively after nothing by mouth, fluids, analgesia and preoperative antibiotics.",
      incorrectFeedback: "He is not critically ill, so intensive care is excessive; but a confirmed appendicitis needs definitive management, not discharge.",
      conceptCode: "SURG.APPY.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Which findings would suggest perforation?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Diffuse abdominal rigidity with generalized rebound, high fever, marked tachycardia, and free fluid or extraluminal air on imaging" },
        { key: "b", text: "Focal tenderness confined to McBurney point" },
        { key: "c", text: "A white count of 14,200" },
        { key: "d", text: "Anorexia and two episodes of vomiting" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Perforation converts localized peritoneal signs into diffuse peritonitis with systemic toxicity.",
      incorrectFeedback: "Focal tenderness and a modest leukocytosis are the uncomplicated picture. Perforation causes diffuse peritonitis and systemic illness.",
      conceptCode: "SURG.APPY.04",
    },
    {
      stage: "ROUNDS",
      promptText: "What initial management precedes surgery?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Nothing by mouth, intravenous fluids, analgesia, preoperative antibiotics and surgical consultation" },
        { key: "b", text: "Oral antibiotics with discharge and outpatient surgical follow-up" },
        { key: "c", text: "Withholding analgesia so the examination is not obscured" },
        { key: "d", text: "A trial of oral intake to see whether the pain worsens" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Withholding analgesia is an outdated practice that does not improve diagnostic accuracy.",
      incorrectFeedback: "Analgesia is given. The preoperative bundle is nothing by mouth, intravenous fluids, pain control, antibiotics and prompt surgical involvement.",
      conceptCode: "SURG.APPY.03",
    },
    {
      stage: "ROUNDS",
      promptText: "What postoperative features indicate readiness for discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Afebrile with stable vital signs, pain controlled on oral analgesia, tolerating a diet, ambulating, and passing flatus" },
        { key: "b", text: "A normal white blood cell count as the only criterion" },
        { key: "c", text: "A repeat CT scan showing no residual inflammation" },
        { key: "d", text: "Completion of a mandatory five-day inpatient stay" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Most patients after uncomplicated laparoscopic appendectomy go home within a day or two on these criteria.",
      incorrectFeedback: "Discharge after appendectomy is a clinical decision: afebrile, eating, ambulating, pain controlled orally, and bowel function returning.",
      conceptCode: "SURG.APPY.03",
    },
    {
      stage: "DISCHARGE",
      promptText: "He is postoperative day one and meets those criteria. What completes the discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Wound care instructions, activity guidance, oral analgesia, surgical follow-up and return precautions for fever, worsening pain or wound drainage" },
        { key: "b", text: "A prolonged course of intravenous antibiotics at home" },
        { key: "c", text: "Strict bed rest for four weeks" },
        { key: "d", text: "No follow-up, since the appendix has been removed" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Non-perforated appendicitis does not require prolonged antibiotics, and early ambulation is encouraged.",
      incorrectFeedback: "Uncomplicated appendectomy needs wound care, activity guidance, follow-up and return precautions — not prolonged antibiotics or bed rest.",
      conceptCode: "SURG.APPY.03",
    },
  ],
};
