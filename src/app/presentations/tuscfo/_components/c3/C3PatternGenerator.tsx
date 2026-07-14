'use client'

/**
 * Concepto 03 — generador de patrones "números de píxeles".
 *
 * The brick unit is the lockup's rounded spreadsheet cell. Two modes:
 * "Números" renders big pixelated figures in one of two cell fonts —
 * "Alta" (chunky 6×12) or "Ancha" (squat 5×7) — covering A–Z, digits
 * and $ % + . ,; "Dibujo" lets the user paint cells by drawing
 * a stabilised stroke on the canvas. Colours come from a user-assembled
 * sequence (3–6 colours) applied in seeded-random order; optional
 * seeded gap clusters carve holes in the field. "Invertir" flips the
 * relationship: the whole grid fills with bricks and the content (text
 * or strokes) reads as a hole punched in the field. Same seed model as
 * C1: "Generar patrón" re-rolls colours + gaps, the content persists.
 *
 * On top of that, three spreadsheet-flavoured layers (all seeded):
 * "Campo de color" maps each cell to a value and walks the colour
 * sequence like conditional formatting (Aleatorio / Ondas / Diagonal /
 * Radial); "Selección" draws the classic snapped selection marquee with
 * fill-handle and emphasises the range inside it; "Combinar celdas"
 * merges seeded runs of 2–3 adjacent painted cells into wide bricks.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import EditorShell, { CANVAS, rotationTransform, type Orientation } from '../EditorShell'
import { Panel, Seg, Check, Swatches, SliderRow } from '../ui'
import {
  PALETTES,
  getPalette,
  paletteWithShades,
  shadesOf,
  contrastRatio,
  luminance,
  remapColor,
  autoBg,
  type PaletteId,
} from '../palettes'
import { useSyncedPalette } from '../paletteSync'
import {
  EXPORT_EXCLUDE_CLASS,
  getCleanExportSVGString,
  downloadSVG,
  downloadPNG,
} from '../exportUtils'
import { usePublishPattern } from '../patternPreview'
import { pick, randInt, seededRand, newSeed, shuffle } from '../rand'
import { C3_CELL_ASPECT, C3_CELL_CORNER } from './geometry'

const INK = '#000000'
const PAPER = '#ffffff'

const HINT: CSSProperties = { margin: 0, fontSize: '0.66rem', lineHeight: 1.5, opacity: 0.65 }

type Mode = 'numeros' | 'dibujo'

/** How the colour sequence is distributed across the painted field. */
type FieldMode = 'aleatorio' | 'ondas' | 'diagonal' | 'radial'

interface Pt {
  x: number
  y: number
}

interface Stroke {
  pts: Pt[]
  r: number
}

interface PCell {
  col: number
  row: number
  x: number
  y: number
}

/* ── Pixel fonts ─────────────────────────────────────────────── */

type FontId = 'alta' | 'ancha'

interface PixelFont {
  rows: number
  glyphs: Record<string, string[]>
}

/**
 * "Alta": tall and chunky — 6 columns × 12 rows per glyph with every
 * stroke 2 units thick (2 cols wide for verticals, 2 rows tall for
 * horizontals) — poster-like figures that stay bold when built from
 * the wide (≈2.26:1) bricks.
 */

// Row shorthands for the Alta skeleton (full / left / right / both).
const F = '111111'
const L = '110000'
const R = '000011'
const B = '110011'
// Center 2-wide column (I / T stems, 1 body).
const C = '001100'

