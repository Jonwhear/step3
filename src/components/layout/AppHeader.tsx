import type { ReactNode } from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { getProfile } from "@/domain/profile";
import { db } from "@/server/db";
import { formatShortDate } from "@/lib/date";

/**
 * The persistent top bar.
 *
 * `subtitle` says where you are. The learner's identity and exam date are read
 * here rather than passed in, so they appear on every screen without each page
 * having to remember to supply them — standing facts belong to the chrome, not
 * to one page.
 */
export function AppHeader({
  subtitle,
  right,
}: {
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  const profile = getProfile(db());

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
          {profile ? (
            <div className="max-w-[9.5rem] text-right sm:max-w-none">
              <p className="truncate text-xs font-medium text-ink-700">
                {profile.name}
                {profile.degree ? `, ${profile.degree}` : ""}
              </p>
              <p className="truncate text-[11px] text-ink-500">
                Step 3 · {formatShortDate(profile.step3Date)}
              </p>
            </div>
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
