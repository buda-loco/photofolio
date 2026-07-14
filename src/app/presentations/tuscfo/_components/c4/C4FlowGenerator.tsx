'use client'

/**
 * Concepto 04 — generador de flujos.
 *
 * A proper cash-flow Sankey taken to an abstract plane: several sources
 * merge into one ("one into many" — the aggregator), which splits into
 * colour-coded categories and finally into leaf ribbons, every stream
 * with its own seeded value so widths vary like real money. Nodes mark
 * each junction; ribbons fade between node colours; overlaps can blend.
 * Origin, split and ends are movable and the whole system anchors to
 * canvas edges — top-to-bottom, sideways, or from both sides at once.
 *
 * Geometry lives in "flow space" (u = along the flow, v = across) and is
 * mapped per direction, so one ribbon builder serves every mode.
 */

import { useMemo, useRef, useState, useEffect } from 'react'
import EditorShell, { CANVAS, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import {
  PALETTES,
  getPalette,
  paletteWithShades,
  remapColor,
  autoBg,
  shadesOf,
  visiblePool,
  type PaletteId,
} from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import { getCleanExportSVGString, downloadSVG, downloadPNG } from '../exportUtils'
import { usePublishPattern } from '../patternPreview'
import { pick, seededRand, newSeed } from '../rand'

const INK = '#000000'
const PAPER = '#ffffff'

type Direction = 'down' | 'right' | 'both'
type Blend = 'normal' | 'overlay' | 'screen' | 'multiply'
type Stages = 2 | 3 | 4

const BLEND_OPTIONS: { value: Blend; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'screen', label: 'Suma' },
  { value: 'multiply', label: 'Multipl.' },
]

/** n seeded weights that sum to 1, none vanishingly small. */
function weights(rnd: () => number, n: number): number[] {
  const raw = Array.from({ length: n }, () => 0.25 + rnd())
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((x) => x / sum)
}

interface SankeyData {
  srcVals: number[]
  leafVals: number[]
  catCount: number
  /** leaf index → category index (contiguous groups) */
  leafCat: number[]
  catThrows: number[]
  leafThrows: number[]
}

interface NodeBox {
  v0: number // across-axis start
  size: number // across-axis extent
  value: number // total value flowing through
  color: string
  outOff: number // stacking offsets for ribbon slices
  inOff: number
}

