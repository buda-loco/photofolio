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
export const SCALE_MIN = 0.2 // startScale/endScale floor — near-flat against the spine
export const SCALE_MAX = 3 // startScale/endScale ceiling — matches the logo-scale slider's headroom

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

export type ThicknessPreset = 'flat' | 'thick-thin' | 'thin-thick' | 'thick-thin-thick' | 'thin-thick-thin'
export type ThicknessParams = {
  preset: ThicknessPreset
  min: number
  max: number
  transitionPos: number   // 0..1, where along the line the transition/peak sits
  transitionWidth: number // 0..1, how gradual it is
}

// The Gaussian presets (thick-thin-thick / thin-thick-thin) use transitionWidth
// directly as sigma, but that makes them visually much wider than the linear
// presets (thick-thin / thin-thick) at the same transitionWidth value: the
// linear presets fully saturate at delta = w/2 from transitionPos, while an
// unscaled Gaussian (sigma = w) only reaches ~90% saturation (bump ~= 0.1) at
// delta ~= 2*w. Since transitionWidth is one shared field a future UI slider
// will drive across all 5 presets, that mismatch reads as a broken control.
// Scale sigma down so the Gaussian's "visually saturated" point (bump falls
// to 5% of its peak) lands at the same delta = w/2 as the linear presets:
// solving exp(-(w/2)^2 / (2*sigma^2)) = 0.05 for sigma gives
// sigma = (w/2) / sqrt(-2*ln(0.05)) ~= w / 4.9.
const GAUSSIAN_SIGMA_SCALE = 4.9

export function thicknessAt(t: number, p: ThicknessParams): number {
  const { preset, min, max, transitionPos, transitionWidth } = p
  const w = Math.max(1e-3, transitionWidth)
  switch (preset) {
    case 'flat':
      return max
    case 'thick-thin':
      return max - (max - min) * smoothstep(transitionPos - w / 2, transitionPos + w / 2, t)
    case 'thin-thick':
      return min + (max - min) * smoothstep(transitionPos - w / 2, transitionPos + w / 2, t)
    case 'thick-thin-thick': {
      const sigma = w / GAUSSIAN_SIGMA_SCALE
      const bump = Math.exp(-((t - transitionPos) ** 2) / (2 * sigma * sigma))
      return max - (max - min) * bump
    }
    case 'thin-thick-thin': {
      const sigma = w / GAUSSIAN_SIGMA_SCALE
      const bump = Math.exp(-((t - transitionPos) ** 2) / (2 * sigma * sigma))
      return min + (max - min) * bump
    }
  }
}

export const SAMPLES = 220

export type AvoidRect = { x: number; y: number; width: number; height: number }

/**
 * Repels `p` away from an axis-aligned rect, falling off smoothly to zero at
 * `radius` px from the rect's nearest edge (measured from the edge, not the
 * center, so a bigger rect doesn't need a bigger radius to still "reach"
 * points just outside it).
 *
 * The field is CONTINUOUS across the rect boundary — this matters because the
 * strands are rendered as filled ribbon polygons, and any jump in the
 * displacement between adjacent samples kinks the centerline hard enough to
 * self-intersect the ribbon outline, which renders as solid filled blobs.
 * So both branches agree at the boundary:
 * - outside (0 < dist < radius): pushed away from the nearest point on the
 *   rect, magnitude strength·radius·(1 - dist/radius)² — approaches
 *   strength·radius as dist → 0.
 * - inside/on the rect: pushed out through the NEAREST EDGE (the direction
 *   the outside branch converges to), magnitude strength·(radius + depth) —
 *   equals strength·radius at depth 0, and grows with depth so deeper points
 *   still clear the rect at full strength.
 * `strength` is 0..1, scaling the push at the edge as a fraction of
 * `radius`; `strength <= 0` or `radius <= 0` is a no-op.
 */
export function avoidRect(p: Pt, rect: AvoidRect, strength: number, radius: number): Pt {
  if (strength <= 0 || radius <= 0) return p
  const cx = Math.min(Math.max(p.x, rect.x), rect.x + rect.width)
  const cy = Math.min(Math.max(p.y, rect.y), rect.y + rect.height)
  const dx = p.x - cx
  const dy = p.y - cy
  const dist = Math.hypot(dx, dy)

  if (dist === 0) {
    // Inside (or exactly on) the rect. Exit through the nearest edge — the
    // same direction the outside branch's push converges to as a point
    // approaches this edge from outside, which is what keeps the field
    // continuous across the boundary. (The old version pushed inside points
    // away from the rect *center*, which disagrees with the outside
    // direction almost everywhere on the boundary — that discontinuity was
    // the source of the self-intersecting-ribbon "fill" artifacts.)
    const dl = p.x - rect.x
    const dr = rect.x + rect.width - p.x
    const dt = p.y - rect.y
    const db = rect.y + rect.height - p.y
    const depth = Math.min(dl, dr, dt, db)
    let nx = 0, ny = 0
    if (depth === dl) nx = -1
    else if (depth === dr) nx = 1
    else if (depth === dt) ny = -1
    else ny = 1
    const push = strength * (radius + depth)
    return { x: p.x + nx * push, y: p.y + ny * push }
  }

  if (dist >= radius) return p
  // Squared falloff (not linear): keeps the push near-full close to the
  // edge, then tapers out smoothly by `radius`, instead of an abrupt "field
  // boundary" that would otherwise be visible as a kink where lines re-enter
  // their undeflected path.
  const falloff = 1 - dist / radius
  const push = falloff * falloff * strength * radius
  return { x: p.x + (dx / dist) * push, y: p.y + (dy / dist) * push }
}

