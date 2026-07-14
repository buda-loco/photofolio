/** Tus CFO — tiny random helpers shared by the generators. */

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Pick an element that isn't `not` (falls back to any if impossible). */
export function pickOther<T>(arr: readonly T[], not: T): T {
  const options = arr.filter((x) => x !== not)
  return options.length ? pick(options) : pick(arr)
}

/**
 * mulberry32 — tiny seeded PRNG. The pattern generators keep a `seed` in
 * state and derive every cell from it, so changing a palette or slider
 * re-colours the *same* arrangement instead of scrambling it, and
 * "Generar" is just a new seed.
 */
export function seededRand(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
