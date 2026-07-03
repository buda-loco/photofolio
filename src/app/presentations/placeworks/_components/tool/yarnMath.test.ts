import { describe, it, expect } from 'vitest'
import {
  mulberry32,
  smoothstep,
  fractal,
  buildHarmonics,
  STRAND_MAX,
  OCT_MAX,
  SCALE_MAX,
  type Octave,
  bezierPoint,
  bezierTangent,
  bezierNormal,
  type Bezier,
  thicknessAt,
  type ThicknessParams,
  avoidRect,
  relaxPolyline,
  fitCubicBezier,
  type AvoidRect,
  buildStrokes,
  type BuildParams,
  SAMPLES,
  buildRibbonPath,
  catmullRom,
  type Pt,
} from './yarnMath'

const NO_AVOID = { rect: { x: 0, y: 0, width: 0, height: 0 }, strength: 0 }

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    expect(a()).toBe(b())
  })
  it('produces values in [0, 1)', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 20; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('smoothstep', () => {
  it('is 0 below e0, 1 above e1, monotonic between', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 2)).toBe(1)
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 1)
  })
})

describe('fractal', () => {
  it('stays within [-1, 1] for normalized octave amplitudes', () => {
    const oct: Octave[] = [{ f: 1, ph: 0, a: 1 }, { f: 2, ph: 1, a: 0.5 }]
    for (let p = 0; p <= 1; p += 0.05) {
      const v = fractal(oct, 2, p)
      expect(v).toBeGreaterThanOrEqual(-1)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

describe('buildHarmonics', () => {
  it('is deterministic for a given seed', () => {
    const a = buildHarmonics(7)
    const b = buildHarmonics(7)
    expect(a).toEqual(b)
  })
  it('produces STRAND_MAX strands, each with OCT_MAX octaves per perp/along', () => {
    const strands = buildHarmonics(1)
    expect(strands).toHaveLength(STRAND_MAX)
    expect(strands[0].perp).toHaveLength(OCT_MAX)
    expect(strands[0].along).toHaveLength(OCT_MAX)
  })
  it('tmJit is within [-0.5, 0.5)', () => {
    const strands = buildHarmonics(3)
    strands.forEach((s) => {
      expect(s.tmJit).toBeGreaterThanOrEqual(-0.5)
      expect(s.tmJit).toBeLessThan(0.5)
    })
  })
})

// p1/p2 are exact thirds (not 33/66) so the curve is truly linear in t —
// bezier x(t) simplifies to p0 + t*(p3-p0) only when control points are
// evenly spaced; rounded thirds would fail the toBeCloseTo(50, 5) below.
const straightLine: Bezier = {
  p0: { x: 0, y: 0 }, p1: { x: 100 / 3, y: 0 }, p2: { x: 200 / 3, y: 0 }, p3: { x: 100, y: 0 },
}

// Non-collinear control points and an asymmetric t so the p1/p2 Bernstein
// coefficients (b=0.421875 vs c=0.140625 at t=0.25) are numerically distinct
// — a p1/p2 coefficient-swap bug would be caught here (it wouldn't be by
// straightLine at t=0.5, where the two coefficients happen to be equal).
const curve: Bezier = {
  p0: { x: 0, y: 0 }, p1: { x: 0, y: 100 }, p2: { x: 100, y: 100 }, p3: { x: 100, y: 0 },
}

// A genuine cusp: derivative is exactly zero at t=0.5 (solved from
// B'(0.5) = 0.75*(P1-P0) + 1.5*(P2-P1) + 0.75*(P3-P2) = 0), while the chord
// P3-P0 = (0,-10) is nonzero — so this also exercises bezierTangent's
// chord-direction fallback meaningfully (unlike P0===P3 constructions,
// where the fallback chord would itself be zero-length).
const cusp: Bezier = {
  p0: { x: 0, y: 0 }, p1: { x: 10, y: 0 }, p2: { x: 10, y: 10 }, p3: { x: 0, y: -10 },
}

describe('bezierPoint', () => {
  it('t=0 is p0, t=1 is p3', () => {
    expect(bezierPoint(straightLine, 0)).toEqual({ x: 0, y: 0 })
    expect(bezierPoint(straightLine, 1)).toEqual({ x: 100, y: 0 })
  })
  it('a straight-line bezier is linear at any t', () => {
    const mid = bezierPoint(straightLine, 0.5)
    expect(mid.x).toBeCloseTo(50, 5)
    expect(mid.y).toBeCloseTo(0, 5)
  })
  it('matches the Bernstein formula by hand for a curved bezier at an asymmetric t', () => {
    // t=0.25: coefficients are a=0.421875, b=0.421875, c=0.140625, d=0.015625
    // x = c*100 + d*100 = 15.625; y = b*100 + c*100 = 56.25
    const p = bezierPoint(curve, 0.25)
    expect(p.x).toBeCloseTo(15.625, 5)
    expect(p.y).toBeCloseTo(56.25, 5)
  })
})

describe('bezierTangent / bezierNormal', () => {
  it('tangent of a horizontal line points along +x, normal points +y or -y', () => {
    const tan = bezierTangent(straightLine, 0.5)
    expect(tan.x).toBeGreaterThan(0)
    expect(Math.abs(tan.y)).toBeLessThan(1e-6)
    const nrm = bezierNormal(straightLine, 0.5)
    expect(Math.abs(nrm.x)).toBeLessThan(1e-6)
    expect(Math.abs(Math.abs(nrm.y) - 1)).toBeLessThan(1e-6)
  })
  it('tangent and normal are unit vectors', () => {
    const tan = bezierTangent(straightLine, 0.3)
    expect(Math.hypot(tan.x, tan.y)).toBeCloseTo(1, 5)
  })
  it('falls back to the chord direction at a cusp (zero derivative) instead of collapsing to {0,0}', () => {
    const tan = bezierTangent(cusp, 0.5)
    expect(Math.hypot(tan.x, tan.y)).toBeCloseTo(1, 5)
    // chord P3-P0 = (0,-10) normalized = (0,-1)
    expect(tan.x).toBeCloseTo(0, 5)
    expect(tan.y).toBeCloseTo(-1, 5)
  })
})

describe('thicknessAt', () => {
  const base: ThicknessParams = { preset: 'flat', min: 2, max: 8, transitionPos: 0.5, transitionWidth: 0.15 }

  it('flat preset returns max at every t', () => {
    expect(thicknessAt(0, base)).toBe(8)
    expect(thicknessAt(0.5, base)).toBe(8)
    expect(thicknessAt(1, base)).toBe(8)
  })

  it('thick-thin preset starts near max, ends near min', () => {
    const p: ThicknessParams = { ...base, preset: 'thick-thin' }
    expect(thicknessAt(0, p)).toBeGreaterThan(thicknessAt(1, p))
  })

  it('thin-thick preset starts near min, ends near max', () => {
    const p: ThicknessParams = { ...base, preset: 'thin-thick' }
    expect(thicknessAt(0, p)).toBeLessThan(thicknessAt(1, p))
  })

  it('thick-thin-thick preset dips to min at transitionPos', () => {
    const p: ThicknessParams = { ...base, preset: 'thick-thin-thick', transitionPos: 0.5 }
    expect(thicknessAt(0.5, p)).toBeLessThan(thicknessAt(0, p))
    expect(thicknessAt(0.5, p)).toBeLessThan(thicknessAt(1, p))
  })

  it('thin-thick-thin preset peaks to max at transitionPos', () => {
    const p: ThicknessParams = { ...base, preset: 'thin-thick-thin', transitionPos: 0.5 }
    expect(thicknessAt(0.5, p)).toBeGreaterThan(thicknessAt(0, p))
    expect(thicknessAt(0.5, p)).toBeGreaterThan(thicknessAt(1, p))
  })

  it('stays within [min, max] for all presets', () => {
    for (const preset of ['flat', 'thick-thin', 'thin-thick', 'thick-thin-thick', 'thin-thick-thin'] as const) {
      const p: ThicknessParams = { ...base, preset }
      for (let t = 0; t <= 1; t += 0.1) {
        const w = thicknessAt(t, p)
        expect(w).toBeGreaterThanOrEqual(base.min - 1e-6)
        expect(w).toBeLessThanOrEqual(base.max + 1e-6)
      }
    }
  })

  it('transitionWidth <= 0 stays finite (no NaN/Infinity) for a Gaussian preset', () => {
    for (const transitionWidth of [0, -1]) {
      const p: ThicknessParams = { ...base, preset: 'thick-thin-thick', transitionWidth }
      for (let t = 0; t <= 1; t += 0.25) {
        const v = thicknessAt(t, p)
        expect(Number.isFinite(v)).toBe(true)
      }
    }
  })

  it('min > max (swapped) still bounds output between the two given values', () => {
    const swapped = { min: 8, max: 2, transitionPos: 0.5, transitionWidth: 0.15 }
    const lo = Math.min(swapped.min, swapped.max)
    const hi = Math.max(swapped.min, swapped.max)
    for (const preset of ['thick-thin', 'thick-thin-thick'] as const) {
      const p: ThicknessParams = { ...swapped, preset }
      for (let t = 0; t <= 1; t += 0.1) {
        const w = thicknessAt(t, p)
        expect(w).toBeGreaterThanOrEqual(lo - 1e-6)
        expect(w).toBeLessThanOrEqual(hi + 1e-6)
      }
    }
  })
})

describe('avoidRect', () => {
  const rect: AvoidRect = { x: 100, y: 100, width: 50, height: 50 } // spans 100..150 on both axes

  it('strength <= 0 is a no-op', () => {
    const p = { x: 120, y: 120 }
    expect(avoidRect(p, rect, 0, 40)).toEqual(p)
    expect(avoidRect(p, rect, -1, 40)).toEqual(p)
  })

  it('radius <= 0 is a no-op', () => {
    const p = { x: 120, y: 120 }
    expect(avoidRect(p, rect, 1, 0)).toEqual(p)
  })

  it('a point beyond the radius is unaffected', () => {
    const p = { x: 300, y: 300 }
    expect(avoidRect(p, rect, 1, 40)).toEqual(p)
  })

  it('a point just outside the rect edge is pushed further away, not toward it', () => {
    const p = { x: 160, y: 125 } // 10px right of the rect's right edge, within the vertical span
    const moved = avoidRect(p, rect, 1, 40)
    expect(moved.x).toBeGreaterThan(p.x) // pushed further right, away from the rect
    expect(moved.y).toBeCloseTo(p.y, 5) // straight-line case: no vertical component
  })

  it('a point inside the rect is pushed out through its nearest edge', () => {
    const center = { x: 125, y: 125 } // exact center of the rect
    const offCenter = { x: 130, y: 125 } // inside; nearest edge is the right one (20px) vs left 30 / top 25 / bottom 25
    const movedOffCenter = avoidRect(offCenter, rect, 1, 40)
    // pushed in +x, through that nearest right edge, and all the way clear of it
    expect(movedOffCenter.x).toBeGreaterThan(rect.x + rect.width)
    expect(movedOffCenter.y).toBeCloseTo(offCenter.y, 5)
    // exact center is equidistant from all four edges — direction is a
    // tie-break, but it must still move somewhere (never left sitting on
    // top of the obstacle) and stay finite
    const movedCenter = avoidRect(center, rect, 1, 40)
    expect(Number.isFinite(movedCenter.x)).toBe(true)
    expect(Number.isFinite(movedCenter.y)).toBe(true)
    expect(movedCenter.x === center.x && movedCenter.y === center.y).toBe(false)
  })

  it('push magnitude is continuous across the rect boundary (no fill-artifact jump)', () => {
    // Straddle the right edge (x=150) by 0.1px on each side: the two push
    // magnitudes must nearly agree — a discontinuity here is exactly what
    // kinked the ribbon centerline into self-intersecting filled blobs.
    const justInside = avoidRect({ x: 149.9, y: 125 }, rect, 1, 40)
    const justOutside = avoidRect({ x: 150.1, y: 125 }, rect, 1, 40)
    const insidePush = justInside.x - 149.9
    const outsidePush = justOutside.x - 150.1
    expect(Math.abs(insidePush - outsidePush)).toBeLessThan(1)
  })

  it('push strength scales with the strength parameter', () => {
    const p = { x: 160, y: 125 }
    const weak = avoidRect(p, rect, 0.25, 40)
    const strong = avoidRect(p, rect, 1, 40)
    const weakPush = weak.x - p.x
    const strongPush = strong.x - p.x
    expect(strongPush).toBeGreaterThan(weakPush)
  })
})

describe('relaxPolyline', () => {
  const zigzag: Pt[] = Array.from({ length: 9 }, (_, i) => ({ x: i * 10, y: i % 2 === 0 ? 0 : 20 }))

  it('zero influence leaves every point untouched', () => {
    const out = relaxPolyline(zigzag, zigzag.map(() => 0), 3)
    expect(out).toEqual(zigzag)
  })

  it('endpoints never move even at full influence', () => {
    const out = relaxPolyline(zigzag, zigzag.map(() => 1), 5)
    expect(out[0]).toEqual(zigzag[0])
    expect(out[out.length - 1]).toEqual(zigzag[zigzag.length - 1])
  })

  it('full influence reduces the zigzag amplitude', () => {
    const out = relaxPolyline(zigzag, zigzag.map(() => 1), 3)
    // interior peaks (odd indices, y=20) must have been pulled down toward
    // the valleys, and valleys pulled up — total deviation from the y=10
    // midline strictly shrinks
    const deviation = (pts: Pt[]) => pts.slice(1, -1).reduce((sum, p) => sum + Math.abs(p.y - 10), 0)
    expect(deviation(out)).toBeLessThan(deviation(zigzag))
  })

  it('partial influence smooths only the weighted span', () => {
    const influence = zigzag.map((_, i) => (i >= 3 && i <= 5 ? 1 : 0))
    const out = relaxPolyline(zigzag, influence, 3)
    // outside the span: bit-exact
    expect(out[1]).toEqual(zigzag[1])
    expect(out[7]).toEqual(zigzag[7])
    // inside the span: moved
    expect(out[4]).not.toEqual(zigzag[4])
  })

  it('throws on mismatched points/influence length', () => {
    expect(() => relaxPolyline(zigzag, [1, 0], 1)).toThrow()
  })
})

describe('buildStrokes', () => {
  const bez: Bezier = { p0: { x: 0, y: 300 }, p1: { x: 200, y: 100 }, p2: { x: 400, y: 500 }, p3: { x: 600, y: 300 } }
  const harmonics = buildHarmonics(7)
  const params: BuildParams = {
    bezier: bez, lines: 5, mess: 68, detail: 4, resolve: 58, sharp: 45, spread: 72, startScale: 1, endScale: 1, avoid: NO_AVOID, seed: 7,
    thickness: { preset: 'flat', min: 2, max: 6, transitionPos: 0.5, transitionWidth: 0.15 },
  }

  it('returns one entry per requested line', () => {
    const strokes = buildStrokes(harmonics, params)
    expect(strokes).toHaveLength(5)
  })

  it('each stroke has matching points[] and widths[] of equal length', () => {
    const [s] = buildStrokes(harmonics, params)
    expect(s.points.length).toBe(s.widths.length)
    expect(s.points.length).toBe(SAMPLES + 1)
  })

  it('is deterministic for the same seed/params', () => {
    const a = buildStrokes(harmonics, params)
    const b = buildStrokes(harmonics, params)
    expect(a[0].points[10]).toEqual(b[0].points[10])
  })

  it('resolved lines end up close to the bezier end point (low mess at t=1)', () => {
    const strokes = buildStrokes(harmonics, { ...params, mess: 0 })
    const last = strokes[0].points[strokes[0].points.length - 1]
    expect(Math.hypot(last.x - bez.p3.x, last.y - bez.p3.y)).toBeLessThan(20)
  })

  it('lines: 1 does not crash and produces a sane single stroke', () => {
    const strokes = buildStrokes(harmonics, { ...params, lines: 1 })
    expect(strokes).toHaveLength(1)
    expect(strokes[0].points.length).toBe(SAMPLES + 1)
  })

  it('mess: 100 (raised ceiling) keeps every point finite', () => {
    const strokes = buildStrokes(harmonics, { ...params, mess: 100 })
    for (const stroke of strokes) {
      for (const pt of stroke.points) {
        expect(Number.isFinite(pt.x)).toBe(true)
        expect(Number.isFinite(pt.y)).toBe(true)
      }
    }
  })

  it('avoid.strength: 0 matches the no-avoidance case exactly (backward compatible)', () => {
    const withZeroStrength = buildStrokes(harmonics, {
      ...params,
      avoid: { rect: { x: 250, y: 250, width: 100, height: 100 }, strength: 0 },
    })
    const withoutAvoid = buildStrokes(harmonics, params)
    expect(withZeroStrength).toEqual(withoutAvoid)
  })

  it('avoidance guarantees NO sample point ends up inside the rect, even at partial strength', () => {
    // The user-visible contract: "avoid the container" means no line sample
    // sits inside it. mess: 100 + a rect straddling the spine's midpoint is
    // the worst case (deep crossings + relaxation pulling points back), and
    // partial strength (30) is where the old strength-scaled ejection
    // failed. The final post-relax ejection pass is what makes this hold.
    const rect = { x: 250, y: 250, width: 150, height: 150 }
    const strokes = buildStrokes(harmonics, { ...params, mess: 100, avoid: { rect, strength: 30 } })
    for (const stroke of strokes) {
      for (const pt of stroke.points) {
        const strictlyInside =
          pt.x > rect.x && pt.x < rect.x + rect.width && pt.y > rect.y && pt.y < rect.y + rect.height
        expect(strictlyInside).toBe(false)
      }
    }
  })

  it('a strong avoidance field pushes points near the obstacle further from its center than with no field', () => {
    // Flat preset + mess=0 collapses every strand onto the spine itself, so
    // the midpoint sample is guaranteed to land inside the obstacle rect
    // without avoidance — a deterministic setup to prove the field moves it.
    const rect = { x: 250, y: 250, width: 150, height: 150 } // straddles the spine's midpoint (300,300)
    const withAvoid = buildStrokes(harmonics, { ...params, mess: 0, avoid: { rect, strength: 100 } })
    const withoutAvoid = buildStrokes(harmonics, { ...params, mess: 0, avoid: NO_AVOID })
    const rectCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    const mid = Math.floor(SAMPLES / 2)
    const distWith = Math.hypot(withAvoid[0].points[mid].x - rectCenter.x, withAvoid[0].points[mid].y - rectCenter.y)
    const distWithout = Math.hypot(withoutAvoid[0].points[mid].x - rectCenter.x, withoutAvoid[0].points[mid].y - rectCenter.y)
    expect(distWith).toBeGreaterThan(distWithout)
  })

  it('startScale: 0 collapses the start of the run onto the spine, independent of endScale', () => {
    const collapsed = buildStrokes(harmonics, { ...params, mess: 100, startScale: 0, endScale: 1 })
    const full = buildStrokes(harmonics, { ...params, mess: 100, startScale: 1, endScale: 1 })
    const spineStart = bezierPoint(bez, 0)
    const collapsedStartDist = Math.hypot(collapsed[0].points[0].x - spineStart.x, collapsed[0].points[0].y - spineStart.y)
    const fullStartDist = Math.hypot(full[0].points[0].x - spineStart.x, full[0].points[0].y - spineStart.y)
    expect(collapsedStartDist).toBeLessThan(fullStartDist)
  })

  it('endScale: 0 collapses the end of the run onto the spine, independent of startScale', () => {
    const collapsed = buildStrokes(harmonics, { ...params, mess: 100, startScale: 1, endScale: 0 })
    const full = buildStrokes(harmonics, { ...params, mess: 100, startScale: 1, endScale: 1 })
    const spineEnd = bezierPoint(bez, 1)
    const collapsedLast = collapsed[0].points[collapsed[0].points.length - 1]
    const fullLast = full[0].points[full[0].points.length - 1]
    const collapsedEndDist = Math.hypot(collapsedLast.x - spineEnd.x, collapsedLast.y - spineEnd.y)
    const fullEndDist = Math.hypot(fullLast.x - spineEnd.x, fullLast.y - spineEnd.y)
    expect(collapsedEndDist).toBeLessThan(fullEndDist)
  })

  it('startScale/endScale beyond 1 (up to SCALE_MAX) keeps every point finite', () => {
    const strokes = buildStrokes(harmonics, { ...params, mess: 100, startScale: SCALE_MAX, endScale: SCALE_MAX })
    for (const stroke of strokes) {
      for (const pt of stroke.points) {
        expect(Number.isFinite(pt.x)).toBe(true)
        expect(Number.isFinite(pt.y)).toBe(true)
      }
    }
  })
})

describe('fitCubicBezier', () => {
  it('returns null for fewer than 3 distinct points', () => {
    expect(fitCubicBezier([])).toBeNull()
    expect(fitCubicBezier([{ x: 0, y: 0 }])).toBeNull()
    expect(fitCubicBezier([{ x: 0, y: 0 }, { x: 10, y: 10 }])).toBeNull()
    // duplicates collapse — still only 2 distinct
    expect(fitCubicBezier([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 }])).toBeNull()
  })

  it('pins the endpoints to the first and last input points exactly', () => {
    const pts: Pt[] = Array.from({ length: 20 }, (_, i) => ({ x: i * 10, y: Math.sin(i / 3) * 50 }))
    const fit = fitCubicBezier(pts)
    expect(fit).not.toBeNull()
    expect(fit!.p0).toEqual(pts[0])
    expect(fit!.p3).toEqual(pts[pts.length - 1])
  })

  it('recovers a curve close to points sampled from a known bezier', () => {
    const source: Bezier = { p0: { x: 0, y: 300 }, p1: { x: 200, y: 0 }, p2: { x: 400, y: 600 }, p3: { x: 600, y: 300 } }
    const samples: Pt[] = Array.from({ length: 50 }, (_, i) => bezierPoint(source, i / 49))
    const fit = fitCubicBezier(samples)
    expect(fit).not.toBeNull()
    // The fitted curve must pass close to every input sample. The scan step
    // must be fine enough that measurement resolution (~curve-length × step)
    // stays well under the tolerance being asserted — at 0.002 on this
    // ~900px-long curve, adjacent scan points are ~2px apart.
    for (let i = 0; i < samples.length; i++) {
      const q = samples[i]
      let best = Infinity
      for (let t = 0; t <= 1; t += 0.002) {
        const p = bezierPoint(fit!, t)
        best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y))
      }
      expect(best).toBeLessThan(4)
    }
  })

  it('collinear input falls back to control points at the chord thirds (finite, exact for a line)', () => {
    const pts: Pt[] = Array.from({ length: 10 }, (_, i) => ({ x: i * 30, y: i * 15 }))
    const fit = fitCubicBezier(pts)
    expect(fit).not.toBeNull()
    for (const p of [fit!.p1, fit!.p2]) {
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
      // control points must sit ON the line y = x/2 for the fit to
      // reproduce the straight stroke
      expect(p.y).toBeCloseTo(p.x / 2, 4)
    }
  })
})

describe('catmullRom', () => {
  it('starts with an M command at the first point', () => {
    const d = catmullRom([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }])
    expect(d.startsWith('M 0.0 0.0')).toBe(true)
  })
  it('returns empty string for fewer than 2 points', () => {
    expect(catmullRom([{ x: 0, y: 0 }])).toBe('')
  })
})

describe('buildRibbonPath', () => {
  const points: Pt[] = Array.from({ length: 10 }, (_, i) => ({ x: i * 10, y: 0 }))
  const widths = points.map(() => 4)

  it('produces a non-empty closed SVG path', () => {
    const d = buildRibbonPath(points, widths)
    expect(d.startsWith('M')).toBe(true)
    expect(d.trim().endsWith('Z')).toBe(true)
  })
  it('throws on mismatched points/widths length', () => {
    expect(() => buildRibbonPath(points, [1, 2])).toThrow()
  })

  it('handles variable (non-constant) per-point widths without throwing', () => {
    const variableWidths = points.map((_, i) => 1 + i * 0.7)
    const d = buildRibbonPath(points, variableWidths)
    expect(d.startsWith('M')).toBe(true)
    expect(d.trim().endsWith('Z')).toBe(true)
  })

  it('handles a curved, noisy centerline (the actual buildStrokes use case) without throwing', () => {
    const bez: Bezier = { p0: { x: 0, y: 300 }, p1: { x: 200, y: 100 }, p2: { x: 400, y: 500 }, p3: { x: 600, y: 300 } }
    const harmonics = buildHarmonics(3)
    const params: BuildParams = {
      bezier: bez, lines: 1, mess: 72, detail: 5, resolve: 50, sharp: 40, spread: 60, startScale: 1, endScale: 1, avoid: NO_AVOID, seed: 3,
      thickness: { preset: 'thin-thick-thin', min: 2, max: 10, transitionPos: 0.5, transitionWidth: 0.2 },
    }
    const [stroke] = buildStrokes(harmonics, params)
    const d = buildRibbonPath(stroke.points, stroke.widths)
    expect(d.startsWith('M')).toBe(true)
    expect(d.trim().endsWith('Z')).toBe(true)
    // every coordinate emitted into the path must be finite — a noisy
    // centerline is exactly the case that could expose NaN/Infinity from
    // a zero-length normal or similar edge case
    const nums = d.match(/-?\d+\.\d/g) ?? []
    expect(nums.length).toBeGreaterThan(0)
    for (const n of nums) expect(Number.isFinite(Number(n))).toBe(true)
  })

  it('returns empty string for fewer than 2 points (mirrors catmullRom)', () => {
    expect(buildRibbonPath([{ x: 0, y: 0 }], [4])).toBe('')
  })

  it('returns empty string for empty points/widths arrays instead of throwing', () => {
    expect(buildRibbonPath([], [])).toBe('')
  })

  it('clamps negative widths so left/right edges stay on consistent sides (no self-intersecting bowtie)', () => {
    const pts: Pt[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }]
    const raw = [4, -4, 4]
    const d = buildRibbonPath(pts, raw)
    expect(d.startsWith('M')).toBe(true)

    // normals are (0, 1) for every sample on this straight horizontal line,
    // so the left edge should never dip below the centerline and the right
    // edge should never rise above it -- if the negative width weren't
    // clamped to 0, the middle sample's offset would flip sign and the two
    // edges would cross there.
    const clamped = raw.map((w) => Math.max(0, w))
    const left = pts.map((p, i) => ({ x: p.x, y: p.y + clamped[i] / 2 }))
    const right = pts.map((p, i) => ({ x: p.x, y: p.y - clamped[i] / 2 })).reverse()
    expect(left.every((p) => p.y >= 0)).toBe(true)
    expect(right.every((p) => p.y <= 0)).toBe(true)

    // and the actual output matches stitching those exact clamped edges
    const expectedLeft = catmullRom(left)
    const expectedRight = catmullRom(right).replace(
      /^M [\d.-]+ [\d.-]+/,
      ` L ${right[0].x.toFixed(1)} ${right[0].y.toFixed(1)}`
    )
    expect(d).toBe(`${expectedLeft}${expectedRight} Z`)
  })
})
