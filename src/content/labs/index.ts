/**
 * Central laboratory reference library (spec §14).
 *
 * Normal ranges live here once. A case supplies a *value*; the range, units,
 * panel and display order all come from this table. That is what stops the
 * same analyte from carrying three slightly different "normal" ranges across
 * three different case files, and it means correcting a range fixes every case
 * at once.
 *
 * Ranges are standardised educational values of the kind used in exam
 * materials, not any particular laboratory's assay-specific values.
 */

import type { LabDefinitionInput } from "@/content/schema";

export const LAB_CATEGORIES = [
  "CBC",
  "BMP",
  "LIVER",
  "COAGULATION",
  "CARDIAC",
  "URINALYSIS",
  "OTHER",
] as const;
export type LabCategory = (typeof LAB_CATEGORIES)[number];

export const LAB_CATEGORY_LABELS: Record<LabCategory, string> = {
  CBC: "Complete Blood Count",
  BMP: "Basic Metabolic Panel",
  LIVER: "Liver Profile",
  COAGULATION: "Coagulation",
  CARDIAC: "Cardiac Markers",
  URINALYSIS: "Urinalysis",
  OTHER: "Other Studies",
};

/** Panel display order on the results screen. */
export const LAB_CATEGORY_ORDER: LabCategory[] = [
  "CBC",
  "BMP",
  "LIVER",
  "COAGULATION",
  "CARDIAC",
  "URINALYSIS",
  "OTHER",
];

