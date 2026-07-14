'use client'

/**
 * Concepto 01 — generador de patrones.
 *
 * The monogram's component shapes arranged on a grid, randomising
 * rotation (90° steps) and colour per cell. Sizes can vary via an
 * orderly quadtree tiling (never overlapping), rows/columns can be
 * offset brick-style, and the monochrome mode can dress cells in
 * random shades of one colour. The seed model means palette and
 * slider changes re-dress the same arrangement instead of scrambling
 * it; "Generar" is just a new seed.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import EditorShell, { CANVAS, rotationTransform, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import {
  PALETTES,
  getPalette,
  paletteWithShades,
  remapColor,
  autoBg,
  shadesOf,
  contrastRatio,
  visiblePool,
  type PaletteId,
} from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { getCleanExportSVGString, downloadSVG, downloadPNG } from '../exportUtils'
import { usePublishPattern } from '../patternPreview'
import { pick, seededRand, newSeed } from '../rand'
import { buildTiles, type Tile } from '../tiles'
import { C1_PARTS, C1_VIEW, C1_BBOXES, rotatedBBox } from './geometry'

const INK = '#000000'
const PAPER = '#ffffff'

type ColorMode = 'mono' | 'multi'
type SizeMode = 'uniform' | 'varied'
type OffsetMode = 'none' | 'rows' | 'cols'
type ConnectMode = 'none' | 'horizontal' | 'vertical'

interface Cell extends Tile {
  shape: number // index into C1_PARTS (ring kept rare)
  rot: number // 0..3 quarter turns
  c: number // 0..1 → colour pool index
}

export default function C1PatternGenerator() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [rotation, setRotation] = useState(0)
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('multi')
  const [mono, setMono] = useState('#00545f')
  const [monoShades, setMonoShades] = useState(false)
  const [shadeOffset, setShadeOffset] = useState(0.37)
  const [bg, setBg] = useState<string | null>('#000000')
  const [cols, setCols] = useState(7)
  const [air, setAir] = useState(0.08)
  const [sizeMode, setSizeMode] = useState<SizeMode>('uniform')
  const [offsetMode, setOffsetMode] = useState<OffsetMode>('none')
  const [offsetAmt, setOffsetAmt] = useState(0.5)
  const [connect, setConnect] = useState<ConnectMode>('none')
  // Which brand parts participate in the pattern (all on by default).
  const [enabledParts, setEnabledParts] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(C1_PARTS.map((p) => [p.id, true])),
  )
  // Hydration-safe seeding: SSR and first client render share a fixed seed;
  // a fresh one lands right after mount so every visit still opens with a
  // brand-new pattern.
  const [seed, setSeed] = useState(20260714)
  useEffect(() => {
    setSeed(newSeed())
  }, [])

  const { w, h } = CANVAS[orientation]
  usePublishPattern('c1', svgRef, w, h)
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c1', paletteId, (next) => applyPalette(next))

  const cs = w / cols
  const rows = Math.ceil(h / cs)
  // Constant over-generation margin: covers canvas rotation and row/column
  // offsets without the layout re-rolling when those controls move.
  const bleed = Math.ceil(Math.max(cols, rows) * 0.25)

  // Stable key so toggling parts re-derives shapes without re-rolling layout.
  const enabledKey = C1_PARTS.map((p) => (enabledParts[p.id] ? 1 : 0)).join('')

  // Chains and brick offsets only make sense on the uniform grid.
  const effConnect: ConnectMode = sizeMode === 'uniform' ? connect : 'none'

  const cells: Cell[] = useMemo(() => {
    const rnd = seededRand(seed)
    const totalCols = cols + bleed * 2
    const totalRows = rows + bleed * 2
    const tiles: Tile[] =
      sizeMode === 'varied'
        ? buildTiles(totalCols, totalRows, rnd)
        : Array.from({ length: totalCols * totalRows }, (_, i) => ({
            x: i % totalCols,
            y: Math.floor(i / totalCols),
            s: 1,
          }))
    const enabledIdx = C1_PARTS.map((_, i) => i).filter((i) => enabledParts[C1_PARTS[i].id])
    // Single-float shape pick keeps the rnd stream aligned no matter which
    // parts are on, so toggles re-dress the same arrangement. shape -1 = skip.
    const pickShape = (f: number): number => {
      if (!enabledIdx.length) return -1
      const rest = enabledIdx.filter((i) => i !== 0)
      // the ring reads heavy — keep it rare when other parts are available
      if (enabledIdx.includes(0) && rest.length) {
        return f < 0.1 ? 0 : rest[Math.floor(((f - 0.1) / 0.9) * rest.length) % rest.length]
      }
      return enabledIdx[Math.floor(f * enabledIdx.length) % enabledIdx.length]
    }
    // Connected mode: one shape + one rotation per row (or column), so the
    // touching pieces read as continuous chains instead of confetti. Only
    // the pieces whose tips can land on the chain axis participate: the
    // ring chains as beads, the two arcs as waves — their rotation is
    // constrained so both endpoints sit on the touching edge.
    const rnd2 = seededRand(seed ^ 0x5f3759df)
    // Only the ring (beads) and the right arc (waves) have tips that land on
    // the touching edge — the lower arc's endpoints sit at different heights
    // so it can't chain; it stays available in "Suelto".
    const chainPoolAll = [0, 1].filter((i) => enabledIdx.includes(i))
    const chainPool = chainPoolAll.length ? chainPoolAll : [1]
    const chainTrait = (axis: 'h' | 'v') => {
      const f1 = rnd2()
      const f2 = rnd2()
      const shape = chainPool.includes(0) && chainPool.includes(1) ? (f1 < 0.2 ? 0 : 1) : chainPool[0]
      // arc's tips sit on its bbox's vertical side → quarter-turn for chains
      const rot =
        shape === 0
          ? Math.floor(f2 * 4)
          : axis === 'h'
            ? [1, 3][Math.floor(f2 * 2) % 2]
            : [0, 2][Math.floor(f2 * 2) % 2]
      return { shape, rot }
    }
    const rowTraits = Array.from({ length: totalRows }, () => chainTrait('h'))
    const colTraits = Array.from({ length: totalCols }, () => chainTrait('v'))
    return tiles.map((t) => {
      const own = { shape: pickShape(rnd()), rot: Math.floor(rnd() * 4), c: rnd() }
      if (effConnect === 'horizontal') {
        const tr = rowTraits[t.y] ?? own
        return { ...t, ...own, shape: tr.shape, rot: tr.rot }
      }
      if (effConnect === 'vertical') {
        const tr = colTraits[t.x] ?? own
        return { ...t, ...own, shape: tr.shape, rot: tr.rot }
      }
      return { ...t, ...own }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, cols, rows, bleed, sizeMode, enabledKey, effConnect])

  const cellColor = (cell: Cell): string => {
    if (colorMode === 'mono') {
      if (!monoShades) return mono
      // drop shades that wouldn't read against the background
      const monoPool = visiblePool(shadesOf(mono), bg, 1.5)
      return monoPool[Math.floor(((cell.c + shadeOffset) % 1) * monoPool.length)]
    }
    let idx = Math.floor(cell.c * pool.length) % pool.length
    let color = pool[idx]
    // never let an element vanish into the background — step through the
    // pool until the piece actually reads (not just "isn't identical")
    if (bg) {
      for (let step = 0; step < pool.length && contrastRatio(color, bg) < 1.5; step++) {
        idx = (idx + 1) % pool.length
        color = pool[idx]
      }
    }
    return color
  }

  /** Palette click re-dresses the current design, not just the swatch pool. */
  const applyPalette = (next: PaletteId) => {
    const from = getPalette(paletteId)
    const to = getPalette(next)
    setPaletteId(next)
    setMono((c) => remapColor(c, from, to))
    setBg((b) => autoBg(b, from, to))
  }

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextShades = Math.random() < 0.4
    const nextPool = nextShades ? paletteWithShades(pal) : pal.colors
    const nextMode: ColorMode = Math.random() < 0.3 ? 'mono' : 'multi'
    setPaletteId(pal.id)
    setShades(nextShades)
    setColorMode(nextMode)
    setMono(pick(nextPool))
    setMonoShades(Math.random() < 0.5)
    setShadeOffset(Math.random())
    setBg(Math.random() < 0.15 ? null : pick([PAPER, INK, ...nextPool]))
    setCols(4 + Math.floor(Math.random() * 9))
    setAir(Math.random() < 0.5 ? 0 : Math.random() * 0.3)
    setSizeMode(Math.random() < 0.45 ? 'varied' : 'uniform')
    setConnect(Math.random() < 0.7 ? 'none' : pick(['horizontal', 'vertical'] as const))
    setOffsetMode(Math.random() < 0.65 ? 'none' : pick(['rows', 'cols'] as const))
    setOffsetAmt(pick([0.25, 0.5]))
    setRotation(Math.random() < 0.75 ? 0 : pick([-45, -30, 30, 45]))
    setSeed(newSeed())
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c1-patron.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c1-patron.png')
  }

  // Brick-style offsets only make sense on the uniform grid.
  const effOffset = sizeMode === 'uniform' ? offsetMode : 'none'

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
            {bg && <rect x="0" y="0" width={w} height={h} fill={bg} />}
            <g transform={rotationTransform(rotation, w, h)}>
              {cells.map((cell, i) => {
                if (cell.shape < 0) return null
                const dx = effOffset === 'rows' ? (((cell.y % 2) + 2) % 2) * offsetAmt : 0
                const dy = effOffset === 'cols' ? (((cell.x % 2) + 2) % 2) * offsetAmt : 0
                const size = cell.s * cs
                // Connected: pieces touch along the chain axis (no inset) and
                // the air becomes spacing BETWEEN chains on the other axis.
                const spacedX = effConnect === 'vertical' ? 1 + air : 1
                const spacedY = effConnect === 'horizontal' ? 1 + air : 1
                const inset = effConnect === 'none' ? (air * size) / 2 : 0
                const cellScale = effConnect === 'none' ? 1 - air : 1
                const fill = cellColor(cell)
                // Connected: zoom the piece to its own (rotated) bounding box
                // so its tips reach the cell edge and neighbours actually touch.
                const vb =
                  effConnect !== 'none'
                    ? rotatedBBox(C1_BBOXES[C1_PARTS[cell.shape].id], cell.rot)
                    : { x: 0, y: 0, w: C1_VIEW, h: C1_VIEW }
                return (
                  <svg
                    key={i}
                    x={(cell.x - bleed + dx) * cs * spacedX + inset}
                    y={(cell.y - bleed + dy) * cs * spacedY + inset}
                    width={size * cellScale}
                    height={size * cellScale}
                    viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
                  >
                    <g transform={`rotate(${cell.rot * 90} ${C1_VIEW / 2} ${C1_VIEW / 2})`}>
                      <g transform={C1_PARTS[cell.shape].transform}>
                        <path d={C1_PARTS[cell.shape].d} fill={fill} fillRule="evenodd" />
                      </g>
                    </g>
                  </svg>
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
              max={16}
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
            {sizeMode === 'uniform' && (
              <>
                <span className="tc-panel-label">Conexión</span>
                <Seg
                  options={[
                    { value: 'none' as const, label: 'Suelto' },
                    { value: 'horizontal' as const, label: 'Horizontal' },
                    { value: 'vertical' as const, label: 'Vertical' },
                  ]}
                  value={connect}
                  onChange={setConnect}
                />
                <span className="tc-panel-label">Desfase</span>
                <Seg
                  options={[
                    { value: 'none' as const, label: 'Sin desfase' },
                    { value: 'rows' as const, label: 'Filas' },
                    { value: 'cols' as const, label: 'Columnas' },
                  ]}
                  value={offsetMode}
                  onChange={setOffsetMode}
                />
                {offsetMode !== 'none' && (
                  <SliderRow
                    label="Desfase"
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    value={offsetAmt}
                    onChange={setOffsetAmt}
                    format={(v) => `${Math.round(v * 100)}%`}
                  />
                )}
              </>
            )}
          </Panel>

          <Panel label="Piezas">
            {C1_PARTS.map((p) => (
              <Check
                key={p.id}
                label={p.name}
                checked={enabledParts[p.id]}
                onChange={(v) => setEnabledParts((prev) => ({ ...prev, [p.id]: v }))}
              />
            ))}
          </Panel>

          <Panel label="Paleta">
            <Seg
              options={PALETTES.map((p) => ({ value: p.id, label: p.id }))}
              value={paletteId}
              onChange={applyPalette}
            />
            <Check label="Jugar con tonos" checked={shades} onChange={setShades} />
            <Seg
              options={[
                { value: 'multi' as const, label: 'Multicolor' },
                { value: 'mono' as const, label: 'Monocromo' },
              ]}
              value={colorMode}
              onChange={setColorMode}
            />
            {colorMode === 'mono' && (
              <>
                <Swatches
                  colors={pickerPool}
                  value={mono}
                  onPick={(c) => {
                    setMono(c)
                    setMonoShades(false)
                  }}
                  small={shades}
                />
                <button
                  type="button"
                  className="tc-btn"
                  onClick={() => {
                    setMonoShades(true)
                    setShadeOffset(Math.random())
                  }}
                >
                  Tonos al azar ✦
                </button>
              </>
            )}
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