const ALTA_GLYPHS: Record<string, string[]> = {
  '0': [F, F, B, B, B, B, B, B, B, B, F, F],
  '1': [C, '011100', '111100', C, C, C, C, C, C, C, F, F],
  '2': [F, F, R, R, R, F, F, L, L, L, F, F],
  '3': [F, F, R, R, R, F, F, R, R, R, F, F],
  '4': [B, B, B, B, B, F, F, R, R, R, R, R],
  '5': [F, F, L, L, L, F, F, R, R, R, F, F],
  '6': [F, F, L, L, L, F, F, B, B, B, F, F],
  '7': [F, F, R, R, R, R, R, R, R, R, R, R],
  '8': [F, F, B, B, B, F, F, B, B, B, F, F],
  '9': [F, F, B, B, B, F, F, R, R, R, F, F],
  // A: flat top bar + crossbar mid-height, open counter above the bar.
  A: [F, F, B, B, B, F, F, B, B, B, B, B],
  // B: 5-wide bars (vs 8's full-width) keep it apart from the digit 8.
  B: ['111110', '111110', B, B, '111110', '111110', B, B, B, B, '111110', '111110'],
  C: [F, F, L, L, L, L, L, L, L, L, F, F],
  // D: clipped outer corners on the right so it doesn't read as 0/O.
  D: ['111100', '111110', B, B, B, B, B, B, B, B, '111110', '111100'],
  E: [F, F, L, L, L, F, F, L, L, L, F, F],
  F: [F, F, L, L, L, F, F, L, L, L, L, L],
  // G: stem + inner 3-wide spur entering from the right at mid-height.
  G: [F, F, L, L, L, '110111', '110111', B, B, B, F, F],
  H: [B, B, B, B, B, F, F, B, B, B, B, B],
  // I: full-height 2-wide bar with serif rows (vs 1's diagonal flag).
  I: [F, F, C, C, C, C, C, C, C, C, F, F],
  J: [R, R, R, R, R, R, R, R, B, B, F, F],
  // K: stems + stepped 2-wide arms meeting at a waist.
  K: [B, B, B, '110110', '110110', '111100', '111100', '110110', '110110', B, B, B],
  L: [L, L, L, L, L, L, L, L, L, L, F, F],
  // M / W: solid centre block at the top / bottom between full stems.
  M: [B, B, F, F, F, F, B, B, B, B, B, B],
  // N: 1-wide diagonal stepping between the two full stems.
  N: [B, B, B, '111011', '111011', '111011', '110111', '110111', '110111', B, B, B],
  O: [F, F, B, B, B, B, B, B, B, B, F, F],
  P: [F, F, B, B, B, F, F, L, L, L, L, L],
  // Q: O with an inner tail poking the lower-right counter.
  Q: [F, F, B, B, B, B, B, B, '110111', '110111', F, F],
  R: [F, F, B, B, B, F, F, '110110', '110110', B, B, B],
  // S: cut corners top-left / bottom-right (vs the fully square 5).
  S: ['011111', F, L, L, L, F, F, R, R, R, F, '111110'],
  T: [F, F, C, C, C, C, C, C, C, C, C, C],
  U: [B, B, B, B, B, B, B, B, B, B, F, F],
  V: [B, B, B, B, B, B, '011110', '011110', '011110', C, C, C],
  W: [B, B, B, B, B, B, F, F, F, F, B, B],
  X: [B, B, B, '011110', '011110', C, C, '011110', '011110', B, B, B],
  Y: [B, B, B, '011110', '011110', C, C, C, C, C, C, C],
  // Z: stepped 2-wide diagonal between full bars (vs 2's flat middle).
  Z: [F, F, R, '000110', '000110', C, C, '011000', '011000', L, F, F],
  $: [C, F, F, L, L, F, F, R, R, F, F, C],
  '%': [B, B, '000110', '000110', C, C, '011000', '011000', '011000', L, B, B],
  '+': ['000000', '000000', C, C, C, F, F, C, C, C, '000000', '000000'],
  '.': ['00', '00', '00', '00', '00', '00', '00', '00', '00', '11', '11', '11'],
  ',': ['00', '00', '00', '00', '00', '00', '00', '00', '00', '11', '11', '10'],
  ' ': ['000', '000', '000', '000', '000', '000', '000', '000', '000', '000', '000', '000'],
}

/**
 * "Ancha": the previous squat 5×7 font the client also liked — kept
 * verbatim for digits/symbols, with A–Z drawn in the same weight
 * (2-thick stems, rounded shoulders via corner cuts).
 */