export const DEMO_LAB_DEFINITIONS: LabDefinitionInput[] = [
  /* ------------------------------ CBC ------------------------------------ */
  { code: "WBC", displayName: "WBC", units: "K/µL", referenceLow: 4.5, referenceHigh: 11, category: "CBC", displayOrder: 1 },
  {
    code: "HGB",
    displayName: "Hemoglobin",
    units: "g/dL",
    referenceLow: 12,
    referenceHigh: 16,
    // Sex-specific because the difference is large enough to change the flag.
    sexSpecificRange: { male: { low: 13.5, high: 17.5 }, female: { low: 12, high: 16 } },
    category: "CBC",
    displayOrder: 2,
  },
  {
    code: "HCT",
    displayName: "Hematocrit",
    units: "%",
    referenceLow: 36,
    referenceHigh: 48,
    sexSpecificRange: { male: { low: 41, high: 53 }, female: { low: 36, high: 46 } },
    category: "CBC",
    displayOrder: 3,
  },
  { code: "PLT", displayName: "Platelets", units: "K/µL", referenceLow: 150, referenceHigh: 400, category: "CBC", displayOrder: 4 },
  { code: "MCV", displayName: "MCV", units: "fL", referenceLow: 80, referenceHigh: 100, category: "CBC", displayOrder: 5 },
  { code: "NEUT_PCT", displayName: "Neutrophils", units: "%", referenceLow: 40, referenceHigh: 70, category: "CBC", displayOrder: 6 },

  /* ------------------------------ BMP ------------------------------------ */
  { code: "NA", displayName: "Sodium", units: "mEq/L", referenceLow: 135, referenceHigh: 145, category: "BMP", displayOrder: 1 },
  { code: "K", displayName: "Potassium", units: "mEq/L", referenceLow: 3.5, referenceHigh: 5, category: "BMP", displayOrder: 2 },
  { code: "CL", displayName: "Chloride", units: "mEq/L", referenceLow: 98, referenceHigh: 107, category: "BMP", displayOrder: 3 },
  { code: "HCO3", displayName: "Bicarbonate", units: "mEq/L", referenceLow: 22, referenceHigh: 28, category: "BMP", displayOrder: 4 },
  { code: "BUN", displayName: "BUN", units: "mg/dL", referenceLow: 7, referenceHigh: 20, category: "BMP", displayOrder: 5 },
  { code: "CR", displayName: "Creatinine", units: "mg/dL", referenceLow: 0.6, referenceHigh: 1.2, category: "BMP", displayOrder: 6 },
  { code: "GLU", displayName: "Glucose", units: "mg/dL", referenceLow: 70, referenceHigh: 100, category: "BMP", displayOrder: 7 },
  { code: "CA", displayName: "Calcium", units: "mg/dL", referenceLow: 8.5, referenceHigh: 10.5, category: "BMP", displayOrder: 8 },
  { code: "MG", displayName: "Magnesium", units: "mg/dL", referenceLow: 1.6, referenceHigh: 2.4, category: "BMP", displayOrder: 9 },
  { code: "PHOS", displayName: "Phosphate", units: "mg/dL", referenceLow: 2.5, referenceHigh: 4.5, category: "BMP", displayOrder: 10 },
  { code: "ANION_GAP", displayName: "Anion gap", units: "mEq/L", referenceLow: 8, referenceHigh: 12, category: "BMP", displayOrder: 11 },

  /* ----------------------------- Liver ----------------------------------- */
  { code: "AST", displayName: "AST", units: "U/L", referenceLow: 10, referenceHigh: 40, category: "LIVER", displayOrder: 1 },
  { code: "ALT", displayName: "ALT", units: "U/L", referenceLow: 10, referenceHigh: 40, category: "LIVER", displayOrder: 2 },
  { code: "ALP", displayName: "Alkaline phosphatase", units: "U/L", referenceLow: 40, referenceHigh: 120, category: "LIVER", displayOrder: 3 },
  { code: "TBILI", displayName: "Total bilirubin", units: "mg/dL", referenceLow: 0.2, referenceHigh: 1.2, category: "LIVER", displayOrder: 4 },
  { code: "DBILI", displayName: "Direct bilirubin", units: "mg/dL", referenceLow: 0, referenceHigh: 0.3, category: "LIVER", displayOrder: 5 },
  { code: "ALB", displayName: "Albumin", units: "g/dL", referenceLow: 3.5, referenceHigh: 5.5, category: "LIVER", displayOrder: 6 },
  { code: "LIPASE", displayName: "Lipase", units: "U/L", referenceLow: 10, referenceHigh: 140, category: "LIVER", displayOrder: 7 },

  /* -------------------------- Coagulation -------------------------------- */
  { code: "INR", displayName: "INR", units: "", referenceLow: 0.8, referenceHigh: 1.2, category: "COAGULATION", displayOrder: 1 },
  { code: "PT", displayName: "Prothrombin time", units: "sec", referenceLow: 11, referenceHigh: 15, category: "COAGULATION", displayOrder: 2 },
  { code: "PTT", displayName: "Partial thromboplastin time", units: "sec", referenceLow: 25, referenceHigh: 35, category: "COAGULATION", displayOrder: 3 },
  { code: "DDIMER", displayName: "D-dimer", units: "ng/mL FEU", referenceLow: 0, referenceHigh: 500, category: "COAGULATION", displayOrder: 4 },
  { code: "FIBRINOGEN", displayName: "Fibrinogen", units: "mg/dL", referenceLow: 200, referenceHigh: 400, category: "COAGULATION", displayOrder: 5 },

  /* ---------------------------- Cardiac ---------------------------------- */
  { code: "TROP", displayName: "Troponin I", units: "ng/mL", referenceLow: 0, referenceHigh: 0.04, category: "CARDIAC", displayOrder: 1 },
  { code: "BNP", displayName: "BNP", units: "pg/mL", referenceLow: 0, referenceHigh: 100, category: "CARDIAC", displayOrder: 2 },
  { code: "LACTATE", displayName: "Lactate", units: "mmol/L", referenceLow: 0.5, referenceHigh: 2, category: "CARDIAC", displayOrder: 3 },

  /* --------------------------- Urinalysis -------------------------------- */
  { code: "UA_LEUK", displayName: "Leukocyte esterase", units: "", referenceText: "Negative", category: "URINALYSIS", displayOrder: 1 },
  { code: "UA_NITRITE", displayName: "Nitrite", units: "", referenceText: "Negative", category: "URINALYSIS", displayOrder: 2 },
  { code: "UA_BLOOD", displayName: "Blood", units: "", referenceText: "Negative", category: "URINALYSIS", displayOrder: 3 },
  { code: "UA_PROTEIN", displayName: "Protein", units: "", referenceText: "Negative", category: "URINALYSIS", displayOrder: 4 },
  { code: "UA_KETONES", displayName: "Ketones", units: "", referenceText: "Negative", category: "URINALYSIS", displayOrder: 5 },
  { code: "UA_GLUCOSE", displayName: "Glucose", units: "", referenceText: "Negative", category: "URINALYSIS", displayOrder: 6 },
  { code: "UA_WBC", displayName: "WBC (urine)", units: "/hpf", referenceLow: 0, referenceHigh: 5, category: "URINALYSIS", displayOrder: 7 },

  /* ------------------------------ Other ---------------------------------- */
  { code: "TSH", displayName: "TSH", units: "µIU/mL", referenceLow: 0.4, referenceHigh: 4, category: "OTHER", displayOrder: 1 },
  { code: "HBA1C", displayName: "Hemoglobin A1c", units: "%", referenceLow: 4, referenceHigh: 5.6, category: "OTHER", displayOrder: 2 },
  { code: "CRP", displayName: "C-reactive protein", units: "mg/L", referenceLow: 0, referenceHigh: 10, category: "OTHER", displayOrder: 3 },
  { code: "PROCALCITONIN", displayName: "Procalcitonin", units: "ng/mL", referenceLow: 0, referenceHigh: 0.5, category: "OTHER", displayOrder: 4 },
  { code: "PH_ART", displayName: "pH (arterial)", units: "", referenceLow: 7.35, referenceHigh: 7.45, category: "OTHER", displayOrder: 5 },
  { code: "PCO2", displayName: "pCO2", units: "mm Hg", referenceLow: 35, referenceHigh: 45, category: "OTHER", displayOrder: 6 },
  { code: "PO2", displayName: "pO2", units: "mm Hg", referenceLow: 80, referenceHigh: 100, category: "OTHER", displayOrder: 7 },
  { code: "BETA_HCG", displayName: "β-hCG (quantitative)", units: "mIU/mL", referenceText: "Negative if < 5", category: "OTHER", displayOrder: 8 },
  { code: "ETHANOL", displayName: "Ethanol", units: "mg/dL", referenceText: "Not detected", category: "OTHER", displayOrder: 9 },
  { code: "CK", displayName: "Creatine kinase", units: "U/L", referenceLow: 30, referenceHigh: 200, category: "OTHER", displayOrder: 10 },
];
