/**
 * Demo learning points.
 *
 * These are the granular, testable claims extracted from the demo source
 * fragments — the unit that consolidation must not lose (spec §3, §5). Several
 * are deliberately left unmapped so the Content Coverage Audit has something
 * real to report: an audit that always says "100%" teaches you nothing about
 * whether it works.
 */

import type { LearningPointContentInput } from "@/content/schema";

const SOURCE = "DEMO-SRC-001";

export const DEMO_LEARNING_POINTS: LearningPointContentInput[] = [
  /* --------------------------- acute coronary ---------------------------- */
  {
    code: "LP-ACS-01",
    title: "The ECG splits acute coronary syndrome into two management pathways",
    description:
      "ST elevation means emergent reperfusion; non-ST elevation disease is medical therapy plus risk-stratified invasive evaluation.",
    specialty: "Internal Medicine",
    topic: "Cardiology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 0,
    caseCodes: ["DEMO-CARD-002"],
    lectureCodes: ["DEMO-LEC-002"],
  },
  {
    code: "LP-ACS-02",
    title: "Medical therapy in NSTE-ACS starts immediately and does not wait for catheterisation",
    description:
      "Aspirin, anticoagulation, high-intensity statin and a beta blocker are given while the invasive plan is being arranged.",
    specialty: "Internal Medicine",
    topic: "Cardiology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 0,
    caseCodes: ["DEMO-CARD-002"],
    lectureCodes: ["DEMO-LEC-002"],
  },
  {
    code: "LP-ACS-03",
    title: "Troponin defines infarction but does not drive the reperfusion decision",
    specialty: "Internal Medicine",
    topic: "Cardiology",
    importance: 4,
    sourceCode: SOURCE,
    sourceFragmentIndex: 0,
    caseCodes: ["DEMO-CARD-002"],
    lectureCodes: ["DEMO-LEC-002"],
  },

  /* -------------------------- atrial fibrillation ------------------------ */
  {
    code: "LP-AF-01",
    title: "Unstable atrial fibrillation requires immediate synchronised cardioversion",
    description: "Instability overrides rate control; electricity comes before drugs.",
    specialty: "Internal Medicine",
    topic: "Cardiology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 1,
    caseCodes: ["DEMO-CARD-001"],
    lectureCodes: ["DEMO-LEC-003"],
  },
  {
    code: "LP-AF-02",
    title: "CHA2DS2-VASc informs thromboembolic risk independently of rhythm control",
    specialty: "Internal Medicine",
    topic: "Cardiology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 1,
    caseCodes: ["DEMO-CARD-001"],
    lectureCodes: ["DEMO-LEC-003"],
  },

  /* --------------------------------- DKA --------------------------------- */
  {
    code: "LP-DKA-01",
    title: "Fluids precede insulin in diabetic ketoacidosis",
    specialty: "Internal Medicine",
    topic: "Endocrinology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 2,
    caseCodes: ["DEMO-ENDO-001"],
    lectureCodes: ["DEMO-LEC-006"],
  },
  {
    code: "LP-DKA-02",
    title: "Potassium is repleted before insulin when the initial potassium is low",
    description: "Insulin shifts potassium intracellularly and can precipitate dangerous hypokalaemia.",
    specialty: "Internal Medicine",
    topic: "Endocrinology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 2,
    caseCodes: ["DEMO-ENDO-001"],
    lectureCodes: ["DEMO-LEC-006"],
  },
  {
    code: "LP-DKA-03",
    title: "The insulin infusion continues until the anion gap closes, not until glucose normalises",
    specialty: "Internal Medicine",
    topic: "Endocrinology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 2,
    caseCodes: ["DEMO-ENDO-001"],
    lectureCodes: ["DEMO-LEC-006"],
  },

  /* ----------------------------- hyperkalaemia --------------------------- */
  {
    code: "LP-HYPERK-01",
    title: "IV calcium is the first step in hyperkalaemia with ECG changes",
    description: "Calcium stabilises the cardiac membrane; it does not lower the potassium.",
    specialty: "Internal Medicine",
    topic: "Nephrology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 3,
    // Unmapped on purpose: the demo library has no hyperkalaemia patient yet,
    // so this is exactly the gap the coverage audit exists to surface.
    caseCodes: [],
    lectureCodes: [],
  },
  {
    code: "LP-HYPERK-02",
    title: "Shifting agents follow calcium; definitive removal comes last",
    specialty: "Internal Medicine",
    topic: "Nephrology",
    importance: 4,
    sourceCode: SOURCE,
    sourceFragmentIndex: 3,
    caseCodes: [],
    lectureCodes: [],
  },

  /* ------------------------------- VTE / PE ------------------------------ */
  {
    code: "LP-PE-01",
    title: "Pretest probability determines whether a D-dimer is useful",
    specialty: "Emergency Medicine",
    topic: "Cardiopulmonary",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 4,
    caseCodes: ["DEMO-EM-001"],
    lectureCodes: ["DEMO-LEC-001"],
  },
  {
    code: "LP-PE-02",
    title: "Anticoagulation starts before imaging when suspicion is high",
    specialty: "Emergency Medicine",
    topic: "Cardiopulmonary",
    importance: 4,
    sourceCode: SOURCE,
    sourceFragmentIndex: 4,
    caseCodes: ["DEMO-EM-001"],
    lectureCodes: [],
  },

  /* -------------------------------- sepsis ------------------------------- */
  {
    code: "LP-SEPSIS-01",
    title: "Blood cultures precede antibiotics when this does not delay therapy",
    specialty: "Internal Medicine",
    topic: "Infectious Disease",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 5,
    caseCodes: ["DEMO-ID-001"],
    lectureCodes: ["DEMO-LEC-009"],
  },
  {
    code: "LP-SEPSIS-02",
    title: "Broad-spectrum antibiotics are given within the first hour",
    specialty: "Internal Medicine",
    topic: "Infectious Disease",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 5,
    caseCodes: ["DEMO-ID-001"],
    lectureCodes: ["DEMO-LEC-009"],
  },
  {
    code: "LP-SEPSIS-03",
    title: "Vasopressors follow adequate fluid resuscitation, not a fixed volume",
    specialty: "Internal Medicine",
    topic: "Infectious Disease",
    importance: 4,
    sourceCode: SOURCE,
    sourceFragmentIndex: 5,
    caseCodes: ["DEMO-ID-001"],
    lectureCodes: [],
  },

  /* ------------------------------- cirrhosis ----------------------------- */
  {
    code: "LP-CIRR-01",
    title: "New ascites warrants diagnostic paracentesis",
    specialty: "Internal Medicine",
    topic: "Gastroenterology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 6,
    caseCodes: [],
    lectureCodes: [],
  },
  {
    code: "LP-CIRR-02",
    title: "Ascitic neutrophils ≥ 250/mm³ establishes spontaneous bacterial peritonitis",
    description: "Treated with a third-generation cephalosporin plus albumin.",
    specialty: "Internal Medicine",
    topic: "Gastroenterology",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 6,
    caseCodes: [],
    lectureCodes: [],
  },

  /* --------------------------------- stroke ------------------------------ */
  {
    code: "LP-STROKE-01",
    title: "Non-contrast head CT precedes any thrombolytic decision",
    specialty: "Neurology",
    topic: "Stroke",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 7,
    caseCodes: ["DEMO-NEURO-001"],
    lectureCodes: ["DEMO-LEC-011"],
  },
  {
    code: "LP-STROKE-02",
    title: "Time of last known well determines thrombolysis eligibility",
    specialty: "Neurology",
    topic: "Stroke",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 7,
    caseCodes: ["DEMO-NEURO-001"],
    lectureCodes: ["DEMO-LEC-011"],
  },
  {
    code: "LP-STROKE-03",
    title: "Hypoglycaemia is a common stroke mimic and is checked early",
    specialty: "Neurology",
    topic: "Stroke",
    importance: 4,
    sourceCode: SOURCE,
    sourceFragmentIndex: 7,
    caseCodes: ["DEMO-NEURO-001"],
    lectureCodes: [],
  },

  /* ------------------------------ preeclampsia --------------------------- */
  {
    code: "LP-PREE-01",
    title: "Magnesium sulphate provides seizure prophylaxis, not blood pressure control",
    specialty: "OB/GYN",
    topic: "Obstetrics",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 8,
    caseCodes: ["DEMO-OB-001"],
    lectureCodes: ["DEMO-LEC-015"],
  },
  {
    code: "LP-PREE-02",
    title: "Delivery is the definitive management of preeclampsia with severe features",
    specialty: "OB/GYN",
    topic: "Obstetrics",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 8,
    caseCodes: ["DEMO-OB-001"],
    lectureCodes: ["DEMO-LEC-015"],
  },

  /* ----------------------------- appendicitis ---------------------------- */
  {
    code: "LP-APPY-01",
    title: "Migratory right lower quadrant pain with peritonism suggests appendicitis",
    specialty: "Surgery",
    topic: "Acute Abdomen",
    importance: 5,
    sourceCode: SOURCE,
    sourceFragmentIndex: 9,
    caseCodes: ["DEMO-SURG-001"],
    lectureCodes: ["DEMO-LEC-018"],
  },
  {
    code: "LP-APPY-02",
    title: "Analgesia does not obscure the abdominal examination and should not be withheld",
    specialty: "Surgery",
    topic: "Acute Abdomen",
    importance: 4,
    sourceCode: SOURCE,
    sourceFragmentIndex: 9,
    caseCodes: ["DEMO-SURG-001"],
    lectureCodes: [],
  },
];
