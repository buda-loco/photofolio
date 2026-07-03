# PlaceWorks Brand Asset Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the PlaceWorks pitch-deck entropy generator (`YarnGenerator.tsx`, embedded on `/presentations/placeworks/02`) into a standalone, palette-aware brand asset tool at `/presentations/placeworks/tool` that the client can use to generate on-brand SVG/PNG assets with a logo clear-space built in.

**Architecture:** Pure math/data modules (`palette.ts`, `yarnMath.ts`, `exportCanvas.ts`, `useToolPersistence.ts`) hold all logic and are unit-tested with Vitest, matching this repo's existing `src/lib/quote.ts` convention. A single stateful client component (`BrandAssetTool.tsx`) owns one `ToolParams` object and renders an SVG canvas plus control panels; panel components are presentational and call back into `BrandAssetTool`'s setters. UI/interaction work (dragging, live SVG rendering, export) has no automated test coverage in this codebase's existing generators (`YarnGenerator.tsx`, `ShapePlayground.tsx` have none) — those tasks are verified manually in the browser per project convention, and each task below says exactly what to look at.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest (`npm test`), plain `useState`/`useMemo` (no state library), inline SVG (no canvas library) with a `<canvas>` element only for PNG rasterization.

**Key existing precedent this plan builds on:**
- `src/app/presentations/placeworks/_components/YarnGenerator.tsx` — the math being evolved (harmonics, fractal noise, Catmull-Rom smoothing, `mulberry32` PRNG). Left untouched.
- `src/app/presentations/placeworks/_components/ShapePlayground.tsx` — already has a **working, proven client-side PNG export** (`exportPNG()`, lines 276–296: serialize SVG → Blob → `Image` → offscreen `<canvas>` → `toDataURL`). This exact pattern is reused in Milestone 8, not reinvented.
- `src/app/presentations/placeworks/presentations.css` — `.pw-tool`, `.pw-controls`, `.pw-btn`, `.pw-toggle`, `.pw-slider` classes already exist and are reused as-is; only new classes for the path/mask drag handles and range-pair inputs need adding.
- `src/lib/quote.ts` / `src/lib/quote.test.ts` — the only precedent for pure-logic + Vitest in this repo; `palette.ts` and `yarnMath.ts` follow the same shape (no fs, no React, dependency-free, unit-tested).

---

## Milestone 1 — Palette module (pure, tested)

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/palette.ts`
- Test: `src/app/presentations/placeworks/_components/tool/palette.test.ts`

### Task 1.1: Write the palette constants + OKLab mixing + shade ramp, test-first

**Step 1 — write the failing test**

```ts
// src/app/presentations/placeworks/_components/tool/palette.test.ts
import { describe, it, expect } from 'vitest'
import { PALETTE, shadesOf, resolveSwatch, contrastRatio } from './palette'

describe('PALETTE', () => {
  it('has the 7 client-supplied swatches', () => {
    expect(PALETTE.cream).toBe('#E5C491')
    expect(PALETTE.dustyPink).toBe('#DCAAA0')
    expect(PALETTE.terracotta).toBe('#D58E6C')
    expect(PALETTE.lavender).toBe('#A7A6D2')
    expect(PALETTE.seafoam).toBe('#9EC0C7')
    expect(PALETTE.navy).toBe('#3B3D6D')
    expect(PALETTE.nearBlack).toBe('#292632')
  })
})

describe('shadesOf', () => {
  it('returns 5 steps, middle step equals the base hex', () => {
    const shades = shadesOf('terracotta')
    expect(shades).toHaveLength(5)
    expect(shades[2].toLowerCase()).toBe('#d58e6c')
  })

  it('lightens toward step 0, darkens toward step 4', () => {
    const shades = shadesOf('navy')
    // rough luminance check: step 0 should read lighter than step 2, step 4 darker
    const lum = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    expect(lum(shades[0])).toBeGreaterThan(lum(shades[2]))
    expect(lum(shades[4])).toBeLessThan(lum(shades[2]))
  })

  it('never returns pure white or pure black (stays on-brand)', () => {
    const shades = shadesOf('cream')
    expect(shades[0].toLowerCase()).not.toBe('#ffffff')
    expect(shades[4].toLowerCase()).not.toBe('#000000')
  })
})

describe('resolveSwatch', () => {
  it('resolves a SwatchRef to the matching shade', () => {
    expect(resolveSwatch({ base: 'seafoam', shadeStep: 2 }).toLowerCase()).toBe('#9ec0c7')
  })
})

describe('contrastRatio', () => {
  it('black vs white is the maximum ratio (21)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
  it('a colour against itself is 1', () => {
    expect(contrastRatio('#D58E6C', '#D58E6C')).toBeCloseTo(1, 1)
  })
})
```

**Step 2 — run and verify it fails**

Run: `npm test -- palette` (from the project root)
Expected: FAIL — `Cannot find module './palette'`

**Step 3 — implement `palette.ts`**

```ts
// src/app/presentations/placeworks/_components/tool/palette.ts
//
// Pure, dependency-free palette + shade-ramp logic for the PlaceWorks brand
// tool. No fs, no React — mirrors src/lib/quote.ts's shape so it's
// unit-testable in isolation. Mixing happens in OKLab (perceptually uniform)
// rather than raw RGB/HSL so a 5-step ramp doesn't muddy through grey at the
// midpoint the way naive RGB lerp does.

export const PALETTE = {
  cream: '#E5C491',
  dustyPink: '#DCAAA0',
  terracotta: '#D58E6C',
  lavender: '#A7A6D2',
  seafoam: '#9EC0C7',
  navy: '#3B3D6D',
  nearBlack: '#292632',
} as const

export type PaletteKey = keyof typeof PALETTE
export type SwatchRef = { base: PaletteKey; shadeStep: number } // 0..4, 2 = base hex

const SHADE_STEPS = 5
const MID_STEP = 2
const MAX_LIGHTEN = 0.7 // cap toward white so the lightest step stays tinted
const MAX_DARKEN = 0.55 // cap toward black so the darkest step stays tinted

// ── colour space conversions ────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function srgbToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
  return s * 255
}

function rgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ]
}

function oklabToRgb([L, a, b]: [number, number, number]): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)]
}

