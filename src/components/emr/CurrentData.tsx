/**
 * The patient's state today: vitals, labs, imaging, and the rest of the chart
 * data the learner has uncovered (spec V3 §12-14).
 *
 * Values are today's by definition, so nothing is labelled "current" — the
 * label would be on every row and therefore say nothing. Where an earlier value
 * was actually recorded on a previous hospital day, and it differs from
 * today's, the row offers a disclosure; where it was not, there is no control
 * to open. Nothing here interpolates a trend.
 */

import { Card, SectionHeading } from "@/components/ui";
import { ImagingList } from "@/components/emr/ImagingReport";
import type {
  EncounterFinding,
  EncounterLabPanel,
  EncounterVital,
  ObservationPoint,
} from "@/domain/rounds";
import type { ImagingResultView } from "@/domain/labs";

const FLAG_CLASS: Record<string, string> = {
  NORMAL: "text-ink-900",
  LOW: "text-warn-700",
  HIGH: "text-warn-700",
  CRITICAL_LOW: "text-bad-700",
  CRITICAL_HIGH: "text-bad-700",
  ABNORMAL: "text-warn-700",
};

const CATEGORY_LABEL: Record<string, string> = {
  HISTORY: "History",
  EXAM: "Examination",
  LAB: "Laboratory (narrative)",
  IMAGING: "Imaging (narrative)",
  ECG: "ECG",
  OTHER: "Other studies",
};

/** The recorded earlier values, named by the day they belong to. */
function PriorValues({ prior, label }: { prior: ObservationPoint[]; label: string }) {
  return (
    <details className="mt-0.5 inline-block align-top">
      <summary
        aria-label={`Earlier values for ${label}`}
        className="tap inline-flex cursor-pointer list-none items-center rounded border border-ink-200 px-1 text-[10px] leading-4 text-ink-400"
      >
        ▾
      </summary>
      <dl className="mt-1 space-y-0.5 rounded-md border border-ink-200 bg-surface-muted p-2 text-left">
        {prior.map((point) => (
          <div key={point.hospitalDay} className="flex justify-between gap-3 text-[11px]">
            <dt className="text-ink-500">
              {point.hospitalDay === 1 ? "Admission" : `HD ${point.hospitalDay}`}
            </dt>
            <dd className="tabular-nums text-ink-700">{point.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function CurrentData({
  vitals,
  labPanels,
  imaging,
  findings,
  showReferenceRanges,
}: {
  vitals: EncounterVital[];
  labPanels: EncounterLabPanel[];
  imaging: ImagingResultView[];
  findings: EncounterFinding[];
  showReferenceRanges: boolean;
}) {
  const grouped = findings.reduce<Record<string, EncounterFinding[]>>((acc, finding) => {
    (acc[finding.category] ??= []).push(finding);
    return acc;
  }, {});

  const hasAnything =
    vitals.length > 0 ||
    labPanels.length > 0 ||
    imaging.length > 0 ||
    Object.keys(grouped).length > 0;

  if (!hasAnything) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-500">
          No results have been released for this patient yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {vitals.length > 0 ? (
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            Vitals
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {vitals.map((vital) => (
              <div key={vital.label} className="text-sm">
                <dt className="text-xs text-ink-400">{vital.label}</dt>
                <dd className="flex items-start gap-1.5 tabular-nums text-ink-800">
                  <span>{vital.value}</span>
                  {vital.prior.length > 0 ? (
                    <PriorValues prior={vital.prior} label={vital.label} />
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      {labPanels.map((panel) => (
        <section key={panel.category}>
          <SectionHeading>
            {panel.label}
            {panel.abnormalCount > 0 ? (
              <span className="ml-2 font-normal normal-case tracking-normal text-warn-700">
                {panel.abnormalCount} abnormal
              </span>
            ) : null}
          </SectionHeading>
          <Card className="divide-y divide-ink-100">
            {panel.results.map((result) => (
              <div key={result.id} className="flex items-start justify-between gap-4 px-3 py-1.5">
                <span className="text-sm text-ink-700">{result.displayName}</span>
                <span className="text-right">
                  <span
                    className={`font-medium tabular-nums ${FLAG_CLASS[result.flag] ?? "text-ink-900"}`}
                  >
                    {result.value}
                  </span>
                  {result.units ? (
                    <span className="ml-1 text-xs text-ink-400">{result.units}</span>
                  ) : null}
                  {result.flagLabel ? (
                    <span
                      className={`ml-1.5 text-[10px] font-bold tracking-wide ${FLAG_CLASS[result.flag] ?? ""}`}
                    >
                      {result.flagLabel}
                    </span>
                  ) : null}
                  {result.prior.length > 0 ? (
                    <span className="ml-1.5">
                      <PriorValues prior={result.prior} label={result.displayName} />
                    </span>
                  ) : null}
                  {showReferenceRanges && result.referenceRange ? (
                    <span className="block text-[11px] tabular-nums text-ink-400">
                      Ref {result.referenceRange}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </Card>
        </section>
      ))}

      {imaging.length > 0 ? (
        <section>
          <SectionHeading>Imaging</SectionHeading>
          <ImagingList studies={imaging} />
        </section>
      ) : null}

      {Object.entries(grouped).map(([category, rows]) => (
        <section key={category}>
          <SectionHeading>{CATEGORY_LABEL[category] ?? category}</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {rows.map((finding) => (
              <div
                key={`${category}:${finding.label}`}
                className="flex justify-between gap-4 px-3 py-1.5"
              >
                <span className="text-sm text-ink-600">{finding.label}</span>
                <span className="text-right text-sm text-ink-900">{finding.value}</span>
              </div>
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}

