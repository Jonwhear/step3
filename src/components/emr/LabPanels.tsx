/**
 * EMR-style laboratory display (spec §15).
 *
 * Dense, aligned, grouped by panel — not a quiz table. Two presentation rules
 * carry clinical weight:
 *
 *  - The abnormal flag is always shown, whether or not reference ranges are
 *    switched on (spec §14). Hiding ranges is a display preference; hiding the
 *    flag would change what the learner can tell.
 *  - Values are tabular-aligned so a column of numbers can be scanned the way
 *    it would be in a real chart.
 */

import { Card, SectionHeading } from "@/components/ui";
import type { LabFlag, LabPanelView } from "@/domain/labs";

const FLAG_CLASS: Record<LabFlag, string> = {
  NORMAL: "",
  LOW: "text-amber-700 dark:text-amber-400",
  HIGH: "text-amber-700 dark:text-amber-400",
  CRITICAL_LOW: "text-rose-700 dark:text-rose-400",
  CRITICAL_HIGH: "text-rose-700 dark:text-rose-400",
  ABNORMAL: "text-amber-700 dark:text-amber-400",
};

export function LabPanels({
  panels,
  showReferenceRanges,
  emptyMessage = "No laboratory results have been released for this patient yet.",
}: {
  panels: LabPanelView[];
  showReferenceRanges: boolean;
  emptyMessage?: string;
}) {
  if (panels.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {panels.map((panel) => (
        <section key={panel.category}>
          <SectionHeading>
            {panel.label}
            {panel.abnormalCount > 0 ? (
              <span className="ml-2 font-normal normal-case tracking-normal text-amber-700 dark:text-amber-400">
                {panel.abnormalCount} abnormal
              </span>
            ) : null}
          </SectionHeading>
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-surface-muted text-left">
                  <th className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    Test
                  </th>
                  <th className="px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    Result
                  </th>
                  {showReferenceRanges ? (
                    <th className="hidden px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-500 sm:table-cell">
                      Reference
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {panel.results.map((result) => (
                  <tr key={result.id}>
                    <td className="px-3 py-1.5 text-ink-700">
                      {result.displayName}
                      {result.collectedLabel ? (
                        <span className="block text-[11px] text-ink-400">
                          {result.collectedLabel}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right">
                      <span
                        className={`font-medium tabular-nums ${
                          result.flag === "NORMAL" ? "text-ink-900" : FLAG_CLASS[result.flag]
                        }`}
                      >
                        {result.value}
                      </span>
                      {result.units ? (
                        <span className="ml-1 text-xs text-ink-400">{result.units}</span>
                      ) : null}
                      {result.flagLabel ? (
                        <span
                          className={`ml-1.5 text-[10px] font-bold tracking-wide ${FLAG_CLASS[result.flag]}`}
                        >
                          {result.flagLabel}
                        </span>
                      ) : null}
                      {/* Ranges collapse under the value on narrow screens
                          rather than forcing the table to scroll. */}
                      {showReferenceRanges && result.referenceRange ? (
                        <span className="block text-[11px] tabular-nums text-ink-400 sm:hidden">
                          Ref {result.referenceRange}
                        </span>
                      ) : null}
                    </td>
                    {showReferenceRanges ? (
                      <td className="hidden whitespace-nowrap px-3 py-1.5 text-right text-xs tabular-nums text-ink-400 sm:table-cell">
                        {result.referenceRange}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      ))}
    </div>
  );
}