/** Mix two hex colours in OKLab space. t=0 → hexA, t=1 → hexB. */
export function mix(hexA: string, hexB: string, t: number): string {
  const a = rgbToOklab(hexToRgb(hexA))
  const b = rgbToOklab(hexToRgb(hexB))
  const lab: [number, number, number] = [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
  return rgbToHex(...oklabToRgb(lab))
}

/** 5-step tint/shade ramp for one base swatch. Step 2 is always the exact base hex. */
export function shadesOf(key: PaletteKey, steps = SHADE_STEPS): string[] {
  const base = PALETTE[key]
  const mid = Math.floor(steps / 2)
  const out: string[] = []
  for (let i = 0; i < steps; i++) {
    if (i === mid) { out.push(base); continue }
    if (i < mid) out.push(mix(base, '#ffffff', ((mid - i) / mid) * MAX_LIGHTEN))
    else out.push(mix(base, '#000000', ((i - mid) / (steps - 1 - mid)) * MAX_DARKEN))
  }
  return out
}

export function resolveSwatch(ref: SwatchRef): string {
  return shadesOf(ref.base)[ref.shadeStep]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * srgbToLinear(r) * 255 ** 0 + 0 // placeholder, replaced below
}

/** WCAG relative luminance + contrast ratio (same formula as src/lib/colors.ts,
 *  kept local/self-contained here rather than shared — this tool's OKLab
 *  mixing has no other overlap with that file's HSL-based pill-colour logic). */
function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relLuminance(hexA)
  const l2 = relLuminance(hexB)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
```

Delete the stray unused `luminance()` placeholder function above before committing — it was scaffolding while porting the formula; `relLuminance` is the one actually used. (Flagging explicitly because it's easy to leave dead code in when copy-adapting formulas.)

**Step 4 — run and verify it passes**

Run: `npm test -- palette`
Expected: PASS, all 7 tests green

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/palette.ts src/app/presentations/placeworks/_components/tool/palette.test.ts
git commit -m "feat(placeworks-tool): add palette module with OKLab shade ramps"
```

---

## Milestone 2 — Yarn math module (pure, tested where feasible)

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/yarnMath.ts`
- Test: `src/app/presentations/placeworks/_components/tool/yarnMath.test.ts`

This evolves `YarnGenerator.tsx`'s `mulberry32`, `catmullRom`, `buildHarmonics`, `fractal`, `smoothstep`, `build` — but the spine is now a freeform cubic bezier (not a fixed LR/RL/TB/BT axis), and output carries a per-sample width for the ribbon renderer instead of a flat `strokeWidth`. Direction/span/spread-as-separate-controls and the pinch feature are gone entirely, per the finalized design.

### Task 2.1: Port PRNG + smoothstep + fractal noise (unchanged math, new home)

**Step 1 — write the failing test**

```ts
// src/app/presentations/placeworks/_components/tool/yarnMath.test.ts
import { describe, it, expect } from 'vitest'
import { mulberry32, smoothstep, fractal, type Octave } from './yarnMath'

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
```

**Step 2 — run, verify it fails** (`Cannot find module './yarnMath'`)

**Step 3 — implement** (this part is a direct, unchanged port from `YarnGenerator.tsx` lines 25–33 and 68–80)

```ts
// src/app/presentations/placeworks/_components/tool/yarnMath.ts
//
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
```

**Step 4 — run, verify pass:** `npm test -- yarnMath`

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/yarnMath.ts src/app/presentations/placeworks/_components/tool/yarnMath.test.ts
git commit -m "feat(placeworks-tool): port PRNG/smoothstep/fractal noise into yarnMath"
```

### Task 2.2: Bezier spine — point, tangent, normal

**Step 1 — write the failing test**

```ts
// append to yarnMath.test.ts
import { bezierPoint, bezierTangent, bezierNormal, type Bezier } from './yarnMath'

const straightLine: Bezier = {
  p0: { x: 0, y: 0 }, p1: { x: 33, y: 0 }, p2: { x: 66, y: 0 }, p3: { x: 100, y: 0 },
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
})
```

**Step 2 — run, verify fails**

**Step 3 — implement**

```ts
// append to yarnMath.ts
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
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

/** Unit normal (perpendicular to travel), consistent left-hand rotation of the tangent. */
export function bezierNormal(bez: Bezier, t: number): Pt {
  const tan = bezierTangent(bez, t)
  return { x: -tan.y, y: tan.x }
}
```

**Step 4 — run, verify pass:** `npm test -- yarnMath`

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/yarnMath.ts src/app/presentations/placeworks/_components/tool/yarnMath.test.ts
git commit -m "feat(placeworks-tool): add cubic bezier point/tangent/normal math"
```

### Task 2.3: Thickness profile evaluation

Reuses the same Gaussian-bump technique the old generator already used for `pinch` (`Math.exp(-((p-pinchAt)**2)/(2*pinchW**2))`, `YarnGenerator.tsx:120`) — repurposed here to bump *width* instead of *position*, since it's already a proven, cheap "localized influence" shape in this codebase.

**Step 1 — write the failing test**

```ts
// append to yarnMath.test.ts
import { thicknessAt, type ThicknessParams } from './yarnMath'

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
})
```

**Step 2 — run, verify fails**

**Step 3 — implement**

```ts
// append to yarnMath.ts
export type ThicknessPreset = 'flat' | 'thick-thin' | 'thin-thick' | 'thick-thin-thick' | 'thin-thick-thin'
export type ThicknessParams = {
  preset: ThicknessPreset
  min: number
  max: number
  transitionPos: number   // 0..1, where along the line the transition/peak sits
  transitionWidth: number // 0..1, how gradual it is
}

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
      const bump = Math.exp(-((t - transitionPos) ** 2) / (2 * w * w))
      return max - (max - min) * bump
    }
    case 'thin-thick-thin': {
      const bump = Math.exp(-((t - transitionPos) ** 2) / (2 * w * w))
      return min + (max - min) * bump
    }
  }
}
```

**Step 4 — run, verify pass**

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/yarnMath.ts src/app/presentations/placeworks/_components/tool/yarnMath.test.ts
git commit -m "feat(placeworks-tool): add thickness profile presets"
```

### Task 2.4: `buildStrokes` — the full per-strand sampler (bezier spine + noise + width)

This replaces `YarnGenerator.tsx`'s `build()` (lines 87–129). Direction/span/spread/pinch inputs are gone; `bezier`, `mess` (now scaled ×0.95, was ×0.58), `spread` (lane gather, kept), and `thickness` replace them. `crossScale` ties the perpendicular noise amplitude to the spine's own length so the tangle reads proportionally regardless of how the user drags the endpoints.

**Step 1 — write the failing test**

```ts
// append to yarnMath.test.ts
import { buildHarmonics, buildStrokes, type BuildParams } from './yarnMath'

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
    expect(s.points.length).toBeGreaterThan(50)
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
})
```

**Step 2 — run, verify fails**

**Step 3 — implement**

```ts
// append to yarnMath.ts
export const SAMPLES = 220

export type BuildParams = {
  bezier: Bezier
  lines: number
  mess: number    // 0..100
  detail: number  // 1..OCT_MAX
  resolve: number // 0..100 — where along the run the mess resolves
  sharp: number   // 0..100 — how abrupt the resolve transition is
  spread: number  // 0..100 — how much lines gather toward the centerline when resolved
  thickness: ThicknessParams
  seed: number
}

export type Stroke = { points: Pt[]; widths: number[]; opacity: number }

export function buildStrokes(h: Strand[], params: BuildParams): Stroke[] {
  const { bezier, lines, mess, detail, resolve, sharp, spread, thickness } = params
  const amp = (mess / 100) * 0.95 // was 0.58 — raised chaos ceiling
  const oct = Math.max(1, Math.min(OCT_MAX, Math.round(detail)))
  const tm = 0.1 + (resolve / 100) * 0.85
  const width = 0.5 - (sharp / 100) * 0.46
  const laneSpread = (spread / 100) * 0.96

  const spineLen = Math.hypot(bezier.p3.x - bezier.p0.x, bezier.p3.y - bezier.p0.y) || 1
  const crossScale = spineLen * 0.35 // ties noise amplitude to how far apart the endpoints are

  const out: Stroke[] = []
  for (let i = 0; i < lines; i++) {
    const s = h[i % STRAND_MAX]
    const lane = 0.5 + ((i + 0.5) / lines - 0.5) * laneSpread
    const tmS = Math.max(0.04, Math.min(0.97, tm + s.tmJit * 0.16))

    const points: Pt[] = []
    const widths: number[] = []
    for (let j = 0; j <= SAMPLES; j++) {
      const p = j / SAMPLES
      const win = 1 - smoothstep(tmS - width / 2, tmS + width / 2, p)
      const tAlong = Math.max(0, Math.min(1, p + amp * 0.5 * win * fractal(s.along, oct, p)))
      const perpOffset = (lane - 0.5) * 2 + amp * win * fractal(s.perp, oct, p)

      const base = bezierPoint(bezier, tAlong)
      const normal = bezierNormal(bezier, tAlong)
      points.push({ x: base.x + normal.x * perpOffset * crossScale, y: base.y + normal.y * perpOffset * crossScale })
      widths.push(thicknessAt(p, thickness))
    }
    out.push({ points, widths, opacity: 0.5 + (i % 4) * 0.12 })
  }
  return out
}
```

**Step 4 — run, verify pass:** `npm test -- yarnMath`

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/yarnMath.ts src/app/presentations/placeworks/_components/tool/yarnMath.test.ts
git commit -m "feat(placeworks-tool): add buildStrokes bezier-spine sampler with per-point width"
```

### Task 2.5: Ribbon polygon builder (variable-width filled shape from centerline + widths)

SVG has no native "stroke width varies along path" primitive, so a thickness-profiled line is built as a filled ribbon: offset the centerline left/right by half-width along each sample's local normal (computed from neighboring points, since the noisy sampled curve isn't the clean analytic bezier anymore), smooth each edge with the existing Catmull-Rom helper, then stitch into one closed path.

**Step 1 — write the failing test**

```ts
// append to yarnMath.test.ts
import { buildRibbonPath, catmullRom } from './yarnMath'

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
```

**Step 2 — run, verify fails**

**Step 3 — implement**

```ts
// append to yarnMath.ts
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

/** Builds a closed, filled ribbon path from a centerline + per-point half-widths. */
export function buildRibbonPath(points: Pt[], widths: number[]): string {
  if (points.length !== widths.length) throw new Error('points and widths must be the same length')
  const normals = polylineNormals(points)
  const left = points.map((p, i) => ({ x: p.x + normals[i].x * widths[i] / 2, y: p.y + normals[i].y * widths[i] / 2 }))
  const right = points.map((p, i) => ({ x: p.x - normals[i].x * widths[i] / 2, y: p.y - normals[i].y * widths[i] / 2 })).reverse()
  const leftPath = catmullRom(left)
  const rightPath = catmullRom(right)
  // drop the leading "M x y" of the right half — it continues the same path
  const rightContinuation = rightPath.replace(/^M [\d.-]+ [\d.-]+/, ` L ${right[0].x.toFixed(1)} ${right[0].y.toFixed(1)}`)
  return `${leftPath}${rightContinuation} Z`
}
```

**Step 4 — run, verify pass:** `npm test -- yarnMath`

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/yarnMath.ts src/app/presentations/placeworks/_components/tool/yarnMath.test.ts
git commit -m "feat(placeworks-tool): add ribbon-polygon builder for variable-width strokes"
```

**Milestone 2 risk flag:** `buildRibbonPath`'s neighbour-based normals can pinch or self-intersect at very sharp turns with a wide `max` thickness (a known limitation of simple ribbon-offsetting, not fixable without a full polygon-offset library). Acceptable for this tool's visual style (soft, noisy curves, not sharp corners) — but call it out explicitly to the user during Milestone 5's manual check if pinching is visible at extreme `mess`+`max thickness` combinations, rather than silently shipping a visual glitch.

---

## Milestone 3 — Route scaffolding, asset copy, CSS

