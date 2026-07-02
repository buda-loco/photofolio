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

export type Bezier = { p0: Pt; p1: Pt; p2: Pt; p3: Pt }

export function bezierPoint({ p0, p1, p2, p3 }: Bezier, t: number): Pt {
  const mt = 1 - t
  const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  }
}

/** Unit tangent (direction of travel) at t. */
export function bezierTangent({ p0, p1, p2, p3 }: Bezier, t: number): Pt {
  const mt = 1 - t
  const dx = 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x)
  const dy = 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) {
    // cusp / zero-derivative point (freeform user-dragged spines can create
    // these) — fall back to the chord direction so the tangent stays a
    // genuine unit vector instead of collapsing to {0,0} and zeroing the
    // ribbon width/normal downstream
    const cdx = p3.x - p0.x, cdy = p3.y - p0.y
    const clen = Math.hypot(cdx, cdy) || 1
    return { x: cdx / clen, y: cdy / clen }
  }
  return { x: dx / len, y: dy / len }
}

/**
 * Unit normal (perpendicular to travel), a 90° rotation of the tangent:
 * {x: -tan.y, y: tan.x}. Rotation sense (left vs right of travel) depends on
 * the caller's coordinate system — in screen/SVG space (y-down) this points
 * to the left of the direction of travel; in math space (y-up) it points to
 * the right. Callers only need consistency (same side along the whole spine
 * for ribbon-edge offsetting), which this guarantees regardless of which
 * convention is in play.
 */
export function bezierNormal(bez: Bezier, t: number): Pt {
  const tan = bezierTangent(bez, t)
  return { x: -tan.y, y: tan.x }
}
