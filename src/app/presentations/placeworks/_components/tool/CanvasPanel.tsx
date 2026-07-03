'use client'

type CanvasParams = { widthPx: number; heightPx: number; unit: 'px' | 'cm'; widthCm: number; heightCm: number; dpi: number }
type Props = { value: CanvasParams; onChange: (v: CanvasParams) => void }

const CM_TO_PX = (cm: number, dpi: number) => Math.round((cm / 2.54) * dpi)
const PX_TO_CM = (px: number, dpi: number) => (px / dpi) * 2.54

export default function CanvasPanel({ value, onChange }: Props) {
  const setUnit = (unit: 'px' | 'cm') => onChange({ ...value, unit })

  // widthCm/heightCm are kept continuously in sync with widthPx/heightPx in
  // BOTH directions (not just write-through from cm -> px on cm-field edits)
  // so the two tabs never show contradictory numbers, and so a later
  // DPI-only edit recomputes px from an up-to-date cm value instead of
  // silently reverting a px edit the user just made.
  const setPx = (dim: 'widthPx' | 'heightPx', v: number) => {
    const px = Math.max(1, v)
    const cmDim = dim === 'widthPx' ? 'widthCm' : 'heightCm'
    onChange({ ...value, [dim]: px, [cmDim]: PX_TO_CM(px, value.dpi) })
  }

  const setCm = (dim: 'widthCm' | 'heightCm', v: number) => {
    const cm = Math.max(1, v)
    const next = { ...value, [dim]: cm }
    onChange({
      ...next,
      widthPx: Math.max(1, CM_TO_PX(next.widthCm, next.dpi)),
      heightPx: Math.max(1, CM_TO_PX(next.heightCm, next.dpi)),
    })
  }

  const setDpi = (v: number) => {
    const dpi = Math.max(1, v)
    onChange({
      ...value,
      dpi,
      widthPx: Math.max(1, CM_TO_PX(value.widthCm, dpi)),
      heightPx: Math.max(1, CM_TO_PX(value.heightCm, dpi)),
    })
  }

  return (
    <div className="pw-controls">
      <button type="button" className={`pw-btn${value.unit === 'px' ? ' pw-btn--solid' : ''}`} onClick={() => setUnit('px')}>PX</button>
      <button type="button" className={`pw-btn${value.unit === 'cm' ? ' pw-btn--solid' : ''}`} onClick={() => setUnit('cm')}>CM</button>

      {value.unit === 'px' ? (
        <>
          <span className="pw-slider">Width&nbsp;(px)<input type="number" min={1} value={value.widthPx} onChange={(e) => setPx('widthPx', +e.target.value)} /></span>
          <span className="pw-slider">Height&nbsp;(px)<input type="number" min={1} value={value.heightPx} onChange={(e) => setPx('heightPx', +e.target.value)} /></span>
        </>
      ) : (
        <>
          <span className="pw-slider">Width&nbsp;(cm)<input type="number" min={1} step={0.1} value={value.widthCm} onChange={(e) => setCm('widthCm', +e.target.value)} /></span>
          <span className="pw-slider">Height&nbsp;(cm)<input type="number" min={1} step={0.1} value={value.heightCm} onChange={(e) => setCm('heightCm', +e.target.value)} /></span>
          <span className="pw-slider">DPI<input type="number" min={1} value={value.dpi} onChange={(e) => setDpi(+e.target.value)} /></span>
          <span className="pw-mono">{value.widthPx} &times; {value.heightPx} px</span>
        </>
      )}
    </div>
  )
}