**Files:**
- Create: `src/app/presentations/placeworks/tool/layout.tsx`
- Create: `src/app/presentations/placeworks/tool/page.tsx`
- Create: `public/presentations/placeworks/just-logo.svg` (copied)
- Modify: `src/app/presentations/placeworks/presentations.css`
- Modify: `src/app/presentations/placeworks/02/page.tsx`

### Task 3.1: Copy the logo asset into `public/`

**Step 1**

```bash
cp "/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Cr8tive/Placeworks/Clean-brand/just-logo.svg" \
   "/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/2026/Benjamin Arnedo/photofolio/public/presentations/placeworks/just-logo.svg"
```

**Step 2 — verify**

Run: `ls -la "public/presentations/placeworks/just-logo.svg"`
Expected: file exists, non-zero size

**Step 3 — commit**

```bash
git add public/presentations/placeworks/just-logo.svg
git commit -m "chore(placeworks-tool): add logo SVG asset"
```

### Task 3.2: Route layout + page shell (no tool logic yet — verifies routing/CSS wiring first)

**Step 1 — create `layout.tsx`**

```tsx
// src/app/presentations/placeworks/tool/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PlaceWorks — Brand Asset Tool',
  robots: { index: false, follow: false },
}

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

The parent `placeworks/layout.tsx` already wraps everything in `.pw-pitch` (noindex + hidden nav/footer + warm palette shell), so this nested layout only needs its own metadata override — no need to re-wrap.

**Step 2 — create a placeholder `page.tsx`**

```tsx
// src/app/presentations/placeworks/tool/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PlaceWorks — Brand Asset Tool',
}

export default function PlaceWorksTool() {
  return (
    <div style={{ padding: '4rem var(--pw-margin)' }}>
      <Link href="/presentations/placeworks/02" className="pw-credit">&larr; Concept 02</Link>
      <h1 className="pw-concept-name" style={{ marginTop: '1.5rem' }}>Brand Asset Tool</h1>
      <p className="pw-concept-tagline">Scaffolding — BrandAssetTool component wires in next.</p>
    </div>
  )
}
```

**Step 3 — manual verify**

Run: `npm run dev`, open `http://localhost:3000/presentations/placeworks/tool`
Expected: page renders with the pitch-deck's warm palette shell, no site nav/footer visible, "← Concept 02" link works.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/tool/layout.tsx src/app/presentations/placeworks/tool/page.tsx
git commit -m "feat(placeworks-tool): scaffold /presentations/placeworks/tool route"
```

### Task 3.3: Link out from concept-02

**Step 1 — modify `src/app/presentations/placeworks/02/page.tsx`**, inside the `pw-tool-section`, right after the closing `</div>` of the `pw-tool-head` block's hint paragraph (i.e. as a new element inside `pw-tool-head`, after the existing `<p className="pw-tool-hint">`):

```tsx
          <Link href="/presentations/placeworks/tool" className="pw-btn pw-btn--solid">
            Try the generator yourself &rarr;
          </Link>
```

Add the `Link` import at the top (already imports `Link from 'next/link'` — reuse it, no new import needed).

**Step 2 — manual verify**

Run: `npm run dev`, open `http://localhost:3000/presentations/placeworks/02`
Expected: a solid yellow "Try the generator yourself →" button appears near the tool section header, clicking it navigates to `/presentations/placeworks/tool`.

**Step 3 — commit**

```bash
git add src/app/presentations/placeworks/02/page.tsx
git commit -m "feat(placeworks-tool): link concept-02 to the standalone brand tool"
```

### Task 3.4: CSS additions for new interactive elements

**Step 1 — append to `presentations.css`** (new drag-handle + range-pair styles; everything else reuses `.pw-tool`/`.pw-controls`/`.pw-btn`/`.pw-slider` as-is):

```css
/* ── Brand tool — path/mask drag handles ─────────────────── */
.pw-handle {
  fill: var(--pw-accent);
  stroke: var(--pw-paper-pure);
  stroke-width: 2;
  cursor: grab;
}
.pw-handle:active { cursor: grabbing; }
.pw-handle-line {
  stroke: var(--pw-ink-soft);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  pointer-events: none;
}
.pw-mask-rect {
  fill: none;
  stroke: var(--pw-accent);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
  cursor: move;
}

/* ── Brand tool — min/max range pair (randomiser) ────────── */
.pw-range-pair {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 22rem;
  min-width: 16rem;
  font-family: var(--pw-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pw-stone);
}
.pw-range-pair input[type="number"] {
  width: 3.4rem;
  background: transparent;
  border: 1px solid var(--pw-hair);
  color: var(--pw-ink);
  font-family: var(--pw-mono);
  font-size: 0.72rem;
  padding: 0.2em 0.4em;
  border-radius: 2px;
}

/* ── Brand tool — swatch grid ─────────────────────────────── */
.pw-swatch-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.pw-swatch {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.28);
  padding: 0;
}
.pw-swatch--active { border: 2px solid var(--pw-accent); box-shadow: 0 0 0 1px var(--pw-accent); }
.pw-contrast-warning {
  font-family: var(--pw-mono);
  font-size: 0.68rem;
  color: var(--pw-accent);
}
```

**Step 2 — manual verify**

Run: `npm run dev` — no visual change yet (classes unused until later milestones); verify `npm run build` still succeeds (CSS-only change, but confirms no syntax error broke the stylesheet).

**Step 3 — commit**

```bash
git add src/app/presentations/placeworks/presentations.css
git commit -m "feat(placeworks-tool): add CSS for drag handles, range pairs, swatch grid"
```

---

## Milestone 4 — Logo component: recolourable + measured ink bounding box

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/PlaceWorksLogo.tsx`
- Create: `src/app/presentations/placeworks/_components/tool/useLogoBBox.ts`

The logo SVG (`public/presentations/placeworks/just-logo.svg`) has 12 paths sharing one fill (`rgb(35,31,32)`) and a `viewBox="0 0 2221 754"` that includes built-in padding (confirmed by inspecting the file — there's a fully transparent full-canvas `<rect>` as the first child, purely a bounding artifact from the source design tool, not visible ink). The tool must not trust that viewBox as the "minimum clear space" — it has to measure the actual painted-pixel bounding box at runtime via `getBBox()`.

### Task 4.1: Inline the logo as a component with an overridable fill

**Step 1 — create `PlaceWorksLogo.tsx`** by copying the 12 `<path>` elements' `d` attributes out of `public/presentations/placeworks/just-logo.svg` (read the file, extract each `<path d="...">`) into JSX, replacing the per-path `style="fill:rgb(35,31,32)..."` with a single `fill={color}` prop passed down:

```tsx
// src/app/presentations/placeworks/_components/tool/PlaceWorksLogo.tsx
import { forwardRef } from 'react'

type Props = { color: string; className?: string }

/** Inlined from public/presentations/placeworks/just-logo.svg — all 12 paths
 *  shared one fill in the source file, so a single `color` prop recolours
 *  the whole mark. viewBox kept identical to the source for 1:1 fidelity. */
const PlaceWorksLogo = forwardRef<SVGSVGElement, Props>(function PlaceWorksLogo({ color, className }, ref) {
  return (
    <svg ref={ref} viewBox="0 0 2221 754" className={className} xmlns="http://www.w3.org/2000/svg">
      <g fill={color}>
        {/* paste the 12 <path d="..."/> elements here verbatim from just-logo.svg,
            dropping each one's inline style="fill:..." — the group above supplies it */}
      </g>
    </svg>
  )
})

export default PlaceWorksLogo
```

Do the actual paste by reading `public/presentations/placeworks/just-logo.svg` and copying every `<path d="M...Z" .../>` string's `d` value into a `<path d="..." key={i} />` inside the `<g>` — do not hand-retype the coordinates, copy them exactly from the source file to avoid transcription errors.

**Step 2 — manual verify**

Temporarily render `<PlaceWorksLogo color="#000000" />` at the bottom of `tool/page.tsx`, run `npm run dev`, open the tool route.
Expected: the PlaceWorks wordmark + monogram renders correctly, matches `public/presentations/placeworks/just-logo.svg` opened directly in a browser tab side-by-side. Try `color="#D58E6C"` too and confirm it recolours fully. Remove the temporary render from `page.tsx` before committing.

**Step 3 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/PlaceWorksLogo.tsx
git commit -m "feat(placeworks-tool): inline recolourable PlaceWorks logo component"
```

### Task 4.2: Measure the logo's true ink bounding box via `getBBox()`

**Step 1 — create `useLogoBBox.ts`**

```tsx
// src/app/presentations/placeworks/_components/tool/useLogoBBox.ts
import { useEffect, useRef, useState } from 'react'

export type BBox = { width: number; height: number }

/** Measures an SVG element's true painted-content bounding box on mount.
 *  Do NOT use `display: none` on the element being measured — getBBox()
 *  returns all-zero for display:none elements. Keep it in normal flow but
 *  visually hidden (off-screen absolute + zero-size clip) instead. */
export function useLogoBBox(ref: React.RefObject<SVGSVGElement>): BBox | null {
  const [bbox, setBBox] = useState<BBox | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const raw = ref.current.getBBox()
    setBBox({ width: raw.width, height: raw.height })
  }, [ref])

  return bbox
}
```

