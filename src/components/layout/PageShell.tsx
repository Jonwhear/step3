import type { ReactNode } from "react";

/**
 * Standard page frame: constrained width, bottom-nav clearance.
 *
 * Nothing is appended here. A global footer repeating the same disclaimer on
 * every screen was pure chrome — the learner read it once and then scrolled
 * past it forever — so the educational-use statement is stated once, during
 * onboarding, and the app itself stays free of standing boilerplate.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">{children}</div>;
}
