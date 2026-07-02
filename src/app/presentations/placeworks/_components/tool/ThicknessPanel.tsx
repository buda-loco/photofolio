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
        <button
          key={p.id}
          type="button"
          className={`pw-btn${value.preset === p.id ? ' pw-btn--solid' : ''}`}
          onClick={() => set('preset', p.id)}
        >
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
