/** DEMO CASE 16 — Ectopic pregnancy. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_OB_002: CaseTemplateInput = {
  code: "DEMO-OB-002",
  title: "Ectopic Pregnancy",
  specialty: "OB/GYN",
  topic: "Early Pregnancy",
  primaryDiagnosis: "Ectopic pregnancy",
  difficulty: 3,
  step3Importance: 5,

  handoffScript:
    "This is a 27-year-old woman who came in with three days of right-sided pelvic pain and light vaginal spotting. Her last menstrual period was about seven weeks ago. Her urine pregnancy test was positive and her quantitative beta-hCG came back at 3,200. Transvaginal ultrasound showed no intrauterine pregnancy and a two centimeter right adnexal mass with a small amount of free fluid in the pelvis. She has been hemodynamically stable throughout, heart rate in the 80s, blood pressure 118 over 72, and her hemoglobin is 12.4. She is blood type O negative so she received Rh immune globulin. Gynecology has seen her and is discussing methotrexate versus laparoscopy with her this morning.",
  dailySignout:
    "27-year-old woman with an ectopic pregnancy, hemodynamically stable with a beta-hCG of 3,200 and a right adnexal mass. Rh immune globulin given. Gynecology discussing medical versus surgical management.",
  admissionOpening:
    "A 27-year-old woman presents with three days of right-sided pelvic pain and light vaginal spotting. Her last menstrual period was about seven weeks ago.",
  teachingPoint:
    "In any woman of reproductive age with pelvic pain, the pregnancy test comes first. A positive test with no intrauterine pregnancy on ultrasound is an ectopic pregnancy until proven otherwise, and the very next question is whether she is hemodynamically stable.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "OB.ECTOPIC.01", weight: 1 },
    { code: "OB.ECTOPIC.02", weight: 1 },
    { code: "OB.ECTOPIC.03", weight: 1 },
    { code: "OB.ECTOPIC.04", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "84", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "118/72", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "16", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "36.9", units: "C", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Three days of right-sided pelvic pain with light vaginal spotting", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "Last menstrual period seven weeks ago. Prior chlamydial infection treated at age 22. No prior ectopic pregnancy. Reliable transportation and able to return for follow-up.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "EXAM", label: "Abdomen", value: "Soft with right lower quadrant tenderness, no rebound or guarding, no distension", triggerActionCode: "EXAM_ABDOMEN" },
    { category: "EXAM", label: "General appearance", value: "Comfortable at rest, well perfused, no pallor", triggerActionCode: "EXAM_GENERAL" },
    { category: "LAB", label: "Quantitative beta-hCG", value: "3,200", units: "mIU/mL", triggerActionCode: "ORDER_HCG" },
    { category: "IMAGING", label: "Transvaginal ultrasound", value: "No intrauterine gestational sac. Two centimeter right adnexal mass with a small amount of free pelvic fluid.", triggerActionCode: "ORDER_TRANSVAGINAL_US" },
    { category: "LAB", label: "Complete blood count", value: "Hemoglobin 12.4, platelets 260, white count 8.8", triggerActionCode: "ORDER_CBC" },
    { category: "LAB", label: "Type and screen", value: "Blood type O negative. Rh immune globulin indicated and given.", triggerActionCode: "ORDER_TYPE_AND_SCREEN" },
    { category: "LAB", label: "Comprehensive metabolic panel", value: "Normal liver enzymes and creatinine, relevant before methotrexate", triggerActionCode: "ORDER_CMP" },
  ],

  actionRules: [
    { actionCode: "ORDER_HCG", classification: "REQUIRED", resultText: "Quantitative beta-hCG 3,200 mIU/mL.", feedbackText: "The quantitative value is interpreted against the ultrasound: above the discriminatory zone with no intrauterine pregnancy is highly concerning for ectopic.", conceptCode: "OB.ECTOPIC.03" },
    { actionCode: "ORDER_TRANSVAGINAL_US", classification: "REQUIRED", resultText: "No intrauterine gestational sac. Two centimeter right adnexal mass with a small amount of free pelvic fluid.", feedbackText: "Transvaginal ultrasound is the imaging study of choice in early pregnancy.", conceptCode: "OB.ECTOPIC.03" },
    { actionCode: "EXAM_GENERAL", classification: "REQUIRED", resultText: "Comfortable at rest, well perfused, no pallor, normotensive without tachycardia.", feedbackText: "Stability determines whether this is a scheduled decision or an emergency laparotomy.", conceptCode: "OB.ECTOPIC.02" },
    { actionCode: "ORDER_CBC", classification: "REQUIRED", resultText: "Hemoglobin 12.4, platelets 260, white count 8.8.", feedbackText: "A baseline hemoglobin matters if she bleeds, and a normal count is reassuring against significant hemoperitoneum.", conceptCode: "OB.ECTOPIC.02" },
    { actionCode: "ORDER_TYPE_AND_SCREEN", classification: "REQUIRED", resultText: "Blood type O negative. Rh immune globulin indicated and administered.", feedbackText: "Rh-negative women with early pregnancy bleeding need Rh immune globulin, and blood must be available if she destabilizes.", conceptCode: "OB.ECTOPIC.02" },
    { actionCode: "CONSULT_OBGYN", classification: "REQUIRED", resultText: "Gynecology evaluates and discusses methotrexate versus laparoscopic management.", feedbackText: "The medical-versus-surgical decision is a specialist discussion with the patient.", conceptCode: "OB.ECTOPIC.04" },
    { actionCode: "ORDER_CMP", classification: "APPROPRIATE", resultText: "Normal liver enzymes and creatinine.", feedbackText: "Hepatic and renal function must be checked before methotrexate.", conceptCode: "OB.ECTOPIC.04" },
    { actionCode: "GIVE_METHOTREXATE", classification: "APPROPRIATE", resultText: "Methotrexate given after confirming stability, an unruptured mass, acceptable beta-hCG, normal organ function, and her ability to return for serial monitoring.", feedbackText: "Medical management is appropriate for a stable patient with an unruptured ectopic who can reliably follow up.", conceptCode: "OB.ECTOPIC.04" },
    { actionCode: "ADMIT_OR", classification: "OPTIONAL", resultText: "Laparoscopy is available and would be the choice if she became unstable, if the mass ruptured, or if she preferred definitive surgical management.", feedbackText: "Surgery is mandatory for instability or rupture and is a reasonable elective choice otherwise.", conceptCode: "OB.ECTOPIC.04" },
    { actionCode: "GIVE_IV_FLUIDS", classification: "APPROPRIATE", resultText: "Intravenous access established with maintenance fluids in case of deterioration.", feedbackText: "Access is prudent in any patient who could rupture." },
    { actionCode: "GIVE_ANALGESIA", classification: "APPROPRIATE", resultText: "Analgesia given with improvement in pain.", feedbackText: "Analgesia does not obscure the diagnosis here, which rests on ultrasound and beta-hCG." },
    { actionCode: "ORDER_CT_ABDOMEN", classification: "UNNECESSARY", resultText: "Right adnexal mass noted, consistent with the ultrasound findings.", feedbackText: "Computed tomography adds radiation without adding information beyond the transvaginal ultrasound in early pregnancy." },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "Discharging without a management decision and a follow-up plan risks rupture at home.", feedbackText: "An ectopic pregnancy requires a definitive plan — medical or surgical — with structured follow-up before the patient leaves.", conceptCode: "OB.ECTOPIC.04" },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the diagnosis?",
      responseType: "DIAGNOSIS",
      answerConfig: { kind: "DIAGNOSIS", choices: [
        { key: "ectopic", text: "Ectopic pregnancy" },
        { key: "iup", text: "Normal early intrauterine pregnancy" },
        { key: "miscarriage", text: "Completed spontaneous abortion" },
        { key: "cyst", text: "Ruptured ovarian cyst in a non-pregnant patient" },
      ], correctKey: "ectopic" },
      correctFeedback: "Correct. A positive pregnancy test with a beta-hCG above the discriminatory zone, no intrauterine pregnancy and an adnexal mass.",
      incorrectFeedback: "At this beta-hCG level an intrauterine pregnancy should be visible. Its absence with an adnexal mass is an ectopic pregnancy.",
      conceptCode: "OB.ECTOPIC.01",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the immediate next assessment that determines management?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Hemodynamic stability — blood pressure, heart rate, perfusion and hemoglobin" },
        { key: "b", text: "Her exact gestational age by dating criteria" },
        { key: "c", text: "Her preference for future fertility" },
        { key: "d", text: "Whether she has a family history of ectopic pregnancy" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Instability means the operating room now; stability opens the medical-versus-surgical discussion.",
      incorrectFeedback: "Stability is the branch point. Everything else is a subsequent conversation.",
      conceptCode: "OB.ECTOPIC.02",
    },
    {
      stage: "ROUNDS",
      promptText: "Which findings would mandate operative management?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Hemodynamic instability, signs of rupture with significant hemoperitoneum, or failure of medical management" },
        { key: "b", text: "Any beta-hCG above 1,000" },
        { key: "c", text: "Any degree of pelvic pain" },
        { key: "d", text: "A patient preference for a shorter hospital stay" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Rupture with hemodynamic compromise is a surgical emergency and no medical option applies.",
      incorrectFeedback: "Pain and beta-hCG values alone do not mandate surgery. Instability, rupture and failed medical therapy do.",
      conceptCode: "OB.ECTOPIC.02",
    },
    {
      stage: "ROUNDS",
      promptText: "When is methotrexate a reasonable option?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A hemodynamically stable patient with an unruptured ectopic, an acceptable beta-hCG and mass size, normal hepatic renal and hematologic function, and reliable follow-up" },
        { key: "b", text: "Any patient with an ectopic pregnancy regardless of stability" },
        { key: "c", text: "Only after laparoscopy has already been performed" },
        { key: "d", text: "In a patient with active intraperitoneal bleeding" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Reliable follow-up is as much a criterion as the laboratory values — the treatment depends on serial monitoring.",
      incorrectFeedback: "Methotrexate requires stability, an unruptured mass, acceptable laboratory parameters and a patient who will return for serial beta-hCG monitoring.",
      conceptCode: "OB.ECTOPIC.04",
    },
    {
      stage: "ROUNDS",
      promptText: "What follow-up is required after methotrexate?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Serial beta-hCG measurements until undetectable, with a second dose or surgery if the decline is inadequate, plus avoidance of folate supplements and alcohol" },
        { key: "b", text: "A single beta-hCG one month later" },
        { key: "c", text: "No follow-up once the pain resolves" },
        { key: "d", text: "A repeat ultrasound only, without beta-hCG monitoring" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The treatment is not complete until the beta-hCG is undetectable, and an inadequate decline requires escalation.",
      incorrectFeedback: "Methotrexate requires structured serial beta-hCG monitoring to confirm resolution and to detect treatment failure before rupture.",
      conceptCode: "OB.ECTOPIC.04",
    },
    {
      stage: "DISCHARGE",
      promptText: "She received methotrexate and remains stable. What is essential at discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A scheduled serial beta-hCG plan, explicit rupture warning signs with instructions to return immediately, and confirmation that Rh immune globulin was given" },
        { key: "b", text: "Routine follow-up in three months" },
        { key: "c", text: "No specific instructions, since the methotrexate has been given" },
        { key: "d", text: "Instructions to take a folate supplement daily" },
      ], correctKey: "a" },
      correctFeedback: "Correct. She can still rupture after methotrexate, so the return precautions and the monitoring schedule are the discharge deliverables.",
      incorrectFeedback: "Methotrexate is the start of treatment, not the end. She needs a serial monitoring schedule and explicit rupture warning signs.",
      conceptCode: "OB.ECTOPIC.04",
    },
  ],
};