**Step 2 — manual verify**

In `tool/page.tsx`, temporarily render:
```tsx
'use client'
const ref = useRef<SVGSVGElement>(null)
const bbox = useLogoBBox(ref)
// ...
<PlaceWorksLogo ref={ref} color="#000000" style={{ position: 'absolute', width: 400, height: 200, opacity: 0 }} />
{bbox && <p>Ink bbox: {bbox.width.toFixed(1)} × {bbox.height.toFixed(1)}</p>}
```
Expected: a printed width/height that's smaller than the full 2221×754 viewBox at the rendered size (confirms the transparent full-canvas rect isn't being counted) and has roughly the same aspect ratio as the visible wordmark+monogram (much wider than tall — the source content is a wide horizontal lockup). Remove the temporary render before committing; the real usage is wired in Milestone 7.

**Step 3 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/useLogoBBox.ts
git commit -m "feat(placeworks-tool): measure logo ink bounding box via getBBox"
```

**Milestone 4 risk flag:** `getBBox()` requires the SVG to be laid out in the DOM with non-zero size (an `opacity: 0` element at a real pixel size works; `width: 0; height: 0` or `display: none` do not). The measured bbox is in the SVG's own user-space units (the 2221×754 viewBox coordinate system), not screen pixels — Milestone 7's mask-clamping logic must convert it into the canvas's coordinate space (scale by `logo.scale` and by whatever viewBox-to-canvas ratio is in effect) rather than using the raw numbers directly.

---

## Milestone 5 — Core `BrandAssetTool` state + static render

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx`
- Modify: `src/app/presentations/placeworks/tool/page.tsx` (render it)

This wires the `ToolParams` state shape and renders a static (non-interactive) composition: background rect, yarn ribbons via `buildStrokes` + `buildRibbonPath`, the mask rect with its cream backing, and the logo. Dragging (Milestone 6) and the control panels (Milestone 7) come after — this milestone's job is proving the render pipeline end-to-end with hardcoded default values.

### Task 5.1: Define `ToolParams` and sensible defaults

**Step 1 — implement, no test (this is a type + constant, not logic)**

```tsx
// top of BrandAssetTool.tsx
import type { Pt, ThicknessParams } from './yarnMath'
import type { SwatchRef } from './palette'

export type ToolParams = {
  canvas: { widthPx: number; heightPx: number; unit: 'px' | 'cm'; widthCm: number; heightCm: number; dpi: number }
  path: { start: Pt; startHandle: Pt; end: Pt; endHandle: Pt }
  lines: number
  mess: number
  detail: number
  resolve: number
  sharp: number
  spread: number
  thickness: ThicknessParams
  colours: { background: SwatchRef; lines: SwatchRef[]; logo: SwatchRef | 'black' | 'white' }
  mask: { x: number; y: number; width: number; height: number; style: 'hard' | 'soft' }
  logo: { scale: number }
  seed: number
}

export const DEFAULT_PARAMS: ToolParams = {
  canvas: { widthPx: 1600, heightPx: 900, unit: 'px', widthCm: 33.87, heightCm: 19.05, dpi: 300 },
  path: { start: { x: 160, y: 700 }, startHandle: { x: 500, y: 200 }, end: { x: 1440, y: 300 }, endHandle: { x: 1100, y: 750 } },
  lines: 12,
  mess: 68,
  detail: 4,
  resolve: 58,
  sharp: 45,
  spread: 72,
  thickness: { preset: 'thick-thin', min: 1.5, max: 6, transitionPos: 0.6, transitionWidth: 0.3 },
  colours: {
    background: { base: 'nearBlack', shadeStep: 2 },
    lines: [{ base: 'terracotta', shadeStep: 2 }, { base: 'lavender', shadeStep: 2 }],
    logo: 'black',
  },
  mask: { x: 620, y: 340, width: 360, height: 220, style: 'hard' },
  logo: { scale: 1 },
  seed: 7,
}
```

**Step 2 — no automated test** (pure data, verified indirectly by every downstream render test/manual check)

**Step 3 — commit** (bundled with Task 5.2 below — a bare type+constant file isn't independently meaningful to commit alone)

### Task 5.2: Render pipeline — background, ribbons, mask, logo

**Step 1 — implement the component**

```tsx
'use client'

import { useMemo, useState, useRef } from 'react'
import { buildHarmonics, buildStrokes, buildRibbonPath } from './yarnMath'
import { resolveSwatch, PALETTE, shadesOf, contrastRatio } from './palette'
import PlaceWorksLogo from './PlaceWorksLogo'
import { useLogoBBox } from './useLogoBBox'

const CREAM_BACKING = shadesOf('cream')[0] // lightest cream tint — fixed, non-configurable mask backing

export default function BrandAssetTool() {
  const [params, setParams] = useState<ToolParams>(DEFAULT_PARAMS)
  const logoRef = useRef<SVGSVGElement>(null)
  const logoInkBBox = useLogoBBox(logoRef)

  const harmonics = useMemo(() => buildHarmonics(params.seed), [params.seed])
  const strokes = useMemo(() => buildStrokes(harmonics, {
    bezier: { p0: params.path.start, p1: params.path.startHandle, p2: params.path.endHandle, p3: params.path.end },
    lines: params.lines,
    mess: params.mess,
    detail: params.detail,
    resolve: params.resolve,
    sharp: params.sharp,
    spread: params.spread,
    thickness: params.thickness,
    seed: params.seed,
  }), [harmonics, params.path, params.lines, params.mess, params.detail, params.resolve, params.sharp, params.spread, params.thickness, params.seed])

  const bgColor = resolveSwatch(params.colours.background)
  const lineColors = params.colours.lines.map(resolveSwatch)
  const logoColor = params.colours.logo === 'black' ? '#000000' : params.colours.logo === 'white' ? '#ffffff' : resolveSwatch(params.colours.logo)
  const lowContrast = contrastRatio(logoColor, CREAM_BACKING) < 3

  const { widthPx: W, heightPx: H } = params.canvas
  const maskId = 'pw-tool-mask'

  return (
    <div className="pw-tool">
      <div className="pw-tool-stage">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="PlaceWorks brand asset generator canvas">
          <defs>
            <clipPath id={`${maskId}-hard`}>
              {/* everything EXCEPT the mask rect — approximated with 4 surrounding rects since SVG clipPath has no native "subtract" */}
              <rect x={0} y={0} width={W} height={params.mask.y} />
              <rect x={0} y={params.mask.y + params.mask.height} width={W} height={H} />
              <rect x={0} y={params.mask.y} width={params.mask.x} height={params.mask.height} />
              <rect x={params.mask.x + params.mask.width} y={params.mask.y} width={W} height={params.mask.height} />
            </clipPath>
            {params.mask.style === 'soft' && (
              <mask id={`${maskId}-soft`}>
                <rect x={0} y={0} width={W} height={H} fill="white" />
                <rect
                  x={params.mask.x} y={params.mask.y} width={params.mask.width} height={params.mask.height}
                  fill="black" opacity={0.9}
                  style={{ filter: 'blur(18px)' }}
                />
              </mask>
            )}
          </defs>

          <rect width={W} height={H} fill={bgColor} />

          <g clipPath={params.mask.style === 'hard' ? `url(#${maskId}-hard)` : undefined} mask={params.mask.style === 'soft' ? `url(#${maskId}-soft)` : undefined}>
            {strokes.map((s, i) => (
              <path key={i} d={buildRibbonPath(s.points, s.widths)} fill={lineColors[i % lineColors.length]} fillOpacity={s.opacity} />
            ))}
          </g>

          <rect x={params.mask.x} y={params.mask.y} width={params.mask.width} height={params.mask.height} fill={CREAM_BACKING} />
          {logoInkBBox && (
            <PlaceWorksLogo
              ref={logoRef}
              color={logoColor}
              style={{
                width: logoInkBBox.width * params.logo.scale,
                height: logoInkBBox.height * params.logo.scale,
                x: params.mask.x + (params.mask.width - logoInkBBox.width * params.logo.scale) / 2,
                y: params.mask.y + (params.mask.height - logoInkBBox.height * params.logo.scale) / 2,
              }}
            />
          )}
          {/* off-screen measurement copy — always mounted so getBBox has something to read even before the visible one exists */}
          {!logoInkBBox && (
            <foreignObject x={-9999} y={-9999} width={400} height={200}>
              <PlaceWorksLogo ref={logoRef} color="#000000" />
            </foreignObject>
          )}
        </svg>
        {lowContrast && <p className="pw-contrast-warning">Logo colour is low-contrast against its cream backing panel.</p>}
      </div>
    </div>
  )
}
```

Note: `PlaceWorksLogo` needs a small prop update from Task 4.1 to accept `x`/`y`/`width`/`height` (or a wrapping `<g transform>`) so it can be positioned/scaled inside the mask rect — go back and extend its `Props` type with optional `x?, y?, width?, height?` passed through to the root `<svg>` element (SVG-in-SVG via nested `<svg>` with its own x/y/width/height/viewBox is the simplest way to position+scale it without manual matrix math).

**Step 2 — wire into `tool/page.tsx`**

```tsx
import BrandAssetTool from '../_components/tool/BrandAssetTool'
// ...inside the page body, replace the placeholder paragraph with:
<BrandAssetTool />
```

**Step 3 — manual verify**

Run: `npm run dev`, open `/presentations/placeworks/tool`.
Expected:
- A dark canvas renders with a bundle of terracotta/lavender ribbons flowing from bottom-left to top-right (matching `DEFAULT_PARAMS.path`), tangled near the start, resolving to gathered parallel lines near the end.
- A cream rectangle sits mid-canvas with the black PlaceWorks logo centered inside it, and yarn lines are visibly cut out from underneath it (not drawn on top).
- No console errors about `getBBox` (if there are, the off-screen-measurement `foreignObject` fallback isn't mounting correctly — check it renders before the "real" logo does, per the `!logoInkBBox` condition).
- Toggling `params.mask.style` to `'soft'` (temporarily, by hand in code) shows a blurred-edge falloff instead of a hard cut.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx src/app/presentations/placeworks/_components/tool/PlaceWorksLogo.tsx src/app/presentations/placeworks/tool/page.tsx
git commit -m "feat(placeworks-tool): render static composition — background, ribbons, mask, logo"
```

