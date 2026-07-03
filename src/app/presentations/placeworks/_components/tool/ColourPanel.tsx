'use client'

import { useState } from 'react'
import { PALETTE, shadesOf, type PaletteKey, type SwatchRef } from './palette'

type Props = {
  background: SwatchRef
  lines: SwatchRef[]
  logo: SwatchRef | 'black' | 'white'
  container: SwatchRef
  onBackgroundChange: (ref: SwatchRef) => void
  onLinesChange: (refs: SwatchRef[]) => void
  onLogoChange: (v: SwatchRef | 'black' | 'white') => void
  onContainerChange: (ref: SwatchRef) => void
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

export default function ColourPanel({ background, lines, logo, container, onBackgroundChange, onLinesChange, onLogoChange, onContainerChange }: Props) {
  // UI-mode only, deliberately not part of ToolParams: it changes how a
  // swatch click behaves (replace vs. multi-select toggle), not anything
  // that's rendered or exported, so it doesn't belong in persisted/
  // randomised artwork state.
  const [mono, setMono] = useState(false)

  const toggleLine = (key: PaletteKey, step: number) => {
    if (mono) {
      onLinesChange([{ base: key, shadeStep: step }])
      return
    }
    const exists = lines.some((l) => l.base === key && l.shadeStep === step)
    if (exists) {
      if (lines.length > 1) onLinesChange(lines.filter((l) => !(l.base === key && l.shadeStep === step)))
    } else if (lines.length < 4) {
      onLinesChange([...lines, { base: key, shadeStep: step }])
    }
  }

  // Distinct from RandomiserPanel's Randomise button: this only reshuffles
  // colour roles (background/lines/logo/container) across the fixed swatch
  // grid — it never touches shape/generation params, so it can't undo a
  // tangle the user has otherwise dialed in.
  const randomSwatch = (): SwatchRef => ({
    base: KEYS[Math.floor(Math.random() * KEYS.length)],
    shadeStep: Math.floor(Math.random() * SHADE_TABLE[KEYS[0]].length),
  })

  const mixColours = () => {
    onBackgroundChange(randomSwatch())
    const lineCount = mono ? 1 : 1 + Math.floor(Math.random() * 4) // 1..4 — respects the mono toggle above
    onLinesChange(Array.from({ length: lineCount }, randomSwatch))
    onContainerChange(randomSwatch())
    // Biased toward black/white: they stay legible against any background/
    // container combo the roll above just picked, whereas a fully random
    // swatch risks landing on the low-contrast warning most of the time.
    const roll = Math.random()
    onLogoChange(roll < 0.4 ? 'black' : roll < 0.8 ? 'white' : randomSwatch())
  }

  return (
    <div className="pw-controls" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      {/* flex: 'none' overrides .pw-slider's `flex: 1 1 22rem` (which sizes
          along the *main* axis — normally width, in the row-flex .pw-controls
          used by every other panel). Here .pw-controls is switched to
          flex-direction: column above, which makes that same flex-basis
          apply to *height* instead, so a bare text label (no input, unlike
          every other .pw-slider usage) would otherwise claim a 22rem-tall
          empty box. */}
      <span className="pw-slider" style={{ flex: 'none' }}>Background</span>
      <SwatchPicker value={background} onChange={onBackgroundChange} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
        <span className="pw-slider" style={{ flex: 'none' }}>{mono ? 'Lines (mono)' : 'Lines (1–4 active)'}</span>
        <label className="pw-toggle">
          <input type="checkbox" checked={mono} onChange={(e) => setMono(e.target.checked)} />
          <span className="pw-toggle-track" />
          Mono
        </label>
      </div>
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

      <span className="pw-slider" style={{ flex: 'none' }}>Logo colour</span>
      <div className="pw-swatch-grid">
        <button className={`pw-swatch${logo === 'black' ? ' pw-swatch--active' : ''}`} style={{ background: '#000' }} title="Black" aria-label="Black" onClick={() => onLogoChange('black')} />
        <button className={`pw-swatch${logo === 'white' ? ' pw-swatch--active' : ''}`} style={{ background: '#fff' }} title="White" aria-label="White" onClick={() => onLogoChange('white')} />
      </div>
      <SwatchPicker value={typeof logo === 'string' ? null : logo} onChange={onLogoChange} />

      <span className="pw-slider" style={{ flex: 'none' }}>Container background</span>
      <SwatchPicker value={container} onChange={onContainerChange} />

      <div style={{ marginTop: '0.25rem' }}>
        <button type="button" className="pw-btn pw-btn--solid" onClick={mixColours}>Mix colours</button>
      </div>
    </div>
  )
}
