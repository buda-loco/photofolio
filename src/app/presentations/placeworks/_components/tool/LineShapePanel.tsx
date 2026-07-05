'use client'

import { memo } from 'react'
import { OCT_MAX, STRAND_MAX, type ThicknessParams } from './yarnMath'
import ThicknessPanel from './ThicknessPanel'
import type { ToolParams } from './BrandAssetTool'

// Updater-style like RandomiserPanel: value props are the exact slices this
// panel renders, and writes go through the stable setParams updater — so the
// memo below actually holds through canvas drags (this panel is the default
// active left tab, so before extraction it re-reconciled on every rAF drag
// frame despite the memo pass on the other panels).
type Props = {
  lines: number
  thickness: ThicknessParams
  resolve: number
  detail: number
  messMultiplier: number
  breadth: number
  onUpdate: (update: (prev: ToolParams) => ToolParams) => void
  onThicknessChange: (thickness: ThicknessParams) => void
  onRandomiseShape: () => void
}

function LineShapePanel({ lines, thickness, resolve, detail, messMultiplier, breadth, onUpdate, onThicknessChange, onRandomiseShape }: Props) {
  return (
    <>
      <div className="pw-controls">
        {/* Direct line-count control — previously only reachable through
            the randomiser's bounds, which made "start with one line and
            build up" impossible to do deliberately. */}
        <span className="pw-slider">
          Lines
          <input
            type="range"
            min={1}
            max={STRAND_MAX}
            step={1}
            value={lines}
            onChange={(e) => onUpdate((p) => ({ ...p, lines: +e.target.value }))}
          />
        </span>
        {/* Master width: one slider that scales the whole stroke. It moves
            thickness.max and keeps min at the same RATIO to it, so the
            thick-to-thin profile shaped by ThicknessPanel's own Min/Max
            sliders is preserved — this scales the line, those sculpt it. */}
        <span className="pw-slider">
          Width
          <input
            type="range"
            min={0.5}
            max={24}
            step={0.5}
            value={thickness.max}
            onChange={(e) =>
              onUpdate((p) => {
                const nextMax = +e.target.value
                const ratio = p.thickness.max > 0 ? p.thickness.min / p.thickness.max : 0.3
                return { ...p, thickness: { ...p.thickness, max: nextMax, min: Math.max(0.1, nextMax * ratio) } }
              })
            }
          />
        </span>
        {/* Perpendicular width of the WHOLE array (how far strands can
            stray from the spine) — distinct from Width above, which is
            the stroke thickness of each individual line. */}
        <span className="pw-slider">
          Array&nbsp;width
          <input
            type="range"
            min={2}
            max={100}
            step={1}
            value={breadth}
            onChange={(e) => onUpdate((p) => ({ ...p, breadth: +e.target.value }))}
          />
        </span>
      </div>
      <ThicknessPanel value={thickness} onChange={onThicknessChange} />
      <div className="pw-controls">
        <span className="pw-slider">
          Mess&nbsp;end
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={resolve}
            onChange={(e) => onUpdate((p) => ({ ...p, resolve: +e.target.value }))}
          />
        </span>
        <span className="pw-slider">
          Mess&nbsp;detail
          <input
            type="range"
            min={1}
            max={OCT_MAX}
            step={1}
            value={detail}
            onChange={(e) => onUpdate((p) => ({ ...p, detail: +e.target.value }))}
          />
        </span>
        {/* Global tame dial: scales only the jitter, keeping lane
            structure — 0% = perfectly smooth strands at the same
            spacing. See yarnMath's messMultiplier doc. */}
        <span className="pw-slider">
          Mess&nbsp;multiplier
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={messMultiplier}
            onChange={(e) => onUpdate((p) => ({ ...p, messMultiplier: +e.target.value }))}
          />
        </span>
      </div>
      <div className="pw-controls">
        <button type="button" className="pw-btn pw-btn--solid" onClick={onRandomiseShape}>Randomise shape</button>
      </div>
    </>
  )
}

// Memoised: value props only change when this panel's own params change,
// and the callbacks are stable — canvas drags skip reconciling it entirely.
export default memo(LineShapePanel)
