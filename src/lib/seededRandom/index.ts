/**
 * Deterministic pseudo-random helpers.
 *
 * The scheduler must never call unseeded Math.random() (spec §45): every
 * decision has to be reproducible from (user id + date + case id) so bugs can
 * be replayed and tests can assert exact output.
 */

/** FNV-1a 32-bit string hash. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Mulberry32: small, fast, good enough for tie-breaking. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable value in [0, 1) for a set of seed parts. */
export function seededUnit(...parts: (string | number)[]): number {
  return mulberry32(hashString(parts.join("|")))();
}

/** A stable value in [0, max) for a set of seed parts. */
export function seededJitter(max: number, ...parts: (string | number)[]): number {
  return seededUnit(...parts) * max;
}

/** Deterministic shuffle; same input order + seed always yields same output. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rand = mulberry32(hashString(seed));
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}
