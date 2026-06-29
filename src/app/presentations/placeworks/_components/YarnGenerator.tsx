'use client'

import { useMemo, useState } from 'react'

/* Concept 02 — entropy generator. A bundle of strands begins as a dense
   tangle at one edge and resolves into clean, ordered parallel lines at the
   opposite edge. Fully procedural — direction, mess and the transition are
   all adjustable. Just the lines. */

const LINE = '#ffffff'
const PAPER = '#000000'
const VB_W = 1600
const VB_H = 900
const MARGIN = 70
const SAMPLES = 220
const STRAND_MAX = 60
const OCT_MAX = 6
const TWO_PI = Math.PI * 2

type Pt = { x: number; y: number }
type Dir = 'LR' | 'RL' | 'TB' | 'BT'
type Octave = { f: number; ph: number; a: number }
type Strand = { perp: Octave[]; along: Octave[]; tmJit: number }

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function catmullRom(points: Pt[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

// stable per-seed harmonics so moving sliders doesn't re-roll the tangle
function buildHarmonics(seed: number): Strand[] {
  const rng = mulberry32((seed * 2654435761) >>> 0)
  const strands: Strand[] = []
  for (let s = 0; s < STRAND_MAX; s++) {
    const perp: Octave[] = []
    const along: Octave[] = []
    for (let o = 0; o < OCT_MAX; o++) {
      perp.push({ f: (o + 1) * (0.8 + rng() * 1.7), ph: rng() * TWO_PI, a: 1 / (o + 1) })
      along.push({ f: (o + 1) * (0.7 + rng() * 1.5), ph: rng() * TWO_PI, a: 1 / (o + 1) })
    }
    strands.push({ perp, along, tmJit: rng() - 0.5 })
  }
  return strands
}

function fractal(oct: Octave[], n: number, p: number) {
  let v = 0, norm = 0
  for (let o = 0; o < n; o++) {
    v += oct[o].a * Math.sin(TWO_PI * oct[o].f * p + oct[o].ph)
    norm += oct[o].a
  }
  return v / norm
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

type Params = {
  lines: number; mess: number; detail: number; resolve: number; sharp: number
  span: number; spread: number; pinch: number; pinchPos: number; dir: Dir; seed: number
}

function build(h: Strand[], { lines, mess, detail, resolve, sharp, span, spread, pinch, pinchPos, dir }: Params) {
  const amp = (mess / 100) * 0.58 // perp swing as fraction of the cross dimension
  const oct = Math.max(1, Math.min(OCT_MAX, Math.round(detail)))
  const tm = 0.1 + (resolve / 100) * 0.85 // where the mess resolves along the run
  const width = 0.5 - (sharp / 100) * 0.46 // transition width: high sharp → abrupt
  const spanFrac = 0.25 + (span / 100) * 0.75 // run length along the main axis
  const laneSpread = (spread / 100) * 0.96 // 0 → lines converge to the centre at the resolved end
  const pinchAmt = pinch / 100 // 0..1 — how tightly the lines neck in at the pinch
  const pinchAt = pinchPos / 100 // 0 (mess) … 1 (resolved) — where the waist sits
  const pinchW = 0.11 // spread of the pinch influence along the run

  const innerW = VB_W - MARGIN * 2
  const innerH = VB_H - MARGIN * 2
  // a = mess(0) → resolved(1) along the run, q = ordered position across it [0,1]
  const mapXY = (a: number, q: number): Pt => {
    if (dir === 'LR') return { x: MARGIN + a * spanFrac * innerW, y: MARGIN + q * innerH }
    if (dir === 'RL') return { x: MARGIN + innerW - a * spanFrac * innerW, y: MARGIN + q * innerH }
    if (dir === 'TB') return { y: MARGIN + a * spanFrac * innerH, x: MARGIN + q * innerW }
    return { y: MARGIN + innerH - a * spanFrac * innerH, x: MARGIN + q * innerW } // BT
  }

  const out: { d: string; opacity: number }[] = []
  for (let i = 0; i < lines; i++) {
    const s = h[i % STRAND_MAX]
    // resolved lane, gathered toward the centre by `laneSpread`
    const lane = 0.5 + ((i + 0.5) / lines - 0.5) * laneSpread
    const tmS = Math.max(0.04, Math.min(0.97, tm + s.tmJit * 0.16)) // organic stagger
    const pts: Pt[] = []
    for (let j = 0; j <= SAMPLES; j++) {
      const p = j / SAMPLES
      const win = 1 - smoothstep(tmS - width / 2, tmS + width / 2, p)
      let perp = lane + amp * win * fractal(s.perp, oct, p)
      // pinch: neck the lines toward the centre near the pinch position
      const pf = 1 - pinchAmt * Math.exp(-((p - pinchAt) ** 2) / (2 * pinchW * pinchW))
      perp = 0.5 + (perp - 0.5) * pf
      const perpN = Math.max(0.008, Math.min(0.992, perp))
      const alongN = Math.max(0, Math.min(1, p + amp * 0.5 * win * fractal(s.along, oct, p)))
      pts.push(mapXY(alongN, perpN))
    }
    out.push({ d: catmullRom(pts), opacity: 0.5 + (i % 4) * 0.12 })
  }
  return out
}

const DIRS: { id: Dir; label: string }[] = [
  { id: 'LR', label: 'L → R' },
  { id: 'RL', label: 'R → L' },
  { id: 'TB', label: 'T → B' },
  { id: 'BT', label: 'B → T' },
]

export default function YarnGenerator() {
  const [lines, setLines] = useState(12)
  const [mess, setMess] = useState(68)
  const [detail, setDetail] = useState(4)
  const [resolve, setResolve] = useState(58)
  const [sharp, setSharp] = useState(45)
  const [span, setSpan] = useState(100)
  const [spread, setSpread] = useState(72)
  const [pinch, setPinch] = useState(0)
  const [pinchPos, setPinchPos] = useState(100)
  const [dir, setDir] = useState<Dir>('LR')
  const [seed, setSeed] = useState(7)

  const harmonics = useMemo(() => buildHarmonics(seed), [seed])
  const strokes = useMemo(
    () => build(harmonics, { lines, mess, detail, resolve, sharp, span, spread, pinch, pinchPos, dir, seed }),
    [harmonics, lines, mess, detail, resolve, sharp, span, spread, pinch, pinchPos, dir, seed],
  )
  const axisLabel = dir === 'LR' || dir === 'RL' ? 'Width' : 'Height'

  const exportSVG = () => {
    const paths = strokes
      .map((s) => `<path d="${s.d}" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-opacity="${s.opacity.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}"><rect width="${VB_W}" height="${VB_H}" fill="${PAPER}"/>${paths}</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'placeworks-entropy.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pw-tool">
      <div className="pw-tool-stage">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label="Entropy generator — a tangle resolving into ordered lines">
          <rect width={VB_W} height={VB_H} fill={PAPER} />
          {strokes.map((s, i) => (
            <path key={i} d={s.d} fill="none" stroke={LINE} strokeWidth={2.2} strokeOpacity={s.opacity} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      </div>

      <div className="pw-controls">
        {DIRS.map((d) => (
          <button
            key={d.id}
            className={`pw-btn${dir === d.id ? ' pw-btn--solid' : ''}`}
            onClick={() => setDir(d.id)}
          >
            {d.label}
          </button>
        ))}

        <span className="pw-slider">
          Lines&nbsp;·&nbsp;{lines}
          <input type="range" min={2} max={48} value={lines} onChange={(e) => setLines(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Mess
          <input type="range" min={0} max={100} value={mess} onChange={(e) => setMess(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Detail
          <input type="range" min={1} max={6} value={detail} onChange={(e) => setDetail(+e.target.value)} />
        </span>
        <span className="pw-slider">
          {axisLabel}
          <input type="range" min={20} max={100} value={span} onChange={(e) => setSpan(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Spread
          <input type="range" min={0} max={100} value={spread} onChange={(e) => setSpread(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Pinch
          <input type="range" min={0} max={100} value={pinch} onChange={(e) => setPinch(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Pinch&nbsp;pos
          <input type="range" min={0} max={100} value={pinchPos} onChange={(e) => setPinchPos(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Resolve&nbsp;point
          <input type="range" min={0} max={100} value={resolve} onChange={(e) => setResolve(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Sharpness
          <input type="range" min={0} max={100} value={sharp} onChange={(e) => setSharp(+e.target.value)} />
        </span>

        <button className="pw-btn" onClick={() => setSeed((s) => s + 1)}>Randomise</button>
        <button className="pw-btn pw-btn--solid" onClick={exportSVG} style={{ marginLeft: 'auto' }}>Export SVG</button>
      </div>
    </div>
  )
}
