'use client'

/**
 * Concepto 01 — editor de logo.
 *
 * Colour the monogram as a single mark or per component, from the three
 * approved palettes (with optional 3-up / 3-down shade expansion),
 * over any background, at any size and canvas rotation. Exports the
 * exact frame as SVG or Full HD PNG.
 */

import { useRef, useState } from 'react'
import EditorShell, { CANVAS, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import { PALETTES, getPalette, paletteWithShades, remapColor, autoBg, visiblePool, type PaletteId } from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { getCleanExportSVGString, downloadSVG, downloadPNG } from '../exportUtils'
import { pick } from '../rand'
import { C1_PARTS, C1_VIEW } from './geometry'
import C1Mark from './C1Mark'
import LogoMockups from '../LogoMockups'

const INK = '#000000'
const PAPER = '#ffffff'

type ColorMode = 'single' | 'parts'

export default function C1LogoEditor() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [mode, setMode] = useState<ColorMode>('single')
  const [single, setSingle] = useState('#00545f')
  const [partColors, setPartColors] = useState<Record<string, string>>({
    ring: '#00545f',
    arc: '#d6fb00',
    base: '#d6fb00',
    c: '#ecfeb6',
  })
  const [bg, setBg] = useState<string | null>(PAPER)
  const [size, setSize] = useState(0.72)

  const { w, h } = CANVAS[orientation]
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c1', paletteId, (next) => applyPalette(next))

  const markSize = size * Math.min(w, h)
  const colors = mode === 'single'
    ? Object.fromEntries(C1_PARTS.map((p) => [p.id, single]))
    : partColors

  /** Palette click re-dresses the current design, not just the swatch pool. */
  const applyPalette = (next: PaletteId) => {
    const from = getPalette(paletteId)
    const to = getPalette(next)
    setPaletteId(next)
    setSingle((c) => remapColor(c, from, to))
    setPartColors((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, c]) => [k, remapColor(c, from, to)])),
    )
    setBg((b) => autoBg(b, from, to))
  }

  /** New random colours from the active pool — layout and background stay. */
  const randomColors = () => {
    const usable = visiblePool(pool, bg)
    setSingle(pick(usable))
    setPartColors(Object.fromEntries(C1_PARTS.map((p) => [p.id, pick(usable)])))
  }

  /** Negative version — shapes and background switch places. */
  const invert = () => {
    const oldBg = bg ?? PAPER
    // dominant shape colour becomes the new background
    const dominant = mode === 'single' ? single : partColors.ring ?? single
    setBg(dominant)
    setSingle(oldBg)
    setPartColors(Object.fromEntries(C1_PARTS.map((p) => [p.id, oldBg])))
  }

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextPool = shades ? paletteWithShades(pal) : pal.colors
    const nextMode: ColorMode = Math.random() < 0.5 ? 'single' : 'parts'
    const nextBg = Math.random() < 0.2 ? null : pick([PAPER, INK, ...nextPool])
    // only offer colours that actually read against the chosen background
    const usable = visiblePool(nextPool, nextBg)
    setPaletteId(pal.id)
    setMode(nextMode)
    setBg(nextBg)
    setSingle(pick(usable))
    setPartColors(Object.fromEntries(C1_PARTS.map((p) => [p.id, pick(usable)])))
    setSize(0.35 + Math.random() * 0.55)
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c1-logo.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c1-logo.png')
  }

  return (
    <>
    <EditorShell
      orientation={orientation}
      onOrientationChange={setOrientation}
      onSurprise={surprise}
      onExportSVG={exportSVG}
      onExportPNG={exportPNG}
      stage={
        <div className="tc-canvas-frame" style={{ aspectRatio: `${w} / ${h}`, maxWidth: '100%', maxHeight: '100%' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${w} ${h}`}
            width={w / 2}
            height={h / 2}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
          >
            {bg && <rect x="0" y="0" width={w} height={h} fill={bg} />}
            <svg
              x={(w - markSize) / 2}
              y={(h - markSize) / 2}
              width={markSize}
              height={markSize}
              viewBox={`0 0 ${C1_VIEW} ${C1_VIEW}`}
            >
              <C1Mark colors={colors} />
            </svg>
          </svg>
        </div>
      }
      panels={
        <>
          <Panel label="Paleta">
            <Seg
              options={PALETTES.map((p) => ({ value: p.id, label: p.id }))}
              value={paletteId}
              onChange={applyPalette}
            />
            <Check label="Jugar con tonos" checked={shades} onChange={setShades} />
          </Panel>

          <Panel label="Color">
            <Seg
              options={[
                { value: 'single' as const, label: 'Único' },
                { value: 'parts' as const, label: 'Por parte' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <div className="tc-btn-row">
              <button type="button" className="tc-btn" onClick={randomColors}>
                Colores al azar
              </button>
              <button type="button" className="tc-btn" onClick={invert}>
                Invertir
              </button>
            </div>
            {mode === 'single' ? (
              <Swatches colors={pickerPool} value={single} onPick={setSingle} small={shades} />
            ) : (
              C1_PARTS.map((p) => (
                <div key={p.id}>
                  <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                    {p.name}
                  </span>
                  <Swatches
                    colors={pickerPool}
                    value={partColors[p.id]}
                    onPick={(c) => setPartColors((prev) => ({ ...prev, [p.id]: c }))}
                    small
                  />
                </div>
              ))
            )}
          </Panel>

          <Panel label="Fondo">
            <Swatches colors={pickerPool} value={bg} onPick={setBg} small={shades} />
            <button type="button" className="tc-btn" onClick={() => setBg(null)} disabled={bg === null}>
              Transparente
            </button>
          </Panel>

          <Panel label="Tamaño">
            <SliderRow
              label="Tamaño del logo"
              min={0.15}
              max={0.95}
              step={0.01}
              value={size}
              onChange={setSize}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Panel>
        </>
      }
    />
    <LogoMockups
      patternKey="c1"
      bg={bg}
      aspect={1}
      renderLogo={(x, y, lw, lh) => (
        <svg x={x} y={y} width={lw} height={lh} viewBox={`0 0 ${C1_VIEW} ${C1_VIEW}`}>
          <C1Mark colors={colors} />
        </svg>
      )}
    />
    </>
  )
}
