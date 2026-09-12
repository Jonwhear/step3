import type { ReactNode } from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

/**
 * The persistent top bar.
 *
 * `subtitle` says where you are; `meta` carries standing facts that would
 * otherwise need a block of their own on the page — on the service screen,
 * who the learner is and when they sit Step 3. Both are chrome: nothing here
 * is ever the only place a piece of information appears.
 */
export function AppHeader({
  subtitle,
  meta,
  right,
}: {
  subtitle?: ReactNode;
  meta?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <Link href="/" className="block truncate text-sm font-semibold text-ink-900">
            {APP_CONFIG.hospitalName}
          </Link>
          {subtitle ? <p className="truncate text-xs text-ink-500">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {meta ? (
            <div className="max-w-[9.5rem] text-right sm:max-w-none">{meta}</div>
          ) : null}
          {right}
          <Link
            href="/settings"
            aria-label="Settings"
            className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 text-ink-600"
          >
            ⚙
          </Link>
        </div>
      </div>
    </header>
  );
}
