'use client'

/**
 * Concepto 02 — generador de patrones.
 *
 * The three graph-glyphs (pie, bars, dial) scattered on a square grid —
 * random glyph and colour per cell, optional gaps, uniform or quadtree-
 * varied tile sizes (non-overlapping, via buildTiles), and a subtle living
 * animation: the pie spins slowly, the bars breathe, the dial pulses while
 * counter-rotating. Same seed model as Concepto 01: palette and slider
 * changes re-dress the arrangement; "Generar" is a new seed.
 *
 * The animation is pure CSS inside an export-excluded <style>, so SVG/PNG
 * exports are always the static frame defined by the markup.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import EditorShell, { CANVAS, rotationTransform, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import { PALETTES, getPalette, paletteWithShades, remapColor, autoBg, type PaletteId} from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { EXPORT_EXCLUDE_CLASS, getCleanExportSVGString, downloadSVG, downloadPNG } from '../exportUtils'
import { usePublishPattern } from '../patternPreview'
import { pick, seededRand, newSeed } from '../rand'
import { buildTiles, type Tile } from '../tiles'
import { C2_ANIM_CLASS, C2_ANIM_DUR, C2_GLYPHS } from './geometry'

const INK = '#000000'
const PAPER = '#ffffff'

type SizeMode = 'uniform' | 'varied'
type CounterMode = 'paper' | 'transparent'

/** A quadtree tile plus its seeded per-tile dressing. */
interface DressedTile extends Tile {
  glyph: number // 0 C / 1 F / 2 O
  c: number // 0..1 → colour pool index
  gap: number // 0..1 → empty when < gap probability
  phase: number // 0..1 → animation phase offset
  rot: number // 0..1 → 90°-step rotation (bars only)
}

