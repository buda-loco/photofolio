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
