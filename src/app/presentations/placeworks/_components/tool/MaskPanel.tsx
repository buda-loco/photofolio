'use client'

import { useEffect } from 'react'

export type MaskParams = {
  x: number; y: number; width: number; height: number; style: 'hard' | 'soft'
  avoid: boolean // when true, yarn strands are repelled away from this rect as they're generated (see yarnMath.ts's avoidRect)
  avoidStrength: number // 0..100, only meaningful while avoid is true
}
type Props = {
  value: MaskParams
  onChange: (v: MaskParams) => void
  canvasW: number
  canvasH: number
  minWidth: number // smallest width the rect may be sized to, in canvas px (a usability floor — the logo scales down to fit the container, not vice versa)
  minHeight: number // same, height
}

// Single source of truth for keeping the mask rect valid. Clamps size first
// (independent of position) then clamps position against the *resulting*
// size — this order guarantees `x + width <= canvasW` and
// `y + height <= canvasH` always hold, no matter which field triggered the
// update. Without this, e.g. increasing `width` while `x` is large would
// leave `x` stale and push the rect past the right edge, producing a
// negative-dimension clip rect (SVG silently drops it, so the yarn bleeds
// past that edge uncontained).
// If `minHeight`/`minWidth` exceed `canvasH`/`canvasW`, canvas bounds win and
// the logo will visually overflow the mask — accepted tradeoff, not a bug.
export function clampMask(m: MaskParams, canvasW: number, canvasH: number, minWidth: number, minHeight: number): MaskParams {
  const width = Math.min(Math.max(m.width, minWidth), canvasW)
  const height = Math.min(Math.max(m.height, minHeight), canvasH)
  const x = Math.min(Math.max(m.x, 0), canvasW - width)
  const y = Math.min(Math.max(m.y, 0), canvasH - height)
  return { ...m, x, y, width, height }
}

export default function MaskPanel({ value, onChange, canvasW, canvasH, minWidth, minHeight }: Props) {
  const set = (patch: Partial<MaskParams>) => {
    onChange(clampMask({ ...value, ...patch }, canvasW, canvasH, minWidth, minHeight))
  }

  // Re-clamp whenever the *bounds* move out from under the current mask —
  // the logo scale slider growing minWidth/minHeight, or the canvas being
  // resized smaller — rather than only when the user drags a mask slider
  // directly. This is what makes the mask visibly grow to match a larger
  // logo instead of silently letting the logo overflow its backing panel.
  useEffect(() => {
    const next = clampMask(value, canvasW, canvasH, minWidth, minHeight)
    if (next.x !== value.x || next.y !== value.y || next.width !== value.width || next.height !== value.height) {
      onChange(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasW, canvasH, minWidth, minHeight])

  return (
    <div className="pw-controls">
      <button type="button" className={`pw-btn${value.style === 'hard' ? ' pw-btn--solid' : ''}`} onClick={() => set({ style: 'hard' })}>Hard clip</button>
      <button type="button" className={`pw-btn${value.style === 'soft' ? ' pw-btn--solid' : ''}`} onClick={() => set({ style: 'soft' })}>Soft fade</button>
      <button type="button" className={`pw-btn${value.avoid ? ' pw-btn--solid' : ''}`} onClick={() => set({ avoid: !value.avoid })}>Avoid</button>
      {value.avoid && (
        <span className="pw-slider">
          Avoidance
          <input type="range" min={0} max={100} step={1} value={value.avoidStrength} onChange={(e) => set({ avoidStrength: +e.target.value })} />
        </span>
      )}

      {/* step="any": min/max here are computed floats (minWidth/minHeight come
          from the logo's aspect-ratio-derived size, not round numbers). The
          native range input's default step is 1 with a step-base equal to
          `min` — with a fractional min, that silently snaps values to
          min + n*1 offsets (e.g. 899.205 instead of 900), never violating
          the min/max bounds but preventing the slider from ever reaching a
          clean value. step="any" disables that snapping. */}
      <span className="pw-slider">X<input type="range" step="any" min={0} max={Math.max(0, canvasW - value.width)} value={value.x} onChange={(e) => set({ x: +e.target.value })} /></span>
      <span className="pw-slider">Y<input type="range" step="any" min={0} max={Math.max(0, canvasH - value.height)} value={value.y} onChange={(e) => set({ y: +e.target.value })} /></span>
      <span className="pw-slider">Width<input type="range" step="any" min={minWidth} max={canvasW} value={value.width} onChange={(e) => set({ width: +e.target.value })} /></span>
      <span className="pw-slider">Height<input type="range" step="any" min={minHeight} max={canvasH} value={value.height} onChange={(e) => set({ height: +e.target.value })} /></span>
    </div>
  )
}
