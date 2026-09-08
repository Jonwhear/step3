/**
 * Registry of synthetic demo cases.
 *
 * To add a case: copy `card001-atrial-fibrillation.ts` (the annotated
 * reference), give it a new code, and add it to this array. Nothing else in
 * the application needs to change — the seeder validates it with Zod and the
 * scheduler picks it up automatically.
 */

import type { CaseTemplateInput } from "@/content/schema";

import { CASE_CARD_001 } from "./card001-atrial-fibrillation";
import { CASE_CARD_002 } from "./card002-nstemi";
import { CASE_CARD_003 } from "./card003-heart-failure";
import { CASE_PULM_001 } from "./pulm001-pneumonia";
import { CASE_PULM_002 } from "./pulm002-copd";
import { CASE_ENDO_001 } from "./endo001-dka";
import { CASE_GI_001 } from "./gi001-upper-gi-bleed";
import { CASE_ID_001 } from "./id001-pyelonephritis-sepsis";
import { CASE_NEURO_001 } from "./neuro001-stroke";
import { CASE_NEURO_002 } from "./neuro002-status-epilepticus";
import { CASE_PSYCH_001 } from "./psych001-serotonin-syndrome";
import { CASE_PSYCH_002 } from "./psych002-alcohol-withdrawal";
import { CASE_PEDS_001 } from "./peds001-dehydration";
import { CASE_PEDS_002 } from "./peds002-asthma";
import { CASE_OB_001 } from "./ob001-preeclampsia";
import { CASE_OB_002 } from "./ob002-ectopic";
import { CASE_SURG_001 } from "./surg001-appendicitis";
import { CASE_SURG_002 } from "./surg002-cholecystitis";
import { CASE_EM_001 } from "./em001-pulmonary-embolism";
import { CASE_EM_002 } from "./em002-anaphylaxis";

export const DEMO_CASES: CaseTemplateInput[] = [
  CASE_CARD_001,
  CASE_CARD_002,
  CASE_CARD_003,
  CASE_PULM_001,
  CASE_PULM_002,
  CASE_ENDO_001,
  CASE_GI_001,
  CASE_ID_001,
  CASE_NEURO_001,
  CASE_NEURO_002,
  CASE_PSYCH_001,
  CASE_PSYCH_002,
  CASE_PEDS_001,
  CASE_PEDS_002,
  CASE_OB_001,
  CASE_OB_002,
  CASE_SURG_001,
  CASE_SURG_002,
  CASE_EM_001,
  CASE_EM_002,
];
