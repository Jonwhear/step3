/** The complete synthetic demo content bundle, validated at seed time. */

import { demoContentSchema, type DemoContent } from "@/content/schema";
import { DEMO_LAB_DEFINITIONS } from "@/content/labs";
import { DEMO_CONCEPTS } from "./concepts";
import { DEMO_ACTIONS } from "./actions";
import { DEMO_CASES } from "./cases";
import { DEMO_LECTURES } from "./lectures";
import { DEMO_SOURCES } from "./sources";
import { DEMO_LEARNING_POINTS } from "./learningPoints";

export const rawDemoContent = {
  concepts: DEMO_CONCEPTS,
  actions: DEMO_ACTIONS,
  cases: DEMO_CASES,
  lectures: DEMO_LECTURES,
  labDefinitions: DEMO_LAB_DEFINITIONS,
  sources: DEMO_SOURCES,
  learningPoints: DEMO_LEARNING_POINTS,
};

/**
 * Parses and validates the whole demo library. Throws with a readable path if
 * any record is malformed, which is exactly what you want at seed time.
 */
export function loadDemoContent(): DemoContent {
  return demoContentSchema.parse(rawDemoContent);
}

export {
  DEMO_CONCEPTS,
  DEMO_ACTIONS,
  DEMO_CASES,
  DEMO_LECTURES,
  DEMO_LAB_DEFINITIONS,
  DEMO_SOURCES,
  DEMO_LEARNING_POINTS,
};
