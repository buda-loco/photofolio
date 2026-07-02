// Pure yarn-generation math for the PlaceWorks brand tool. No React, no DOM —
// unit-testable in isolation (see src/lib/quote.ts for the repo's existing
// pure-logic-module precedent). Ported from YarnGenerator.tsx and extended:
// the spine is a freeform cubic bezier (not a fixed axis), and strokes carry
// a per-sample width for ribbon-polygon rendering instead of one flat width.

export type Pt = { x: number; y: number }
export type Octave = { f: number; ph: number; a: number }
export type Strand = { perp: Octave[]; along: Octave[]; tmJit: number }

const TWO_PI = Math.PI * 2
export const STRAND_MAX = 60
export const OCT_MAX = 9 // raised from 6 — more chaos headroom at max mess

export function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

export function fractal(oct: Octave[], n: number, p: number) {
  let v = 0, norm = 0
  for (let o = 0; o < n; o++) {
    v += oct[o].a * Math.sin(TWO_PI * oct[o].f * p + oct[o].ph)
    norm += oct[o].a
  }
  return v / norm
}

// stable per-seed harmonics so moving sliders doesn't re-roll the tangle
export function buildHarmonics(seed: number): Strand[] {
  const rng = mulberry32((seed * 2654435761) >>> 0)
  const strands: Strand[] = []
  for (let s = 0; s < STRAND_MAX; s++) {
    const perp: Octave[] = []
    const along: Octave[] = []
    for (let o = 0; o < OCT_MAX; o++) {
      perp.push({ f: (o + 1) * (0.8 + rng() * 1.7), ph: rng() * TWO_PI, a: 1 / (o + 1) })
      along.push({ f: (o + 1) * (0.7 + rng() * 1.5), ph: rng() * TWO_PI, a: 1 / (o + 1) })
    }
    strands.push({ perp, along, tmJit: rng() - 0.5 })
  }
  return strands
}