**Milestone 5 risk flag:** the hard-clip-via-4-surrounding-rects trick assumes the mask rect never touches the canvas edge; if a user drags the mask rect so `x=0` or it exceeds `W`/`H`, one or more of the 4 rects gets zero/negative width and clipping degrades gracefully (that region just clips nothing extra) rather than erroring — worth a quick manual check in Milestone 7 once the mask becomes draggable.

---

## Milestone 6 — `PathEditor`: draggable bezier start/end + handles

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/PathEditor.tsx`
- Modify: `src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx`

### Task 6.1: Pointer-drag overlay for the 4 bezier control points

**Step 1 — implement**

```tsx
// src/app/presentations/placeworks/_components/tool/PathEditor.tsx
'use client'

import { useCallback, useRef } from 'react'
import type { Pt } from './yarnMath'

type Props = {
  start: Pt; startHandle: Pt; end: Pt; endHandle: Pt
  onChange: (next: { start: Pt; startHandle: Pt; end: Pt; endHandle: Pt }) => void
  svgRef: React.RefObject<SVGSVGElement>
  viewBoxW: number
  viewBoxH: number
}

type DragKey = 'start' | 'startHandle' | 'end' | 'endHandle'

export default function PathEditor({ start, startHandle, end, endHandle, onChange, svgRef, viewBoxW, viewBoxH }: Props) {
  const dragging = useRef<DragKey | null>(null)

  const toSvgPoint = useCallback((clientX: number, clientY: number): Pt => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * viewBoxW,
      y: ((clientY - rect.top) / rect.height) * viewBoxH,
    }
  }, [svgRef, viewBoxW, viewBoxH])

  const onPointerDown = (key: DragKey) => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragging.current = key
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const p = toSvgPoint(e.clientX, e.clientY)
    onChange({ start, startHandle, end, endHandle, [dragging.current]: p } as never)
  }

  const onPointerUp = () => { dragging.current = null }

  const dot = (key: DragKey, pt: Pt) => (
    <circle className="pw-handle" cx={pt.x} cy={pt.y} r={8}
      onPointerDown={onPointerDown(key)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
  )

  return (
    <g>
      <line className="pw-handle-line" x1={start.x} y1={start.y} x2={startHandle.x} y2={startHandle.y} />
      <line className="pw-handle-line" x1={end.x} y1={end.y} x2={endHandle.x} y2={endHandle.y} />
      {dot('start', start)}
      {dot('startHandle', startHandle)}
      {dot('end', end)}
      {dot('endHandle', endHandle)}
    </g>
  )
}
```

Merging the changed key into the full 4-point object with a computed key (`{ ...prev, [dragging.current]: p }`) is clearer than the inline `as never` cast above — replace that line with:

```tsx
    const next = { start, startHandle, end, endHandle }
    next[dragging.current] = p
    onChange(next)
```

**Step 2 — wire into `BrandAssetTool.tsx`**: pass an `svgRef` to the root `<svg>`, add `<PathEditor start={params.path.start} startHandle={params.path.startHandle} end={params.path.end} endHandle={params.path.endHandle} onChange={(path) => setParams((p) => ({ ...p, path }))} svgRef={svgRef} viewBoxW={W} viewBoxH={H} />` as the last child inside the `<svg>` (so handles render on top of everything).

**Step 3 — manual verify**

Run: `npm run dev`, open `/presentations/placeworks/tool`.
Expected: 4 small yellow dots visible on the canvas (2 solid anchors, 2 handle dots connected by dashed guide lines), each draggable with mouse/touch; dragging any dot immediately reflows the yarn bundle live (spine changes shape, tangle/resolve regions follow). Test dragging on a touch device or with browser devtools' touch emulation too, since `pointer` events should cover both.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/PathEditor.tsx src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): add draggable bezier path editor"
```

---

## Milestone 7 — Control panels (Colour, Thickness, Canvas, Mask)

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/ColourPanel.tsx`
- Create: `src/app/presentations/placeworks/_components/tool/ThicknessPanel.tsx`
- Create: `src/app/presentations/placeworks/_components/tool/CanvasPanel.tsx`
- Create: `src/app/presentations/placeworks/_components/tool/MaskPanel.tsx`
- Modify: `src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx`

Each panel is a small presentational component: props in (`current values`), a callback out (`onChange`). None have novel logic beyond what Milestones 1–2 already tested — they're wiring. Verify each one manually in the browser per its step below; no new unit tests (matches this repo's existing `YarnGenerator`/`ShapePlayground` convention of untested control panels — the logic underneath them is what's tested).

### Task 7.1: `ColourPanel` — background, multi-line colour cycling, logo colour

**Step 1 — implement**

```tsx
// src/app/presentations/placeworks/_components/tool/ColourPanel.tsx
'use client'

import { PALETTE, shadesOf, type PaletteKey, type SwatchRef } from './palette'

type Props = {
  background: SwatchRef
  lines: SwatchRef[]
  logo: SwatchRef | 'black' | 'white'
  onBackgroundChange: (ref: SwatchRef) => void
  onLinesChange: (refs: SwatchRef[]) => void
  onLogoChange: (v: SwatchRef | 'black' | 'white') => void
}

const KEYS = Object.keys(PALETTE) as PaletteKey[]

function SwatchPicker({ value, onChange }: { value: SwatchRef; onChange: (r: SwatchRef) => void }) {
  return (
    <div className="pw-swatch-grid">
      {KEYS.flatMap((key) => shadesOf(key).map((hex, step) => (
        <button
          key={`${key}-${step}`}
          className={`pw-swatch${value.base === key && value.shadeStep === step ? ' pw-swatch--active' : ''}`}
          style={{ background: hex }}
          title={`${key} · shade ${step}`}
          onClick={() => onChange({ base: key, shadeStep: step })}
        />
      )))}
    </div>
  )
}

export default function ColourPanel({ background, lines, logo, onBackgroundChange, onLinesChange, onLogoChange }: Props) {
  const toggleLine = (key: PaletteKey, step: number) => {
    const exists = lines.some((l) => l.base === key && l.shadeStep === step)
    if (exists) {
      if (lines.length > 1) onLinesChange(lines.filter((l) => !(l.base === key && l.shadeStep === step)))
    } else if (lines.length < 4) {
      onLinesChange([...lines, { base: key, shadeStep: step }])
    }
  }

  return (
    <div className="pw-controls" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <span className="pw-slider">Background</span>
      <SwatchPicker value={background} onChange={onBackgroundChange} />

      <span className="pw-slider">Lines&nbsp;(1&ndash;4 active)</span>
      <div className="pw-swatch-grid">
        {KEYS.flatMap((key) => shadesOf(key).map((hex, step) => (
          <button
            key={`${key}-${step}`}
            className={`pw-swatch${lines.some((l) => l.base === key && l.shadeStep === step) ? ' pw-swatch--active' : ''}`}
            style={{ background: hex }}
            title={`${key} · shade ${step}`}
            onClick={() => toggleLine(key, step)}
          />
        )))}
      </div>

      <span className="pw-slider">Logo colour</span>
      <div className="pw-swatch-grid">
        <button className={`pw-swatch${logo === 'black' ? ' pw-swatch--active' : ''}`} style={{ background: '#000' }} title="Black" onClick={() => onLogoChange('black')} />
        <button className={`pw-swatch${logo === 'white' ? ' pw-swatch--active' : ''}`} style={{ background: '#fff' }} title="White" onClick={() => onLogoChange('white')} />
      </div>
      <SwatchPicker value={typeof logo === 'string' ? { base: 'nearBlack', shadeStep: 2 } : logo} onChange={onLogoChange} />
    </div>
  )
}
```

**Step 2 — wire into `BrandAssetTool.tsx`** below the canvas stage:
```tsx
<ColourPanel
  background={params.colours.background} lines={params.colours.lines} logo={params.colours.logo}
  onBackgroundChange={(background) => setParams((p) => ({ ...p, colours: { ...p.colours, background } }))}
  onLinesChange={(lines) => setParams((p) => ({ ...p, colours: { ...p.colours, lines } }))}
  onLogoChange={(logo) => setParams((p) => ({ ...p, colours: { ...p.colours, logo } }))}
