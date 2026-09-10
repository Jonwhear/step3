/**
 * Central asset resolver (spec §32).
 *
 * No component builds a media path itself. Today every patient renders as
 * initials and every imaging study is text, but when generated headshots or
 * real images are added later the change lands here and nowhere else.
 */

export const ASSET_ROOTS = {
  patients: "/patients",
  imaging: "/imaging",
  lectures: "/lectures",
} as const;

export type AssetScope = "demo" | "custom";

export interface PatientVisual {
  kind: "initials" | "image";
  initials: string;
  src: string | null;
}

/**
 * Resolves what to draw for a patient. `assetPath` is stored on
 * `patient_visual` and is null for every patient today.
 */
export function resolvePatientVisual(input: {
  patientName: string;
  assetType?: string | null;
  assetPath?: string | null;
  fallbackInitials?: string | null;
}): PatientVisual {
  const initials = input.fallbackInitials?.trim() || initialsFromName(input.patientName);
  if (input.assetType === "HEADSHOT" && input.assetPath) {
    return { kind: "image", initials, src: assetUrl(ASSET_ROOTS.patients, input.assetPath) };
  }
  return { kind: "initials", initials, src: null };
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "??";
}

export function resolveImagingAsset(path: string | null | undefined): string | null {
  return path ? assetUrl(ASSET_ROOTS.imaging, path) : null;
}

export function resolveLectureAsset(path: string | null | undefined): string | null {
  return path ? assetUrl(ASSET_ROOTS.lectures, path) : null;
}

/** Absolute paths are passed through; anything else is rooted under its scope. */
function assetUrl(root: string, path: string): string {
  if (path.startsWith("/") || path.startsWith("http")) return path;
  return `${root}/${path}`;
}
