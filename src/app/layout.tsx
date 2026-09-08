import type { Metadata, Viewport } from "next";
import { APP_CONFIG } from "@/config/app";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_CONFIG.hospitalName} — Step 3 Teaching Service`,
  description:
    "A case-centric Step 3 study application structured as a fictional teaching hospital service.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-ink-50 text-ink-900 antialiased">
        <div className="min-h-dvh">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