/>
```

**Step 3 — manual verify**

Expected: 35 swatch chips (7 colours × 5 shades) for background and for lines; clicking a background chip recolours the canvas immediately; clicking 2–4 line chips makes the yarn bundle cycle through those colours in strand order; clicking a 5th line chip while 4 are active does nothing (cap enforced); clicking the sole active line swatch does nothing (min-1 enforced); black/white/palette logo buttons recolour the logo live; picking a near-white logo colour on the cream backing shows the low-contrast warning text from Milestone 5.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/ColourPanel.tsx src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): add colour panel with palette shade pickers"
```

### Task 7.2: `ThicknessPanel`

**Step 1 — implement**

```tsx
// src/app/presentations/placeworks/_components/tool/ThicknessPanel.tsx
'use client'

import type { ThicknessParams, ThicknessPreset } from './yarnMath'

const PRESETS: { id: ThicknessPreset; label: string }[] = [
  { id: 'flat', label: 'Flat' },
  { id: 'thick-thin', label: 'Thick → Thin' },
  { id: 'thin-thick', label: 'Thin → Thick' },
  { id: 'thick-thin-thick', label: 'Thick-Thin-Thick' },
  { id: 'thin-thick-thin', label: 'Thin-Thick-Thin' },
]

type Props = { value: ThicknessParams; onChange: (v: ThicknessParams) => void }

export default function ThicknessPanel({ value, onChange }: Props) {
  const set = <K extends keyof ThicknessParams>(key: K, v: ThicknessParams[K]) => onChange({ ...value, [key]: v })
  return (
    <div className="pw-controls">
      {PRESETS.map((p) => (
        <button key={p.id} className={`pw-btn${value.preset === p.id ? ' pw-btn--solid' : ''}`} onClick={() => set('preset', p.id)}>
          {p.label}
        </button>
      ))}
      <span className="pw-slider">Min&nbsp;width<input type="range" min={0.5} max={20} step={0.5} value={value.min} onChange={(e) => set('min', +e.target.value)} /></span>
      <span className="pw-slider">Max&nbsp;width<input type="range" min={0.5} max={20} step={0.5} value={value.max} onChange={(e) => set('max', +e.target.value)} /></span>
      {value.preset !== 'flat' && (
        <>
          <span className="pw-slider">Transition&nbsp;pos<input type="range" min={0} max={100} value={value.transitionPos * 100} onChange={(e) => set('transitionPos', +e.target.value / 100)} /></span>
          <span className="pw-slider">Transition&nbsp;width<input type="range" min={5} max={100} value={value.transitionWidth * 100} onChange={(e) => set('transitionWidth', +e.target.value / 100)} /></span>
        </>
      )}
    </div>
  )
}
```

**Step 2 — wire in**, same pattern as 7.1.

**Step 3 — manual verify**

Expected: switching presets visibly changes how the ribbon width varies along each line — flat stays constant, thick-thin tapers, the two "…-thick-…" presets show a bulge/pinch centered at the transition-position slider's value; min/max sliders bound the taper's range; transition-pos/width sliders only show for non-flat presets and visibly shift/spread the taper location.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/ThicknessPanel.tsx src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): add thickness profile panel"
```

### Task 7.3: `CanvasPanel` — px/cm/dpi

**Step 1 — implement**

```tsx
// src/app/presentations/placeworks/_components/tool/CanvasPanel.tsx
'use client'

type CanvasParams = { widthPx: number; heightPx: number; unit: 'px' | 'cm'; widthCm: number; heightCm: number; dpi: number }
type Props = { value: CanvasParams; onChange: (v: CanvasParams) => void }

const CM_TO_PX = (cm: number, dpi: number) => Math.round((cm / 2.54) * dpi)

export default function CanvasPanel({ value, onChange }: Props) {
  const setUnit = (unit: 'px' | 'cm') => onChange({ ...value, unit })

  const setPx = (dim: 'widthPx' | 'heightPx', v: number) => onChange({ ...value, [dim]: v })

  const setCm = (dim: 'widthCm' | 'heightCm', v: number) => {
    const next = { ...value, [dim]: v }
    onChange({ ...next, widthPx: CM_TO_PX(next.widthCm, next.dpi), heightPx: CM_TO_PX(next.heightCm, next.dpi) })
  }

  const setDpi = (dpi: number) => onChange({ ...value, dpi, widthPx: CM_TO_PX(value.widthCm, dpi), heightPx: CM_TO_PX(value.heightCm, dpi) })

  return (
    <div className="pw-controls">
      <button className={`pw-btn${value.unit === 'px' ? ' pw-btn--solid' : ''}`} onClick={() => setUnit('px')}>PX</button>
      <button className={`pw-btn${value.unit === 'cm' ? ' pw-btn--solid' : ''}`} onClick={() => setUnit('cm')}>CM</button>

      {value.unit === 'px' ? (
        <>
          <span className="pw-slider">Width&nbsp;(px)<input type="number" value={value.widthPx} onChange={(e) => setPx('widthPx', +e.target.value)} /></span>
          <span className="pw-slider">Height&nbsp;(px)<input type="number" value={value.heightPx} onChange={(e) => setPx('heightPx', +e.target.value)} /></span>
        </>
      ) : (
        <>
          <span className="pw-slider">Width&nbsp;(cm)<input type="number" step={0.1} value={value.widthCm} onChange={(e) => setCm('widthCm', +e.target.value)} /></span>
          <span className="pw-slider">Height&nbsp;(cm)<input type="number" step={0.1} value={value.heightCm} onChange={(e) => setCm('heightCm', +e.target.value)} /></span>
          <span className="pw-slider">DPI<input type="number" value={value.dpi} onChange={(e) => setDpi(+e.target.value)} /></span>
          <span className="pw-mono">{value.widthPx} &times; {value.heightPx} px</span>
        </>
      )}
    </div>
  )
}
```

**Step 2 — wire in.** Note: switching `unit` alone doesn't recompute `widthPx`/`heightPx` from stale `widthCm`/`heightCm` — call `setCm`'s logic once on unit switch to cm, or simpler: only trust `widthPx`/`heightPx` as the single source of truth for rendering (they're what `BrandAssetTool` actually uses for the viewBox), and treat `widthCm`/`heightCm`/`dpi` as a convenience input mode that writes through to px — which the implementation above already does correctly (every cm/dpi setter recomputes px immediately). No extra sync code needed; just don't add a *separate* px→cm auto-sync (not required — cm fields are display/input only when in cm mode).

**Step 3 — manual verify**

Expected: PX mode shows plain width/height number inputs matching current canvas size; switching to CM mode shows cm width/height + DPI fields plus a computed "N × N px" readout; changing any cm/dpi field updates that readout and the actual rendered canvas size immediately; e.g. 10cm × 10cm at 300 DPI shows "1181 × 1181 px".

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/CanvasPanel.tsx src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): add canvas size panel with px/cm/dpi conversion"
```

### Task 7.4: `MaskPanel` — position/size sliders clamped to the logo's minimum clear space, style toggle

**Step 1 — implement**

```tsx
// src/app/presentations/placeworks/_components/tool/MaskPanel.tsx
'use client'

type MaskParams = { x: number; y: number; width: number; height: number; style: 'hard' | 'soft' }
type Props = {
  value: MaskParams
  onChange: (v: MaskParams) => void
  canvasW: number
  canvasH: number
  minWidth: number  // logo ink bbox width * logo.scale
  minHeight: number // logo ink bbox height * logo.scale
}

export default function MaskPanel({ value, onChange, canvasW, canvasH, minWidth, minHeight }: Props) {
  const set = <K extends keyof MaskParams>(key: K, v: MaskParams[K]) => onChange({ ...value, [key]: v })
  return (
    <div className="pw-controls">
      <button className={`pw-btn${value.style === 'hard' ? ' pw-btn--solid' : ''}`} onClick={() => set('style', 'hard')}>Hard clip</button>
      <button className={`pw-btn${value.style === 'soft' ? ' pw-btn--solid' : ''}`} onClick={() => set('style', 'soft')}>Soft fade</button>

      <span className="pw-slider">X<input type="range" min={0} max={canvasW - value.width} value={value.x} onChange={(e) => set('x', +e.target.value)} /></span>
      <span className="pw-slider">Y<input type="range" min={0} max={canvasH - value.height} value={value.y} onChange={(e) => set('y', +e.target.value)} /></span>
      <span className="pw-slider">Width<input type="range" min={minWidth} max={canvasW} value={value.width} onChange={(e) => set('width', Math.max(minWidth, +e.target.value))} /></span>
      <span className="pw-slider">Height<input type="range" min={minHeight} max={canvasH} value={value.height} onChange={(e) => set('height', Math.max(minHeight, +e.target.value))} /></span>
    </div>
  )
}
```

**Step 2 — wire into `BrandAssetTool.tsx`**, passing `minWidth={logoInkBBox ? logoInkBBox.width * params.logo.scale : 0}` (same for height) and a `logo.scale` slider alongside it (a plain `pw-slider` with `min={1} max={4} step={0.1}`, no separate component needed for one control).