/**
 * Laplacian relaxation of a polyline, weighted per-point: each interior
 * point moves toward the midpoint of its neighbours by
 * 0.5 · clamp(influence[i], 0, 1) per iteration; endpoints never move.
 * Used after avoidRect displacement to round off the direction flips the
 * field necessarily has along the rect's diagonals (nearest-edge changes
 * side there) — without it those flips kink the centerline and the filled
 * ribbon outline self-intersects. Influence-weighted so undeflected spans
 * keep their high-frequency mess detail exactly (weight 0 = untouched).
 */
export function relaxPolyline(points: Pt[], influence: number[], iterations: number): Pt[] {
  if (points.length !== influence.length) throw new Error('points and influence must be the same length')
  let cur = points
  for (let it = 0; it < iterations; it++) {
    cur = cur.map((p, i) => {
      if (i === 0 || i === cur.length - 1) return p
      const w = 0.5 * Math.min(1, Math.max(0, influence[i]))
      if (w === 0) return p
      const mx = (cur[i - 1].x + cur[i + 1].x) / 2
      const my = (cur[i - 1].y + cur[i + 1].y) / 2
      return { x: p.x + (mx - p.x) * w, y: p.y + (my - p.y) * w }
    })
  }
  return cur
}

/** Per-element max over a ±w window — spreads relaxation influence a few
 *  samples past where the field actually displaced points, so the smoothed
 *  span blends into the untouched span instead of stopping dead at it. */
function dilateInfluence(vals: number[], w: number): number[] {
  return vals.map((_, i) => {
    let m = 0
    for (let k = Math.max(0, i - w); k <= Math.min(vals.length - 1, i + w); k++) m = Math.max(m, vals[k])
    return m
  })
}

export type BuildParams = {
  bezier: Bezier
  lines: number
  mess: number    // 0..100
  detail: number  // 1..OCT_MAX
  resolve: number // 0..100 — where along the run the mess resolves
  sharp: number   // 0..100 — how abrupt the resolve transition is
  spread: number  // 0..100 — how much lines gather toward the centerline when resolved
  startScale: number // SCALE_MIN..SCALE_MAX — tangle-amplitude multiplier at t=0, blended linearly to endScale across the run
  endScale: number   // SCALE_MIN..SCALE_MAX — same, at t=1
  avoid: { rect: AvoidRect; strength: number } // strength 0..100; <=0 disables the field entirely (avoidRect no-ops)
  thickness: ThicknessParams
  seed: number
}

export type Stroke = { points: Pt[]; widths: number[]; opacity: number }

