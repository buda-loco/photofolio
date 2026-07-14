'use client'

/**
 * Concepto 04 — editor de logo.
 *
 * The sober CFO wordmark (TUS nested in the C's counter) coloured with a
 * single colour, a duo (TUS vs CFO) or letter by letter. Deliberately the
 * quietest editor of the four: the default is ink on paper — the colour
 * play lives in "Sorprendeme" and in the flow generator, not in the mark.
 * Exports the exact frame as SVG or Full HD PNG.
 */

import { useRef, useState } from 'react'
import EditorShell, { CANVAS, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import {
  PALETTES,
  getPalette,
  paletteWithShades,
  visiblePool,
  remapColor,
  autoBg,
  type PaletteId,
} from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { getCleanExportSVGString, downloadSVG, downloadPNG } from '../exportUtils'
import { pick } from '../rand'
import { C4Mark, C4_PART_IDS, C4_VIEW_W, C4_VIEW_H, type C4PartId } from './geometry'
import LogoMockups from '../LogoMockups'

const INK = '#000000'
const PAPER = '#ffffff'

const PART_NAMES: Record<C4PartId, string> = {
  tus: 'TUS',
  c: 'Letra C',
  f: 'Letra F',
  o: 'Letra O',
}

type ColorMode = 'uno' | 'duo' | 'per'

export default function C4LogoEditor() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('uno')
  const [uniColor, setUniColor] = useState(INK)
  const [duoColors, setDuoColors] = useState({ tus: INK, cfo: INK })
  const [perColors, setPerColors] = useState<Record<C4PartId, string>>(() => ({
    tus: INK,
    c: INK,
    f: INK,
    o: INK,
  }))
  const [bg, setBg] = useState<string | null>(PAPER)
  const [size, setSize] = useState(0.7)

  const { w, h } = CANVAS[orientation]
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c4', paletteId, (next) => applyPalette(next))

  /** Effective fill of each part, whatever the current mode. */
  const fills: Record<C4PartId, string> =
    colorMode === 'uno'
      ? { tus: uniColor, c: uniColor, f: uniColor, o: uniColor }
      : colorMode === 'duo'
        ? { tus: duoColors.tus, c: duoColors.cfo, f: duoColors.cfo, o: duoColors.cfo }
        : perColors

  // The mark is very wide (1333 × 441): fit both dimensions inside the
  // canvas (same lockup math as C2) and centre it.
  const scale = size * Math.min(w / C4_VIEW_W, h / C4_VIEW_H)
  const mw = C4_VIEW_W * scale
  const mh = C4_VIEW_H * scale

  /** Seed the next mode's state from the current effective fills so nothing jumps. */
  const changeColorMode = (next: ColorMode) => {
    if (next === colorMode) return
    if (next === 'uno') setUniColor(fills.c)
    else if (next === 'duo') setDuoColors({ tus: fills.tus, cfo: fills.c })
    else setPerColors({ ...fills })
    setColorMode(next)
  }

  // Negative version: swap the background with the mark's dominant colour
  // (the big CFO letters). A transparent background counts as paper, so the
  // result always has a bg — same convention as C1/C2.
  const invert = () => {
    const dominant = fills.c
    const nextFill = bg ?? PAPER
    const swap = (c: string) => (c === dominant ? nextFill : c)
    setBg(dominant)
    if (colorMode === 'uno') setUniColor(swap(uniColor))
    else if (colorMode === 'duo')
      setDuoColors((d) => ({ tus: swap(d.tus), cfo: swap(d.cfo) }))
    else
      setPerColors(
        (p) =>
          Object.fromEntries(C4_PART_IDS.map((id) => [id, swap(p[id])])) as Record<
            C4PartId,
            string
          >,
      )
  }

  // Switching palettes remaps the applied colours to the equivalent slot of
  // the new palette instead of just swapping the swatch pool.
  const applyPalette = (next: PaletteId) => {
    if (next === paletteId) return
    const from = getPalette(paletteId)
    const to = getPalette(next)
    const re = (c: string) => remapColor(c, from, to)
    setPaletteId(next)
    setUniColor(re(uniColor))
    setDuoColors((d) => ({ tus: re(d.tus), cfo: re(d.cfo) }))
    setPerColors(
      (p) =>
        Object.fromEntries(C4_PART_IDS.map((id) => [id, re(p[id])])) as Record<C4PartId, string>,
    )
    setBg((b) => autoBg(b, from, to))
  }

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextShades = Math.random() < 0.35
    const nextPool = nextShades ? paletteWithShades(pal) : pal.colors
    const nextMode: ColorMode = pick(['uno', 'uno', 'duo', 'per'] as ColorMode[])
    const nextBg = Math.random() < 0.2 ? null : pick([PAPER, INK, ...nextPool])
    // only offer colours that actually read against the chosen background
    const vis = visiblePool([INK, ...nextPool], nextBg)
    setPaletteId(pal.id)
    setShades(nextShades)
    setColorMode(nextMode)
    setBg(nextBg)
    setUniColor(pick(vis))
    setDuoColors({ tus: pick(vis), cfo: pick(vis) })
    setPerColors(
      Object.fromEntries(C4_PART_IDS.map((id) => [id, pick(vis)])) as Record<C4PartId, string>,
    )
    setSize(0.4 + Math.random() * 0.5)
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c4-logo.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c4-logo.png')
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
              x={(w - mw) / 2}
              y={(h - mh) / 2}
              width={mw}
              height={mh}
              viewBox={`0 0 ${C4_VIEW_W} ${C4_VIEW_H}`}
            >
              <C4Mark colors={fills} />
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
                { value: 'uno' as const, label: 'Único' },
                { value: 'duo' as const, label: 'Dúo' },
                { value: 'per' as const, label: 'Por letra' },
              ]}
              value={colorMode}
              onChange={changeColorMode}
            />
            {colorMode === 'uno' ? (
              <Swatches colors={pickerPool} value={uniColor} onPick={setUniColor} small={shades} />
            ) : colorMode === 'duo' ? (
              <>
                <div>
                  <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                    TUS
                  </span>
                  <Swatches
                    colors={pickerPool}
                    value={duoColors.tus}
                    onPick={(c) => setDuoColors((prev) => ({ ...prev, tus: c }))}
                    small
                  />
                </div>
                <div>
                  <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                    C · F · O
                  </span>
                  <Swatches
                    colors={pickerPool}
                    value={duoColors.cfo}
                    onPick={(c) => setDuoColors((prev) => ({ ...prev, cfo: c }))}
                    small
                  />
                </div>
              </>
            ) : (
              C4_PART_IDS.map((id) => (
                <div key={id}>
                  <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                    {PART_NAMES[id]}
                  </span>
                  <Swatches
                    colors={pickerPool}
                    value={perColors[id]}
                    onPick={(c) => setPerColors((prev) => ({ ...prev, [id]: c }))}
                    small
                  />
                </div>
              ))
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
      patternKey="c4"
      bg={bg}
      aspect={C4_VIEW_W / C4_VIEW_H}
      renderLogo={(x, y, mockW, mockH) => (
        <svg x={x} y={y} width={mockW} height={mockH} viewBox={`0 0 ${C4_VIEW_W} ${C4_VIEW_H}`}>
          <C4Mark colors={fills} />
        </svg>
      )}
    />
    </>
  )
}
