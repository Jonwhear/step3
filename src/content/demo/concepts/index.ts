/**
 * Synthetic demo concepts.
 *
 * Concepts are the invisible scaffolding: the learner never browses them, but
 * mastery, spaced repetition and curriculum coverage are all computed on them.
 *
 * All records here are synthetic teaching material written for this demo.
 */

import type { ConceptInput } from "@/content/schema";

export const DEMO_CONCEPTS: ConceptInput[] = [
  /* ------------------------------- Cardiology ------------------------------ */
  { code: "CARD.AF.01", name: "Recognize atrial fibrillation on ECG", specialty: "Internal Medicine", topic: "Cardiology", description: "Identify an irregularly irregular narrow-complex rhythm without discrete P waves.", importance: 5 },
  { code: "CARD.AF.02", name: "Assess hemodynamic stability in atrial fibrillation", specialty: "Internal Medicine", topic: "Cardiology", description: "Separate stable rapid ventricular response from unstable arrhythmia requiring immediate cardioversion.", importance: 5 },
  { code: "CARD.AF.03", name: "Rate control in stable atrial fibrillation", specialty: "Internal Medicine", topic: "Cardiology", description: "Choose an appropriate rate-controlling agent for a hemodynamically stable patient.", importance: 4 },
  { code: "CARD.AF.04", name: "Assess stroke risk and anticoagulation in atrial fibrillation", specialty: "Internal Medicine", topic: "Cardiology", description: "Apply a validated risk score and weigh bleeding risk before starting anticoagulation.", importance: 5 },
  { code: "CARD.ACS.01", name: "Recognize acute coronary syndrome", specialty: "Internal Medicine", topic: "Cardiology", description: "Identify ischemic chest pain patterns and the populations with atypical presentations.", importance: 5 },
  { code: "CARD.ACS.02", name: "Interpret the initial ECG in chest pain", specialty: "Internal Medicine", topic: "Cardiology", description: "Distinguish ST elevation from ST depression and understand what each implies for reperfusion.", importance: 5 },
  { code: "CARD.ACS.03", name: "Initial antiplatelet and anticoagulant therapy in ACS", specialty: "Internal Medicine", topic: "Cardiology", description: "Give aspirin promptly and add anticoagulation for non-ST-elevation myocardial infarction.", importance: 5 },
  { code: "CARD.ACS.04", name: "Serial troponin and risk stratification", specialty: "Internal Medicine", topic: "Cardiology", description: "Use serial biomarkers and clinical risk to decide urgency of invasive evaluation.", importance: 4 },
  { code: "CARD.ACS.05", name: "Secondary prevention after myocardial infarction", specialty: "Internal Medicine", topic: "Cardiology", description: "Antiplatelet therapy, high-intensity statin, beta blocker and risk-factor modification.", importance: 5 },
  { code: "CARD.HF.01", name: "Recognize volume overload in heart failure", specialty: "Internal Medicine", topic: "Cardiology", description: "Elevated jugular venous pressure, crackles, edema and congestion on chest radiograph.", importance: 5 },
  { code: "CARD.HF.02", name: "Intravenous loop diuresis and response assessment", specialty: "Internal Medicine", topic: "Cardiology", description: "Track daily weights, strict intake and output, and symptom response to guide dosing.", importance: 4 },
  { code: "CARD.HF.03", name: "Monitor electrolytes and renal function during diuresis", specialty: "Internal Medicine", topic: "Cardiology", description: "Anticipate hypokalemia and rising creatinine during aggressive decongestion.", importance: 4 },
  { code: "CARD.HF.04", name: "Guideline-directed chronic heart failure therapy", specialty: "Internal Medicine", topic: "Cardiology", description: "Identify the chronic therapies that reduce mortality in reduced ejection fraction.", importance: 5 },
  { code: "CARD.CP.01", name: "Structured approach to undifferentiated chest pain", specialty: "Internal Medicine", topic: "Cardiology", description: "Consider life-threatening causes first and select initial testing accordingly.", importance: 5 },

  /* ------------------------------- Pulmonary ------------------------------- */
  { code: "PULM.CAP.01", name: "Diagnose community-acquired pneumonia", specialty: "Internal Medicine", topic: "Pulmonology", description: "Combine fever, cough, focal findings and a radiographic infiltrate.", importance: 5 },
  { code: "PULM.CAP.02", name: "Assess pneumonia severity and site of care", specialty: "Internal Medicine", topic: "Pulmonology", description: "Use severity indices and oxygenation to decide ward, step-down or intensive care.", importance: 4 },
  { code: "PULM.CAP.03", name: "Select empiric antibiotics for inpatient pneumonia", specialty: "Internal Medicine", topic: "Pulmonology", description: "Cover typical and atypical organisms in the non-critically ill inpatient.", importance: 5 },
  { code: "PULM.CAP.04", name: "Determine discharge readiness in pneumonia", specialty: "Internal Medicine", topic: "Pulmonology", description: "Clinical stability on room air or baseline oxygen, tolerating oral intake, stable vitals.", importance: 4 },
  { code: "PULM.CAP.05", name: "Preventive measures after pneumonia", specialty: "Internal Medicine", topic: "Pulmonology", description: "Vaccination and smoking cessation at discharge.", importance: 3 },
  { code: "PULM.COPD.01", name: "Bronchodilator therapy in COPD exacerbation", specialty: "Internal Medicine", topic: "Pulmonology", description: "Short-acting inhaled beta agonist with or without an anticholinergic as first-line.", importance: 5 },
  { code: "PULM.COPD.02", name: "Systemic glucocorticoids in COPD exacerbation", specialty: "Internal Medicine", topic: "Pulmonology", description: "A short course shortens recovery and reduces treatment failure.", importance: 4 },
  { code: "PULM.COPD.03", name: "Controlled oxygen targets in COPD", specialty: "Internal Medicine", topic: "Pulmonology", description: "Titrate to a modest saturation target rather than maximal oxygen.", importance: 4 },
  { code: "PULM.COPD.04", name: "Indications for noninvasive ventilation", specialty: "Internal Medicine", topic: "Pulmonology", description: "Respiratory acidosis or severe dyspnea with increased work of breathing.", importance: 5 },
  { code: "PULM.COPD.05", name: "Antibiotic indications in COPD exacerbation", specialty: "Internal Medicine", topic: "Pulmonology", description: "Increased sputum purulence and volume with worsened dyspnea.", importance: 3 },

  /* ------------------------------- Endocrine ------------------------------- */
  { code: "ENDO.DKA.01", name: "Recognize diabetic ketoacidosis", specialty: "Internal Medicine", topic: "Endocrinology", description: "Hyperglycemia, anion-gap metabolic acidosis and ketosis.", importance: 5 },
  { code: "ENDO.DKA.02", name: "Fluid resuscitation precedes insulin in DKA", specialty: "Internal Medicine", topic: "Endocrinology", description: "Isotonic fluid restores perfusion and lowers glucose before insulin is started.", importance: 5 },
  { code: "ENDO.DKA.03", name: "Potassium assessment before insulin", specialty: "Internal Medicine", topic: "Endocrinology", description: "Total-body potassium is depleted; insulin drives potassium intracellularly.", importance: 5 },
  { code: "ENDO.DKA.04", name: "Monitor anion gap to guide DKA therapy", specialty: "Internal Medicine", topic: "Endocrinology", description: "Gap closure, not glucose alone, signals resolution.", importance: 4 },
  { code: "ENDO.DKA.05", name: "Transition from intravenous to subcutaneous insulin", specialty: "Internal Medicine", topic: "Endocrinology", description: "Overlap subcutaneous insulin before stopping the infusion.", importance: 4 },
  { code: "ENDO.DKA.06", name: "Identify the precipitating cause of DKA", specialty: "Internal Medicine", topic: "Endocrinology", description: "Infection, missed insulin, or a new diagnosis of diabetes.", importance: 4 },

  /* ---------------------------- Gastroenterology --------------------------- */
  { code: "GI.UGIB.01", name: "Stabilize before diagnosing in gastrointestinal bleeding", specialty: "Internal Medicine", topic: "Gastroenterology", description: "Large-bore access, fluids and blood products come before endoscopy.", importance: 5 },
  { code: "GI.UGIB.02", name: "Transfusion thresholds in upper GI bleeding", specialty: "Internal Medicine", topic: "Gastroenterology", description: "A restrictive strategy is preferred in most hemodynamically stable patients.", importance: 4 },
  { code: "GI.UGIB.03", name: "Role of proton pump inhibitor and endoscopy", specialty: "Internal Medicine", topic: "Gastroenterology", description: "Intravenous acid suppression plus timely endoscopy for diagnosis and hemostasis.", importance: 5 },
  { code: "GI.UGIB.04", name: "Medications that increase rebleeding risk", specialty: "Internal Medicine", topic: "Gastroenterology", description: "Anticoagulants, antiplatelets and nonsteroidal anti-inflammatory drugs.", importance: 4 },

  /* --------------------------- Infectious disease -------------------------- */
  { code: "ID.SEPSIS.01", name: "Recognize sepsis at the bedside", specialty: "Internal Medicine", topic: "Infectious Disease", description: "Infection plus organ dysfunction, hypotension or elevated lactate.", importance: 5 },
  { code: "ID.SEPSIS.02", name: "Obtain cultures before antibiotics when feasible", specialty: "Internal Medicine", topic: "Infectious Disease", description: "Blood and site-specific cultures without delaying therapy.", importance: 4 },
  { code: "ID.SEPSIS.03", name: "Early fluid resuscitation and reassessment", specialty: "Internal Medicine", topic: "Infectious Disease", description: "Give balanced crystalloid, then reassess perfusion, lactate and blood pressure.", importance: 5 },
  { code: "ID.SEPSIS.04", name: "Prompt empiric antibiotics in sepsis", specialty: "Internal Medicine", topic: "Infectious Disease", description: "Early appropriate coverage improves outcomes.", importance: 5 },
  { code: "ID.PYELO.01", name: "Recognize pyelonephritis and its complications", specialty: "Internal Medicine", topic: "Infectious Disease", description: "Fever and flank pain with pyuria; suspect obstruction when response is poor.", importance: 4 },
  { code: "ID.PYELO.02", name: "Transition to oral antibiotic therapy", specialty: "Internal Medicine", topic: "Infectious Disease", description: "Afebrile, improving and tolerating oral intake with a susceptible organism.", importance: 3 },

  /* -------------------------------- Neurology ------------------------------ */
  { code: "NEURO.STROKE.01", name: "Establish last-known-well time", specialty: "Neurology", topic: "Stroke", description: "The single datum that determines reperfusion eligibility.", importance: 5 },
  { code: "NEURO.STROKE.02", name: "Check glucose immediately in suspected stroke", specialty: "Neurology", topic: "Stroke", description: "Hypoglycemia is a reversible stroke mimic.", importance: 4 },
  { code: "NEURO.STROKE.03", name: "Noncontrast head CT before reperfusion", specialty: "Neurology", topic: "Stroke", description: "Excludes hemorrhage, which contraindicates thrombolysis.", importance: 5 },
  { code: "NEURO.STROKE.04", name: "Blood pressure management in acute stroke", specialty: "Neurology", topic: "Stroke", description: "Permissive hypertension unless thrombolysis is planned or extreme values occur.", importance: 4 },
  { code: "NEURO.STROKE.05", name: "Dysphagia screening before oral intake", specialty: "Neurology", topic: "Stroke", description: "A bedside swallow screen prevents aspiration pneumonia.", importance: 4 },
  { code: "NEURO.STROKE.06", name: "Mechanism-directed secondary prevention", specialty: "Neurology", topic: "Stroke", description: "Antiplatelet therapy, statin, and anticoagulation when cardioembolic.", importance: 5 },
  { code: "NEURO.SZ.01", name: "Define status epilepticus", specialty: "Neurology", topic: "Seizure", description: "Continuous seizure activity beyond five minutes or repeated seizures without recovery.", importance: 5 },
  { code: "NEURO.SZ.02", name: "Airway, breathing, circulation and glucose first", specialty: "Neurology", topic: "Seizure", description: "Stabilize and check a bedside glucose before pharmacotherapy escalates.", importance: 5 },
  { code: "NEURO.SZ.03", name: "Benzodiazepine as first-line therapy", specialty: "Neurology", topic: "Seizure", description: "An adequately dosed benzodiazepine is the initial abortive treatment.", importance: 5 },
  { code: "NEURO.SZ.04", name: "Second-line antiseizure medication", specialty: "Neurology", topic: "Seizure", description: "A non-benzodiazepine antiseizure medication follows if seizures persist.", importance: 5 },
  { code: "NEURO.SZ.05", name: "Investigate precipitating causes of seizure", specialty: "Neurology", topic: "Seizure", description: "Metabolic derangement, infection, intoxication, withdrawal, structural lesion.", importance: 4 },
  { code: "NEURO.COG.01", name: "Distinguish delirium from dementia", specialty: "Neurology", topic: "Stroke", description: "Acute fluctuating inattention versus chronic progressive cognitive decline.", importance: 5 },

  /* ------------------------------- Psychiatry ------------------------------ */
  { code: "PSYCH.SS.01", name: "Recognize serotonin syndrome", specialty: "Psychiatry", topic: "Toxicology", description: "Autonomic instability, altered mental status and neuromuscular excitability.", importance: 5 },
  { code: "PSYCH.SS.02", name: "Clonus and hyperreflexia as discriminating findings", specialty: "Psychiatry", topic: "Toxicology", description: "Lower-extremity predominant clonus strongly supports serotonin toxicity.", importance: 5 },
  { code: "PSYCH.SS.03", name: "Distinguish serotonin syndrome from neuroleptic malignant syndrome", specialty: "Psychiatry", topic: "Toxicology", description: "Rapid onset with hyperreflexia versus slow onset with lead-pipe rigidity.", importance: 5 },
  { code: "PSYCH.SS.04", name: "Identify precipitating serotonergic drug combinations", specialty: "Psychiatry", topic: "Toxicology", description: "Serotonin reuptake inhibitors combined with monoamine oxidase inhibition.", importance: 4 },
  { code: "PSYCH.SS.05", name: "Management of serotonin syndrome", specialty: "Psychiatry", topic: "Toxicology", description: "Stop the offending agents, provide supportive care and benzodiazepines.", importance: 5 },
  { code: "PSYCH.ETOH.01", name: "Recognize alcohol withdrawal", specialty: "Psychiatry", topic: "Substance Use", description: "Tremor, anxiety, tachycardia and diaphoresis after cessation of heavy use.", importance: 5 },
  { code: "PSYCH.ETOH.02", name: "Benzodiazepines as first-line withdrawal treatment", specialty: "Psychiatry", topic: "Substance Use", description: "Symptom-triggered dosing guided by a standardized severity scale.", importance: 5 },
  { code: "PSYCH.ETOH.03", name: "Thiamine before glucose in alcohol use disorder", specialty: "Psychiatry", topic: "Substance Use", description: "Prevents precipitating Wernicke encephalopathy.", importance: 5 },
  { code: "PSYCH.ETOH.04", name: "Identify severe withdrawal and delirium tremens", specialty: "Psychiatry", topic: "Substance Use", description: "Confusion, hallucinations, marked autonomic hyperactivity and seizures.", importance: 5 },

  /* ------------------------------- Pediatrics ------------------------------ */
  { code: "PEDS.DEHY.01", name: "Assess dehydration severity in children", specialty: "Pediatrics", topic: "Gastroenterology", description: "Capillary refill, mucous membranes, tears, activity and urine output.", importance: 5 },
  { code: "PEDS.DEHY.02", name: "Oral rehydration as first-line therapy", specialty: "Pediatrics", topic: "Gastroenterology", description: "Small frequent volumes of oral rehydration solution for mild to moderate dehydration.", importance: 5 },
  { code: "PEDS.DEHY.03", name: "Intravenous isotonic fluid for severe dehydration", specialty: "Pediatrics", topic: "Gastroenterology", description: "Weight-based boluses when oral therapy fails or shock is present.", importance: 4 },
  { code: "PEDS.DEHY.04", name: "Avoid unnecessary antibiotics in viral gastroenteritis", specialty: "Pediatrics", topic: "Gastroenterology", description: "Most pediatric gastroenteritis is viral and self-limited.", importance: 4 },
  { code: "PEDS.DEHY.05", name: "Caregiver return precautions at discharge", specialty: "Pediatrics", topic: "Gastroenterology", description: "Explicit warning signs and follow-up plan for the caregiver.", importance: 4 },
  { code: "PEDS.ASTHMA.01", name: "Assess asthma exacerbation severity", specialty: "Pediatrics", topic: "Pulmonology", description: "Work of breathing, air movement, speech, saturation and mental status.", importance: 5 },
  { code: "PEDS.ASTHMA.02", name: "Inhaled short-acting beta agonist first-line", specialty: "Pediatrics", topic: "Pulmonology", description: "Repeated or continuous administration according to severity.", importance: 5 },
  { code: "PEDS.ASTHMA.03", name: "Early systemic corticosteroids", specialty: "Pediatrics", topic: "Pulmonology", description: "Given early to reduce relapse and hospitalization.", importance: 5 },
  { code: "PEDS.ASTHMA.04", name: "Adjunctive magnesium in severe exacerbation", specialty: "Pediatrics", topic: "Pulmonology", description: "Considered when severe obstruction persists despite initial therapy.", importance: 3 },
  { code: "PEDS.ASTHMA.05", name: "Controller therapy and action plan at discharge", specialty: "Pediatrics", topic: "Pulmonology", description: "Inhaler technique, controller step-up and a written action plan.", importance: 4 },

  /* --------------------------------- OB/GYN -------------------------------- */
  { code: "OB.PREE.01", name: "Recognize preeclampsia with severe features", specialty: "OB/GYN", topic: "Obstetrics", description: "Severe hypertension, neurologic symptoms, or laboratory abnormalities.", importance: 5 },
  { code: "OB.PREE.02", name: "Magnesium sulfate for seizure prophylaxis", specialty: "OB/GYN", topic: "Obstetrics", description: "Given to prevent eclamptic seizures, not to lower blood pressure.", importance: 5 },
  { code: "OB.PREE.03", name: "Acute blood pressure control in pregnancy", specialty: "OB/GYN", topic: "Obstetrics", description: "Treat severe-range hypertension promptly with a pregnancy-appropriate agent.", importance: 5 },
  { code: "OB.PREE.04", name: "Delivery as definitive treatment", specialty: "OB/GYN", topic: "Obstetrics", description: "Timing balances gestational age against maternal and fetal risk.", importance: 5 },
  { code: "OB.PREE.05", name: "Maternal and fetal monitoring", specialty: "OB/GYN", topic: "Obstetrics", description: "Continuous fetal monitoring plus serial maternal laboratory studies.", importance: 4 },
  { code: "OB.ECTOPIC.01", name: "Recognize ectopic pregnancy", specialty: "OB/GYN", topic: "Early Pregnancy", description: "Positive pregnancy test with pelvic pain and no intrauterine pregnancy.", importance: 5 },
  { code: "OB.ECTOPIC.02", name: "Assess hemodynamic stability in early pregnancy bleeding", specialty: "OB/GYN", topic: "Early Pregnancy", description: "Instability suggests rupture and mandates operative management.", importance: 5 },
  { code: "OB.ECTOPIC.03", name: "Transvaginal ultrasound and beta-hCG interpretation", specialty: "OB/GYN", topic: "Early Pregnancy", description: "Correlate the discriminatory zone with ultrasound findings.", importance: 4 },
  { code: "OB.ECTOPIC.04", name: "Methotrexate versus surgical management", specialty: "OB/GYN", topic: "Early Pregnancy", description: "Medical therapy requires stability, reliability for follow-up and no contraindications.", importance: 5 },

  /* -------------------------------- Surgery -------------------------------- */
  { code: "SURG.APPY.01", name: "Recognize acute appendicitis", specialty: "Surgery", topic: "Acute Abdomen", description: "Migratory pain, anorexia and right lower quadrant tenderness.", importance: 5 },
  { code: "SURG.APPY.02", name: "Select appropriate imaging for appendicitis", specialty: "Surgery", topic: "Acute Abdomen", description: "Cross-sectional imaging in adults; ultrasound first in children and pregnancy.", importance: 4 },
  { code: "SURG.APPY.03", name: "Preoperative management and surgical consultation", specialty: "Surgery", topic: "Acute Abdomen", description: "Nothing by mouth, intravenous fluids, analgesia and antibiotics before the operating room.", importance: 5 },
  { code: "SURG.APPY.04", name: "Recognize perforated appendicitis", specialty: "Surgery", topic: "Acute Abdomen", description: "Diffuse peritonitis, high fever and systemic toxicity.", importance: 4 },
  { code: "SURG.CHOLE.01", name: "Distinguish biliary colic from acute cholecystitis", specialty: "Surgery", topic: "Biliary Disease", description: "Self-limited postprandial pain versus persistent pain with fever and inflammation.", importance: 5 },
  { code: "SURG.CHOLE.02", name: "Ultrasound as the initial biliary imaging study", specialty: "Surgery", topic: "Biliary Disease", description: "Stones, wall thickening and pericholecystic fluid.", importance: 5 },
  { code: "SURG.CHOLE.03", name: "Early cholecystectomy as definitive treatment", specialty: "Surgery", topic: "Biliary Disease", description: "Performed during the index admission in appropriate candidates.", importance: 5 },
  { code: "SURG.CHOLE.04", name: "Suspect common bile duct obstruction", specialty: "Surgery", topic: "Biliary Disease", description: "Jaundice, elevated bilirubin and a dilated duct on imaging.", importance: 4 },

  /* --------------------------- Emergency Medicine -------------------------- */
  { code: "EM.PE.01", name: "Estimate pretest probability for pulmonary embolism", specialty: "Emergency Medicine", topic: "Cardiopulmonary", description: "Use a structured rule before selecting a diagnostic test.", importance: 5 },
  { code: "EM.PE.02", name: "Select the right diagnostic test for pulmonary embolism", specialty: "Emergency Medicine", topic: "Cardiopulmonary", description: "CT pulmonary angiography for most; ventilation-perfusion when contrast is contraindicated.", importance: 5 },
  { code: "EM.PE.03", name: "Anticoagulation for pulmonary embolism", specialty: "Emergency Medicine", topic: "Cardiopulmonary", description: "Start promptly when suspicion is high and bleeding risk is acceptable.", importance: 5 },
  { code: "EM.PE.04", name: "Risk stratify pulmonary embolism", specialty: "Emergency Medicine", topic: "Cardiopulmonary", description: "Hypotension defines high risk; right ventricular strain defines intermediate risk.", importance: 5 },
  { code: "EM.PE.05", name: "Duration of anticoagulation by provoking factor", specialty: "Emergency Medicine", topic: "Cardiopulmonary", description: "A transient major provoking factor supports a limited treatment course.", importance: 4 },
  { code: "EM.ANA.01", name: "Recognize anaphylaxis", specialty: "Emergency Medicine", topic: "Allergy", description: "Rapid multisystem involvement after exposure, or hypotension after a known allergen.", importance: 5 },
  { code: "EM.ANA.02", name: "Intramuscular epinephrine is first-line", specialty: "Emergency Medicine", topic: "Allergy", description: "Given without delay into the anterolateral thigh.", importance: 5 },
  { code: "EM.ANA.03", name: "Airway assessment in anaphylaxis", specialty: "Emergency Medicine", topic: "Allergy", description: "Stridor, voice change or tongue swelling threaten the airway.", importance: 5 },
  { code: "EM.ANA.04", name: "Adjunctive therapies do not replace epinephrine", specialty: "Emergency Medicine", topic: "Allergy", description: "Antihistamines and corticosteroids are secondary agents.", importance: 5 },
  { code: "EM.ANA.05", name: "Observation and discharge planning after anaphylaxis", specialty: "Emergency Medicine", topic: "Allergy", description: "Observation for biphasic reaction, epinephrine autoinjector and allergy follow-up.", importance: 4 },

  /* ----------------------------- Preventive care --------------------------- */
  { code: "PREV.DC.01", name: "Structured discharge planning", specialty: "Preventive Care", topic: "Preventive Care", description: "Medication reconciliation, follow-up appointment and clear return precautions.", importance: 5 },
  { code: "PREV.DC.02", name: "Medication reconciliation at transitions of care", specialty: "Preventive Care", topic: "Preventive Care", description: "Compare the pre-admission list with the discharge list explicitly.", importance: 4 },
  { code: "PREV.SCREEN.01", name: "Age-appropriate preventive screening", specialty: "Preventive Care", topic: "Preventive Care", description: "Cancer screening, immunization and counseling opportunities during admission.", importance: 4 },
];
