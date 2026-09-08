import type { ReactNode } from "react";
import { APP_CONFIG } from "@/config/app";

/** Standard page frame: constrained width, bottom-nav clearance, disclaimer. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">
      {children}
      <footer className="mt-10 border-t border-ink-200 pt-4">
        <p className="text-[11px] leading-relaxed text-ink-400">
          {APP_CONFIG.educationalDisclaimer}
        </p>
      </footer>
    </div>
  );
}