const ANCHA_GLYPHS: Record<string, string[]> = {
  '0': ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
  '1': ['00110', '01110', '00110', '00110', '00110', '00110', '01111'],
  '2': ['11110', '00011', '00011', '01110', '11000', '11000', '11111'],
  '3': ['11110', '00011', '00011', '01111', '00011', '00011', '11110'],
  '4': ['00011', '00111', '01011', '11011', '11111', '00011', '00011'],
  '5': ['11111', '11000', '11000', '11110', '00011', '00011', '11110'],
  '6': ['01110', '11000', '11000', '11110', '11011', '11011', '01110'],
  '7': ['11111', '00011', '00110', '00110', '01100', '01100', '01100'],
  '8': ['01110', '11011', '11011', '01110', '11011', '11011', '01110'],
  '9': ['01110', '11011', '11011', '01111', '00011', '00011', '01110'],
  A: ['01110', '11011', '11011', '11111', '11011', '11011', '11011'],
  // B: flat left profile (vs 8's rounded '01110' bars).
  B: ['11110', '11011', '11011', '11110', '11011', '11011', '11110'],
  C: ['01111', '11000', '11000', '11000', '11000', '11000', '01111'],
  D: ['11110', '11011', '11011', '11011', '11011', '11011', '11110'],
  E: ['11111', '11000', '11000', '11110', '11000', '11000', '11111'],
  F: ['11111', '11000', '11000', '11110', '11000', '11000', '11000'],
  G: ['01111', '11000', '11000', '11011', '11011', '11011', '01111'],
  H: ['11011', '11011', '11011', '11111', '11011', '11011', '11011'],
  // I: full-height 2-wide bar with serif rows (vs 1's flag + offset foot).
  I: ['11111', '01100', '01100', '01100', '01100', '01100', '11111'],
  J: ['00111', '00011', '00011', '00011', '11011', '11011', '01110'],
  K: ['11011', '11011', '11110', '11100', '11110', '11011', '11011'],
  L: ['11000', '11000', '11000', '11000', '11000', '11000', '11111'],
  // M / N / W: centre column filled top / middle / bottom respectively.
  M: ['11011', '11111', '11111', '11011', '11011', '11011', '11011'],
  N: ['11011', '11011', '11111', '11111', '11111', '11011', '11011'],
  O: ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
  P: ['11110', '11011', '11011', '11110', '11000', '11000', '11000'],
  // Q: bowl + detached tail below the lower-right shoulder.
  Q: ['01110', '11011', '11011', '11011', '11111', '01110', '00011'],
  R: ['11110', '11011', '11011', '11110', '11011', '11011', '11011'],
  // S: rounded top-left / middle (vs the square-cornered 5).
  S: ['01111', '11000', '11000', '01110', '00011', '00011', '11110'],
  T: ['11111', '01100', '01100', '01100', '01100', '01100', '01100'],
  U: ['11011', '11011', '11011', '11011', '11011', '11011', '01110'],
  V: ['11011', '11011', '11011', '11011', '11011', '01110', '00100'],
  W: ['11011', '11011', '11011', '11011', '11111', '11111', '11011'],
  X: ['11011', '11011', '01110', '00100', '01110', '11011', '11011'],
  Y: ['11011', '11011', '11011', '01110', '01100', '01100', '01100'],
  // Z: square full bars + straight staircase (vs 2's rounded top).
  Z: ['11111', '00011', '00110', '01100', '11000', '11000', '11111'],
  $: ['00100', '01111', '11000', '01110', '00011', '11110', '00100'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '.': ['00', '00', '00', '00', '00', '11', '11'],
  ',': ['00', '00', '00', '00', '11', '11', '10'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
}

const FONTS: Record<FontId, PixelFont> = {
  alta: { rows: 12, glyphs: ALTA_GLYPHS },
  ancha: { rows: 7, glyphs: ANCHA_GLYPHS },
}

/** Lay the text out as lit grid cells (1 empty column between glyphs). */
function textToCells(text: string, font: PixelFont): { cols: number; cells: { x: number; y: number }[] } {
  const cells: { x: number; y: number }[] = []
  let x0 = 0
  let used = false
  for (const ch of text) {
    const glyph = font.glyphs[ch]
    if (!glyph) continue
    const gw = glyph[0].length
    for (let y = 0; y < font.rows; y++) {
      for (let x = 0; x < gw; x++) {
        if (glyph[y][x] === '1') cells.push({ x: x0 + x, y })
      }
    }
    x0 += gw + 1
    used = true
  }
  return { cols: used ? x0 - 1 : 0, cells }
}

/* ── Stroke helpers ──────────────────────────────────────────── */

/** Moving-average smoothing + constant arc-length resampling. */
function smoothResample(raw: Pt[], step: number): Pt[] {
  if (raw.length < 3) return raw
  const sm = raw.map((_, i) => {
    let sx = 0
    let sy = 0
    let n = 0
    for (let j = Math.max(0, i - 2); j <= Math.min(raw.length - 1, i + 2); j++) {
      sx += raw[j].x
      sy += raw[j].y
      n++
    }
    return { x: sx / n, y: sy / n }
  })
  const out: Pt[] = [sm[0]]
  let prev = sm[0]
  let acc = 0
  for (let i = 1; i < sm.length; i++) {
    const cur = sm[i]
    let d = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    while (acc + d >= step && d > 0) {
      const t = (step - acc) / d
      const nx = prev.x + (cur.x - prev.x) * t
      const ny = prev.y + (cur.y - prev.y) * t
      out.push({ x: nx, y: ny })
      prev = { x: nx, y: ny }
      d = Math.hypot(cur.x - prev.x, cur.y - prev.y)
      acc = 0
    }
    acc += d
    prev = cur
  }
  out.push(sm[sm.length - 1])
  return out
}

function distToSeg(px: number, py: number, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - a.x, py - a.y)
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t))
}

function nearStroke(s: Stroke, x: number, y: number): boolean {
  const pts = s.pts
  if (pts.length === 1) return Math.hypot(x - pts[0].x, y - pts[0].y) <= s.r
  for (let i = 1; i < pts.length; i++) {
    if (distToSeg(x, y, pts[i - 1], pts[i]) <= s.r) return true
  }
  return false
}

/** Seeded per-cell random in [0,1) — stable per (seed, col, row, salt). */
function cellRnd(seed: number, col: number, row: number, salt: number): number {
  const s = (seed ^ Math.imul(col + 1, 0x9e3779b1) ^ Math.imul(row + 1, 0x85ebca6b) ^ salt) >>> 0
  return seededRand(s)()
}

function randomMoney(): string {
  const kind = Math.random()
  if (kind < 0.4) return `$${pick(['512', '1.024', '2.048', '4.096', '8.192'])}`
  if (kind < 0.7) return `${randInt(1, 99)}%`
  return `+${pick(['256', '512', '1.024', '2.048'])}`
}

/* ── Component ───────────────────────────────────────────────── */

