/**
 * Chart tab navigation (spec §52).
 *
 * Server-rendered links rather than client state, so a tab is a real URL that
 * survives a refresh and can be linked to. Tabs with nothing behind them are
 * not rendered at all — an empty "Consults" tab would only teach the learner
 * that tabs are unreliable.
 */

import Link from "next/link";

export type ChartTab = "summary" | "handoff" | "results" | "chart" | "rounds" | "course";

export const CHART_TAB_LABELS: Record<ChartTab, string> = {
  summary: "Summary",
  handoff: "Handoff",
  results: "Results",
  chart: "Chart",
  rounds: "Rounds",
  course: "Hospital course",
};

export function ChartTabs({
  patientId,
  active,
  available,
}: {
  patientId: string;
  active: ChartTab;
  available: ChartTab[];
}) {
  return (
    <nav aria-label="Patient chart sections" className="border-b border-ink-200 bg-surface">
      <ul className="scroll-x mx-auto flex max-w-3xl gap-1 px-2">
        {available.map((tab) => {
          const isActive = tab === active;
          return (
            <li key={tab}>
              <Link
                href={`/patients/${patientId}?tab=${tab}`}
                aria-current={isActive ? "page" : undefined}
                className={`tap inline-flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium ${
                  isActive
                    ? "border-clinical-600 text-clinical-700"
                    : "border-transparent text-ink-500"
                }`}
              >
                {CHART_TAB_LABELS[tab]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function parseChartTab(value: string | undefined, available: ChartTab[]): ChartTab {
  const candidate = value as ChartTab | undefined;
  if (candidate && available.includes(candidate)) return candidate;
  return available[0] ?? "summary";
}
