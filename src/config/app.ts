/**
 * Central application configuration.
 *
 * The hospital name is expected to change, so it lives here and nowhere else.
 * Nothing in the UI should hardcode institutional strings.
 */

export const APP_CONFIG = {
  /** Fictional teaching hospital name. Rename here only. */
  hospitalName: "County General Teaching Hospital",
  hospitalShortName: "County General",
  appName: "Step 3 Teaching Service",

  /** Stated once, during onboarding. */
  educationalDisclaimer:
    "This application is intended for medical education and examination preparation. It is not intended to guide the care of actual patients.",

  /** Marker values applied to every synthetic seed record. */
  demo: {
    contentOrigin: "DEMO_SYNTHETIC",
    seedVersion: "demo-v1",
  },

  /** Single-user prototype: there is exactly one profile row and it uses this id. */
  singleUserId: "user-local",

  defaults: {
    targetPatientCount: 300,
    ttsRate: 1.0,
  },

  /** Playback speeds offered by the audio player. */
  ttsRates: [0.8, 1.0, 1.2, 1.4, 1.6] as const,
} as const;

/** Rotation label used when today falls outside every configured rotation block. */
export const OFF_SERVICE_ROTATION = {
  name: "General / Off-Service",
  specialty: "General",
} as const;

export const DEGREES = ["MD", "DO", "MBBS", "Other"] as const;
export type Degree = (typeof DEGREES)[number];

export const SPECIALTIES = [
  "Internal Medicine",
  "Psychiatry",
  "Pediatrics",
  "Family Medicine",
  "Emergency Medicine",
  "Surgery",
  "OB/GYN",
  "Neurology",
  "Anesthesiology",
  "Other",
] as const;
export type Specialty = (typeof SPECIALTIES)[number];

/**
 * Specialties that content can be filed under. This is a superset of the
 * residency specialties above because content is organised by clinical service.
 */
export const CONTENT_SPECIALTIES = [
  "Internal Medicine",
  "Neurology",
  "Psychiatry",
  "Pediatrics",
  "OB/GYN",
  "Surgery",
  "Emergency Medicine",
  "Preventive Care",
] as const;
export type ContentSpecialty = (typeof CONTENT_SPECIALTIES)[number];

/**
 * Adjacency used by the scheduler's rotation-relevance term. A rotation gets
 * full credit for its own specialty and partial credit for related ones.
 */
export const RELATED_SPECIALTIES: Record<string, readonly string[]> = {
  "Internal Medicine": ["Emergency Medicine", "Neurology", "Preventive Care", "General"],
  "Family Medicine": [
    "Internal Medicine",
    "Pediatrics",
    "OB/GYN",
    "Preventive Care",
    "Emergency Medicine",
  ],
  "Emergency Medicine": ["Internal Medicine", "Surgery", "Pediatrics", "Neurology"],
  Neurology: ["Internal Medicine", "Emergency Medicine", "Psychiatry"],
  Psychiatry: ["Neurology", "Internal Medicine"],
  Pediatrics: ["Emergency Medicine", "Internal Medicine", "Preventive Care"],
  "OB/GYN": ["Surgery", "Emergency Medicine", "Preventive Care"],
  Surgery: ["Emergency Medicine", "Internal Medicine"],
  Anesthesiology: ["Surgery", "Emergency Medicine", "Internal Medicine"],
  "Preventive Care": ["Internal Medicine", "Family Medicine", "Pediatrics"],
  General: [
    "Internal Medicine",
    "Emergency Medicine",
    "Neurology",
    "Psychiatry",
    "Pediatrics",
    "OB/GYN",
    "Surgery",
    "Preventive Care",
  ],
  Other: [],
} as const;

/**
 * Internal curriculum tree. Surfaced on Progress, deliberately hidden on the
 * Service screen where patients are the interface.
 */
export const CURRICULUM_TREE: Record<string, readonly string[]> = {
  "Internal Medicine": [
    "Cardiology",
    "Pulmonology",
    "Endocrinology",
    "Gastroenterology",
    "Infectious Disease",
  ],
  Neurology: ["Stroke", "Seizure"],
  Psychiatry: ["Toxicology", "Substance Use", "Cognition"],
  Pediatrics: ["Gastroenterology", "Pulmonology"],
  "OB/GYN": ["Obstetrics", "Early Pregnancy"],
  Surgery: ["Acute Abdomen", "Biliary Disease"],
  "Emergency Medicine": ["Cardiopulmonary", "Allergy"],
  "Preventive Care": ["Preventive Care"],
} as const;