export default function C2PatternGenerator() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [rotation, setRotation] = useState(0)
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [counterMode, setCounterMode] = useState<CounterMode>('paper')
  const [bg, setBg] = useState<string | null>(INK)
  const [cols, setCols] = useState(6)
  const [air, setAir] = useState(0.12)
  const [sizeMode, setSizeMode] = useState<SizeMode>('uniform')
  const [gaps, setGaps] = useState(false)
  const [gapProb, setGapProb] = useState(0.2)
  const [animate, setAnimate] = useState(true)
  // Hydration-safe seeding: SSR and first client render share a fixed seed;
  // a fresh one lands right after mount so every visit still opens with a
  // brand-new pattern.
  const [seed, setSeed] = useState(20260714)
  useEffect(() => {
    setSeed(newSeed())
  }, [])

  const { w, h } = CANVAS[orientation]
  usePublishPattern('c2', svgRef, w, h)
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c2', paletteId, (next) => applyPalette(next))

  const cs = w / cols
  const rows = Math.ceil(h / cs)

  // When the canvas rotates we oversize the grid so corners never show paper.
  const bleed = rotation !== 0 ? Math.ceil((Math.max(w, h) * 0.25) / cs) : 0

  // Non-overlapping tiles over the bleed-extended grid, each dressed with
  // glyph / colour / gap / animation phase from the same seeded stream —
  // "Generar patrón" re-rolls everything, slider changes stay stable.
  // Uniform mode is a plain 1× grid; varied mode is the quadtree tiling.
  const tiles: DressedTile[] = useMemo(() => {
    const rnd = seededRand(seed)
    const gCols = cols + bleed * 2
    const gRows = rows + bleed * 2
    const base: Tile[] =
      sizeMode === 'varied'
        ? buildTiles(gCols, gRows, rnd)
        : Array.from({ length: gCols * gRows }, (_, i) => ({
            x: i % gCols,
            y: Math.floor(i / gCols),
            s: 1,
          }))
    return base.map((t) => ({
      ...t,
      glyph: Math.floor(rnd() * 3),
      c: rnd(),
      gap: rnd(),
      phase: rnd(),
      rot: rnd(),
    }))
  }, [seed, cols, rows, bleed, sizeMode])

  const tileColor = (c: number): string => {
    let color = pool[Math.floor(c * pool.length) % pool.length]
    // never let an element vanish into the background
    if (color === bg) color = pool[(Math.floor(c * pool.length) + 1) % pool.length]
    return color
  }

  const counterFill = counterMode === 'paper' ? PAPER : 'transparent'

  // Switching palettes remaps the stored background to the equivalent slot
  // of the new palette; per-tile colours are derived from the pool at render
  // time, so they follow automatically.
  const applyPalette = (next: PaletteId) => {
    if (next === paletteId) return
    setBg(autoBg(bg, palette, getPalette(next)))
    setPaletteId(next)
  }

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextShades = Math.random() < 0.4
    const nextPool = nextShades ? paletteWithShades(pal) : pal.colors
    const nextGaps = Math.random() < 0.45
    setPaletteId(pal.id)
    setShades(nextShades)
    setCounterMode(Math.random() < 0.5 ? 'paper' : 'transparent')
    setBg(Math.random() < 0.15 ? null : pick([PAPER, INK, ...nextPool]))
    setCols(4 + Math.floor(Math.random() * 8))
    setAir(Math.random() < 0.4 ? 0.08 : Math.random() * 0.35)
    setSizeMode(Math.random() < 0.5 ? 'uniform' : 'varied')
    setGaps(nextGaps)
    if (nextGaps) setGapProb(0.1 + Math.random() * 0.35)
    setRotation(Math.random() < 0.75 ? 0 : pick([-45, -30, 30, 45]))
    setSeed(newSeed())
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c2-patron.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c2-patron.png')
  }

  return (
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
            {/* Keyframes for the living pattern — excluded from exports, so
                downloaded SVG/PNG are always the static frame. */}
            {animate && (
              <style className={EXPORT_EXCLUDE_CLASS}>{`
                .${C2_ANIM_CLASS.c} {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: c2p-spin ${C2_ANIM_DUR.c}s linear infinite;
                }
                .${C2_ANIM_CLASS.bar} {
                  transform-box: fill-box;
                  transform-origin: center bottom;
                  animation: c2p-grow ${C2_ANIM_DUR.bar}s ease-in-out infinite alternate;
                }
                /* O: outer group counter-rotates (opposite to the C, slower),
                   inner group keeps the subtle size pulse */
                .${C2_ANIM_CLASS.oSpin} {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: c2p-spin ${C2_ANIM_DUR.oSpin}s linear infinite reverse;
                }
                .${C2_ANIM_CLASS.o} {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: c2p-pulse ${C2_ANIM_DUR.o}s ease-in-out infinite alternate;
                }
                @keyframes c2p-spin { to { transform: rotate(360deg); } }
                @keyframes c2p-grow { from { transform: scaleY(0.85); } to { transform: scaleY(1.15); } }
                @keyframes c2p-pulse { from { transform: scale(0.9); } to { transform: scale(1.1); } }
              `}</style>
            )}
            {bg && <rect x="0" y="0" width={w} height={h} fill={bg} />}
            <g transform={rotationTransform(rotation, w, h)}>
              {tiles.map((tile) => {
                if (gaps && tile.gap < gapProb) return null
                const Glyph = C2_GLYPHS[tile.glyph]
                // tile box in canvas units, offset back by the bleed margin
                const box = tile.s * cs
                const gs = box * (1 - air)
                const cx = (tile.x - bleed) * cs + box / 2
                const cy = (tile.y - bleed) * cs + box / 2
                const isBars = tile.glyph === 1
                // the bar chart drops its counter square and spins in
                // quarter turns — the other glyphs keep their reading
                const turns = isBars ? Math.floor(tile.rot * 4) * 90 : 0
                return (
                  <g
                    key={`${tile.x}-${tile.y}`}
                    transform={turns ? `rotate(${turns} ${cx} ${cy})` : undefined}
                  >
                    <Glyph
                      x={cx - gs / 2}
                      y={cy - gs / 2}
                      width={gs}
                      height={gs}
                      darkFill={tileColor(tile.c)}
                      counterFill={isBars ? 'transparent' : counterFill}
                      animate={animate}
                      animPhase={tile.phase}
                    />
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      }
      panels={
        <>
          <Panel label="Patrón">
            <button type="button" className="tc-btn tc-btn--primary" onClick={() => setSeed(newSeed())}>
              Generar patrón
            </button>
            <SliderRow
              label="Densidad"
              min={3}
              max={14}
              value={cols}
              onChange={setCols}
              format={(v) => `${v}×`}
            />
            <SliderRow
              label="Aire entre celdas"
              min={0}
              max={0.4}
              step={0.01}
              value={air}
              onChange={setAir}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Panel>

          <Panel label="Celdas">
            <Seg
              options={[
                { value: 'uniform' as const, label: 'Uniforme' },
                { value: 'varied' as const, label: 'Variado' },
              ]}
              value={sizeMode}
              onChange={setSizeMode}
            />
            <Check label="Huecos" checked={gaps} onChange={setGaps} />
            {gaps && (
              <SliderRow
                label="Probabilidad de hueco"
                min={0.05}
                max={0.7}
                step={0.01}
                value={gapProb}
                onChange={setGapProb}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            )}
            <Check label="Animar" checked={animate} onChange={setAnimate} />
          </Panel>

          <Panel label="Paleta">
            <Seg
              options={PALETTES.map((p) => ({ value: p.id, label: p.id }))}
              value={paletteId}
              onChange={applyPalette}
            />
            <Check label="Jugar con tonos" checked={shades} onChange={setShades} />
            <div>
              <span className="tc-panel-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Contraforma
              </span>
              <Seg
                options={[
                  { value: 'paper' as const, label: 'Papel' },
                  { value: 'transparent' as const, label: 'Transparente' },
                ]}
                value={counterMode}
                onChange={setCounterMode}
              />
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
  )
}
