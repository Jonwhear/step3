import type { Metadata, Viewport } from "next";
import { APP_CONFIG } from "@/config/app";
import { BottomNav } from "@/components/layout/BottomNav";
import { getPreferences } from "@/domain/settings";
import { db } from "@/server/db";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_CONFIG.hospitalName} — Step 3 Teaching Service`,
  description:
    "A case-centric Step 3 study application structured as a fictional teaching hospital service.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** Preferences are read on the server and stamped onto <html>, so the chosen
 *  theme is already applied in the first paint — no flash, and no client-side
 *  theme script to keep in sync. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { appearance } = getPreferences(db());

  return (
    <html
      lang="en"
      // "system" deliberately stamps nothing: the CSS media query handles it.
      data-theme={appearance.theme === "system" ? undefined : appearance.theme}
      data-font-size={appearance.fontSize}
      data-density={appearance.density}
      data-accent={appearance.accent}
    >
      <body className="min-h-dvh bg-canvas text-ink-900 antialiased">
        <div className="min-h-dvh">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