**Step 3 — manual verify**

Expected: dragging width/height sliders below the logo's native size is impossible (the slider's own `min` attribute stops it, and the `Math.max` clamp is a second guard); increasing `logo.scale` raises the enforced minimum in real time, so if the rect is already at its old minimum, it visibly grows to match; X/Y sliders keep the rect fully inside the canvas (`max = canvasW - width`, recomputes as width changes); hard/soft buttons toggle the render exactly as verified in Milestone 5.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/MaskPanel.tsx src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): add mask panel clamped to logo clear-space minimum"
```

---

## Milestone 8 — Export: SVG + PNG with size cap

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/exportCanvas.ts`
- Modify: `src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx`

Reuses `ShapePlayground.tsx`'s proven `exportSVG`/`exportPNG` pattern (blob → `Image` → offscreen `<canvas>` → `toDataURL`, `src/app/presentations/placeworks/_components/ShapePlayground.tsx:266–296`) — same-origin blob URL means the canvas never taints, so this is low-risk, not new territory for this codebase.

### Task 8.1: `buildExportSVG` — shared serializer

**Step 1 — write the failing test**

```ts
// src/app/presentations/placeworks/_components/tool/exportCanvas.test.ts
import { describe, it, expect } from 'vitest'
import { buildExportSVG } from './exportCanvas'

describe('buildExportSVG', () => {
  it('produces a well-formed SVG string with the given dimensions', () => {
    const svg = buildExportSVG({
      widthPx: 800, heightPx: 600, background: '#292632',
      ribbons: [{ path: 'M0 0 L10 10 Z', color: '#D58E6C', opacity: 0.8 }],
      mask: { x: 100, y: 100, width: 200, height: 150, backing: '#F5E6C8' },
      logoSVG: '<g fill="#000"><rect width="10" height="10"/></g>',
      logoX: 150, logoY: 140, logoWidth: 100, logoHeight: 40,
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('width="800"')
    expect(svg).toContain('height="600"')
    expect(svg).toContain('#292632')
    expect(svg).toContain('#D58E6C')
    expect(svg).toContain('#F5E6C8')
  })
})
```

**Step 2 — run, verify fails**

**Step 3 — implement**

```ts
// src/app/presentations/placeworks/_components/tool/exportCanvas.ts

export type ExportRibbon = { path: string; color: string; opacity: number }
export type ExportInput = {
  widthPx: number
  heightPx: number
  background: string
  ribbons: ExportRibbon[]
  mask: { x: number; y: number; width: number; height: number; backing: string }
  logoSVG: string // inner markup (the <g fill="...">...</g> content), pre-recoloured
  logoX: number
  logoY: number
  logoWidth: number
  logoHeight: number
}

export function buildExportSVG(input: ExportInput): string {
  const { widthPx, heightPx, background, ribbons, mask, logoSVG, logoX, logoY, logoWidth, logoHeight } = input
  const clipRects = [
    `<rect x="0" y="0" width="${widthPx}" height="${mask.y}"/>`,
    `<rect x="0" y="${mask.y + mask.height}" width="${widthPx}" height="${heightPx}"/>`,
    `<rect x="0" y="${mask.y}" width="${mask.x}" height="${mask.height}"/>`,
    `<rect x="${mask.x + mask.width}" y="${mask.y}" width="${widthPx}" height="${mask.height}"/>`,
  ].join('')
  const ribbonsSVG = ribbons.map((r) => `<path d="${r.path}" fill="${r.color}" fill-opacity="${r.opacity.toFixed(2)}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">` +
    `<rect width="${widthPx}" height="${heightPx}" fill="${background}"/>` +
    `<defs><clipPath id="exportclip">${clipRects}</clipPath></defs>` +
    `<g clip-path="url(#exportclip)">${ribbonsSVG}</g>` +
    `<rect x="${mask.x}" y="${mask.y}" width="${mask.width}" height="${mask.height}" fill="${mask.backing}"/>` +
    `<svg x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" viewBox="0 0 2221 754">${logoSVG}</svg>` +
    `</svg>`
}
```

This mirrors `BrandAssetTool`'s hard-clip approach exactly (Milestone 5) so on-screen and exported composition match. The "soft" mask style export is deliberately simplified to the hard-clip version here — SVG `<mask>` + CSS `filter: blur()` (used for the on-screen soft preview) doesn't reliably serialize/rasterize identically across browsers when exported as a static file; if pixel-perfect soft-mask export turns out to matter after the client tries it, revisit with an SVG `feGaussianBlur` filter primitive instead of CSS `filter`, which does serialize correctly.

**Step 4 — run, verify pass:** `npm test -- exportCanvas`

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/exportCanvas.ts src/app/presentations/placeworks/_components/tool/exportCanvas.test.ts
git commit -m "feat(placeworks-tool): add shared export SVG serializer"
```

### Task 8.2: Download helpers — SVG file + PNG rasterization with size cap

**Step 1 — implement** (no test — DOM/Blob/download side effects, verified manually like `ShapePlayground`'s equivalent code)

```ts
// append to exportCanvas.ts

export const PNG_SIZE_CAP = 6000 // px, longest side

export function downloadSVG(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exceedsSizeCap(widthPx: number, heightPx: number): boolean {
  return Math.max(widthPx, heightPx) > PNG_SIZE_CAP
}

export function downloadPNG(svg: string, widthPx: number, heightPx: number, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = widthPx
      canvas.height = heightPx
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('2D canvas context unavailable')); return }
      ctx.drawImage(img, 0, 0, widthPx, heightPx)
      URL.revokeObjectURL(url)
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('PNG encoding failed')); return }
        const pngUrl = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = filename
        a.click()
        URL.revokeObjectURL(pngUrl)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG failed to rasterize')) }
    img.src = url
  })
}
```

**Step 2 — wire into `BrandAssetTool.tsx`**: add export buttons that build the `ExportInput` from current `strokes`/`params`, call `buildExportSVG`, and either `downloadSVG` directly or check `exceedsSizeCap` first and show a blocking modal/inline message before calling `downloadPNG`:

```tsx
const [sizeCapBlocked, setSizeCapBlocked] = useState(false)

const handleExportSVG = () => downloadSVG(buildExportSVG(exportInput), 'placeworks-brand-asset.svg')

const handleExportPNG = () => {
  if (exceedsSizeCap(W, H)) { setSizeCapBlocked(true); return }
  downloadPNG(buildExportSVG(exportInput), W, H, 'placeworks-brand-asset.png')
}
```

```tsx
{sizeCapBlocked && (
  <div className="pw-tool-hint" role="alert">
    This export is {W}&times;{H}px &mdash; larger than the {PNG_SIZE_CAP}px safety cap and may hang your browser.
    Reduce canvas size or DPI to continue.
    <button className="pw-btn" onClick={() => setSizeCapBlocked(false)}>Dismiss</button>
  </div>
)}
```

**Step 3 — manual verify**

Expected: "Export SVG" downloads a `.svg` file that opens correctly and visually matches the on-screen canvas exactly (background, ribbons, mask, logo, colours all match); "Export PNG" at a normal size (e.g. default 1600×900) downloads a `.png` matching the same composition; switching to CM mode and setting e.g. 60cm × 60cm at 300dpi (7086×7086px, over the 6000px cap) blocks the PNG export with the warning message instead of hanging the tab; reducing DPI to 150 brings it under the cap and export succeeds.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/exportCanvas.ts src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): wire SVG/PNG export with 6000px size cap"
```

---

## Milestone 9 — Randomiser + persistence

**Files:**
- Create: `src/app/presentations/placeworks/_components/tool/RandomiserPanel.tsx`
- Create: `src/app/presentations/placeworks/_components/tool/useToolPersistence.ts`
- Modify: `src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx`

### Task 9.1: `useToolPersistence` — debounced localStorage save/load

**Step 1 — write the failing test** (this one's pure enough to test with a mocked `localStorage`, matching how the rest of the module tests are structured)

```ts
// src/app/presentations/placeworks/_components/tool/useToolPersistence.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadPersistedParams, savePersistedParams, STORAGE_KEY } from './useToolPersistence'

describe('persistence helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadPersistedParams()).toBeNull()
  })

  it('round-trips a saved object', () => {
    savePersistedParams({ seed: 5, lines: 10 })
    expect(loadPersistedParams()).toEqual({ seed: 5, lines: 10 })
  })

  it('returns null (not throw) on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    expect(loadPersistedParams()).toBeNull()
  })
})
```

**Step 2 — run, verify fails** (note: this needs a DOM-like `localStorage` global — Vitest's default `node` environment doesn't have one; check whether `npm test` already runs under `jsdom` for other DOM-touching tests, and if not, add a `// @vitest-environment jsdom` comment at the top of this test file specifically, which scopes the environment override to just this file without touching the global Vitest config)

**Step 3 — implement**

