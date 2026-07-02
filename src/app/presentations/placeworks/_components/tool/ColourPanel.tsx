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

// Hoisted to module scope: shadesOf() is pure over the static PALETTE, so its
// output never changes — computing it once avoids 21 OKLab-conversion calls
// (7 keys × 3 pickers, 5 shades each) on every render, including re-renders
// triggered by unrelated slider changes elsewhere in ToolParams. Mirrors the
// same hoisting already done for CREAM_BACKING in BrandAssetTool.tsx.
const SHADE_TABLE: Record<PaletteKey, string[]> = Object.fromEntries(KEYS.map((k) => [k, shadesOf(k)])) as Record<PaletteKey, string[]>

function SwatchPicker({ value, onChange }: { value: SwatchRef | null; onChange: (r: SwatchRef) => void }) {
  return (
    <div className="pw-swatch-grid">
      {KEYS.flatMap((key) => SHADE_TABLE[key].map((hex, step) => (
        <button
          key={`${key}-${step}`}
          className={`pw-swatch${value !== null && value.base === key && value.shadeStep === step ? ' pw-swatch--active' : ''}`}
          style={{ background: hex }}
          title={`${key} · shade ${step}`}
          aria-label={`${key} shade ${step}`}
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
        {KEYS.flatMap((key) => SHADE_TABLE[key].map((hex, step) => {
          const isActive = lines.some((l) => l.base === key && l.shadeStep === step)
          return (
            <button
              key={`${key}-${step}`}
              className={`pw-swatch${isActive ? ' pw-swatch--active' : ''}`}
              style={{ background: hex }}
              title={`${key} · shade ${step}`}
              aria-label={`${key} shade ${step}`}
              aria-pressed={isActive}
              onClick={() => toggleLine(key, step)}
            />
          )
        }))}
      </div>

      <span className="pw-slider">Logo colour</span>
      <div className="pw-swatch-grid">
        <button className={`pw-swatch${logo === 'black' ? ' pw-swatch--active' : ''}`} style={{ background: '#000' }} title="Black" aria-label="Black" onClick={() => onLogoChange('black')} />
        <button className={`pw-swatch${logo === 'white' ? ' pw-swatch--active' : ''}`} style={{ background: '#fff' }} title="White" aria-label="White" onClick={() => onLogoChange('white')} />
      </div>
      <SwatchPicker value={typeof logo === 'string' ? null : logo} onChange={onLogoChange} />
    </div>
  )
}
