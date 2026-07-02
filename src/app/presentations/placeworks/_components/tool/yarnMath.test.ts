import { describe, it, expect } from 'vitest'
import {
  mulberry32,
  smoothstep,
  fractal,
  buildHarmonics,
  STRAND_MAX,
  OCT_MAX,
  type Octave,
  bezierPoint,
  bezierTangent,
  bezierNormal,
  type Bezier,
  thicknessAt,
  type ThicknessParams,
  buildStrokes,
  type BuildParams,
  SAMPLES,
  buildRibbonPath,
  catmullRom,
  type Pt,
} from './yarnMath'

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

describe('buildStrokes', () => {
  const bez: Bezier = { p0: { x: 0, y: 300 }, p1: { x: 200, y: 100 }, p2: { x: 400, y: 500 }, p3: { x: 600, y: 300 } }
  const harmonics = buildHarmonics(7)
  const params: BuildParams = {
    bezier: bez, lines: 5, mess: 68, detail: 4, resolve: 58, sharp: 45, spread: 72, seed: 7,
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
})