export default function C3PatternGenerator() {
  const svgRef = useRef<SVGSVGElement>(null)
  const drawing = useRef(false)
  const currentRef = useRef<Pt[] | null>(null)

  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [rotation, setRotation] = useState(0)
  const [paletteId, setPaletteId] = useState<PaletteId>('A')
  const [shades, setShades] = useState(false)
  const [mode, setMode] = useState<Mode>('numeros')
  const [font, setFont] = useState<FontId>('alta')
  const [text, setText] = useState('$1.024')
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [seq, setSeq] = useState<string[]>(() => [...getPalette('A').colors])
  const [bg, setBg] = useState<string | null>(INK)
  const [invert, setInvert] = useState(false)
  const [gaps, setGaps] = useState(false)
  const [gapAmount, setGapAmount] = useState(0.25)
  const [gapSize, setGapSize] = useState(2)
  const [brush, setBrush] = useState(60)
  const [fieldMode, setFieldMode] = useState<FieldMode>('aleatorio')
  const [selOn, setSelOn] = useState(false)
  const [selX, setSelX] = useState(0.3)
  const [selY, setSelY] = useState(0.3)
  const [selW, setSelW] = useState(0.35)
  const [selH, setSelH] = useState(0.3)
  const [merge, setMerge] = useState(false)
  const [mergeAmount, setMergeAmount] = useState(0.2)
  // Hydration-safe seeding: SSR and first client render share a fixed seed;
  // a fresh one lands right after mount so every visit still opens with a
  // brand-new pattern.
  const [seed, setSeed] = useState(20260714)
  useEffect(() => {
    setSeed(newSeed())
  }, [])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [current, setCurrent] = useState<Pt[] | null>(null)

  const { w, h } = CANVAS[orientation]
  usePublishPattern('c3', svgRef, w, h)
  const palette = getPalette(paletteId)
  const pool = shades ? paletteWithShades(palette) : palette.colors
  const pickerPool = [PAPER, INK, ...pool]
  useSyncedPalette('c3', paletteId, (next) => applyPalette(next))
  const seqPool = pickerPool.filter((c) => !seq.includes(c))

  // Rotation is locked to 0 while drawing so pointer → cell math stays sane.
  const effRotation = mode === 'dibujo' ? 0 : rotation

  // If a sequence colour would vanish against the background, swap in the
  // nearest shade of it that clears the contrast bar — cells stay visible.
  const safeSeq = useMemo(() => {
    if (!bg) return seq
    return seq.map((c) => {
      if (contrastRatio(c, bg) >= 2.5) return c
      return shadesOf(c).find((s) => contrastRatio(s, bg) >= 2.5) ?? c
    })
  }, [seq, bg])

  /* Grid + painted cells for the active mode. `c0`/`r0` are the first
     grid indices (non-zero only for the inverted Números field, whose
     grid extends beyond the text block) so gap clusters can cover the
     whole painted range. */
  const geo = useMemo(() => {
    const AS = C3_CELL_ASPECT
    if (mode === 'numeros') {
      const fnt = FONTS[font]
      const tg = textToCells(text, fnt)
      if (tg.cols <= 0)
        return {
          cols: 0,
          rows: fnt.rows,
          c0: 0,
          r0: 0,
          cw: 0,
          ch: 0,
          ox: 0,
          oy: 0,
          px: 0,
          py: 0,
          cells: [] as PCell[],
        }
      // pitch = cell + gap, gap = 5.2% of cell width; block centred with margin
      const cw = Math.min(
        (w * 0.86) / (1.052 * tg.cols - 0.052),
        (h * 0.78) / (fnt.rows * (1 / AS + 0.052) - 0.052),
      )
      const gapPx = cw * 0.052
      const px = cw + gapPx
      const ch = cw / AS
      const py = ch + gapPx
      // posX/posY shift the block from centre (±half canvas — overflow clips).
      const ox = (w - (tg.cols * px - gapPx)) / 2 + posX * (w / 2)
      const oy = (h - (fnt.rows * py - gapPx)) / 2 + posY * (h / 2)
      if (invert) {
        // Negative: fill the whole canvas grid, skipping the text's cells.
        // The grid is padded out to the canvas diagonal so rotating the
        // field never uncovers the corners.
        const lit = new Set(tg.cells.map((c) => `${c.x},${c.y}`))
        const diag = Math.hypot(w, h)
        const padX = (diag - w) / 2
        const padY = (diag - h) / 2
        const c0 = Math.floor((-padX - ox) / px)
        const c1 = Math.ceil((w + padX - ox) / px)
        const r0 = Math.floor((-padY - oy) / py)
        const r1 = Math.ceil((h + padY - oy) / py)
        const cells: PCell[] = []
        for (let r = r0; r < r1; r++) {
          for (let c = c0; c < c1; c++) {
            if (!lit.has(`${c},${r}`)) {
              cells.push({ col: c, row: r, x: ox + c * px, y: oy + r * py })
            }
          }
        }
        return { cols: c1 - c0, rows: r1 - r0, c0, r0, cw, ch, ox, oy, px, py, cells }
      }
      return {
        cols: tg.cols,
        rows: fnt.rows,
        c0: 0,
        r0: 0,
        cw,
        ch,
        ox,
        oy,
        px,
        py,
        cells: tg.cells.map((c) => ({ col: c.x, row: c.y, x: ox + c.x * px, y: oy + c.y * py })),
      }
    }
    // dibujo: fixed full-bleed grid, cells painted near the strokes
    // (inverted: cells painted everywhere EXCEPT near the strokes)
    const cols = Math.max(8, Math.round(w / 64))
    const px = w / cols
    const gapPx = px * 0.052
    const cw = px - gapPx
    const ch = cw / AS
    const py = ch + gapPx
    const rows = Math.ceil((h + gapPx) / py)
    const all: Stroke[] =
      current && current.length ? [...strokes, { pts: current, r: brush }] : strokes
    const cells: PCell[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * px + cw / 2
        const cy = r * py + ch / 2
        if (all.some((s) => nearStroke(s, cx, cy)) !== invert) {
          cells.push({ col: c, row: r, x: c * px, y: r * py })
        }
      }
    }
    return { cols, rows, c0: 0, r0: 0, cw, ch, ox: 0, oy: 0, px, py, cells }
  }, [mode, text, font, posX, posY, w, h, strokes, current, brush, invert])

  /* Seeded gap clusters: seeds drop with probability amount/clusterArea,
     each seed carves a (2·size−1)² hole, so bigger sizes = bigger holes. */
  const dropped = useMemo(() => {
    const out = new Set<string>()
    if (!gaps || gapAmount <= 0) return out
    const rad = gapSize - 1
    const q = gapAmount / (2 * rad + 1) ** 2
    for (let r = geo.r0; r < geo.r0 + geo.rows; r++) {
      for (let c = geo.c0; c < geo.c0 + geo.cols; c++) {
        if (cellRnd(seed, c, r, 0x9d) < q) {
          for (let dr = -rad; dr <= rad; dr++) {
            for (let dc = -rad; dc <= rad; dc++) {
              out.add(`${c + dc},${r + dr}`)
            }
          }
        }
      }
    }
    return out
  }, [gaps, gapAmount, gapSize, seed, geo.rows, geo.cols, geo.r0, geo.c0])

  /* ── Campo de color: seeded field parameters ─────────────────
     The non-random modes map every cell to v ∈ [0,1) and index the
     sequence with it, so the user's colour order becomes a progression
     flowing across the bricks (Excel conditional-formatting energy).
     All parameters re-roll with "Generar patrón". */
  const fieldParams = useMemo(() => {
    const rnd = seededRand((seed ^ 0x2f6b1a) >>> 0)
    // Ondas: 2–3 summed sines. Wavelengths live in CELL units (6–14
    // cells per full wave) so the bands stay readable at any brick size.
    const waves = Array.from({ length: rnd() < 0.5 ? 2 : 3 }, () => ({
      theta: rnd() * Math.PI * 2,
      cells: 6 + rnd() * 8,
      phase: rnd() * Math.PI * 2,
    }))
    // Diagonal: angle quantised to 15° steps so the sweep feels designed.
    const diagTheta = (Math.floor(rnd() * 24) * 15 * Math.PI) / 180
    const diagPhase = rnd()
    // Radial: centre biased towards the middle of the canvas.
    const radialX = 0.25 + rnd() * 0.5
    const radialY = 0.25 + rnd() * 0.5
    const radialSpan = 0.4 + rnd() * 0.4
    return { waves, diagTheta, diagPhase, radialX, radialY, radialSpan }
  }, [seed])

  /** Sequence index for a cell. (col,row) feed the aleatorio hash; the
      cell CENTRE (cx,cy, canvas units) feeds the field modes — merged
      cells pass their run centre so wide bricks sample sensibly. */
  const colorIndexAt = (col: number, row: number, cx: number, cy: number): number => {
    const n = safeSeq.length
    if (n === 0) return 0
    if (fieldMode === 'aleatorio') return Math.floor(cellRnd(seed, col, row, 0x51) * n) % n
    let v: number
    if (fieldMode === 'ondas') {
      const pitch = geo.px || 64
      let s = 0
      for (const wv of fieldParams.waves) {
        const f = (Math.PI * 2) / (wv.cells * pitch)
        s += Math.sin(f * (cx * Math.cos(wv.theta) + cy * Math.sin(wv.theta)) + wv.phase)
      }
      v = 0.5 + s / (2 * fieldParams.waves.length)
    } else if (fieldMode === 'diagonal') {
      // One clean banded sweep: projection spans at most one cycle.
      const proj =
        (cx * Math.cos(fieldParams.diagTheta) + cy * Math.sin(fieldParams.diagTheta)) /
        Math.hypot(w, h)
      v = proj + fieldParams.diagPhase
      v -= Math.floor(v)
    } else {
      const d = Math.hypot(cx - fieldParams.radialX * w, cy - fieldParams.radialY * h)
      v = d / (Math.hypot(w, h) * fieldParams.radialSpan)
    }
    v = Math.min(0.999999, Math.max(0, v))
    return Math.floor(v * n)
  }

  /* ── Selección: marquee snapped to cell boundaries ──────────── */
  const selSnap = useMemo(() => {
    if (!selOn || geo.px <= 0 || geo.py <= 0) return null
    const c0 = Math.round((selX * w - geo.ox) / geo.px)
    const r0 = Math.round((selY * h - geo.oy) / geo.py)
    const c1 = Math.max(c0 + 1, Math.round(((selX + selW) * w - geo.ox) / geo.px))
    const r1 = Math.max(r0 + 1, Math.round(((selY + selH) * h - geo.oy) / geo.py))
    // Border strokes sit centred over the gaps between cells, like the
    // grid lines a real spreadsheet selection hugs.
    const gapX = geo.px - geo.cw
    const gapY = geo.py - geo.ch
    return {
      c0,
      r0,
      c1,
      r1,
      x: geo.ox + c0 * geo.px - gapX / 2,
      y: geo.oy + r0 * geo.py - gapY / 2,
      wPx: (c1 - c0) * geo.px,
      hPx: (r1 - r0) * geo.py,
    }
  }, [selOn, selX, selY, selW, selH, geo, w, h])

  const inSel = (c: number, r: number): boolean =>
    !!selSnap && c >= selSnap.c0 && c < selSnap.c1 && r >= selSnap.r0 && r < selSnap.r1
  const selShift = Math.max(1, Math.floor(safeSeq.length / 2))
  // Marquee colour: simple luminance flip against the background so it
  // reads over both the bg and the field (PAPER on dark, INK on light).
  const selBase = bg ?? PAPER
  const selColor = luminance(selBase) < 0.35 ? PAPER : INK

  /* ── Combinar celdas: seeded runs of 2–3 horizontal neighbours ─
     Only merges runs whose cells are all painted AND not dropped by a
     gap cluster — merges never bridge holes or content edges. Greedy
     left-to-right walk per row, fully deterministic from `seed`. */
  const mergeInfo = useMemo(() => {
    const starts = new Map<string, number>()
    const consumed = new Set<string>()
    if (!merge || mergeAmount <= 0) return { starts, consumed }
    const alive = new Set<string>()
    const byRow = new Map<number, number[]>()
    for (const c of geo.cells) {
      const key = `${c.col},${c.row}`
      if (dropped.has(key)) continue
      alive.add(key)
      const cols = byRow.get(c.row)
      if (cols) cols.push(c.col)
      else byRow.set(c.row, [c.col])
    }
    for (const [row, cols] of byRow) {
      cols.sort((a, b) => a - b)
      for (const col of cols) {
        const key = `${col},${row}`
        if (consumed.has(key)) continue
        if (cellRnd(seed, col, row, 0xa7) >= mergeAmount) continue
        const want = cellRnd(seed, col, row, 0xb3) < 0.5 ? 2 : 3
        let len = 1
        while (len < want) {
          const nk = `${col + len},${row}`
          if (!alive.has(nk) || consumed.has(nk)) break
          len++
        }
        if (len < 2) continue
        starts.set(key, len)
        for (let i = 1; i < len; i++) consumed.add(`${col + i},${row}`)
      }
    }
    return { starts, consumed }
  }, [merge, mergeAmount, seed, geo, dropped])

  /* ── Drawing (pointer → viewBox coords) ─────────────────────── */

  const updCurrent = (v: Pt[] | null) => {
    currentRef.current = v
    setCurrent(v)
  }

  const toCanvas = (e: React.PointerEvent<SVGSVGElement>): Pt | null => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== 'dibujo') return
    const p = toCanvas(e)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    updCurrent([p])
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current || mode !== 'dibujo') return
    const p = toCanvas(e)
    const prev = currentRef.current
    if (!p || !prev) return
    const last = prev[prev.length - 1]
    if (Math.hypot(p.x - last.x, p.y - last.y) < 6) return
    updCurrent([...prev, p])
  }

  const onPointerUp = () => {
    if (!drawing.current) return
    drawing.current = false
    const raw = currentRef.current
    if (raw && raw.length) {
      const pts = smoothResample(raw, 10)
      setStrokes((s) => [...s, { pts, r: brush }])
    }
    updCurrent(null)
  }

  /* ── Actions ────────────────────────────────────────────────── */

  const surprise = () => {
    const pal = pick(PALETTES)
    const nextShades = Math.random() < 0.4
    const nextPool = nextShades ? paletteWithShades(pal) : pal.colors
    const n = Math.min(randInt(3, 6), nextPool.length)
    const nextGaps = Math.random() < 0.6
    setPaletteId(pal.id)
    setShades(nextShades)
    setSeq(shuffle(nextPool).slice(0, n))
    setBg(pick([INK, PAPER, ...nextPool]))
    setGaps(nextGaps)
    if (nextGaps) {
      setGapAmount(0.1 + Math.random() * 0.45)
      setGapSize(randInt(1, 4))
    }
    // Campo de color: mostly the flowing fields, sometimes classic random.
    setFieldMode(
      Math.random() < 0.4 ? 'aleatorio' : pick(['ondas', 'diagonal', 'radial'] as FieldMode[]),
    )
    const nextSel = Math.random() < 0.25
    setSelOn(nextSel)
    if (nextSel) {
      const sw = 0.2 + Math.random() * 0.3
      const sh = 0.2 + Math.random() * 0.3
      setSelW(sw)
      setSelH(sh)
      setSelX(Math.random() * (1 - sw))
      setSelY(Math.random() * (1 - sh))
    }
    const nextMerge = Math.random() < 0.35
    setMerge(nextMerge)
    if (nextMerge) setMergeAmount(0.05 + Math.random() * 0.45)
    if (mode === 'numeros') {
      setText(randomMoney())
      setFont(pick(['alta', 'ancha'] as FontId[]))
      setRotation(Math.random() < 0.75 ? 0 : pick([-30, -15, 15, 30]))
      // Mostly centred; occasionally a small offset (±0.3).
      const off = () => (Math.random() < 0.3 ? Math.round((Math.random() * 60 - 30)) / 100 : 0)
      setPosX(off())
      setPosY(off())
    }
    setSeed(newSeed())
  }

  /**
   * Switching palettes re-dresses the pattern instantly: the colour
   * sequence and the background are remapped to the equivalent slots of
   * the new palette (neutrals like paper/ink pass through). Remapping
   * into a smaller palette can collapse entries into duplicates, so the
   * result is deduped and topped back up to 3 from the new pool.
   */
  const applyPalette = (next: PaletteId) => {
    if (next === paletteId) return
    const from = getPalette(paletteId)
    const to = getPalette(next)
    const re = (c: string) => remapColor(c, from, to)
    setPaletteId(next)
    setSeq((prev) => {
      const mapped = Array.from(new Set(prev.map(re)))
      for (const c of to.colors) {
        if (mapped.length >= 3) break
        if (!mapped.includes(c)) mapped.push(c)
      }
      return mapped
    })
    setBg((b) => autoBg(b, from, to))
  }

  const addSeqColor = (c: string) =>
    setSeq((prev) => (prev.length >= 6 || prev.includes(c) ? prev : [...prev, c]))
  const removeSeqColor = (c: string) =>
    setSeq((prev) => (prev.length <= 3 ? prev : prev.filter((x) => x !== c)))

  const exportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, w, h), 'tuscfo-c3-patron.svg')
  }
  const exportPNG = () => {
    if (!svgRef.current) return
    void downloadPNG(getCleanExportSVGString(svgRef.current, w, h), w, h, 'tuscfo-c3-patron.png')
  }

  const guideColor = contrastRatio(bg ?? PAPER, PAPER) >= 3 ? PAPER : INK

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
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              cursor: mode === 'dibujo' ? 'crosshair' : undefined,
              touchAction: mode === 'dibujo' ? 'none' : undefined,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {bg && <rect x="0" y="0" width={w} height={h} fill={bg} />}
            <g transform={rotationTransform(effRotation, w, h)}>
              {geo.cells.map((cell) => {
                const key = `${cell.col},${cell.row}`
                if (dropped.has(key) || mergeInfo.consumed.has(key)) return null
                // Merged runs render as ONE wide brick spanning the run
                // (gaps included), coloured from a single field sample.
                const run = mergeInfo.starts.get(key) ?? 1
                const wPx = geo.cw + (run - 1) * geo.px
                let idx = colorIndexAt(cell.col, cell.row, cell.x + wPx / 2, cell.y + geo.ch / 2)
                // Cells inside the selection shift half a sequence away —
                // the range reads highlighted, like a selected range.
                // Merged runs count as inside via their left (anchor) cell.
                if (inSel(cell.col, cell.row)) idx = (idx + selShift) % safeSeq.length
                // 2× the logo cell's corner ratio: pattern cells are much
                // smaller than the lockup's, so 1× would read as square.
                return (
                  <rect
                    key={`${cell.col}-${cell.row}`}
                    x={cell.x}
                    y={cell.y}
                    width={wPx}
                    height={geo.ch}
                    rx={geo.ch * C3_CELL_CORNER * 2}
                    fill={safeSeq[idx]}
                  />
                )
              })}
              {selSnap &&
                (() => {
                  // The marquee is artwork: it lives in the rotated group
                  // (so it stays snapped to the grid) and it EXPORTS.
                  const strokeW = geo.ch * 0.4
                  const side = strokeW * 1.8
                  const under = side + strokeW
                  const hx = selSnap.x + selSnap.wPx
                  const hy = selSnap.y + selSnap.hPx
                  return (
                    <g pointerEvents="none">
                      <rect
                        x={selSnap.x}
                        y={selSnap.y}
                        width={selSnap.wPx}
                        height={selSnap.hPx}
                        fill="none"
                        stroke={selColor}
                        strokeWidth={strokeW}
                      />
                      {/* fill-handle: bg-coloured underlay square gives the
                          classic thin gap around the little grabber */}
                      <rect
                        x={hx - under / 2}
                        y={hy - under / 2}
                        width={under}
                        height={under}
                        fill={selBase}
                      />
                      <rect
                        x={hx - side / 2}
                        y={hy - side / 2}
                        width={side}
                        height={side}
                        fill={selColor}
                      />
                    </g>
                  )
                })()}
            </g>
            {mode === 'dibujo' && current && current.length > 1 && (
              <g className={EXPORT_EXCLUDE_CLASS} pointerEvents="none">
                <polyline
                  points={current.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={guideColor}
                  strokeWidth={3}
                  strokeDasharray="8 8"
                  opacity={0.7}
                />
              </g>
            )}
          </svg>
        </div>
      }
      panels={
        <>
          <Panel label="Modo">
            <Seg
              options={[
                { value: 'numeros' as const, label: 'Números' },
                { value: 'dibujo' as const, label: 'Dibujo' },
              ]}
              value={mode}
              onChange={setMode}
            />
            {mode === 'numeros' ? (
              <>
                <input
                  type="text"
                  className="tc-field"
                  value={text}
                  onChange={(e) =>
                    setText(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9$%+., ]/g, '')
                        .slice(0, 20),
                    )
                  }
                  placeholder="$1.024"
                  aria-label="Cifra a mostrar"
                />
                <p style={HINT}>Admite letras, números y $ % + . , — hasta 20 caracteres.</p>
                <p style={HINT}>Fuente</p>
                <Seg
                  options={[
                    { value: 'alta' as const, label: 'Alta' },
                    { value: 'ancha' as const, label: 'Ancha' },
                  ]}
                  value={font}
                  onChange={setFont}
                />
                <SliderRow
                  label="Posición X"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={posX}
                  onChange={setPosX}
                  format={(v) => `X ${Math.round(v * 100)}%`}
                />
                <SliderRow
                  label="Posición Y"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={posY}
                  onChange={setPosY}
                  format={(v) => `Y ${Math.round(v * 100)}%`}
                />
              </>
            ) : (
              <>
                <SliderRow
                  label="Pincel"
                  min={20}
                  max={160}
                  step={5}
                  value={brush}
                  onChange={setBrush}
                  format={(v) => `${v}`}
                />
                <button
                  type="button"
                  className="tc-btn"
                  onClick={() => {
                    setStrokes([])
                    updCurrent(null)
                  }}
                  disabled={!strokes.length && !current}
                >
                  Borrar dibujo
                </button>
                <p style={HINT}>
                  Dibujá con el puntero sobre el lienzo. En este modo la rotación queda pausada en 0°.
                </p>
              </>
            )}
          </Panel>

          <Panel label="Patrón">
            <button type="button" className="tc-btn tc-btn--primary" onClick={() => setSeed(newSeed())}>
              Generar patrón
            </button>
            <Check label="Invertir" checked={invert} onChange={setInvert} />
            {invert && (
              <p style={HINT}>
                Se pinta todo el campo y el contenido queda como hueco, mostrando el fondo.
              </p>
            )}
            <Check label="Huecos" checked={gaps} onChange={setGaps} />
            {gaps && (
              <>
                <SliderRow
                  label="Cantidad"
                  min={0}
                  max={0.6}
                  step={0.01}
                  value={gapAmount}
                  onChange={setGapAmount}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <SliderRow
                  label="Tamaño"
                  min={1}
                  max={4}
                  value={gapSize}
                  onChange={setGapSize}
                  format={(v) => `${v}`}
                />
              </>
            )}
            <Check label="Combinar celdas" checked={merge} onChange={setMerge} />
            {merge && (
              <>
                <SliderRow
                  label="Cantidad"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={mergeAmount}
                  onChange={setMergeAmount}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <p style={HINT}>
                  Une tramos de 2–3 celdas vecinas en ladrillos anchos, como celdas combinadas de
                  planilla.
                </p>
              </>
            )}
          </Panel>

          <Panel label="Selección">
            <Check label="Selección" checked={selOn} onChange={setSelOn} />
            {selOn && (
              <>
                <SliderRow
                  label="Posición X"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selX}
                  onChange={setSelX}
                  format={(v) => `X ${Math.round(v * 100)}%`}
                />
                <SliderRow
                  label="Posición Y"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selY}
                  onChange={setSelY}
                  format={(v) => `Y ${Math.round(v * 100)}%`}
                />
                <SliderRow
                  label="Ancho"
                  min={0.05}
                  max={1}
                  step={0.01}
                  value={selW}
                  onChange={setSelW}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <SliderRow
                  label="Alto"
                  min={0.05}
                  max={1}
                  step={0.01}
                  value={selH}
                  onChange={setSelH}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <p style={HINT}>
                  El marco se ajusta a la grilla, resalta las celdas de adentro y sale en la
                  exportación.
                </p>
              </>
            )}
          </Panel>

          <Panel label="Paleta">
            <Seg
              options={PALETTES.map((p) => ({ value: p.id, label: p.id }))}
              value={paletteId}
              onChange={applyPalette}
            />
            <Check label="Jugar con tonos" checked={shades} onChange={setShades} />
          </Panel>

          <Panel label="Secuencia de colores">
            <Swatches colors={seq} onPick={removeSeqColor} small label="Secuencia actual" />
            <p style={HINT}>Tocá un color para quitarlo (mín. 3). Sumá desde abajo (máx. 6).</p>
            <Swatches colors={seqPool} onPick={addSeqColor} small label="Colores disponibles" />
            <p style={HINT}>Campo de color</p>
            <Seg
              options={[
                { value: 'aleatorio' as const, label: 'Aleatorio' },
                { value: 'ondas' as const, label: 'Ondas' },
                { value: 'diagonal' as const, label: 'Diagonal' },
                { value: 'radial' as const, label: 'Radial' },
              ]}
              value={fieldMode}
              onChange={setFieldMode}
            />
            {fieldMode !== 'aleatorio' && (
              <p style={HINT}>
                La secuencia fluye por el campo como formato condicional: el orden de los colores
                marca la progresión.
              </p>
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
