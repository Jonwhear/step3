/**
 * Demo source material.
 *
 * This is original synthetic teaching material written for the prototype. No
 * copyrighted question bank or textbook content is bundled with the app, and
 * none is ever fetched (spec §4, §71) — the point of this file is to exercise
 * the ingestion pathway end to end so that when the developer does import their
 * own licensed material, the provenance, fragmenting and coverage machinery is
 * already proven to work.
 */

import type { ContentSourceInputContent } from "@/content/schema";

export const DEMO_SOURCES: ContentSourceInputContent[] = [
  {
    code: "DEMO-SRC-001",
    sourceType: "DEMO",
    title: "General Hospital Core Curriculum",
    sourceIdentifier: "GH-CORE-2026",
    section: "Acute Care Medicine",
    notes:
      "Synthetic reference document authored for this prototype. Demonstrates the source → fragment → learning point → case pathway.",
    version: "1.0",
    fragments: [
      {
        label: "Cardiology — acute coronary syndrome",
        rawText:
          "The electrocardiogram divides acute coronary syndrome into two management pathways. ST elevation indicates a completely occluded epicardial vessel and calls for emergent reperfusion. Non-ST elevation disease is managed with immediate antiplatelet therapy, anticoagulation and a high-intensity statin, with the urgency of invasive evaluation determined by risk. Serial troponins define whether infarction has occurred but do not make the reperfusion decision.",
      },
      {
        label: "Cardiology — atrial fibrillation",
        rawText:
          "Haemodynamic instability in atrial fibrillation calls for immediate synchronised cardioversion rather than rate control. In the stable patient, rate control and an assessment of thromboembolic risk come first. CHA2DS2-VASc informs the anticoagulation decision, and anticoagulation is considered independently of whether sinus rhythm is restored.",
      },
      {
        label: "Endocrinology — diabetic ketoacidosis",
        rawText:
          "Diabetic ketoacidosis is treated with intravenous fluids first, then insulin, with potassium repleted before insulin is started when the initial potassium is low. Insulin drives potassium intracellularly and can precipitate dangerous hypokalaemia. The infusion continues until the anion gap closes, not until the glucose normalises; dextrose is added once glucose falls while the gap remains open.",
      },
      {
        label: "Nephrology — hyperkalaemia",
        rawText:
          "Hyperkalaemia with electrocardiographic changes calls for intravenous calcium first to stabilise the cardiac membrane. Calcium does not lower the potassium; it buys time. Shifting agents such as insulin with dextrose and inhaled beta agonists follow, and definitive removal by dialysis or a potassium binder comes last.",
      },
      {
        label: "Pulmonary — venous thromboembolism",
        rawText:
          "Pretest probability determines which test is useful in suspected pulmonary embolism. A D-dimer is informative only when the pretest probability is low; in a high-probability patient it will be elevated regardless and computed tomography pulmonary angiography should be obtained directly. Anticoagulation is started before imaging when suspicion is high and bleeding risk is acceptable.",
      },
      {
        label: "Infectious disease — sepsis",
        rawText:
          "In sepsis, blood cultures are drawn before antibiotics whenever this does not delay therapy, and broad-spectrum antibiotics are given within the first hour. Fluid resuscitation is guided by perfusion rather than by a fixed volume, and vasopressors are started when hypotension persists despite adequate fluids. Source control is pursued in parallel, not afterwards.",
      },
      {
        label: "Hepatology — decompensated cirrhosis",
        rawText:
          "New ascites warrants diagnostic paracentesis. A neutrophil count of 250 cells per cubic millimetre or more establishes spontaneous bacterial peritonitis and calls for a third-generation cephalosporin plus albumin. Patients with cirrhosis require variceal screening, surveillance for hepatocellular carcinoma, sodium restriction and avoidance of non-steroidal anti-inflammatory drugs.",
      },
      {
        label: "Neurology — acute stroke",
        rawText:
          "Non-contrast computed tomography of the head precedes any thrombolytic decision in suspected stroke, because the immediate question is whether there is haemorrhage. Time of last known well determines eligibility. Blood glucose is checked early since hypoglycaemia is a common stroke mimic, and blood pressure targets differ depending on whether thrombolysis is given.",
      },
      {
        label: "Obstetrics — hypertensive disease of pregnancy",
        rawText:
          "Severe-range hypertension in pregnancy with end-organ involvement is treated with magnesium sulphate for seizure prophylaxis alongside antihypertensive therapy. Magnesium prevents eclamptic seizures; it is not an antihypertensive. Definitive management is delivery, with timing determined by gestational age and severity.",
      },
      {
        label: "Surgery — the acute abdomen",
        rawText:
          "Right lower quadrant pain with migration from the periumbilical region, anorexia and localised peritonism suggests appendicitis. Computed tomography confirms the diagnosis in the adult, and appendicectomy is definitive. Analgesia does not obscure the examination and should not be withheld while the diagnosis is being established.",
      },
    ],
  },
];
