/** DEMO CASE 13 — Pediatric dehydration from gastroenteritis. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_PEDS_001: CaseTemplateInput = {
  code: "DEMO-PEDS-001",
  title: "Acute Gastroenteritis With Dehydration",
  specialty: "Pediatrics",
  topic: "Gastroenterology",
  primaryDiagnosis: "Acute gastroenteritis with moderate dehydration",
  difficulty: 2,
  step3Importance: 4,

  handoffScript:
    "Next is an 18-month-old girl brought in by her mother with two days of vomiting and watery diarrhea. She has had only two wet diapers in the last 24 hours. On arrival her mucous membranes were dry, capillary refill was about three seconds, and she had decreased tears with crying but she was still alert and interactive. That puts her at moderate dehydration, not shock. She was given oral rehydration solution in small frequent volumes with an antiemetic first, and she has kept it down. She has had one wet diaper since. No blood in the stool, no high fever, no bilious vomiting.",
  dailySignout:
    "18-month-old with viral gastroenteritis and moderate dehydration, tolerating oral rehydration solution. Urine output improving. Alert and interactive with her mother.",
  admissionOpening:
    "An 18-month-old girl is brought in by her mother with two days of vomiting and watery diarrhea and only two wet diapers since yesterday. She is fussy but looks at you when you come in.",
  teachingPoint:
    "Dehydration in a child is a clinical assessment, not a laboratory one. Capillary refill, mucous membranes, tears and activity level determine severity, and moderate dehydration is treated orally — the intravenous line is for children who fail oral therapy or are in shock.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "PEDS.DEHY.01", weight: 1 },
    { code: "PEDS.DEHY.02", weight: 1 },
    { code: "PEDS.DEHY.03", weight: 1 },
    { code: "PEDS.DEHY.04", weight: 1 },
    { code: "PEDS.DEHY.05", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "158", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "88/54", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "32", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "37.9", units: "C", initiallyVisible: true },
    { category: "VITAL", label: "Weight", value: "10.6 kg, down from 11.3 kg two weeks ago", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Two days of vomiting and watery diarrhea with reduced urine output", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "Non-bloody, non-bilious vomiting. Watery stools without blood or mucus. Two other children at daycare are ill. Immunizations up to date.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "General appearance", value: "Alert and interactive, fussy but consolable. Dry mucous membranes, decreased tears, capillary refill three seconds, sunken anterior fontanelle is closed.", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Abdomen", value: "Soft, non-distended, hyperactive bowel sounds, no guarding or mass", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "LAB", label: "Basic metabolic panel", value: "Sodium 138, potassium 3.6, bicarbonate 18, blood urea nitrogen 22, creatinine 0.4, glucose 82", triggerActionCode: "ORDER_BMP" },
    { category: "LAB", label: "Bedside glucose", value: "82", units: "mg/dL", triggerActionCode: "ORDER_GLUCOSE" },
  ],

  actionRules: [
    { actionCode: "EXAM_GENERAL", classification: "REQUIRED", resultText: "Alert and interactive. Dry mucous membranes, decreased tears, capillary refill three seconds. This is moderate dehydration, not shock.", feedbackText: "The physical examination is how dehydration severity is graded in children; laboratory values add little.", conceptCode: "PEDS.DEHY.01" },
    { actionCode: "GIVE_ORAL_REHYDRATION", classification: "REQUIRED", resultText: "Oral rehydration solution given in small frequent volumes by syringe. She tolerates it and has a wet diaper within two hours.", feedbackText: "Oral rehydration is first-line for mild to moderate dehydration and is as effective as intravenous fluid with fewer complications.", conceptCode: "PEDS.DEHY.02" },
    { actionCode: "GIVE_ANTIEMETIC", classification: "APPROPRIATE", resultText: "A single weight-based dose of ondansetron given, after which she keeps down the oral rehydration solution.", feedbackText: "A single antiemetic dose substantially improves the success rate of oral rehydration in vomiting children.", conceptCode: "PEDS.DEHY.02" },
    { actionCode: "ORDER_GLUCOSE", classification: "APPROPRIATE", resultText: "Bedside glucose 82 mg/dL.", feedbackText: "Young children deplete glycogen stores quickly and hypoglycemia is easy to miss." },
    { actionCode: "ORDER_BMP", classification: "OPTIONAL", resultText: "Sodium 138, potassium 3.6, bicarbonate 18, blood urea nitrogen 22, creatinine 0.4, glucose 82.", feedbackText: "Electrolytes are not required for routine moderate dehydration; they are useful if the child is severely dehydrated or the picture is atypical.", conceptCode: "PEDS.DEHY.01" },
    { actionCode: "GIVE_IV_FLUIDS", classification: "OPTIONAL", resultText: "An intravenous line is available. She is tolerating oral rehydration, so intravenous fluid is not required at this time.", feedbackText: "Intravenous isotonic fluid is reserved for shock, altered mental status, or failure of oral rehydration.", conceptCode: "PEDS.DEHY.03" },
    { actionCode: "HX_ADDITIONAL", classification: "REQUIRED", resultText: "Non-bloody, non-bilious vomiting with watery stools. Sick contacts at daycare. Immunizations up to date.", feedbackText: "The absence of bile, blood and severe abdominal findings makes a surgical cause unlikely.", conceptCode: "PEDS.DEHY.04" },
    { actionCode: "ADMIT_OBSERVATION", classification: "APPROPRIATE", resultText: "Observed in a short-stay unit while oral rehydration proceeds and urine output is confirmed.", feedbackText: "A period of observation confirms she can maintain hydration before she goes home." },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "UNNECESSARY", resultText: "No fever above 39, no bloody stool, no toxic appearance. This is viral gastroenteritis and antibiotics are not indicated.", feedbackText: "Most pediatric gastroenteritis is viral. Antibiotics add adverse effects without benefit and can worsen some bacterial causes.", conceptCode: "PEDS.DEHY.04" },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "UNNECESSARY", resultText: "No acute intra-abdominal abnormality.", feedbackText: "Radiation exposure in a child without surgical features is not justified." },
    { actionCode: "ORDER_BLOOD_CULTURES", classification: "UNNECESSARY", resultText: "No growth.", feedbackText: "She is not toxic-appearing or febrile enough to warrant a blood culture." },
    { actionCode: "ADMIT_ICU", classification: "UNNECESSARY", resultText: "She is alert and perfusing with a normal blood pressure. Intensive care is not indicated.", feedbackText: "Intensive care is for shock or altered mental status, neither of which she has." },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the severity of her dehydration?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Moderate — dry mucous membranes, decreased tears, delayed capillary refill, but alert and perfusing" },
        { key: "b", text: "Mild — no clinical signs of volume depletion" },
        { key: "c", text: "Severe with shock — lethargy, mottling and absent peripheral pulses" },
        { key: "d", text: "Cannot be determined without serum electrolytes" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Alertness and a normal blood pressure exclude shock, while the dry membranes and delayed capillary refill place her in the moderate category.",
      incorrectFeedback: "She has clear signs of volume depletion but remains alert with a normal blood pressure. That is moderate dehydration, and it is a clinical determination.",
      conceptCode: "PEDS.DEHY.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate first-line rehydration strategy?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Oral rehydration solution in small frequent volumes, with an antiemetic if vomiting limits intake" },
        { key: "b", text: "Immediate intravenous bolus for all children with vomiting" },
        { key: "c", text: "Plain water in large volumes" },
        { key: "d", text: "Withhold all fluids until the vomiting stops on its own" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Oral rehydration works for moderate dehydration and avoids the complications of intravenous access in a small child.",
      incorrectFeedback: "Plain water in large volumes risks hyponatremia, and withholding fluid worsens the deficit. Small frequent volumes of oral rehydration solution is the answer.",
      conceptCode: "PEDS.DEHY.02",
    },
    {
      stage: "ROUNDS",
      promptText: "What indicates successful rehydration?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Improved urine output, moist mucous membranes, normal capillary refill, weight gain and improved activity" },
        { key: "b", text: "Normalization of the serum bicarbonate alone" },
        { key: "c", text: "Complete cessation of all diarrhea" },
        { key: "d", text: "A single wet diaper regardless of examination findings" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Diarrhea can continue for days after hydration is restored — you are following perfusion and urine output, not stool frequency.",
      incorrectFeedback: "Diarrhea often outlasts the dehydration. Successful rehydration is judged by urine output, examination findings, weight and activity.",
      conceptCode: "PEDS.DEHY.01",
    },
    {
      stage: "ROUNDS",
      promptText: "When is intravenous therapy preferred over oral rehydration?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Severe dehydration or shock, altered mental status, intractable vomiting, or failure of an adequate oral rehydration trial" },
        { key: "b", text: "Any child who has vomited more than once" },
        { key: "c", text: "Any child under two years of age" },
        { key: "d", text: "Whenever the caregiver requests it" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Intravenous fluid is for children who cannot use their gut or who are in shock.",
      incorrectFeedback: "Age and a history of vomiting are not by themselves indications. Shock, altered mental status and failed oral therapy are.",
      conceptCode: "PEDS.DEHY.03",
    },
    {
      stage: "ROUNDS",
      promptText: "Should she receive antibiotics?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "No — this is almost certainly viral, and antibiotics add risk without benefit" },
        { key: "b", text: "Yes — all children with diarrhea should receive empiric antibiotics" },
        { key: "c", text: "Yes — because she has a temperature of 37.9" },
        { key: "d", text: "Yes — to shorten the duration of diarrhea in all cases" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Non-bloody watery diarrhea with sick daycare contacts is viral, and antibiotics can worsen some bacterial causes as well.",
      incorrectFeedback: "Most pediatric gastroenteritis is viral and self-limited. Antibiotics are reserved for specific bacterial or parasitic indications.",
      conceptCode: "PEDS.DEHY.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "She is tolerating fluids and making urine. What discharge counseling does her mother need?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "How to give oral rehydration solution at home, to resume a normal age-appropriate diet, and specific return precautions for reduced urine output, lethargy, bloody stool or persistent vomiting" },
        { key: "b", text: "To restrict all food for one week" },
        { key: "c", text: "To give plain water exclusively until the diarrhea stops" },
        { key: "d", text: "To return only if she develops a fever above 40 degrees" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Explicit, concrete return precautions are the safety net that makes discharge appropriate.",
      incorrectFeedback: "Prolonged food restriction and water-only regimens cause harm. Resume normal feeding, continue oral rehydration solution, and give specific return precautions.",
      conceptCode: "PEDS.DEHY.05",
    },
  ],
};
