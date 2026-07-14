'use client'

/**
 * Concepto 02 — editor de logo.
 *
 * The CFO graph-lockup in a row or stacked, coloured with a two-colour
 * combination from the approved palettes (colour 1 = figures, colour 2 =
 * counter shapes) or a single colour with transparent counters. Optional
 * palette-built gradients: radial for the circular glyphs (C pie, O dial),
 * linear for the F bars. Exports the exact frame as SVG or Full HD PNG.
 */

import { useRef, useState } from 'react'
import EditorShell, { CANVAS, rotationTransform, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import { PALETTES, getPalette, paletteWithShades, visiblePool, remapColor, autoBg, type PaletteId } from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { getCleanExportSVGString, downloadSVG, downloadPNG } from '../exportUtils'
import { pick, pickOther } from '../rand'
import { C2_VIEW, C2_GAP, C2GlyphC, C2GlyphF, C2GlyphO } from './geometry'
import LogoMockups from '../LogoMockups'

const INK = '#000000'
const PAPER = '#ffffff'

/** Lockup layout — this is the logo's own arrangement, not the canvas. */
type LogoLayout = 'horizontal' | 'vertical'

type ColorMode = 'duo' | 'single'

const STEP = C2_VIEW + C2_GAP // 424.4 — glyph box + lockup gap
const LOCK_LONG = STEP * 2 + C2_VIEW // long side of the 3-glyph lockup

export default function C2LogoEditor() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [rotation, setRotation] = useState(0)
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [layout, setLayout] = useState<LogoLayout>('horizontal')
  const [mode, setMode] = useState<ColorMode>('duo')
  const [gradient, setGradient] = useState(false)
  const [color1, setColor1] = useState('#00545f')
  const [color2, setColor2] = useState('#ecfeb6')
  const [bg, setBg] = useState<string | null>(PAPER)
  const [size, setSize] = useState(0.72)

  const { w, h } = CANVAS[orientation]
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c2', paletteId, (next) => applyPalette(next))

  // Lockup box and fit inside the canvas
  const lw = layout === 'horizontal' ? LOCK_LONG : C2_VIEW
  const lh = layout === 'horizontal' ? C2_VIEW : LOCK_LONG
  const scale = size * Math.min(w / lw, h / lh)
  const renderW = lw * scale
  const renderH = lh * scale

  // Figure fills: solid colour, or palette-built gradients when "Degradado"
  // is on — radial for the circular glyphs, linear for the bars.
  const circleFill = gradient ? 'url(#c2logo-rad)' : color1
  const barsFill = gradient ? 'url(#c2logo-lin)' : color1
  // Single-colour mode: the counters (white parts in the source) disappear.
  const counterFill = mode === 'single' ? 'transparent' : color2

  // Negative version: swap the background with the logo's main colour.
  // A transparent background counts as paper, so the result always has a bg.
  const invert = () => {
    setBg(color1)
    setColor1(bg ?? PAPER)
  }

  // Switching palettes remaps the applied colours to the equivalent slot of
  // the new palette instead of just swapping the swatch pool.
  const applyPalette = (next: PaletteId) => {
    if (next === paletteId) return
    const from = getPalette(paletteId)
    const to = getPalette(next)
    setColor1(remapColor(color1, from, to))
    setColor2(remapColor(color2, from, to))
    setBg(autoBg(bg, from, to))
    setPaletteId(next)
  }

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextShades = Math.random() < 0.35
    const nextPool = nextShades ? paletteWithShades(pal) : pal.colors
    const nextMode: ColorMode = Math.random() < 0.35 ? 'single' : 'duo'
    const nextBg = Math.random() < 0.2 ? null : pick([PAPER, INK, ...nextPool])
    // only offer colours that actually read against the chosen background
    const c1 = pick(visiblePool(nextPool, nextBg))
    setPaletteId(pal.id)
    setShades(nextShades)
    setMode(nextMode)
    setGradient(Math.random() < 0.35)
    setBg(nextBg)
    setColor1(c1)
    setColor2(pickOther([PAPER, ...nextPool], c1))
    setLayout(Math.random() < 0.6 ? 'horizontal' : 'vertical')
    setSize(0.4 + Math.random() * 0.5)
    setRotation(Math.random() < 0.7 ? 0 : Math.round((Math.random() * 360 - 180) / 15) * 15)
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c2-logo.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c2-logo.png')
  }

  // Glyph positions inside the lockup viewBox
  const posC = { x: 0, y: 0 }
  const posF = layout === 'horizontal' ? { x: STEP, y: 0 } : { x: 0, y: STEP }
  const posO = layout === 'horizontal' ? { x: STEP * 2, y: 0 } : { x: 0, y: STEP * 2 }

  // Mockup fills: gradients live in a SEPARATE svg document from the stage,
  // so the strip carries its own defs with `-mk`-suffixed ids.
  const circleFillMk = gradient ? 'url(#c2logo-rad-mk)' : color1
  const barsFillMk = gradient ? 'url(#c2logo-lin-mk)' : color1

  return (
    <>
    <EditorShell
      orientation={orientation}
      onOrientationChange={setOrientation}
      rotation={rotation}
      onRotationChange={setRotation}
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
            <defs>
              {/* radial for the circular glyphs (C pie + O dial) */}
              <radialGradient id="c2logo-rad">
                <stop offset="0%" stopColor={color1} />
                <stop offset="100%" stopColor={color2} />
              </radialGradient>
              {/* linear for the bars — along each bar so every bar fades
                  towards its tip (objectBoundingBox keeps it robust across
                  the source rect matrices) */}
              <linearGradient id="c2logo-lin">
                <stop offset="0%" stopColor={color1} />
                <stop offset="100%" stopColor={color2} />
              </linearGradient>
            </defs>
            {bg && <rect x="0" y="0" width={w} height={h} fill={bg} />}
            <g transform={rotationTransform(rotation, w, h)}>
              <svg
                x={(w - renderW) / 2}
                y={(h - renderH) / 2}
                width={renderW}
                height={renderH}
                viewBox={`0 0 ${lw} ${lh}`}
                overflow="visible"
              >
                <C2GlyphC {...posC} width={C2_VIEW} height={C2_VIEW} darkFill={circleFill} counterFill={counterFill} />
                <C2GlyphF {...posF} width={C2_VIEW} height={C2_VIEW} darkFill={barsFill} counterFill={counterFill} />
                <C2GlyphO {...posO} width={C2_VIEW} height={C2_VIEW} darkFill={circleFill} />
              </svg>
            </g>
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

          <Panel label="Logo">
            <Seg
              options={[
                { value: 'horizontal' as const, label: 'Horizontal' },
                { value: 'vertical' as const, label: 'Vertical' },
              ]}
              value={layout}
              onChange={setLayout}
            />
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

          <Panel label="Color">
            <Seg
              options={[
                { value: 'duo' as const, label: 'Dos colores' },
                { value: 'single' as const, label: 'Un color' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <Check label="Degradado" checked={gradient} onChange={setGradient} />
            <div>
              <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Color 1 — formas
              </span>
              <Swatches colors={pickerPool} value={color1} onPick={setColor1} small />
            </div>
            {(mode === 'duo' || gradient) && (
              <div>
                <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  {mode === 'duo' ? 'Color 2 — contraformas' : 'Color 2 — degradado'}
                </span>
                <Swatches colors={pickerPool} value={color2} onPick={setColor2} small />
              </div>
            )}
            <div className="tc-btn-row">
              <button type="button" className="tc-btn" onClick={invert}>
                Invertir
              </button>
            </div>
          </Panel>

          <Panel label="Fondo">
            <Swatches colors={pickerPool} value={bg} onPick={setBg} small={shades} />
            <button type="button" className="tc-btn" onClick={() => setBg(null)} disabled={bg === null}>
              Transparente
            </button>
          </Panel>
        </>
      }
    />
    <LogoMockups
      patternKey="c2"
      bg={bg}
      aspect={lw / lh}
      renderLogo={(x, y, mockW, mockH) => (
        <svg x={x} y={y} width={mockW} height={mockH} viewBox={`0 0 ${lw} ${lh}`} overflow="visible">
          <defs>
            <radialGradient id="c2logo-rad-mk">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </radialGradient>
            <linearGradient id="c2logo-lin-mk">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
          <C2GlyphC {...posC} width={C2_VIEW} height={C2_VIEW} darkFill={circleFillMk} counterFill={counterFill} />
          <C2GlyphF {...posF} width={C2_VIEW} height={C2_VIEW} darkFill={barsFillMk} counterFill={counterFill} />
          <C2GlyphO {...posO} width={C2_VIEW} height={C2_VIEW} darkFill={circleFillMk} />
        </svg>
      )}
    />
    </>
  )
}
