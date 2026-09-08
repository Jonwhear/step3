/**
 * Controlled action vocabulary.
 *
 * The admission interface *feels* open-ended, but every button and every
 * spoken phrase resolves to one of these codes before anything is scored
 * (spec §17, §49). Synonyms are lowercase and matched after normalisation.
 *
 * This library is intentionally expandable: adding an action here makes it
 * available to every case that defines a rule for it.
 */

import type { ActionDefinitionInput } from "@/content/schema";

export const DEMO_ACTIONS: ActionDefinitionInput[] = [
  /* --------------------------------- History -------------------------------- */
  { actionCode: "HX_ADDITIONAL", category: "HISTORY", displayName: "Additional history", synonyms: ["history", "take a history", "more history", "additional history", "ask about history"] },
  { actionCode: "HX_MEDICATIONS", category: "HISTORY", displayName: "Medication history", synonyms: ["medications", "medication list", "med rec", "what medications", "drug history"] },
  { actionCode: "HX_SOCIAL", category: "HISTORY", displayName: "Social history", synonyms: ["social history", "alcohol history", "smoking history", "substance use history"] },

  /* ---------------------------------- Exam ---------------------------------- */
  { actionCode: "EXAM_GENERAL", category: "EXAM", displayName: "General examination", synonyms: ["exam", "examine", "physical exam", "general exam", "examine the patient"] },
  { actionCode: "EXAM_CARDIOPULMONARY", category: "EXAM", displayName: "Cardiopulmonary examination", synonyms: ["heart and lung exam", "cardiac exam", "lung exam", "chest exam", "listen to the chest"] },
  { actionCode: "EXAM_ABDOMEN", category: "EXAM", displayName: "Abdominal examination", synonyms: ["abdominal exam", "examine the abdomen", "belly exam", "palpate the abdomen"] },
  { actionCode: "EXAM_NEUROLOGIC", category: "EXAM", displayName: "Neurologic examination", synonyms: ["neuro exam", "neurologic exam", "neurological exam", "check reflexes"] },

  /* -------------------------------- Laboratory ------------------------------ */
  { actionCode: "ORDER_CBC", category: "ORDER", displayName: "Complete blood count", synonyms: ["cbc", "complete blood count", "blood count", "check a cbc", "order a cbc"] },
  { actionCode: "ORDER_BMP", category: "ORDER", displayName: "Basic metabolic panel", synonyms: ["bmp", "basic metabolic panel", "chem 7", "electrolytes", "check electrolytes"] },
  { actionCode: "ORDER_CMP", category: "ORDER", displayName: "Comprehensive metabolic panel", synonyms: ["cmp", "comprehensive metabolic panel", "liver panel", "lfts", "liver function tests"] },
  { actionCode: "ORDER_TROPONIN", category: "ORDER", displayName: "Troponin", synonyms: ["troponin", "cardiac enzymes", "check a troponin", "serial troponins", "trop"] },
  { actionCode: "ORDER_BNP", category: "ORDER", displayName: "B-type natriuretic peptide", synonyms: ["bnp", "natriuretic peptide", "pro bnp", "nt probnp"] },
  { actionCode: "ORDER_LACTATE", category: "ORDER", displayName: "Serum lactate", synonyms: ["lactate", "lactic acid", "check a lactate"] },
  { actionCode: "ORDER_BLOOD_CULTURES", category: "ORDER", displayName: "Blood cultures", synonyms: ["blood cultures", "cultures", "draw cultures", "blood culture"] },
  { actionCode: "ORDER_URINALYSIS", category: "ORDER", displayName: "Urinalysis with culture", synonyms: ["urinalysis", "ua", "urine culture", "check a urinalysis"] },
  { actionCode: "ORDER_ABG", category: "ORDER", displayName: "Arterial blood gas", synonyms: ["abg", "arterial blood gas", "blood gas", "venous blood gas", "vbg"] },
  { actionCode: "ORDER_GLUCOSE", category: "ORDER", displayName: "Bedside glucose", synonyms: ["glucose", "blood sugar", "fingerstick", "bedside glucose", "check a glucose", "accucheck"] },
  { actionCode: "ORDER_KETONES", category: "ORDER", displayName: "Serum ketones", synonyms: ["ketones", "serum ketones", "beta hydroxybutyrate"] },
  { actionCode: "ORDER_TSH", category: "ORDER", displayName: "Thyroid stimulating hormone", synonyms: ["tsh", "thyroid function", "thyroid studies", "check a tsh"] },
  { actionCode: "ORDER_COAGS", category: "ORDER", displayName: "Coagulation studies", synonyms: ["coags", "inr", "pt inr", "coagulation studies", "ptt"] },
  { actionCode: "ORDER_TYPE_AND_SCREEN", category: "ORDER", displayName: "Type and screen", synonyms: ["type and screen", "type and cross", "crossmatch", "blood bank"] },
  { actionCode: "ORDER_HCG", category: "ORDER", displayName: "Quantitative beta-hCG", synonyms: ["beta hcg", "hcg", "pregnancy test", "quantitative hcg", "b hcg"] },
  { actionCode: "ORDER_LFT_PREECLAMPSIA", category: "ORDER", displayName: "Preeclampsia laboratory panel", synonyms: ["preeclampsia labs", "preeclampsia panel", "liver enzymes and platelets", "hellp labs"] },
  { actionCode: "ORDER_URINE_PROTEIN", category: "ORDER", displayName: "Urine protein-to-creatinine ratio", synonyms: ["urine protein", "protein creatinine ratio", "proteinuria"] },
  { actionCode: "ORDER_MAGNESIUM_LEVEL", category: "ORDER", displayName: "Serum magnesium level", synonyms: ["magnesium level", "check a magnesium", "mag level"] },
  { actionCode: "ORDER_CK", category: "ORDER", displayName: "Creatine kinase", synonyms: ["ck", "creatine kinase", "cpk"] },
  { actionCode: "ORDER_TOX_SCREEN", category: "ORDER", displayName: "Toxicology screen", synonyms: ["tox screen", "toxicology screen", "urine drug screen", "drug screen"] },
  { actionCode: "ORDER_ETHANOL_LEVEL", category: "ORDER", displayName: "Serum ethanol level", synonyms: ["alcohol level", "ethanol level", "blood alcohol"] },
  { actionCode: "ORDER_DDIMER", category: "ORDER", displayName: "D-dimer", synonyms: ["d dimer", "ddimer", "dimer"] },

  /* --------------------------------- Imaging -------------------------------- */
  { actionCode: "ORDER_ECG", category: "ORDER", displayName: "12-lead ECG", synonyms: ["ecg", "ekg", "electrocardiogram", "twelve lead", "12 lead", "get an ecg", "get an ekg"] },
  { actionCode: "ORDER_CXR", category: "ORDER", displayName: "Chest radiograph", synonyms: ["cxr", "chest x ray", "chest xray", "chest radiograph", "chest film"] },
  { actionCode: "ORDER_CT_HEAD", category: "ORDER", displayName: "Noncontrast CT head", synonyms: ["ct head", "head ct", "noncontrast ct head", "brain ct", "cat scan of the head"] },
  { actionCode: "ORDER_CT_ABDOMEN", category: "ORDER", displayName: "CT abdomen and pelvis", synonyms: ["ct abdomen", "ct abdomen pelvis", "abdominal ct", "cat scan of the abdomen"] },
  { actionCode: "ORDER_CTA_CHEST", category: "ORDER", displayName: "CT pulmonary angiography", synonyms: ["cta chest", "ct angiogram", "ct pulmonary angiography", "ctpa", "cta of the chest"] },
  { actionCode: "ORDER_MRI_BRAIN", category: "ORDER", displayName: "MRI brain", synonyms: ["mri brain", "brain mri", "mri of the head"] },
  { actionCode: "ORDER_ECHO", category: "ORDER", displayName: "Transthoracic echocardiogram", synonyms: ["echo", "echocardiogram", "tte", "cardiac ultrasound"] },
  { actionCode: "ORDER_RUQ_ULTRASOUND", category: "ORDER", displayName: "Right upper quadrant ultrasound", synonyms: ["ruq ultrasound", "right upper quadrant ultrasound", "gallbladder ultrasound", "abdominal ultrasound"] },
  { actionCode: "ORDER_TRANSVAGINAL_US", category: "ORDER", displayName: "Transvaginal ultrasound", synonyms: ["transvaginal ultrasound", "pelvic ultrasound", "tvus"] },
  { actionCode: "ORDER_RENAL_ULTRASOUND", category: "ORDER", displayName: "Renal ultrasound", synonyms: ["renal ultrasound", "kidney ultrasound", "renal us"] },
  { actionCode: "ORDER_LOWER_EXTREMITY_US", category: "ORDER", displayName: "Lower extremity venous ultrasound", synonyms: ["leg ultrasound", "venous duplex", "dvt ultrasound", "lower extremity ultrasound"] },
  { actionCode: "ORDER_FETAL_MONITORING", category: "ORDER", displayName: "Continuous fetal monitoring", synonyms: ["fetal monitoring", "fetal heart monitoring", "nonstress test", "continuous fetal monitoring"] },
  { actionCode: "ORDER_SWALLOW_SCREEN", category: "ORDER", displayName: "Bedside swallow screen", synonyms: ["swallow screen", "dysphagia screen", "swallow evaluation", "bedside swallow"] },
  { actionCode: "ORDER_ENDOSCOPY", category: "ORDER", displayName: "Upper endoscopy", synonyms: ["endoscopy", "egd", "upper endoscopy", "scope"] },
  { actionCode: "ORDER_EEG", category: "ORDER", displayName: "Electroencephalogram", synonyms: ["eeg", "electroencephalogram", "continuous eeg"] },

  /* -------------------------------- Treatment ------------------------------- */
  { actionCode: "GIVE_IV_FLUIDS", category: "TREATMENT", displayName: "IV isotonic fluids", synonyms: ["iv fluids", "fluids", "normal saline", "lactated ringers", "fluid bolus", "give fluids", "crystalloid"] },
  { actionCode: "GIVE_ORAL_REHYDRATION", category: "TREATMENT", displayName: "Oral rehydration solution", synonyms: ["oral rehydration", "ors", "oral fluids", "pedialyte"] },
  { actionCode: "GIVE_OXYGEN", category: "TREATMENT", displayName: "Supplemental oxygen", synonyms: ["oxygen", "supplemental oxygen", "nasal cannula", "give oxygen", "o2"] },
  { actionCode: "GIVE_ASPIRIN", category: "TREATMENT", displayName: "Aspirin", synonyms: ["aspirin", "give aspirin", "start aspirin", "administer aspirin", "asa", "chewable aspirin"] },
  { actionCode: "GIVE_HEPARIN", category: "TREATMENT", displayName: "Therapeutic anticoagulation", synonyms: ["heparin", "anticoagulation", "anticoagulate", "start heparin", "low molecular weight heparin", "enoxaparin"] },
  { actionCode: "GIVE_NITROGLYCERIN", category: "TREATMENT", displayName: "Nitroglycerin", synonyms: ["nitroglycerin", "nitro", "sublingual nitroglycerin"] },
  { actionCode: "GIVE_STATIN", category: "TREATMENT", displayName: "High-intensity statin", synonyms: ["statin", "atorvastatin", "high intensity statin"] },
  { actionCode: "GIVE_BETA_BLOCKER", category: "TREATMENT", displayName: "Beta blocker", synonyms: ["beta blocker", "metoprolol", "rate control", "give a beta blocker"] },
  { actionCode: "GIVE_CALCIUM_CHANNEL_BLOCKER", category: "TREATMENT", displayName: "Nondihydropyridine calcium channel blocker", synonyms: ["calcium channel blocker", "diltiazem", "cardizem", "verapamil"] },
  { actionCode: "GIVE_INSULIN", category: "TREATMENT", displayName: "IV insulin infusion", synonyms: ["insulin", "insulin drip", "iv insulin", "start insulin", "insulin infusion"] },
  { actionCode: "GIVE_DEXTROSE", category: "TREATMENT", displayName: "Dextrose", synonyms: ["dextrose", "d50", "glucose", "give dextrose", "sugar"] },
  { actionCode: "GIVE_POTASSIUM", category: "TREATMENT", displayName: "Potassium repletion", synonyms: ["potassium", "replete potassium", "kcl", "potassium chloride"] },
  { actionCode: "GIVE_CALCIUM_GLUCONATE", category: "TREATMENT", displayName: "Calcium gluconate", synonyms: ["calcium gluconate", "calcium", "give calcium"] },
  { actionCode: "GIVE_CEFTRIAXONE", category: "TREATMENT", displayName: "Ceftriaxone", synonyms: ["ceftriaxone", "rocephin", "third generation cephalosporin"] },
  { actionCode: "GIVE_AZITHROMYCIN", category: "TREATMENT", displayName: "Azithromycin", synonyms: ["azithromycin", "macrolide", "zithromax", "atypical coverage"] },
  { actionCode: "GIVE_BROAD_ANTIBIOTICS", category: "TREATMENT", displayName: "Broad-spectrum IV antibiotics", synonyms: ["broad spectrum antibiotics", "antibiotics", "iv antibiotics", "empiric antibiotics", "start antibiotics"] },
  { actionCode: "GIVE_BENZODIAZEPINE", category: "TREATMENT", displayName: "Benzodiazepine", synonyms: ["benzodiazepine", "lorazepam", "ativan", "diazepam", "midazolam", "benzo", "give a benzo"] },
  { actionCode: "GIVE_ANTISEIZURE_MEDICATION", category: "TREATMENT", displayName: "Second-line antiseizure medication", synonyms: ["antiseizure medication", "levetiracetam", "keppra", "fosphenytoin", "valproate", "second line antiseizure"] },
  { actionCode: "GIVE_STEROID", category: "TREATMENT", displayName: "Systemic corticosteroid", synonyms: ["steroid", "steroids", "prednisone", "methylprednisolone", "corticosteroid", "dexamethasone"] },
  { actionCode: "GIVE_BRONCHODILATOR", category: "TREATMENT", displayName: "Inhaled short-acting bronchodilator", synonyms: ["bronchodilator", "albuterol", "nebulizer", "saba", "duoneb", "ipratropium"] },
  { actionCode: "GIVE_MAGNESIUM", category: "TREATMENT", displayName: "Intravenous magnesium sulfate", synonyms: ["magnesium", "magnesium sulfate", "iv magnesium", "give magnesium"] },
  { actionCode: "GIVE_EPINEPHRINE_IM", category: "TREATMENT", displayName: "Intramuscular epinephrine", synonyms: ["epinephrine", "im epinephrine", "epi", "intramuscular epinephrine", "epipen", "give epinephrine"] },
  { actionCode: "GIVE_ANTIHISTAMINE", category: "TREATMENT", displayName: "Antihistamine", synonyms: ["antihistamine", "diphenhydramine", "benadryl", "h1 blocker"] },
  { actionCode: "GIVE_PPI", category: "TREATMENT", displayName: "Intravenous proton pump inhibitor", synonyms: ["ppi", "proton pump inhibitor", "pantoprazole", "protonix", "iv ppi"] },
  { actionCode: "GIVE_LOOP_DIURETIC", category: "TREATMENT", displayName: "Intravenous loop diuretic", synonyms: ["loop diuretic", "furosemide", "lasix", "iv diuretic", "diurese"] },
  { actionCode: "GIVE_BLOOD_TRANSFUSION", category: "TREATMENT", displayName: "Packed red blood cell transfusion", synonyms: ["transfusion", "transfuse", "blood transfusion", "packed red blood cells", "prbc", "give blood"] },
  { actionCode: "GIVE_THIAMINE", category: "TREATMENT", displayName: "Thiamine", synonyms: ["thiamine", "vitamin b1", "give thiamine"] },
  { actionCode: "GIVE_ANTIHYPERTENSIVE_IV", category: "TREATMENT", displayName: "IV antihypertensive (labetalol or hydralazine)", synonyms: ["labetalol", "hydralazine", "iv antihypertensive", "lower the blood pressure", "antihypertensive"] },
  { actionCode: "GIVE_METHOTREXATE", category: "TREATMENT", displayName: "Methotrexate", synonyms: ["methotrexate", "medical management", "mtx"] },
  { actionCode: "GIVE_ANALGESIA", category: "TREATMENT", displayName: "Analgesia", synonyms: ["analgesia", "pain medication", "pain control", "morphine", "give pain medicine"] },
  { actionCode: "GIVE_ANTIEMETIC", category: "TREATMENT", displayName: "Antiemetic", synonyms: ["antiemetic", "ondansetron", "zofran", "antinausea medication"] },
  { actionCode: "GIVE_NPO_IVF", category: "TREATMENT", displayName: "Nothing by mouth with IV fluids", synonyms: ["npo", "nothing by mouth", "npo with iv fluids", "keep the patient npo"] },
  { actionCode: "GIVE_NONINVASIVE_VENTILATION", category: "TREATMENT", displayName: "Noninvasive positive pressure ventilation", synonyms: ["bipap", "noninvasive ventilation", "nippv", "cpap", "start bipap"] },
  { actionCode: "GIVE_THROMBOLYSIS", category: "TREATMENT", displayName: "Systemic thrombolysis", synonyms: ["thrombolysis", "thrombolytics", "tpa", "alteplase", "lytics", "clot buster"] },
  { actionCode: "GIVE_CARDIOVERSION", category: "TREATMENT", displayName: "Synchronized cardioversion", synonyms: ["cardioversion", "synchronized cardioversion", "shock the patient", "cardiovert", "dc cardioversion"] },
  { actionCode: "GIVE_VACCINATION", category: "TREATMENT", displayName: "Vaccination and preventive counseling", synonyms: ["vaccination", "vaccine", "immunization", "flu shot", "pneumococcal vaccine", "smoking cessation"] },

  /* --------------------------------- Consults ------------------------------- */
  { actionCode: "CONSULT_CARDIOLOGY", category: "CONSULT", displayName: "Cardiology consultation", synonyms: ["cardiology", "consult cardiology", "call cardiology", "cardiology consult"] },
  { actionCode: "CONSULT_SURGERY", category: "CONSULT", displayName: "Surgery consultation", synonyms: ["surgery", "consult surgery", "call surgery", "surgical consult", "general surgery"] },
  { actionCode: "CONSULT_NEUROLOGY", category: "CONSULT", displayName: "Neurology consultation", synonyms: ["neurology", "consult neurology", "call neurology", "stroke team", "code stroke"] },
  { actionCode: "CONSULT_OBGYN", category: "CONSULT", displayName: "Obstetrics and gynecology consultation", synonyms: ["ob gyn", "consult ob", "obstetrics", "call ob gyn", "gynecology"] },
  { actionCode: "CONSULT_GI", category: "CONSULT", displayName: "Gastroenterology consultation", synonyms: ["gastroenterology", "consult gi", "call gi", "gi consult"] },
  { actionCode: "CONSULT_PSYCHIATRY", category: "CONSULT", displayName: "Psychiatry consultation", synonyms: ["psychiatry", "consult psychiatry", "call psych", "psych consult"] },
  { actionCode: "CONSULT_UROLOGY", category: "CONSULT", displayName: "Urology consultation", synonyms: ["urology", "consult urology", "call urology"] },

  /* ------------------------------- Disposition ------------------------------ */
  { actionCode: "ADMIT_FLOOR", category: "DISPOSITION", displayName: "Admit to medical floor", synonyms: ["admit to the floor", "admit to medicine", "floor bed", "general ward", "admit floor"] },
  { actionCode: "ADMIT_TELEMETRY", category: "DISPOSITION", displayName: "Admit to telemetry", synonyms: ["telemetry", "admit to telemetry", "monitored bed", "tele bed", "step down"] },
  { actionCode: "ADMIT_ICU", category: "DISPOSITION", displayName: "Admit to intensive care", synonyms: ["icu", "admit to the icu", "intensive care", "critical care unit"] },
  { actionCode: "ADMIT_OBSERVATION", category: "DISPOSITION", displayName: "Observation unit", synonyms: ["observation", "obs unit", "observe", "admit to observation"] },
  { actionCode: "ADMIT_OR", category: "DISPOSITION", displayName: "To the operating room", synonyms: ["operating room", "to the or", "take to surgery", "operative management", "surgery now"] },
  { actionCode: "ADMIT_LABOR_AND_DELIVERY", category: "DISPOSITION", displayName: "Admit to labor and delivery", synonyms: ["labor and delivery", "l and d", "admit to l and d", "obstetric unit"] },
  { actionCode: "DISCHARGE_HOME", category: "DISPOSITION", displayName: "Discharge home", synonyms: ["discharge", "discharge home", "send home", "home with follow up", "go home"] },
];
