'use client'

import { useState } from 'react'
import { mulberry32 } from './yarnMath'
import { PALETTE, shadesOf, type PaletteKey } from './palette'
import type { ToolParams } from './BrandAssetTool'

type Range = { min: number; max: number }
type Bounds = {
  mess: Range
  lines: Range
  detail: Range
  resolve: Range
  sharp: Range
  spread: Range
  thicknessMin: Range
  thicknessMax: Range
}

const DEFAULT_BOUNDS: Bounds = {
  mess: { min: 40, max: 100 },
  lines: { min: 6, max: 24 },
  detail: { min: 3, max: 9 },
  resolve: { min: 20, max: 90 },
  sharp: { min: 10, max: 95 },
  spread: { min: 20, max: 100 },
  thicknessMin: { min: 0.5, max: 3 },
  thicknessMax: { min: 3, max: 12 },
}

type Props = { params: ToolParams; onRandomise: (next: ToolParams) => void }

const PRESET_SHAPES = ['flat', 'thick-thin', 'thin-thick', 'thick-thin-thick', 'thin-thick-thin'] as const
const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[]
// Derived rather than hardcoded to `5`: palette.ts's shade-ramp length is a
// private implementation detail (SHADE_STEPS isn't exported) — reading it off
// a real shadesOf() call keeps this in sync automatically if that ramp length
// ever changes, instead of silently drifting out of step with a magic number.
// (resolveSwatch() also clamps out-of-range shadeStep defensively, so this is
// belt-and-braces, not load-bearing.)
const SHADE_STEP_COUNT = shadesOf('nearBlack').length

export default function RandomiserPanel({ params, onRandomise }: Props) {
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS)

  const setBound = (key: keyof Bounds, edge: 'min' | 'max', v: number) =>
    setBounds((b) => ({ ...b, [key]: { ...b[key], [edge]: v } }))

  const randomise = () => {
    const rng = mulberry32(Date.now() >>> 0)
    // Order-tolerant by construction: `min + t*(max-min)` for t in [0,1)
    // interpolates between the two bound values regardless of which one is
    // numerically larger, so a user dragging/typing "min" above "max" in the
    // UI (nothing currently stops that) still yields a value contained
    // within the pair, never NaN or a wild out-of-range escape. This mirrors
    // ThicknessPanel's own Min-width/Max-width sliders, which have the same
    // property and are likewise left unguarded against swapped ordering.
    const between = (r: Range) => r.min + rng() * (r.max - r.min)
    const colourCount = 1 + Math.floor(rng() * 4) // 1..4, matches ColourPanel's "1-4 active" line-colour rule
    const lineColours = Array.from({ length: colourCount }, () => ({
      base: PALETTE_KEYS[Math.floor(rng() * PALETTE_KEYS.length)],
      shadeStep: Math.floor(rng() * SHADE_STEP_COUNT),
    }))

    onRandomise({
      ...params,
      seed: Math.floor(rng() * 1_000_000),
      mess: between(bounds.mess),
      lines: Math.round(between(bounds.lines)), // strand count — distinct from colours.lines (which line colours cycle through) below
      detail: Math.round(between(bounds.detail)),
      resolve: between(bounds.resolve),
      sharp: between(bounds.sharp),
      spread: between(bounds.spread),
      thickness: {
        ...params.thickness,
        preset: PRESET_SHAPES[Math.floor(rng() * PRESET_SHAPES.length)],
        min: between(bounds.thicknessMin),
        max: between(bounds.thicknessMax),
      },
      colours: { ...params.colours, lines: lineColours },
      // Soft nudge only, deliberately not clamped to canvas bounds — same
      // freeform behaviour PathEditor already allows via manual dragging (it
      // has no canvas-bounds clamp either), so this doesn't introduce a new
      // failure mode. bezierTangent/bezierNormal are well-defined for any
      // real handle position (cusp/zero-derivative case already falls back
      // to the chord direction), so an off-canvas handle can push the spine
      // outside the visible frame but never breaks the math.
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
      <input type="number" min={0} step={step} value={bounds[key].min} onChange={(e) => setBound(key, 'min', +e.target.value)} />
      &ndash;
      <input type="number" min={0} step={step} value={bounds[key].max} onChange={(e) => setBound(key, 'max', +e.target.value)} />
    </div>
  )

  return (
    <div className="pw-controls">
      {rangeInput('Mess', 'mess')}
      {rangeInput('Lines', 'lines')}
      {rangeInput('Detail', 'detail')}
      {rangeInput('Resolve', 'resolve')}
      {rangeInput('Sharp', 'sharp')}
      {rangeInput('Spread', 'spread')}
      {rangeInput('Thickness min', 'thicknessMin', 0.5)}
      {rangeInput('Thickness max', 'thicknessMax', 0.5)}
      <button type="button" className="pw-btn pw-btn--solid" onClick={randomise}>Randomise</button>
    </div>
  )
}