export function buildStrokes(h: Strand[], params: BuildParams): Stroke[] {
  const { bezier, lines, mess, detail, resolve, sharp, spread, startScale, endScale, avoid, thickness } = params
  // defensive clamp — buildStrokes is a standalone exported function future
  // tasks may call directly (not just from a bounded UI slider); a stray
  // large `lines` would allocate lines*(SAMPLES+1) points/widths and blow
  // up downstream SVG rendering. 500 is a generous sanity ceiling, well
  // above any planned UI max.
  const lineCount = Math.max(1, Math.min(500, Math.round(lines)))
  const amp = (mess / 100) * 0.95 // was 0.58 — raised chaos ceiling
  const oct = Math.max(1, Math.min(OCT_MAX, Math.round(detail)))
  const tm = 0.1 + (resolve / 100) * 0.85
  const width = 0.5 - (sharp / 100) * 0.46
  const laneSpread = (spread / 100) * 0.96
  // Radius is derived from the obstacle's own size (not a fixed px value) so
  // the field's reach scales naturally with the container instead of
  // looking cramped on a big container or absurdly oversized on a small one.
  const avoidRadius = Math.max(avoid.rect.width, avoid.rect.height) * 0.5 + 60
  const avoidStrength = Math.min(100, Math.max(0, avoid.strength)) / 100

  const spineLen = Math.hypot(bezier.p3.x - bezier.p0.x, bezier.p3.y - bezier.p0.y) || 1
  const crossScale = spineLen * 0.35 // ties noise amplitude to how far apart the endpoints are

  const out: Stroke[] = []
  for (let i = 0; i < lineCount; i++) {
    const s = h[i % STRAND_MAX]
    const lane = 0.5 + ((i + 0.5) / lineCount - 0.5) * laneSpread
    const tmS = Math.max(0.04, Math.min(0.97, tm + s.tmJit * 0.16))

    const points: Pt[] = []
    const widths: number[] = []
    for (let j = 0; j <= SAMPLES; j++) {
      const p = j / SAMPLES
      const win = 1 - smoothstep(tmS - width / 2, tmS + width / 2, p)
      const tAlong = Math.max(0, Math.min(1, p + amp * 0.5 * win * fractal(s.along, oct, p)))
      // `amp` scales the whole perpendicular displacement — both the
      // structured lane/spread term and the noise term — not just the
      // noise. Unlike the old canvas-mapped model, `perpOffset` here is a
      // *displacement from the bezier spine*, not an absolute position.
      // If the lane term were left unscaled by `amp` (mess), a resolved
      // strand at mess=0 would still sit `spread`-widths away from the
      // spine instead of hugging it — mess=0 must mean zero tangle, i.e.
      // every strand collapses onto the spine itself.
      // `endBlend` is a second, independent multiplier on top of `amp`: it
      // interpolates linearly from startScale (at p=0) to endScale (at p=1)
      // using the same unwarped run-position `p` that resolve/sharp/spread
      // already key off, so "scale near the start" and "scale near the end"
      // stay meaningful even while the tangle itself is busy warping tAlong.
      const endBlend = startScale + (endScale - startScale) * p
      const perpOffset = amp * endBlend * ((lane - 0.5) * 2 + win * fractal(s.perp, oct, p))

      const base = bezierPoint(bezier, tAlong)
      const normal = bezierNormal(bezier, tAlong)
      points.push({ x: base.x + normal.x * perpOffset * crossScale, y: base.y + normal.y * perpOffset * crossScale })
      widths.push(thicknessAt(p, thickness))
    }

    // Avoidance is a whole-polyline pass, not per-point-in-the-loop: after
    // displacing, the deflected span is relaxed (influence-weighted, so
    // untouched spans keep their mess detail bit-exactly) to round off the
    // direction flips the field has along the rect's diagonals — see
    // relaxPolyline's doc comment for why skipping this shows up as filled
    // blobs rather than clean lines.
    let finalPoints = points
    if (avoidStrength > 0) {
      const displaced = points.map((pt) => avoidRect(pt, avoid.rect, avoidStrength, avoidRadius))
      const influence = displaced.map((q, k) => {
        const moved = Math.hypot(q.x - points[k].x, q.y - points[k].y)
        return Math.min(1, moved / (avoidRadius * 0.25))
      })
      finalPoints = relaxPolyline(displaced, dilateInfluence(influence, 4), 3)
    }
    out.push({ points: finalPoints, widths, opacity: 0.5 + (i % 4) * 0.12 })
  }
  return out
}

export function catmullRom(points: Pt[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

/** Per-vertex normal from neighbouring points (central difference; forward/backward at the ends). */
function polylineNormals(points: Pt[]): Pt[] {
  return points.map((_, i) => {
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(points.length - 1, i + 1)]
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    return { x: -dy / len, y: dx / len }
  })
}

/** Builds a closed, filled ribbon path from a centerline + per-point widths (each full width is split half-left/half-right of the centerline along its local normal). */
export function buildRibbonPath(points: Pt[], widths: number[]): string {
  // Length-mismatch is always a caller bug (the two arrays should be built
  // together, e.g. from a Stroke) — check it first so it always surfaces as
  // a clear error, regardless of how short either array is.
  if (points.length !== widths.length) throw new Error('points and widths must be the same length')
  // A ribbon needs at least 2 points to have a direction/normal; mirrors
  // catmullRom's own convention of returning '' for degenerate input rather
  // than throwing or emitting a garbage path (e.g. a bare " Z").
  if (points.length < 2) return ''
  const normals = polylineNormals(points)
  // Defensive clamp — consistent with this file's established style (oct,
  // tmS, transitionWidth, lineCount all get one). A negative width would
  // flip the left/right edges at that sample and self-intersect the ribbon.
  const w = widths.map((width) => Math.max(0, width))
  const left = points.map((p, i) => ({ x: p.x + normals[i].x * w[i] / 2, y: p.y + normals[i].y * w[i] / 2 }))
  const right = points.map((p, i) => ({ x: p.x - normals[i].x * w[i] / 2, y: p.y - normals[i].y * w[i] / 2 })).reverse()
  const leftPath = catmullRom(left)
  const rightPath = catmullRom(right)
  // drop the leading "M x y" of the right half — it continues the same path
  const rightContinuation = rightPath.replace(/^M [\d.-]+ [\d.-]+/, ` L ${right[0].x.toFixed(1)} ${right[0].y.toFixed(1)}`)
  return `${leftPath}${rightContinuation} Z`
}
