/** DEMO CASE 07 — Upper gastrointestinal bleeding. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_GI_001: CaseTemplateInput = {
  code: "DEMO-GI-001",
  title: "Upper Gastrointestinal Bleeding",
  specialty: "Internal Medicine",
  topic: "Gastroenterology",
  primaryDiagnosis: "Upper gastrointestinal bleeding",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "This is a 61-year-old man who came in with two days of black tarry stools and lightheadedness on standing. His heart rate was 112 and his blood pressure 98 over 62 on arrival. Two large-bore intravenous lines were placed, he was typed and crossed, and he received a liter of crystalloid with improvement in his blood pressure. His initial hemoglobin was 7.8. He was started on an intravenous proton pump inhibitor and made nothing by mouth. He takes naproxen daily for knee pain, which is almost certainly the culprit. Gastroenterology is aware and plans endoscopy this morning. He has had no further melena overnight.",
  dailySignout:
    "61-year-old man with upper gastrointestinal bleeding, resuscitated and hemodynamically improved, on an intravenous proton pump inhibitor and nothing by mouth awaiting endoscopy. Hemoglobin stable after transfusion.",
  admissionOpening:
    "A 61-year-old man presents with two days of black tarry stools and dizziness when he stands up. He looks pale and his skin is cool.",
  teachingPoint:
    "In gastrointestinal bleeding, resuscitation precedes diagnosis. Two large-bore intravenous lines, a type and screen, and fluid or blood come before anyone thinks about a scope.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "GI.UGIB.01", weight: 1 },
    { code: "GI.UGIB.02", weight: 1 },
    { code: "GI.UGIB.03", weight: 1 },
    { code: "GI.UGIB.04", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "112", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "98/62", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "20", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "36.6", units: "C", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Two days of melena with lightheadedness on standing", initiallyVisible: true },
    { category: "HISTORY", label: "Past medical history", value: "Osteoarthritis. No known liver disease, no prior ulcer, no varices.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "Naproxen twice daily for the past six months. No proton pump inhibitor. No anticoagulant.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "General appearance", value: "Pale conjunctivae, cool extremities, alert and oriented", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Abdomen", value: "Soft, mild epigastric tenderness, no organomegaly, no stigmata of chronic liver disease", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "LAB", label: "Complete blood count", value: "Hemoglobin 7.8, platelets 218, white count 9.4", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Basic metabolic panel", value: "Blood urea nitrogen 38, creatinine 1.1, potassium 4.0", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Coagulation studies", value: "INR 1.1, normal", triggerActionCode: "ORDER_COAGS" },
    { category: "LAB", label: "Type and screen", value: "Blood type O positive, antibody screen negative, two units crossmatched", triggerActionCode: "ORDER_TYPE_AND_SCREEN" },
    { category: "OTHER", label: "Upper endoscopy", value: "A single duodenal ulcer with a visible vessel, treated endoscopically with successful hemostasis", triggerActionCode: "ORDER_ENDOSCOPY" },
  ],

  actionRules: [
    { actionCode: "GIVE_IV_FLUIDS", classification: "REQUIRED", resultText: "Two large-bore intravenous lines placed and one liter of crystalloid given. Heart rate falls to 96 and blood pressure improves to 114/70.", feedbackText: "Access and volume come first. Everything else waits until the patient is being resuscitated.", conceptCode: "GI.UGIB.01" },
    { actionCode: "ORDER_CBC", classification: "REQUIRED", resultText: "Hemoglobin 7.8, platelets 218, white count 9.4.", feedbackText: "The hemoglobin anchors the transfusion decision, though it lags behind acute blood loss.", conceptCode: "GI.UGIB.02" },
    { actionCode: "ORDER_TYPE_AND_SCREEN", classification: "REQUIRED", resultText: "Blood type O positive, antibody screen negative, two units crossmatched and available.", feedbackText: "Crossmatched blood must be ready before it is needed, not after.", conceptCode: "GI.UGIB.01" },
    { actionCode: "GIVE_PPI", classification: "REQUIRED", resultText: "Intravenous proton pump inhibitor started.", feedbackText: "Acid suppression stabilizes clot and reduces the need for endoscopic reintervention in ulcer bleeding.", conceptCode: "GI.UGIB.03" },
    { actionCode: "ORDER_ENDOSCOPY", classification: "REQUIRED", resultText: "Upper endoscopy shows a single duodenal ulcer with a visible vessel. Endoscopic therapy achieves hemostasis.", feedbackText: "Endoscopy is both diagnostic and therapeutic, and it is performed once the patient is resuscitated.", conceptCode: "GI.UGIB.03" },
    { actionCode: "GIVE_BLOOD_TRANSFUSION", classification: "APPROPRIATE", resultText: "One unit of packed red cells transfused for a hemoglobin of 7.8 with ongoing bleeding and tachycardia; post-transfusion hemoglobin 8.9.", feedbackText: "A restrictive threshold around 7 g/dL is standard for most stable patients; active bleeding with hemodynamic compromise justifies transfusion here.", conceptCode: "GI.UGIB.02" },
    { actionCode: "ORDER_BMP", classification: "APPROPRIATE", resultText: "Blood urea nitrogen 38, creatinine 1.1, potassium 4.0.", feedbackText: "A disproportionately elevated blood urea nitrogen supports an upper rather than lower source.", conceptCode: "GI.UGIB.01" },
    { actionCode: "ORDER_COAGS", classification: "APPROPRIATE", resultText: "INR 1.1, normal.", feedbackText: "Coagulopathy would need correction before or alongside endoscopy." },
    { actionCode: "HX_MEDICATIONS", classification: "REQUIRED", resultText: "Naproxen twice daily for six months with no gastroprotection. No anticoagulant.", feedbackText: "Nonsteroidal anti-inflammatory drugs are the identifiable, removable cause here.", conceptCode: "GI.UGIB.04" },
    { actionCode: "CONSULT_GI", classification: "REQUIRED", resultText: "Gastroenterology consulted and plans endoscopy within 24 hours.", feedbackText: "Timely endoscopy in upper gastrointestinal bleeding improves outcomes and shortens the stay.", conceptCode: "GI.UGIB.03" },
    { actionCode: "GIVE_NPO_IVF", classification: "APPROPRIATE", resultText: "Kept nothing by mouth with maintenance intravenous fluids in anticipation of endoscopy.", feedbackText: "Keeping the patient fasting allows endoscopy to proceed without delay." },
    { actionCode: "ADMIT_ICU", classification: "APPROPRIATE", resultText: "Admitted to a monitored bed given hemodynamic instability on presentation.", feedbackText: "Active bleeding with tachycardia and hypotension warrants a monitored setting." },
    { actionCode: "GIVE_HEPARIN", classification: "CONTRAINDICATED", resultText: "Anticoagulation in a patient with active gastrointestinal hemorrhage would worsen bleeding.", feedbackText: "This is the opposite of what the patient needs.", conceptCode: "GI.UGIB.04" },
    { actionCode: "GIVE_ASPIRIN", classification: "CONTRAINDICATED", resultText: "Antiplatelet therapy is held during active bleeding.", feedbackText: "Antiplatelet and nonsteroidal agents increase rebleeding risk and are held during active hemorrhage.", conceptCode: "GI.UGIB.04" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "He is tachycardic with a hemoglobin of 7.8 and ongoing melena.", feedbackText: "Active bleeding with hemodynamic compromise requires admission and endoscopy.", conceptCode: "GI.UGIB.01" },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "UNNECESSARY", resultText: "No acute intra-abdominal abnormality identified.", feedbackText: "Endoscopy, not computed tomography, is the diagnostic test for upper gastrointestinal bleeding." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "ugib", text: "Upper gastrointestinal bleeding, likely peptic ulcer disease" },
        { key: "lgib", text: "Lower gastrointestinal bleeding from diverticulosis" },
        { key: "ibd", text: "Inflammatory bowel disease flare" },
        { key: "ischemic", text: "Ischemic colitis" },
      ], correctKey: "ugib" },
      correctFeedback: "Correct. Melena with a disproportionately elevated blood urea nitrogen and daily nonsteroidal use points to an upper source.",
      incorrectFeedback: "Melena means digested blood, which indicates an upper source. Lower sources typically produce bright red blood per rectum.",
      conceptCode: "GI.UGIB.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the first priority?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Two large-bore intravenous lines, a type and screen, and volume resuscitation" },
        { key: "b", text: "Immediate endoscopy before any resuscitation" },
        { key: "c", text: "A CT scan of the abdomen to localize the bleeding" },
        { key: "d", text: "Oral proton pump inhibitor and discharge with outpatient endoscopy" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Stabilize before you diagnose.",
      incorrectFeedback: "Endoscopy in an unresuscitated, hypotensive patient is dangerous. Access and volume come first.",
      conceptCode: "GI.UGIB.01",
    },
    {
      stage: "ROUNDS",
      promptText: "What determines whether he needs transfusion?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Hemoglobin combined with hemodynamic status, evidence of ongoing bleeding and cardiac comorbidity, using a restrictive threshold for stable patients" },
        { key: "b", text: "Transfusing everyone to a hemoglobin above 10" },
        { key: "c", text: "The number of melenic stools reported" },
        { key: "d", text: "The blood urea nitrogen value alone" },
      ], correctKey: "a" },
      correctFeedback: "Correct. A restrictive strategy improves outcomes in most stable patients; active instability shifts the threshold.",
      incorrectFeedback: "Liberal transfusion to a hemoglobin above 10 worsens outcomes in gastrointestinal bleeding. The decision combines hemoglobin with clinical status.",
      conceptCode: "GI.UGIB.02",
    },
    {
      stage: "ROUNDS",
      promptText: "What is the role of endoscopy here?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "It identifies the bleeding source, allows therapeutic hemostasis, and provides prognostic information about rebleeding risk" },
        { key: "b", text: "It is purely diagnostic and cannot stop bleeding" },
        { key: "c", text: "It should be deferred to the outpatient setting in all cases" },
        { key: "d", text: "It replaces the need for resuscitation" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Endoscopy diagnoses, treats and risk-stratifies in a single procedure.",
      incorrectFeedback: "Endoscopy is therapeutic as well as diagnostic — the visible vessel here was treated during the procedure.",
      conceptCode: "GI.UGIB.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Which medications increase his risk of recurrent bleeding?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Nonsteroidal anti-inflammatory drugs, antiplatelet agents and anticoagulants" },
        { key: "b", text: "Proton pump inhibitors" },
        { key: "c", text: "Acetaminophen" },
        { key: "d", text: "Inhaled bronchodilators" },
      ], correctKey: "a" },
      correctFeedback: "Correct. His daily naproxen is the modifiable cause, and it has to be stopped.",
      incorrectFeedback: "Proton pump inhibitors protect. It is the nonsteroidal, antiplatelet and anticoagulant agents that raise rebleeding risk.",
      conceptCode: "GI.UGIB.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "Endoscopy achieved hemostasis and his hemoglobin is stable. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Stop the naproxen, provide an alternative analgesic, continue a proton pump inhibitor, test and treat for Helicobacter pylori, and arrange follow-up" },
        { key: "b", text: "Resume naproxen at a lower dose" },
        { key: "c", text: "Start aspirin for cardiovascular prevention" },
        { key: "d", text: "No medication changes since the bleeding has stopped" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The ulcer will recur if the nonsteroidal continues. Removing the cause is the discharge intervention.",
      incorrectFeedback: "Stopping the causative nonsteroidal, continuing acid suppression and testing for Helicobacter pylori are what prevent recurrence.",
      conceptCode: "GI.UGIB.04",
    },
  ],
};
