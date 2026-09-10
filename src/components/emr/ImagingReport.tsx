/**
 * EMR-style imaging result (spec §16).
 *
 * Laid out the way a radiology report reads: study and time, then IMPRESSION,
 * then FINDINGS — impression first because that is what a clinician reads
 * first. Text-only for now; the asset slot renders when an image is attached.
 */

import { Card } from "@/components/ui";
import { resolveImagingAsset } from "@/lib/assets";
import type { ImagingResultView } from "@/domain/labs";

export function ImagingReport({ study }: { study: ImagingResultView }) {
  const image = resolveImagingAsset(study.imageAssetPath);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200 bg-surface-muted px-4 py-2">
        <p className="text-sm font-semibold text-ink-900">{study.studyName}</p>
        {study.performedLabel ? (
          <p className="text-[11px] text-ink-500">{study.performedLabel}</p>
        ) : null}
      </div>

      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={`${study.studyName} image`}
          className="max-h-96 w-full bg-black object-contain"
        />
      ) : null}

      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          Impression
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-900">{study.impression}</p>

        {study.findingsText ? (
          <>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Findings
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">{study.findingsText}</p>
          </>
        ) : null}
      </div>
    </Card>
  );
}

export function ImagingList({
  studies,
  emptyMessage = "No imaging has been released for this patient yet.",
}: {
  studies: ImagingResultView[];
  emptyMessage?: string;
}) {
  if (studies.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-500">{emptyMessage}</p>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {studies.map((study) => (
        <ImagingReport key={study.id} study={study} />
      ))}
    </div>
  );
}
