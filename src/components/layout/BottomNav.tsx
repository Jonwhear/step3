"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { stop as stopSpeech } from "@/lib/audio/speech";

const ITEMS = [
  { href: "/", label: "Service", icon: "▦" },
  { href: "/handoff", label: "Handoff", icon: "☰" },
  { href: "/rounds", label: "Rounds", icon: "✚" },
  { href: "/admissions", label: "Admissions", icon: "⤓" },
  { href: "/conference", label: "Conference", icon: "◍" },
  { href: "/progress", label: "Progress", icon: "◔" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Navigating away must never leave a voice talking over the next screen.
  useEffect(() => {
    stopSpeech();
  }, [pathname]);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`tap flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium ${
                  active ? "text-clinical-600" : "text-ink-500"
                }`}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
