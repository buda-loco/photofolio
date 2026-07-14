'use client'

/**
 * Concepto 03 — editor de logo.
 *
 * The four spreadsheet cells of the lockup, arranged stacked (the
 * original), in a single row, or as a single same-width column,
 * coloured either with an automatic shade progression from one palette
 * colour (colour progression is the point of this concept), a
 * two-colour duo (TUS vs C/F/O), or cell by cell, with optional linear
 * gradients per cell. Letters mirror the same separation: one colour,
 * a duo, or per cell. Exports the exact frame as SVG or PNG.
 */

import { useRef, useState } from 'react'
import EditorShell, { CANVAS, rotationTransform, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import {
  PALETTES,
  getPalette,
  paletteWithShades,
  shadesOf,
  contrastRatio,
  remapColor,
  autoBg,
  type PaletteId,
} from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { getCleanExportSVGString, downloadSVG, downloadPNG } from '../exportUtils'
import { pick, pickOther } from '../rand'
import { C3Cell, C3_CELL_IDS, c3Layout, type C3CellId, type C3LayoutMode } from './geometry'
import LogoMockups from '../LogoMockups'

const INK = '#000000'
const PAPER = '#ffffff'

const CELL_NAMES: Record<C3CellId, string> = {
  tus: 'Celda TUS',
  c: 'Celda C',
  f: 'Celda F',
  o: 'Celda O',
}

const LETTER_NAMES: Record<C3CellId, string> = {
  tus: 'Letras TUS',
  c: 'Letra C',
  f: 'Letra F',
  o: 'Letra O',
}

type ColorMode = 'shades' | 'duo' | 'per'
type LetterMode = 'uno' | 'duo' | 'per'

/** TUS darkest → C → F → O progressively brighter, centred on the base. */
function progressionOf(base: string): Record<C3CellId, string> {
  const s = shadesOf(base) // brightest → darkest
  return { tus: s[5], c: s[4], f: s[3], o: s[2] }
}

export default function C3LogoEditor() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [rotation, setRotation] = useState(0)
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [layout, setLayout] = useState<C3LayoutMode>('stack')
  const [colorMode, setColorMode] = useState<ColorMode>('shades')
  const [base, setBase] = useState('#00545f')
  const [duoColors, setDuoColors] = useState({ tus: '#00545f', rest: '#d6fb00' })
  const [perColors, setPerColors] = useState<Record<C3CellId, string>>(() =>
    progressionOf('#00545f'),
  )
  const [letterMode, setLetterMode] = useState<LetterMode>('uno')
  const [letterFill, setLetterFill] = useState(PAPER)
  const [letterDuo, setLetterDuo] = useState({ tus: PAPER, rest: PAPER })
  const [letterColors, setLetterColors] = useState<Record<C3CellId, string>>(() => ({
    tus: PAPER,
    c: PAPER,
    f: PAPER,
    o: PAPER,
  }))
  const [gradient, setGradient] = useState(false)
  const [bg, setBg] = useState<string | null>(PAPER)
  const [size, setSize] = useState(0.62)

  const { w, h } = CANVAS[orientation]
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c3', paletteId, (next) => applyPalette(next))

  const cellColors: Record<C3CellId, string> =
    colorMode === 'shades'
      ? progressionOf(base)
      : colorMode === 'duo'
        ? { tus: duoColors.tus, c: duoColors.rest, f: duoColors.rest, o: duoColors.rest }
        : perColors

  const letterFills: Record<C3CellId, string> =
    letterMode === 'per'
      ? letterColors
      : letterMode === 'duo'
        ? { tus: letterDuo.tus, c: letterDuo.rest, f: letterDuo.rest, o: letterDuo.rest }
        : { tus: letterFill, c: letterFill, f: letterFill, o: letterFill }

  const view = c3Layout(layout)
  const scale = size * Math.min(w / view.w, h / view.h)
  const mw = view.w * scale
  const mh = view.h * scale

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextShades = Math.random() < 0.4
    const nextPool = nextShades ? paletteWithShades(pal) : pal.colors
    const nextMode: ColorMode = pick(['shades', 'shades', 'duo', 'per'] as ColorMode[])
    const nextBg = Math.random() < 0.2 ? null : pick([PAPER, INK, ...nextPool])
    const nextBase = pickOther(nextPool, nextBg ?? '')
    const nextDuo = {
      tus: pickOther(nextPool, nextBg ?? ''),
      rest: pickOther(nextPool, nextBg ?? ''),
    }
    const nextPer = Object.fromEntries(
      C3_CELL_IDS.map((id) => [id, pickOther(nextPool, nextBg ?? '')]),
    ) as Record<C3CellId, string>
    // keep the letters readable against the darkest cell they'll sit on
    const repr =
      nextMode === 'shades'
        ? progressionOf(nextBase).tus
        : nextMode === 'duo'
          ? nextDuo.tus
          : nextPer.tus
    const nextLetter = contrastRatio(PAPER, repr) >= 2 ? PAPER : INK
    setPaletteId(pal.id)
    setShades(nextShades)
    setColorMode(nextMode)
    setLayout(pick(['stack', 'row', 'column'] as C3LayoutMode[]))
    setGradient(Math.random() < 0.35)
    setBg(nextBg)
    setBase(nextBase)
    setDuoColors(nextDuo)
    setPerColors(nextPer)
    setLetterMode('uno')
    setLetterFill(nextLetter)
    setLetterDuo({ tus: nextLetter, rest: nextLetter })
    setLetterColors({ tus: nextLetter, c: nextLetter, f: nextLetter, o: nextLetter })
    setSize(0.35 + Math.random() * 0.5)
    setRotation(Math.random() < 0.7 ? 0 : Math.round((Math.random() * 360 - 180) / 15) * 15)
  }

  /**
   * Switching palettes re-dresses the design instantly: every applied
   * colour is remapped to the equivalent slot of the new palette
   * (neutrals like paper/ink pass through untouched).
   */
  const applyPalette = (next: PaletteId) => {
    if (next === paletteId) return
    const from = getPalette(paletteId)
    const to = getPalette(next)
    const re = (c: string) => remapColor(c, from, to)
    const reRecord = (rec: Record<C3CellId, string>) =>
      Object.fromEntries(C3_CELL_IDS.map((id) => [id, re(rec[id])])) as Record<C3CellId, string>
    setPaletteId(next)
    setBase(re(base))
    setDuoColors((d) => ({ tus: re(d.tus), rest: re(d.rest) }))
    setPerColors(reRecord)
    setLetterFill(re(letterFill))
    setLetterDuo((d) => ({ tus: re(d.tus), rest: re(d.rest) }))
    setLetterColors(reRecord)
    setBg((b) => autoBg(b, from, to))
  }

  /**
   * Negative version: swap each cell's fill with its letter fill. The
   * current *effective* fills are frozen first, so it works identically
   * from every colour/letter mode — cells land in "Por celda" with the
   * swapped values, and the letters land in the simplest mode that can
   * express the old cell fills (único → dúo → por celda).
   */
  const invert = () => {
    const fills = { ...cellColors }
    const letters = { ...letterFills }
    setColorMode('per')
    setPerColors(letters)
    const uniform = C3_CELL_IDS.every((id) => fills[id] === fills.tus)
    const duoLike = fills.c === fills.f && fills.f === fills.o
    if (uniform) {
      setLetterMode('uno')
      setLetterFill(fills.tus)
    } else if (duoLike) {
      setLetterMode('duo')
      setLetterDuo({ tus: fills.tus, rest: fills.c })
    } else {
      setLetterMode('per')
      setLetterColors(fills)
    }
  }

  /** Seed the next mode's state from the current effective fills so nothing jumps. */
  const changeLetterMode = (next: LetterMode) => {
    if (next === letterMode) return
    if (next === 'uno') setLetterFill(letterFills.tus)
    else if (next === 'duo') setLetterDuo({ tus: letterFills.tus, rest: letterFills.c })
    else setLetterColors({ ...letterFills })
    setLetterMode(next)
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c3-logo.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c3-logo.png')
  }

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
            {gradient && (
              <defs>
                {C3_CELL_IDS.map((id) => (
                  <linearGradient key={id} id={`c3lg-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cellColors[id]} />
                    <stop offset="100%" stopColor={shadesOf(cellColors[id])[5]} />
                  </linearGradient>
                ))}
              </defs>
            )}
            {bg && <rect x="0" y="0" width={w} height={h} fill={bg} />}
            <g transform={rotationTransform(rotation, w, h)}>
              <svg
                x={(w - mw) / 2}
                y={(h - mh) / 2}
                width={mw}
                height={mh}
                viewBox={`0 0 ${view.w} ${view.h}`}
              >
                {view.cells.map((pc) => (
                  <C3Cell
                    key={pc.id}
                    id={pc.id}
                    x={pc.x}
                    y={pc.y}
                    width={pc.w}
                    height={pc.h}
                    cellFill={gradient ? `url(#c3lg-${pc.id})` : cellColors[pc.id]}
                    letterFill={letterFills[pc.id]}
                  />
                ))}
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

          <Panel label="Disposición">
            <Seg
              options={[
                { value: 'row' as const, label: 'Horizontal' },
                { value: 'stack' as const, label: 'Apilado' },
                { value: 'column' as const, label: 'Vertical' },
              ]}
              value={layout}
              onChange={setLayout}
            />
          </Panel>

          <Panel label="Color">
            <Seg
              options={[
                { value: 'shades' as const, label: 'Tonos' },
                { value: 'duo' as const, label: 'Dúo' },
                { value: 'per' as const, label: 'Por celda' },
              ]}
              value={colorMode}
              onChange={setColorMode}
            />
            {colorMode === 'shades' ? (
              <Swatches colors={pickerPool} value={base} onPick={setBase} small={shades} />
            ) : colorMode === 'duo' ? (
              <>
                <div>
                  <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                    Celda TUS
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
                    Celdas C · F · O
                  </span>
                  <Swatches
                    colors={pickerPool}
                    value={duoColors.rest}
                    onPick={(c) => setDuoColors((prev) => ({ ...prev, rest: c }))}
                    small
                  />
                </div>
              </>
            ) : (
              C3_CELL_IDS.map((id) => (
                <div key={id}>
                  <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                    {CELL_NAMES[id]}
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
            <Check label="Degradado" checked={gradient} onChange={setGradient} />
            <div>
              <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Letras
              </span>
              <Seg
                options={[
                  { value: 'uno' as const, label: 'Único' },
                  { value: 'duo' as const, label: 'Dúo' },
                  { value: 'per' as const, label: 'Por celda' },
                ]}
                value={letterMode}
                onChange={changeLetterMode}
              />
              {letterMode === 'uno' ? (
                <Swatches colors={pickerPool} value={letterFill} onPick={setLetterFill} small />
              ) : letterMode === 'duo' ? (
                <>
                  <div>
                    <span className="tc-panel-label" style={{ display: 'block', margin: '0.3rem 0' }}>
                      Letras TUS
                    </span>
                    <Swatches
                      colors={pickerPool}
                      value={letterDuo.tus}
                      onPick={(c) => setLetterDuo((prev) => ({ ...prev, tus: c }))}
                      small
                    />
                  </div>
                  <div>
                    <span className="tc-panel-label" style={{ display: 'block', margin: '0.3rem 0' }}>
                      Letras C · F · O
                    </span>
                    <Swatches
                      colors={pickerPool}
                      value={letterDuo.rest}
                      onPick={(c) => setLetterDuo((prev) => ({ ...prev, rest: c }))}
                      small
                    />
                  </div>
                </>
              ) : (
                C3_CELL_IDS.map((id) => (
                  <div key={id}>
                    <span className="tc-panel-label" style={{ display: 'block', margin: '0.3rem 0' }}>
                      {LETTER_NAMES[id]}
                    </span>
                    <Swatches
                      colors={pickerPool}
                      value={letterColors[id]}
                      onPick={(c) => setLetterColors((prev) => ({ ...prev, [id]: c }))}
                      small
                    />
                  </div>
                ))
              )}
            </div>
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
      patternKey="c3"
      bg={bg}
      aspect={view.w / view.h}
      renderLogo={(x, y, mockW, mockH) => (
        <svg x={x} y={y} width={mockW} height={mockH} viewBox={`0 0 ${view.w} ${view.h}`}>
          {/* The mockups render in separate svg documents from the stage, so
              the gradient defs are duplicated here with `-mk` ids. */}
          {gradient && (
            <defs>
              {C3_CELL_IDS.map((id) => (
                <linearGradient key={id} id={`c3lg-${id}-mk`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cellColors[id]} />
                  <stop offset="100%" stopColor={shadesOf(cellColors[id])[5]} />
                </linearGradient>
              ))}
            </defs>
          )}
          {view.cells.map((pc) => (
            <C3Cell
              key={pc.id}
              id={pc.id}
              x={pc.x}
              y={pc.y}
              width={pc.w}
              height={pc.h}
              cellFill={gradient ? `url(#c3lg-${pc.id}-mk)` : cellColors[pc.id]}
              letterFill={letterFills[pc.id]}
            />
          ))}
        </svg>
      )}
    />
    </>
  )
}
