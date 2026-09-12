import "server-only";

/**
 * Loads everything a screen needs about the current day in one place.
 *
 * Running the scheduler here means the panel is up to date whichever screen the
 * learner opens first, and — because the scheduler records its run — reopening
 * the app later the same day does not assign more patients (spec §31).
 */

import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Db } from "@/db/client";
import { getCaseById, listCases } from "@/domain/cases";
import type { PatientState } from "@/domain/constants";
import { getLecture, type LectureView } from "@/domain/lectures";
import {
  hospitalDayOn,
  listActivePanel,
  listByState,
  listRoundsDue,
} from "@/domain/patients";
import {
  getAudioPreferences,
  getCurrentRotation,
  getProfile,
  getSettings,
  SETTING_KEYS,
  USER_ID,
  type AudioPreferences,
  type CurrentRotation,
} from "@/domain/profile";
import { buildFloorMap, composeCensus, type CensusBed } from "@/domain/rooms";
import { roundsStatusFor } from "@/domain/rounds";
import {
  bootstrapNewUserService,
  daysSinceLastSchedulerRun,
  getSchedulerDebug,
  runDailyScheduler,
} from "@/domain/scheduler";
import { db } from "@/server/db";
import { todayIso, type IsoDate } from "@/lib/date";
import type * as t from "@/db/schema";

export interface PanelPatient {
  id: string;
  patientName: string;
  roomNumber: string;
  state: PatientState;
  entryMode: string;
  hospitalDay: number;
  roundsCompleted: number;
  roundsDueToday: boolean;
  /** Only revealed once the learner has legitimately met the patient. */
  diagnosis: string | null;
  caseTitle: string;
  caseCode: string;
  specialty: string;
  topic: string;
  minimumRounds: number;
}

export interface DailySession {
  today: IsoDate;
  profile: t.UserProfileRow | null;
  onboarded: boolean;
  rotation: CurrentRotation;
  audio: AudioPreferences;
  panel: PanelPatient[];
  pendingHandoff: PanelPatient[];
  pendingAdmission: PanelPatient[];
  roundsDue: PanelPatient[];
  dischargeReady: PanelPatient[];
  lecture: LectureView | null;
  /** Days away since the last scheduler run, for the neutral welcome message. */
  daysAway: number | null;
  /**
   * The inpatient floor in room order, each bed carrying its occupant's full
   * panel entry. This is the *only* representation of the service: the screen
   * shows the ward, not a ward plus a redundant list beside it.
   */
  census: CensusBed<PanelPatient>[];
  /**
   * Panel patients who hold no inpatient bed — an ED bay, typically. They are
   * still the learner's patients, so they must never fall out of the board
   * just because the floor map does not model their location.
   */
  offFloor: PanelPatient[];
  /**
   * Why the service is empty, when it is. Never null-and-silent: spec §66
   * requires the app to say why there is no work rather than showing a blank
   * screen the learner has to interpret.
   */
  emptyServiceReason: EmptyServiceReason | null;
}

export interface EmptyServiceReason {
  title: string;
  body: string;
  /** A concrete next step, when one exists. */
  action: { label: string; href: string } | null;
}

/**
 * Turns the scheduler's own diagnosis into learner-facing wording. The
 * scheduler already recorded exactly which constraint bound; this only decides
 * how to say it.
 */
function describeEmptyService(
  database: Db,
  today: IsoDate,
  hasContent: boolean,
): EmptyServiceReason {
  if (!hasContent) {
    return {
      title: "No clinical content is loaded",
      body: "The content library is empty, so no patients can be assigned. Seed the demo library or import a content pack.",
      action: { label: "Open content library", href: "/settings/content" },
    };
  }

  const debug = getSchedulerDebug(database, today);
  if (debug?.blockedReason) {
    return {
      title: "No patients are currently assigned",
      body: debug.blockedReason,
      action: { label: "Open scheduler inspector", href: "/settings/developer" },
    };
  }

  return {
    title: "Your census is clear",
    body: "Every patient has been discharged and no new admissions are scheduled for today. Your next assignment arrives with tomorrow's scheduler run.",
    action: { label: "Open teaching conference", href: "/conference" },
  };
}

function toPanelPatient(
  database: Db,
  row: t.PatientInstanceRow,
  template: t.CaseTemplateRow | null,
  today: IsoDate,
): PanelPatient {
  // The diagnosis is hidden until the patient has been accepted or admitted —
  // an active admission is supposed to make the learner work it out.
  const revealed = row.state !== "PENDING_ADMISSION";
  return {
    id: row.id,
    patientName: row.patientName,
    roomNumber: row.roomNumber,
    state: row.state as PatientState,
    entryMode: row.entryMode,
    // The day being worked, so the board and the chart never disagree.
    hospitalDay: hospitalDayOn(row, today),
    roundsCompleted: row.roundsCompleted,
    // "Rounds due" has to mean there is work: a case with no question and no
    // problem list is not overdue, it has nothing to ask.
    roundsDueToday: roundsStatusFor(database, row, today) === "DUE",
    diagnosis: revealed ? (template?.primaryDiagnosis ?? null) : null,
    caseTitle: template?.title ?? "Unknown case",
    caseCode: template?.code ?? "",
    specialty: template?.specialty ?? "",
    topic: template?.topic ?? "",
    minimumRounds: template?.minimumRoundsBeforeDischarge ?? 2,
  };
}

export function loadDailySession(): DailySession {
  const database = db();
  const today = todayIso();
  const profile = getProfile(database);
  const settings = getSettings(database);
  const onboarded = Boolean(profile) && settings[SETTING_KEYS.onboarded] === "true";

  const daysAway = daysSinceLastSchedulerRun(database, today);

  if (onboarded) {
    // A profile created before the bootstrap existed still needs its marker
    // settled; the call is a no-op once it has run (spec §35).
    bootstrapNewUserService(database, { today });
    // Safe to call on every page load: it no-ops if it already ran today.
    runDailyScheduler(database, { today });
  }

  const decorate = (rows: t.PatientInstanceRow[]) =>
    rows.map((row) => toPanelPatient(database, row, getCaseById(database, row.caseId), today));

  const panel = decorate(listActivePanel(database));
  const { beds: census, offFloor } = composeCensus(
    onboarded ? buildFloorMap(database, { today }) : [],
    panel,
  );
  const lectureId = getScheduledLectureId(database, today);
  const hasContent = listCases(database).length > 0;

  return {
    today,
    profile,
    onboarded,
    rotation: getCurrentRotation(database, today),
    audio: getAudioPreferences(database),
    panel,
    pendingHandoff: decorate(listByState(database, "PENDING_HANDOFF")),
    pendingAdmission: decorate(listByState(database, "PENDING_ADMISSION")),
    roundsDue: decorate(listRoundsDue(database, today)),
    dischargeReady: decorate(listByState(database, "DISCHARGE_ELIGIBLE")),
    lecture: lectureId ? getLecture(database, lectureId) : null,
    daysAway,
    census,
    offFloor,
    emptyServiceReason:
      onboarded && panel.length === 0
        ? describeEmptyService(database, today, hasContent)
        : null,
  };
}

function getScheduledLectureId(database: Db, today: IsoDate): string | null {
  // Read straight from the persisted run so the lecture is stable all day.
  const run = database
    .select({ lectureId: schema.schedulerRun.lectureId })
    .from(schema.schedulerRun)
    .where(
      and(
        eq(schema.schedulerRun.userId, USER_ID),
        eq(schema.schedulerRun.runDate, today),
      ),
    )
    .get();
  return run?.lectureId ?? null;
}