export default function C4FlowGenerator() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [direction, setDirection] = useState<Direction>('down')
  const [stages, setStages] = useState<Stages>(3)
  const [sources, setSources] = useState(2)
  const [leaves, setLeaves] = useState(6)
  const [origin, setOrigin] = useState(0.5)
  const [originWidth, setOriginWidth] = useState(0.45)
  const [splitAt, setSplitAt] = useState(0.42)
  const [endPos, setEndPos] = useState(0.5)
  const [endSpread, setEndSpread] = useState(0.92)
  const [branchWidth, setBranchWidth] = useState(1)
  const [blend, setBlend] = useState<Blend>('normal')
  const [gradient, setGradient] = useState(true)
  const [showNodes, setShowNodes] = useState(true)
  const [trunkColor, setTrunkColor] = useState('#d6fb00')
  const [bg, setBg] = useState<string | null>(INK)
  // Hydration-safe seeding (same convention as the other generators).
  const [seed, setSeed] = useState(20260714)
  useEffect(() => {
    setSeed(newSeed())
  }, [])

  const { w, h } = CANVAS[orientation]
  usePublishPattern('c4', svgRef, w, h)
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c4', paletteId, (next) => applyPalette(next))

  // Seeded structure: source/leaf values, category grouping, colour throws.
  // Two systems' worth for "Ambos lados". Sliders re-dress, "Recombinar"
  // re-rolls.
  const data: SankeyData[] = useMemo(() => {
    return Array.from({ length: 2 }, (_, s) => {
      const rnd = seededRand(seed ^ (s * 0x9e3779b1))
      const srcVals = weights(rnd, sources)
      const leafVals = weights(rnd, leaves)
      const catCount = Math.max(2, Math.min(4, 2 + Math.floor(rnd() * 3), leaves - 1))
      // contiguous grouping of leaves into categories
      const cuts = new Set<number>()
      while (cuts.size < catCount - 1) cuts.add(1 + Math.floor(rnd() * (leaves - 1)))
      const sorted = [...cuts].sort((a, b) => a - b)
      const leafCat = Array.from({ length: leaves }, (_, i) => sorted.filter((c) => c <= i).length)
      return {
        srcVals,
        leafVals,
        catCount,
        leafCat,
        catThrows: Array.from({ length: 4 }, () => rnd()),
        leafThrows: Array.from({ length: 12 }, () => rnd()),
      }
    })
  }, [seed, sources, leaves])

  /** Coordinate mapping for one flow. mirror flips the u axis. */
  const makeMap = (dir: 'down' | 'right', mirror: boolean) => {
    const L = dir === 'down' ? h : w
    const B = dir === 'down' ? w : h
    const pt =
      dir === 'down'
        ? (u: number, v: number) => ({ x: v, y: mirror ? h - u : u })
        : (u: number, v: number) => ({ x: mirror ? w - u : u, y: v })
    return { L, B, pt, P: (u: number, v: number) => { const p = pt(u, v); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` } }
  }

  /** Build nodes + ribbons + node bars for one system. */
  const buildSystem = (sys: number, mirror: boolean) => {
    const dir = direction === 'both' ? 'right' : direction
    const { L, B, pt, P } = makeMap(dir, direction === 'both' ? mirror : false)
    const d = data[sys]
    const usable = visiblePool(pool, bg)

    const catColor = (g: number) => {
      let idx = Math.floor(d.catThrows[g] * usable.length) % usable.length
      if (g > 0) {
        const prev = Math.floor(d.catThrows[g - 1] * usable.length) % usable.length
        if (idx === prev) idx = (idx + 1) % usable.length
      }
      return usable[idx]
    }
    // leaves live in their category's colour family — a nearby shade
    const leafColor = (i: number) => {
      const fam = shadesOf(catColor(d.leafCat[i]))
      return fam[1 + Math.floor(d.leafThrows[i] * 4)]
    }

    // Column u-positions and across-axis layout params, interpolating the
    // origin controls (col 0) to the end controls (last col).
    const colUs: number[] =
      stages === 2
        ? [0, L]
        : stages === 3
          ? [0, splitAt * L, L]
          : [0, splitAt * L * 0.85, (splitAt + (1 - splitAt) * 0.55) * L, L]
    const nCols = colUs.length
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const colSpan = (k: number) => lerp(originWidth, endSpread, k / (nCols - 1)) * B
    const colPos = (k: number) => lerp(origin, endPos, k / (nCols - 1)) * B

    /** Lay out one column's nodes (values sum to 1) along the across axis. */
    const layout = (k: number, vals: number[], colors: string[]): NodeBox[] => {
      const span = colSpan(k)
      const start = colPos(k) - span / 2
      const gap = vals.length > 1 ? Math.min(span * 0.06, (span * 0.3) / (vals.length - 1)) : 0
      const usableSpan = span - gap * (vals.length - 1)
      let vCursor = start
      return vals.map((val, i) => {
        const size = val * usableSpan
        const node: NodeBox = { v0: vCursor, size, value: val, color: colors[i], outOff: 0, inOff: 0 }
        vCursor += size + gap
        return node
      })
    }

    // Columns: sources → (aggregator) → (categories) → leaves
    const catVals = Array.from({ length: d.catCount }, (_, g) =>
      d.leafVals.reduce((a, v, i) => (d.leafCat[i] === g ? a + v : a), 0),
    )
    const cols: NodeBox[][] = []
    cols.push(layout(0, d.srcVals, d.srcVals.map(() => trunkColor)))
    if (stages >= 3) cols.push(layout(1, [1], [trunkColor]))
    if (stages === 4) cols.push(layout(2, catVals, catVals.map((_, g) => catColor(g))))
    cols.push(
      layout(
        nCols - 1,
        d.leafVals,
        d.leafVals.map((_, i) => (stages === 4 ? leafColor(i) : usable[Math.floor(d.leafThrows[i] * usable.length) % usable.length])),
      ),
    )

    // Flows between adjacent columns. Each flow: {from, to, value}.
    const hops: { a: number; b: number; value: number }[][] = []
    for (let k = 0; k < cols.length - 1; k++) {
      const A = cols[k]
      const Bcol = cols[k + 1]
      const flows: { a: number; b: number; value: number }[] = []
      if (A.length === 1) {
        // one into many
        Bcol.forEach((nb, j) => flows.push({ a: 0, b: j, value: nb.value }))
      } else if (Bcol.length === 1) {
        // many into one
        A.forEach((na, i) => flows.push({ a: i, b: 0, value: na.value }))
      } else if (k === cols.length - 2 && stages === 4) {
        // categories → their leaves
        d.leafVals.forEach((v, i) => flows.push({ a: d.leafCat[i], b: i, value: v }))
      } else {
        // proportional allocation (sources → leaves when stages = 2)
        A.forEach((na, i) => Bcol.forEach((nb, j) => flows.push({ a: i, b: j, value: na.value * nb.value })))
      }
      hops.push(flows)
    }

    // Ribbon paths. Thickness at each end follows that column's own scale,
    // so a stream widens/narrows between columns like a real Sankey.
    const nodeBarW = Math.max(8, L * 0.012)
    const ribbons: { path: string; from: string; to: string; g0: { x: number; y: number }; g1: { x: number; y: number } }[] = []
    hops.forEach((flows, k) => {
      const uA = colUs[k]
      const uB = colUs[k + 1]
      const mid = (uA + uB) / 2
      const A = cols[k]
      const Bcol = cols[k + 1]
      const isLeafHop = k === cols.length - 2
      flows.forEach((f) => {
        const na = A[f.a]
        const nb = Bcol[f.b]
        const tA = (f.value / na.value) * na.size
        let tB = (f.value / nb.value) * nb.size
        const a0 = na.v0 + na.outOff
        na.outOff += tA
        let b0 = nb.v0 + nb.inOff
        nb.inOff += tB
        // leaf-side width play: >100% overlaps neighbours (blend modes shine)
        if (isLeafHop && branchWidth !== 1) {
          const c = b0 + tB / 2
          tB *= branchWidth
          b0 = c - tB / 2
        }
        const u0 = uA + (k === 0 ? 0 : nodeBarW / 2)
        const u1 = uB - (k === hops.length - 1 ? 0 : nodeBarW / 2)
        ribbons.push({
          path: [
            `M ${P(u0, a0)}`,
            `C ${P(mid, a0)} ${P(mid, b0)} ${P(u1, b0)}`,
            `L ${P(u1, b0 + tB)}`,
            `C ${P(mid, b0 + tB)} ${P(mid, a0 + tA)} ${P(u0, a0 + tA)}`,
            'Z',
          ].join(' '),
          from: na.color,
          to: nb.color,
          g0: pt(u0, 0),
          g1: pt(u1, 0),
        })
      })
    })

    // Node bars at every junction (skip the very edges' outer face).
    const nodes = showNodes
      ? cols.flatMap((col, k) =>
          col.map((n) => {
            const u = colUs[k]
            const uStart = k === 0 ? u : u - nodeBarW / 2
            const uEnd = k === cols.length - 1 ? u : u + nodeBarW / 2
            const p1 = pt(Math.max(0, uStart), n.v0)
            const p2 = pt(Math.min(L, uEnd), n.v0 + n.size)
            return {
              x: Math.min(p1.x, p2.x),
              y: Math.min(p1.y, p2.y),
              w: Math.abs(p2.x - p1.x) || nodeBarW,
              h: Math.abs(p2.y - p1.y) || nodeBarW,
              // junctions read as darker bars, like a real Sankey's nodes
              color: shadesOf(n.color)[5],
            }
          }),
        )
      : []

    return { ribbons, nodes }
  }

  const systemCount = direction === 'both' ? 2 : 1

  /** Palette click re-dresses the current design, not just the swatch pool. */
  const applyPalette = (next: PaletteId) => {
    const from = getPalette(paletteId)
    const to = getPalette(next)
    setPaletteId(next)
    setTrunkColor((c) => remapColor(c, from, to))
    setBg((b) => autoBg(b, from, to))
  }

  /** Negative version — background and source band switch places. */
  const invert = () => {
    const oldBg = bg ?? PAPER
    setBg(trunkColor)
    setTrunkColor(oldBg)
  }

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextShades = Math.random() < 0.35
    const nextPool = nextShades ? paletteWithShades(pal) : pal.colors
    const nextBg = Math.random() < 0.15 ? null : pick([PAPER, INK, ...nextPool])
    setPaletteId(pal.id)
    setShades(nextShades)
    setBg(nextBg)
    setTrunkColor(pick(visiblePool([PAPER, ...nextPool], nextBg)))
    setDirection(pick(['down', 'right', 'both'] as const))
    setStages(pick([2, 3, 3, 4] as const))
    setSources(1 + Math.floor(Math.random() * 4))
    setLeaves(3 + Math.floor(Math.random() * 8))
    setOrigin(0.25 + Math.random() * 0.5)
    setOriginWidth(0.2 + Math.random() * 0.45)
    setSplitAt(0.25 + Math.random() * 0.4)
    setEndPos(0.35 + Math.random() * 0.3)
    setEndSpread(0.5 + Math.random() * 0.5)
    setBranchWidth(Math.random() < 0.6 ? 1 : 0.8 + Math.random() * 0.7)
    setBlend(Math.random() < 0.55 ? 'normal' : pick(['overlay', 'screen', 'multiply'] as const))
    setGradient(Math.random() < 0.7)
    setShowNodes(Math.random() < 0.7)
    setSeed(newSeed())
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c4-flujo.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c4-flujo.png')
  }

  const mixStyle = blend === 'normal' ? undefined : ({ mixBlendMode: blend } as const)
  const built = Array.from({ length: systemCount }, (_, s) => buildSystem(s, s === 1))

  return (
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
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', isolation: 'isolate' }}
          >
            <defs>
              {gradient &&
                built.flatMap(({ ribbons }, s) =>
                  ribbons.map((r, i) => (
                    <linearGradient
                      key={`${s}-${i}`}
                      id={`c4g-${s}-${i}`}
                      gradientUnits="userSpaceOnUse"
                      x1={r.g0.x}
                      y1={r.g0.y}
                      x2={r.g1.x}
                      y2={r.g1.y}
                    >
                      <stop offset="0" stopColor={r.from} />
                      <stop offset="1" stopColor={r.to} />
                    </linearGradient>
                  )),
                )}
            </defs>
            {bg && <rect x="0" y="0" width={w} height={h} fill={bg} />}
            {built.map(({ ribbons, nodes }, s) => (
              <g key={s}>
                {ribbons.map((r, i) => (
                  <path
                    key={i}
                    d={r.path}
                    fill={gradient ? `url(#c4g-${s}-${i})` : r.to}
                    style={mixStyle}
                  />
                ))}
                {nodes.map((n, i) => (
                  <rect key={i} x={n.x} y={n.y} width={n.w} height={n.h} fill={n.color} />
                ))}
              </g>
            ))}
          </svg>
        </div>
      }
      panels={
        <>
          <Panel label="Flujo">
            <Seg
              options={[
                { value: 'down' as const, label: 'Vertical' },
                { value: 'right' as const, label: 'Horizontal' },
                { value: 'both' as const, label: 'Ambos lados' },
              ]}
              value={direction}
              onChange={setDirection}
            />
            <span className="tc-panel-label">Etapas</span>
            <Seg
              options={[
                { value: '2' as const, label: '2' },
                { value: '3' as const, label: '3' },
                { value: '4' as const, label: '4' },
              ]}
              value={String(stages) as '2' | '3' | '4'}
              onChange={(v) => setStages(Number(v) as Stages)}
            />
            <span className="tc-panel-label">Fuentes</span>
            <SliderRow label="Fuentes" min={1} max={4} value={sources} onChange={setSources} />
            <span className="tc-panel-label">Ramas finales</span>
            <SliderRow label="Ramas finales" min={3} max={10} value={leaves} onChange={setLeaves} />
            <span className="tc-panel-label">División</span>
            <SliderRow
              label="Punto de división"
              min={0.15}
              max={0.75}
              step={0.01}
              value={splitAt}
              onChange={setSplitAt}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <button type="button" className="tc-btn" onClick={() => setSeed(newSeed())}>
              Recombinar flujo
            </button>
          </Panel>

          <Panel label="Origen">
            <span className="tc-panel-label">Posición</span>
            <SliderRow
              label="Posición del origen"
              min={0}
              max={1}
              step={0.01}
              value={origin}
              onChange={setOrigin}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <span className="tc-panel-label">Ancho</span>
            <SliderRow
              label="Ancho del origen"
              min={0.05}
              max={0.7}
              step={0.01}
              value={originWidth}
              onChange={setOriginWidth}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Panel>

          <Panel label="Final">
            <span className="tc-panel-label">Posición</span>
            <SliderRow
              label="Posición del final"
              min={0}
              max={1}
              step={0.01}
              value={endPos}
              onChange={setEndPos}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <span className="tc-panel-label">Amplitud</span>
            <SliderRow
              label="Amplitud del final"
              min={0.15}
              max={1}
              step={0.01}
              value={endSpread}
              onChange={setEndSpread}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <span className="tc-panel-label">Ancho de ramas — 100% exacto</span>
            <SliderRow
              label="Ancho de ramas"
              min={0.3}
              max={1.6}
              step={0.01}
              value={branchWidth}
              onChange={setBranchWidth}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Panel>

          <Panel label="Color">
            <Seg
              options={PALETTES.map((p) => ({ value: p.id, label: p.id }))}
              value={paletteId}
              onChange={applyPalette}
            />
            <Check label="Jugar con tonos" checked={shades} onChange={setShades} />
            <span className="tc-panel-label">Origen</span>
            <Swatches colors={pickerPool} value={trunkColor} onPick={setTrunkColor} small={shades} />
            <Check label="Degradado en las cintas" checked={gradient} onChange={setGradient} />
            <Check label="Nodos en las uniones" checked={showNodes} onChange={setShowNodes} />
            <span className="tc-panel-label">Fusión al superponer</span>
            <Seg options={BLEND_OPTIONS} value={blend} onChange={setBlend} />
          </Panel>

          <Panel label="Fondo">
            <Swatches colors={pickerPool} value={bg} onPick={setBg} small={shades} />
            <div className="tc-btn-row">
              <button type="button" className="tc-btn" onClick={() => setBg(null)} disabled={bg === null}>
                Transparente
              </button>
              <button type="button" className="tc-btn" onClick={invert}>
                Invertir
              </button>
            </div>
          </Panel>
        </>
      }
    />
  )
}
