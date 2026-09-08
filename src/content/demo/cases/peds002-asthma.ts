/** DEMO CASE 14 — Pediatric asthma exacerbation. Synthetic demo content. */

import type { CaseTemplateInput } from "@/content/schema";

export const CASE_PEDS_002: CaseTemplateInput = {
  code: "DEMO-PEDS-002",
  title: "Acute Pediatric Asthma Exacerbation",
  specialty: "Pediatrics",
  topic: "Pulmonology",
  primaryDiagnosis: "Acute asthma exacerbation",
  difficulty: 3,
  step3Importance: 4,

  handoffScript:
    "This is a 9-year-old boy with known asthma who came in with two days of cough and wheeze that got much worse this evening. On arrival his respiratory rate was 34 with subcostal and intercostal retractions, he was speaking in short phrases, and his saturation was 91 percent on room air. He got three back-to-back albuterol and ipratropium treatments and an oral corticosteroid within the first 30 minutes. He improved substantially: he is now speaking in full sentences, saturating 95 percent on room air, with mild end-expiratory wheeze. His mother tells me he has only a rescue inhaler and no controller medication, and he has been to the emergency department twice this year.",
  dailySignout:
    "9-year-old with an asthma exacerbation, much improved after bronchodilators and systemic steroids. Now on room air, speaking in full sentences, spacing out albuterol treatments. No controller therapy at home.",
  admissionOpening:
    "A 9-year-old boy with asthma is brought in with worsening wheeze and difficulty breathing. He is sitting upright, using his accessory muscles, and can only speak in short phrases.",
  teachingPoint:
    "Asthma severity is assessed at the bedside: how the child speaks, how hard they are working, how much air is moving, and the saturation. The two interventions that change the course are repeated inhaled bronchodilators and early systemic corticosteroids.",

  minimumRoundsBeforeDischarge: 2,

  concepts: [
    { code: "PEDS.ASTHMA.01", weight: 1 },
    { code: "PEDS.ASTHMA.02", weight: 1 },
    { code: "PEDS.ASTHMA.03", weight: 1 },
    { code: "PEDS.ASTHMA.04", weight: 0.8 },
    { code: "PEDS.ASTHMA.05", weight: 1 },
  ],

  findings: [
    { category: "VITAL", label: "Heart rate", value: "128", units: "bpm", initiallyVisible: true },
    { category: "VITAL", label: "Respiratory rate", value: "34", units: "breaths/min", initiallyVisible: true },
    { category: "VITAL", label: "Blood pressure", value: "104/64", units: "mmHg", initiallyVisible: true },
    { category: "VITAL", label: "Oxygen saturation", value: "91% on room air", initiallyVisible: true },
    { category: "VITAL", label: "Temperature", value: "37.1", units: "C", initiallyVisible: true },
    { category: "HISTORY", label: "Chief complaint", value: "Two days of cough and wheeze, markedly worse this evening", initiallyVisible: true },
    { category: "HISTORY", label: "Additional history", value: "Known asthma since age four. Two emergency department visits this year. No prior intubation or intensive care admission.", triggerActionCode: "HX_ADDITIONAL" },
    { category: "HISTORY", label: "Medications", value: "Albuterol rescue inhaler only. No controller medication. No spacer. Poor inhaler technique demonstrated.", triggerActionCode: "HX_MEDICATIONS" },
    { category: "EXAM", label: "General appearance", value: "Sitting upright, speaking in short phrases, subcostal and intercostal retractions, alert", triggerActionCode: "EXAM_GENERAL" },
    { category: "EXAM", label: "Cardiopulmonary", value: "Diffuse expiratory wheeze with a prolonged expiratory phase and reduced air movement at both bases", triggerActionCode: "EXAM_CARDIOPULMONARY" },
    { category: "IMAGING", label: "Chest radiograph", value: "Hyperinflation without focal infiltrate or pneumothorax", triggerActionCode: "ORDER_CXR" },
    { category: "LAB", label: "Venous blood gas", value: "pH 7.42, pCO2 33 — appropriate respiratory alkalosis from tachypnea", triggerActionCode: "ORDER_ABG" },
  ],

  actionRules: [
    { actionCode: "GIVE_BRONCHODILATOR", classification: "REQUIRED", resultText: "Three back-to-back albuterol and ipratropium treatments given. Retractions resolve, he speaks in full sentences, and saturation improves to 95% on room air.", feedbackText: "Repeated inhaled short-acting bronchodilator is the immediate first-line therapy and is given back-to-back in moderate to severe exacerbations.", conceptCode: "PEDS.ASTHMA.02" },
    { actionCode: "GIVE_STEROID", classification: "REQUIRED", resultText: "Oral corticosteroid given within 30 minutes of arrival.", feedbackText: "Early systemic corticosteroids reduce hospitalization and relapse. Giving them early matters more than the route.", conceptCode: "PEDS.ASTHMA.03" },
    { actionCode: "EXAM_GENERAL", classification: "REQUIRED", resultText: "Sitting upright, speaking in short phrases with subcostal and intercostal retractions, but alert and interactive.", feedbackText: "Speech, work of breathing, air movement and mental status are how severity is graded.", conceptCode: "PEDS.ASTHMA.01" },
    { actionCode: "GIVE_OXYGEN", classification: "APPROPRIATE", resultText: "Supplemental oxygen given for a saturation of 91%, titrated off as he improves.", feedbackText: "Oxygen is given for hypoxemia and weaned as obstruction resolves.", conceptCode: "PEDS.ASTHMA.01" },
    { actionCode: "GIVE_MAGNESIUM", classification: "OPTIONAL", resultText: "Intravenous magnesium is available. He responded well to bronchodilators and steroids, so it is not required tonight.", feedbackText: "Magnesium is an adjunct for severe exacerbations that fail to respond to initial bronchodilator and steroid therapy.", conceptCode: "PEDS.ASTHMA.04" },
    { actionCode: "ORDER_CXR", classification: "OPTIONAL", resultText: "Hyperinflation without focal infiltrate or pneumothorax.", feedbackText: "A radiograph is not routine; it is reserved for asymmetric findings, fever, or suspicion of pneumothorax." },
    { actionCode: "ORDER_ABG", classification: "OPTIONAL", resultText: "pH 7.42, pCO2 33 — appropriate respiratory alkalosis from tachypnea.", feedbackText: "A normal or rising carbon dioxide in a tachypneic asthmatic is ominous and signals fatigue.", conceptCode: "PEDS.ASTHMA.01" },
    { actionCode: "HX_MEDICATIONS", classification: "REQUIRED", resultText: "Albuterol rescue inhaler only, no controller medication, no spacer, poor technique.", feedbackText: "Two emergency visits in a year with no controller therapy is the finding that predicts the next visit.", conceptCode: "PEDS.ASTHMA.05" },
    { actionCode: "ADMIT_OBSERVATION", classification: "APPROPRIATE", resultText: "Observed while albuterol treatments are spaced out to confirm he maintains improvement.", feedbackText: "A period of observation confirms that improvement is sustained as bronchodilator frequency is reduced." },
    { actionCode: "GIVE_BROAD_ANTIBIOTICS", classification: "UNNECESSARY", resultText: "He is afebrile with no infiltrate. Antibiotics are not indicated for an asthma exacerbation.", feedbackText: "Wheeze is bronchospasm, not infection. Antibiotics have no role without evidence of bacterial pneumonia." },
    { actionCode: "GIVE_BENZODIAZEPINE", classification: "CONTRAINDICATED", resultText: "Sedating a child with respiratory distress blunts respiratory drive and can precipitate respiratory arrest.", feedbackText: "Anxiety in an asthmatic is hypoxia and air hunger. Treat the obstruction, not the anxiety.", conceptCode: "PEDS.ASTHMA.01" },
    { actionCode: "DISCHARGE_HOME", classification: "CONTRAINDICATED", resultText: "At presentation he is hypoxemic with retractions and speaking in short phrases. Discharging before treatment and reassessment would be unsafe.", feedbackText: "Discharge follows a documented, sustained response to therapy — not the initial presentation.", conceptCode: "PEDS.ASTHMA.05" },
  ],

  prompts: [
    {
      stage: "ADMISSION",
      promptText: "What is the immediate first-line treatment?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Repeated inhaled short-acting bronchodilator plus early systemic corticosteroid" },
        { key: "b", text: "Intravenous antibiotics" },
        { key: "c", text: "An inhaled corticosteroid alone" },
        { key: "d", text: "Observation without treatment to see whether he improves" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Bronchodilators relieve the obstruction immediately and steroids treat the inflammation that drives relapse.",
      incorrectFeedback: "Inhaled corticosteroids are controller therapy, not acute treatment. The acute pair is a short-acting bronchodilator plus a systemic steroid.",
      conceptCode: "PEDS.ASTHMA.02",
    },
    {
      stage: "ADMISSION",
      promptText: "What is the appropriate disposition after he improves?",
      responseType: "DISPOSITION",
      answerConfig: { kind: "DISPOSITION", choices: [
        { key: "obs", text: "Observation while bronchodilator treatments are spaced out, then reassess for discharge" },
        { key: "icu", text: "Immediate intensive care admission" },
        { key: "home", text: "Immediate discharge without a period of observation" },
        { key: "floor", text: "Admit for a mandatory five-day inpatient stay" },
      ], correctKey: "obs" },
      correctFeedback: "Correct. You need to see that improvement is sustained as treatment frequency decreases.",
      incorrectFeedback: "He responded well, so intensive care is not needed; but discharging immediately after back-to-back treatments risks rebound. Observe as treatments are spaced.",
      conceptCode: "PEDS.ASTHMA.01",
    },
    {
      stage: "ROUNDS",
      promptText: "Which findings would indicate a severe or life-threatening exacerbation?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Inability to speak in phrases, a silent chest with poor air movement, drowsiness or agitation, and a normal or rising carbon dioxide" },
        { key: "b", text: "Loud musical wheeze heard across the room" },
        { key: "c", text: "A heart rate of 128 after albuterol treatments" },
        { key: "d", text: "A cough that has been present for two days" },
      ], correctKey: "a" },
      correctFeedback: "Correct. A silent chest and a rising carbon dioxide mean the child is tiring — those are the pre-arrest findings.",
      incorrectFeedback: "Audible wheeze means air is moving. Tachycardia after albuterol is expected. The dangerous signs are a quiet chest, altered mental status and a normalizing carbon dioxide.",
      conceptCode: "PEDS.ASTHMA.01",
    },
    {
      stage: "ROUNDS",
      promptText: "When should intravenous magnesium be considered?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "In a severe exacerbation that has not responded adequately to initial bronchodilators and systemic corticosteroids" },
        { key: "b", text: "As first-line therapy for every exacerbation" },
        { key: "c", text: "Only after the child has been intubated" },
        { key: "d", text: "As a substitute for systemic corticosteroids" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Magnesium is an adjunct for severe disease that is failing standard therapy.",
      incorrectFeedback: "Magnesium is second-line. It supplements, rather than replaces, bronchodilators and steroids in severe exacerbations.",
      conceptCode: "PEDS.ASTHMA.04",
    },
    {
      stage: "ROUNDS",
      promptText: "He has had two emergency visits this year on rescue inhaler alone. What does that indicate?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "Inadequately controlled asthma requiring initiation of controller therapy and an action plan" },
        { key: "b", text: "Well-controlled asthma requiring no changes" },
        { key: "c", text: "That his rescue inhaler dose should simply be increased" },
        { key: "d", text: "That he has outgrown his asthma" },
      ], correctKey: "a" },
      correctFeedback: "Correct. Frequent exacerbations on rescue therapy alone is the definition of inadequate control and the signal to step up.",
      incorrectFeedback: "Repeated exacerbations mean the underlying inflammation is untreated. He needs controller therapy, not more rescue medication.",
      conceptCode: "PEDS.ASTHMA.05",
    },
    {
      stage: "DISCHARGE",
      promptText: "He is on room air with mild wheeze. What must be addressed before discharge?",
      responseType: "MULTIPLE_CHOICE",
      answerConfig: { kind: "MULTIPLE_CHOICE", choices: [
        { key: "a", text: "A steroid course to complete, initiation of controller therapy, a spacer with technique taught and observed, a written action plan, trigger review and follow-up" },
        { key: "b", text: "A new rescue inhaler alone" },
        { key: "c", text: "A prescription for antibiotics to take if he wheezes again" },
        { key: "d", text: "Nothing further, since he is now on room air" },
      ], correctKey: "a" },
      correctFeedback: "Correct. The visit is only useful if it changes what happens at home: controller therapy, a spacer, correct technique and a written plan.",
      incorrectFeedback: "Sending him home with the same rescue-only regimen guarantees a third visit. Controller therapy, spacer technique and an action plan are the deliverables.",
      conceptCode: "PEDS.ASTHMA.05",
    },
  ],
};