```ts
// src/app/presentations/placeworks/_components/tool/useToolPersistence.ts
import { useEffect, useRef } from 'react'

export const STORAGE_KEY = 'pw-tool-params'
const DEBOUNCE_MS = 400

export function loadPersistedParams<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function savePersistedParams<T>(params: T) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // storage unavailable/full — silently skip, not critical to core function
  }
}

export function clearPersistedParams() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

/** Debounce-saves `params` to localStorage on every change. */
export function useAutosave<T>(params: T) {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => savePersistedParams(params), DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [params])
}
```

**Step 4 — run, verify pass:** `npm test -- useToolPersistence`

**Step 5 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/useToolPersistence.ts src/app/presentations/placeworks/_components/tool/useToolPersistence.test.ts
git commit -m "feat(placeworks-tool): add debounced localStorage persistence"
```

### Task 9.2: Wire persistence + "Reset to defaults" into `BrandAssetTool`

**Step 1 — modify `BrandAssetTool.tsx`**:

```tsx
const [params, setParams] = useState<ToolParams>(() => loadPersistedParams<ToolParams>() ?? DEFAULT_PARAMS)
useAutosave(params)

const handleReset = () => { clearPersistedParams(); setParams(DEFAULT_PARAMS) }
```

Add a "Reset to defaults" `pw-btn` somewhere visible in the controls area calling `handleReset`.

**Step 2 — manual verify**

Run: `npm run dev`, open the tool, change several settings, reload the page.
Expected: all changes persist across reload (path shape, colours, canvas size, etc.); clicking "Reset to defaults" reverts everything to `DEFAULT_PARAMS` and a subsequent reload stays at defaults (confirms the storage key was actually cleared, not just the in-memory state reset).

**Step 3 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): persist tool state across reloads"
```

### Task 9.3: `RandomiserPanel` — curated params with min/max bounds

**Step 1 — implement**

```tsx
// src/app/presentations/placeworks/_components/tool/RandomiserPanel.tsx
'use client'

import { useState } from 'react'
import { mulberry32 } from './yarnMath'
import { PALETTE, type PaletteKey } from './palette'
import type { ToolParams } from './BrandAssetTool'

type Range = { min: number; max: number }
type Bounds = { mess: Range; lines: Range; detail: Range; thicknessMin: Range; thicknessMax: Range }

const DEFAULT_BOUNDS: Bounds = {
  mess: { min: 40, max: 100 },
  lines: { min: 6, max: 24 },
  detail: { min: 3, max: 9 },
  thicknessMin: { min: 0.5, max: 3 },
  thicknessMax: { min: 3, max: 12 },
}

type Props = { params: ToolParams; onRandomise: (next: ToolParams) => void }

const PRESET_SHAPES = ['flat', 'thick-thin', 'thin-thick', 'thick-thin-thick', 'thin-thick-thin'] as const
const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[]

export default function RandomiserPanel({ params, onRandomise }: Props) {
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS)

  const setBound = (key: keyof Bounds, edge: 'min' | 'max', v: number) =>
    setBounds((b) => ({ ...b, [key]: { ...b[key], [edge]: v } }))

  const randomise = () => {
    const rng = mulberry32(Date.now() >>> 0)
    const between = (r: Range) => r.min + rng() * (r.max - r.min)
    const colourCount = 1 + Math.floor(rng() * 4)
    const lines = Array.from({ length: colourCount }, () => ({
      base: PALETTE_KEYS[Math.floor(rng() * PALETTE_KEYS.length)],
      shadeStep: Math.floor(rng() * 5),
    }))

    onRandomise({
      ...params,
      seed: Math.floor(rng() * 1_000_000),
      mess: between(bounds.mess),
      lines: Math.round(between(bounds.lines)),
      detail: Math.round(between(bounds.detail)),
      thickness: {
        ...params.thickness,
        preset: PRESET_SHAPES[Math.floor(rng() * PRESET_SHAPES.length)],
        min: between(bounds.thicknessMin),
        max: between(bounds.thicknessMax),
      },
      colours: { ...params.colours, lines },
      path: {
        ...params.path,
        startHandle: { x: params.path.startHandle.x + (rng() - 0.5) * 200, y: params.path.startHandle.y + (rng() - 0.5) * 200 },
        endHandle: { x: params.path.endHandle.x + (rng() - 0.5) * 200, y: params.path.endHandle.y + (rng() - 0.5) * 200 },
      },
    })
  }

  const rangeInput = (label: string, key: keyof Bounds, step = 1) => (
    <div className="pw-range-pair">
      {label}
      <input type="number" step={step} value={bounds[key].min} onChange={(e) => setBound(key, 'min', +e.target.value)} />
      &ndash;
      <input type="number" step={step} value={bounds[key].max} onChange={(e) => setBound(key, 'max', +e.target.value)} />
    </div>
  )

  return (
    <div className="pw-controls">
      {rangeInput('Mess', 'mess')}
      {rangeInput('Lines', 'lines')}
      {rangeInput('Detail', 'detail')}
      {rangeInput('Thickness min', 'thicknessMin', 0.5)}
      {rangeInput('Thickness max', 'thicknessMax', 0.5)}
      <button className="pw-btn pw-btn--solid" onClick={randomise}>Randomise</button>
    </div>
  )
}
```

Note `mulberry32(Date.now() >>> 0)` — this is the one legitimate place in the tool that needs real non-determinism (explore-random-ideas is the whole point), unlike the deterministic seeded generation everywhere else; `Date.now()` is fine here since this is a live browser event handler, not a workflow script.

Path handle bounds aren't clamped to stay strictly on-canvas here (`+ (rng()-0.5)*200` can push a handle off-canvas) — acceptable per the earlier design call that layout params (mask, canvas, logo scale) are excluded from randomisation, but note that handle jitter is a soft "explore variation" nudge, not a hard-bounded param; if the client finds handles frequently randomising off-canvas in practice, tighten the jitter range or clamp to `[0, canvasW]`/`[0, canvasH]`.

**Step 2 — wire into `BrandAssetTool.tsx`**: `<RandomiserPanel params={params} onRandomise={setParams} />`

**Step 3 — manual verify**

Expected: default randomise produces varied but still on-canvas-ish compositions (mess, line count, detail, thickness shape, and 1–4 line colours all change); canvas size, mask rectangle, and logo scale never move when randomising; narrowing e.g. the Mess range to 80–100 and randomising repeatedly only ever produces very chaotic results, confirming the bounds are actually respected.

**Step 4 — commit**

```bash
git add src/app/presentations/placeworks/_components/tool/RandomiserPanel.tsx src/app/presentations/placeworks/_components/tool/BrandAssetTool.tsx
git commit -m "feat(placeworks-tool): add randomiser with per-param min/max bounds"
```

---

## Milestone 10 — Final integration pass

**Files:** all of the above, no new files.

### Task 10.1: Full manual QA pass

**Step 1 — run the full test suite**

Run: `npm test`
Expected: all tests pass (palette, yarnMath, exportCanvas, useToolPersistence)

**Step 2 — run the production build**

Run: `npm run build`
Expected: builds clean, no TypeScript errors, `/presentations/placeworks/tool` appears in the route list output

**Step 3 — full manual walkthrough** (in a real browser, `npm run dev`)

- [ ] Navigate from `/presentations/placeworks/02` via the new button to `/presentations/placeworks/tool`
- [ ] Drag all 4 bezier handles — yarn reflows live, no lag at default line count
- [ ] Push `mess` to 100 — bundle is visibly chaotic (more so than the old generator's old max)
- [ ] Select 3 different line colours from 3 different palette swatches — cycling is visible across strands
- [ ] Try every thickness preset — each looks visually distinct
- [ ] Switch canvas to CM mode, set 20cm × 20cm @ 300dpi, confirm the px readout shows 2362×2362
- [ ] Drag the mask rectangle — cannot shrink below the logo's clear space in either dimension
- [ ] Toggle hard/soft mask style — both render correctly on-screen
- [ ] Export SVG — file opens and matches on-screen composition
- [ ] Export PNG at a normal size — file opens and matches
- [ ] Attempt a PNG export over the 6000px cap — blocked with a clear message, no browser hang
- [ ] Click Randomise several times — canvas/mask/logo scale never change, everything else does
- [ ] Reload the page — all settings persisted
- [ ] Click "Reset to defaults" — reverts, and stays reverted after another reload
- [ ] Resize the browser window narrow (mobile width) — controls wrap reasonably, canvas stays usable

**Step 4 — fix anything found, one commit per fix**, following the same test-first flow as the relevant milestone above for any logic bug, or a plain implement+verify+commit cycle for pure UI/CSS fixes.

**Step 5 — final commit**

```bash
git add -A
git commit -m "chore(placeworks-tool): final QA pass for brand asset tool"
```

---

## Summary of what's deliberately out of scope (YAGNI)

- No backend/server-side rendering for export — everything is client-side, matching every other generator in this codebase.
- No undo/redo — persistence + "Reset to defaults" covers the practical need.
- No multi-client generalization — this is a PlaceWorks-specific tool; if a future client needs something similar, that's a new brainstorming session, not a speculative abstraction now.
- No server-rendered thumbnail/preview gallery of past exports — out of scope per the finalized design.
- Soft-mask PNG/SVG export uses the hard-clip fallback (see Task 8.1) rather than a pixel-perfect blurred export — flagged as a known simplification, not silently dropped.
