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
      <button type="button" className={`pw-btn${value.unit === 'px' ? ' pw-btn--solid' : ''}`} onClick={() => setUnit('px')}>PX</button>
      <button type="button" className={`pw-btn${value.unit === 'cm' ? ' pw-btn--solid' : ''}`} onClick={() => setUnit('cm')}>CM</button>

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
