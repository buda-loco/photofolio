'use client'

/**
 * Tus CFO — small dock controls shared by all six editors.
 * Purely presentational; styling lives in presentations.css (tc-*).
 */

import type { ReactNode } from 'react'

export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tc-panel">
      <span className="tc-panel-label">{label}</span>
      {children}
    </div>
  )
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="tc-seg" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SliderRow({
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
  label,
}: {
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  format?: (v: number) => string
  label?: string
}) {
  return (
    <div className="tc-slider-row" title={label}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="tc-slider-value">{format ? format(value) : value}</span>
    </div>
  )
}

export function Swatches({
  colors,
  value,
  onPick,
  small,
  label,
}: {
  colors: string[]
  value?: string | null
  onPick: (hex: string) => void
  small?: boolean
  label?: string
}) {
  return (
    <div className="tc-swatches" role="group" aria-label={label}>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={small ? 'tc-swatch tc-swatch--sm' : 'tc-swatch'}
          style={{ background: c }}
          aria-pressed={value === c}
          aria-label={c}
          title={c}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  )
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="tc-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
