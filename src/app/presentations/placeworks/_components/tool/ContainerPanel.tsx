'use client'

import { memo } from 'react'
import MaskPanel from './MaskPanel'
import type { ToolParams } from './BrandAssetTool'

// Updater-style like LineShapePanel — see its Props comment for why value
// slices + a stable setParams updater (rather than the whole params object)
// is what makes the memo hold through canvas drags.
type Props = {
  mask: ToolParams['mask']
  logoScale: number
  logoVisible: boolean
  canvasW: number
  canvasH: number
  maskMinSize: number
  onMaskChange: (mask: ToolParams['mask']) => void
  onUpdate: (update: (prev: ToolParams) => ToolParams) => void
}

function ContainerPanel({ mask, logoScale, logoVisible, canvasW, canvasH, maskMinSize, onMaskChange, onUpdate }: Props) {
  return (
    <>
      {/* maskMinSize is a small usability floor only — the logo scales
          down to fit whatever container size the sliders (or the corner
          gizmo) choose, so the container's minimum is no longer tied to
          the logo's rendered size. */}
      <MaskPanel
        value={mask}
        onChange={onMaskChange}
        canvasW={canvasW}
        canvasH={canvasH}
        minWidth={maskMinSize}
        minHeight={maskMinSize}
      />
      <div className="pw-controls">
        {/* Logo visibility — `!== false` so pre-field persisted state
            (visible: undefined) keeps showing it. */}
        <button
          type="button"
          className={`pw-btn${logoVisible ? ' pw-btn--solid' : ''}`}
          onClick={() => onUpdate((p) => ({ ...p, logo: { ...p.logo, visible: p.logo.visible === false } }))}
        >
          {logoVisible ? 'Logo on' : 'Logo off'}
        </button>
        <span className="pw-slider">
          Logo&nbsp;scale
          <input
            type="range"
            min={1}
            // max=4 keeps the natural size (0.22 x 4 = 0.88 of canvas
            // width) inside the canvas; the fit-to-container clamp caps
            // the rendered size regardless, so this is a comfort range,
            // not a safety bound.
            max={4}
            step={0.1}
            value={logoScale}
            onChange={(e) => onUpdate((p) => ({ ...p, logo: { ...p.logo, scale: +e.target.value } }))}
          />
        </span>
      </div>
    </>
  )
}

// Memoised: re-renders only when the container's own values change (its own
// drags), never during path/curve drags.
export default memo(ContainerPanel)
