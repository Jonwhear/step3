"use client";

/**
 * The case's teaching point, revealed only when asked for (spec V3 §6).
 *
 * It used to sit open on the summary, where it answered the case before the
 * learner had worked it out and took up chart space every time they came back.
 * Now it is an inline affordance: hover or focus reveals it, tapping opens it
 * on a touchscreen, and Escape or a click elsewhere puts it away.
 */

import { useEffect, useRef, useState } from "react";

export function TeachingPoint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        /* Opens rather than toggles: a pointer that hovers has already opened
           it by the time the click lands, and toggling would shut it again. It
           is dismissed by leaving, tapping elsewhere, or Escape. */
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className="tap rounded-md border border-clinical-200 bg-clinical-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clinical-700"
      >
        Teaching point
      </button>

      {open ? (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-1.5 block w-[min(22rem,78vw)] rounded-lg border border-clinical-200 bg-clinical-50 p-3 text-sm leading-relaxed text-clinical-700 shadow-lg"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
