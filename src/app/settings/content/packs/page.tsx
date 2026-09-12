import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Card, SectionHeading } from "@/components/ui";
import {
  CURRENT_PACK_SCHEMA_VERSION,
  exportPack,
  listContentPacks,
  PACK_FORMAT,
  SUPPORTED_PACK_SCHEMA_VERSIONS,
} from "@/domain/content/packs";
import { db } from "@/server/db";
import { PackImport } from "./PackImport";

export const dynamic = "force-dynamic";

/** Content packs (spec §40-44): portable, versioned patient libraries. */
export default async function PacksPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string }>;
}) {
  const { export: exportId } = await searchParams;
  const database = db();
  const packs = listContentPacks(database);

  const exported = exportId ? exportPack(database, { packId: exportId }) : null;

  return (
    <>
      <AppHeader subtitle="Content packs" />
      <PageShell>
        <Link href="/settings/content" className="text-xs font-medium text-clinical-600">
          ‹ Content library
        </Link>
        <h1 className="mt-3 text-lg font-semibold text-ink-900">Content packs</h1>
        <p className="mt-1 text-sm text-ink-500">
          A pack is a portable library of patients. The application is the
          engine; packs are the content that runs on it.
        </p>

        <section className="mt-4">
          <SectionHeading>Installed packs</SectionHeading>
          <Card className="divide-y divide-ink-100">
            {packs.map((pack) => (
              <div key={pack.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800">{pack.name}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      v{pack.version} · schema {pack.schemaVersion}
                      {pack.author ? ` · ${pack.author}` : ""}
                    </p>
                  </div>
                  {pack.isBuiltin ? <Badge tone="neutral">Builtin</Badge> : null}
                </div>
                {pack.description ? (
                  <p className="mt-1 text-xs text-ink-500">{pack.description}</p>
                ) : null}
                <Link
                  href={`/settings/content/packs?export=${encodeURIComponent(pack.id)}`}
                  className="mt-2 inline-flex h-9 items-center rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-700"
                >
                  Export
                </Link>
              </div>
            ))}
          </Card>
        </section>

        {exported ? (
          <section className="mt-6">
            <SectionHeading>Exported — {exported.manifest.name}</SectionHeading>
            <Card className="p-4">
              <p className="text-xs text-ink-500">
                Copy this JSON and save it as a <code>.ghpack.json</code> file.
              </p>
              <textarea
                readOnly
                rows={14}
                value={JSON.stringify(exported, null, 2)}
                className="mt-2 w-full rounded-lg border border-ink-200 bg-surface-muted px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-800"
              />
            </Card>
          </section>
        ) : null}

        <section className="mt-6">
          <SectionHeading>Import a pack</SectionHeading>
          <PackImport />
        </section>

        <section className="mt-6">
          <SectionHeading>Format</SectionHeading>
          <Card className="p-4">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Format identifier</dt>
                <dd className="font-mono text-xs text-ink-800">{PACK_FORMAT}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Current schema version</dt>
                <dd className="tabular-nums text-ink-800">{CURRENT_PACK_SCHEMA_VERSION}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Readable versions</dt>
                <dd className="tabular-nums text-ink-800">
                  {SUPPORTED_PACK_SCHEMA_VERSIONS.join(", ")}
                </dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-500">
              Older packs are brought forward by explicit migration adapters
              rather than being reinterpreted as the newest shape. A pack from a
              newer build than this one is refused with an explanation rather
              than partially imported.
            </p>
          </Card>
        </section>
      </PageShell>
    </>
  );
}
