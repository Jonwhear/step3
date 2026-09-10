import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

export function AppHeader({
  rotationName,
  right,
}: {
  rotationName?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <Link href="/" className="block truncate text-sm font-semibold text-ink-900">
            {APP_CONFIG.hospitalName}
          </Link>
          {rotationName ? (
            <p className="truncate text-xs text-ink-500">{rotationName}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <Link
            href="/settings"
            aria-label="Settings"
            className="tap flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600"
          >
            ⚙
          </Link>
        </div>
      </div>
    </header>
  );
}
