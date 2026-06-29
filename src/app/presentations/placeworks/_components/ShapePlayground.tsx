'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/* Concept 03 — the kit of parts. The five shapes that build the PW monogram
   break apart and re-solve to fit any container — varying size, position and
   rotation by the space available — then settle with a little bounce. */

type Kind = 'rect' | 'circle'
type ShapeDef = { id: string; kind: Kind; ratio: number; weight: number }
type Geo = { x: number; y: number; r: number; rot: number }

// kit order matches the monogram order below
const SHAPES: ShapeDef[] = [
  { id: 'sand', kind: 'rect', ratio: 0.5, weight: 1.0 },
  { id: 'navy', kind: 'rect', ratio: 0.5, weight: 0.5 },
  { id: 'stone', kind: 'rect', ratio: 0.5, weight: 1.0 },
  { id: 'plum', kind: 'rect', ratio: 0.5, weight: 1.0 },
  { id: 'terra', kind: 'circle', ratio: 1, weight: 0.67 },
]

// PlaceWorks palette — earth, stone, sand, dusk.
const PALETTE = [
  { id: 'sand', hex: '#e8c883' },
  { id: 'rose', hex: '#d9a49f' },
  { id: 'terra', hex: '#d2875e' },
  { id: 'peri', hex: '#aaa8d7' },
  { id: 'stone', hex: '#aaccce' },
  { id: 'indigo', hex: '#3d3d6b' },
  { id: 'plum', hex: '#2a2434' },
]
const PALETTE_HEX = PALETTE.map((p) => p.hex)
const BG_OPTIONS = ['#000000', ...PALETTE_HEX]

const VB_W = 1000
const VB_H = 640

// The PW monogram (pw.svg) mapped into the viewBox — exact starting layout
// (position, size and rotation derived from the SVG transforms).
const MONOGRAM: Geo[] = [
  { x: 146.9, y: 319.7, r: 149.6, rot: 0 },          // sand — tall bar
  { x: 670.3, y: 252.9, r: 74.8, rot: 0 },           // navy — small bar
  { x: 545.5, y: 319.7, r: 149.6, rot: -0.5236 },    // stone — tilted bar
  { x: 795.2, y: 319.7, r: 149.6, rot: 0.5236 },     // plum — tilted bar
  { x: 317.2, y: 286.3, r: 100.3, rot: 0 },          // terra — circle
]

const DURATION = 760

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// overshoot easing → a little bounce-back as shapes settle
function easeOutBack(t: number) {
  const c1 = 1.5
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Greedy non-overlap packing using bounding-circle tests.
function pack(W: number, H: number, ox: number, oy: number, seed: number, density: number, sizeVar: number): Geo[] {
  let k = Math.min(W, H) * 0.19 * density
  let best: Geo[] = []
  for (let attempt = 0; attempt < 16; attempt++) {
    const rng = mulberry32((seed * 100003 + attempt) >>> 0)
    const placed: Geo[] = []
    let ok = true
    for (const sh of SHAPES) {
      const vf = Math.max(0.25, 1 + (rng() - 0.5) * 2 * sizeVar) // per-shape size jitter
      const r = k * sh.weight * vf
      const gap = k * 0.1
      let done = false
      if (W - 2 * r > 0 && H - 2 * r > 0) {
        for (let t = 0; t < 500; t++) {
          const x = r + rng() * (W - 2 * r)
          const y = r + rng() * (H - 2 * r)
          let clash = false
          for (const p of placed) {
            if (Math.hypot(p.x - ox - x, p.y - oy - y) < p.r + r + gap) { clash = true; break }
          }
          if (!clash) {
            let rot = 0
            if (sh.kind === 'rect') rot = (rng() - 0.5) * 1.4
            placed.push({ x: ox + x, y: oy + y, r, rot })
            done = true
            break
          }
        }
      }
      if (!done) { ok = false; break }
    }
    if (ok) return placed
    if (placed.length > best.length) best = placed
    k *= 0.9
  }
  return best
}

function rectDims(r: number, ratio: number) {
  const h = (2 * r) / Math.sqrt(ratio * ratio + 1)
  return { w: ratio * h, h }
}

// axis-aligned bounds + centre of a (possibly rotated) shape
function boundsOf(g: Geo, sh: ShapeDef) {
  if (sh.kind === 'circle') {
    return { l: g.x - g.r, r: g.x + g.r, t: g.y - g.r, b: g.y + g.r, cx: g.x, cy: g.y }
  }
  const { w, h } = rectDims(g.r, sh.ratio)
  const c = Math.cos(g.rot), s = Math.sin(g.rot)
  const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(
    ([x, y]) => [g.x + x * c - y * s, g.y + x * s + y * c],
  )
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  return { l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys), b: Math.max(...ys), cx: g.x, cy: g.y }
}

// merge near-coincident coordinates into single guide lines
function cluster(vals: number[], tol: number) {
  const s = [...vals].sort((a, b) => a - b)
  const out: number[] = []
  let grp = [s[0]]
  for (let i = 1; i < s.length; i++) {
    if (s[i] - grp[grp.length - 1] <= tol) grp.push(s[i])
    else { out.push(grp.reduce((a, b) => a + b, 0) / grp.length); grp = [s[i]] }
  }
  if (grp.length) out.push(grp.reduce((a, b) => a + b, 0) / grp.length)
  return out
}

export default function ShapePlayground() {
  const [cw, setCw] = useState(620)
  const [ch, setCh] = useState(440)
  const [density, setDensity] = useState(1)
  const [sizeVar, setSizeVar] = useState(30)
  const [seed, setSeed] = useState(3)
  const [bg, setBg] = useState('#000000')
  const [active, setActive] = useState<string[]>(PALETTE_HEX)
  const [grid, setGrid] = useState(false)
  const [blend, setBlend] = useState(0)
  const [overlay, setOverlay] = useState(false)

  const ox = (VB_W - cw) / 2
  const oy = (VB_H - ch) / 2

  // hold on the monogram briefly, then break it apart into the kit
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setStarted(true), 1100)
    return () => clearTimeout(id)
  }, [])

  // packed target, always 5 entries (monogram fallback for any that can't place)
  const target = useMemo(() => {
    if (!started) return MONOGRAM
    const p = pack(cw, ch, ox, oy, seed, density, (sizeVar / 100) * 0.85)
    return MONOGRAM.map((m, i) => p[i] ?? m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, cw, ch, seed, density, sizeVar])

  const [disp, setDisp] = useState<Geo[]>(MONOGRAM)
  const dispRef = useRef<Geo[]>(MONOGRAM)
  const rafRef = useRef(0)

  // animate disp → target with an overshoot bounce whenever target changes
  useEffect(() => {
    const from = dispRef.current
    const to = target
    let start = 0
    cancelAnimationFrame(rafRef.current)
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / DURATION)
      const e = easeOutBack(t)
      const next = to.map((g, i) => {
        const f = from[i] ?? g
        return { x: lerp(f.x, g.x, e), y: lerp(f.y, g.y, e), r: lerp(f.r, g.r, e), rot: lerp(f.rot, g.rot, e) }
      })
      dispRef.current = next
      setDisp(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  // assign each shape a colour from the active palette (stable until reshuffle)
  const colors = useMemo(() => {
    const pool = active.length ? active : ['#ffffff']
    const rng = mulberry32((seed * 2654435761) >>> 0)
    return SHAPES.map(() => pool[Math.floor(rng() * pool.length)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, active.join(',')])

  // design grid: guide lines derived from every shape's edges + centres
  const guides = useMemo(() => {
    const xs: number[] = []
    const ys: number[] = []
    disp.forEach((g, i) => {
      const b = boundsOf(g, SHAPES[i])
      xs.push(b.l, b.cx, b.r)
      ys.push(b.t, b.cy, b.b)
    })
    return { vx: cluster(xs, 9), hy: cluster(ys, 9) }
  }, [disp])

  // blend: grow + blur each shape so colours bleed into a multi-gradient field
  // grow large (so blobs fully cover the box — no black gaps) + a moderate
  // sRGB blur → palette colours stay pure, only the seams soften, so the mesh
  // fills the frame without diluting to mud.
  const grow = 1 + (blend / 100) * 4.2
  const blurAmt = (blend / 100) * 90
  const blobs = useMemo(() => disp.map((g) => ({ ...g, r: g.r * grow })), [disp, grow])

  const toggleColor = (hex: string) => {
    setActive((cur) => {
      if (cur.includes(hex)) return cur.length > 1 ? cur.filter((c) => c !== hex) : cur
      return PALETTE_HEX.filter((h) => h === hex || cur.includes(h))
    })
  }

  const shapeSVG = (g: Geo, i: number, forExport: boolean) => {
    const sh = SHAPES[i]
    const color = colors[i % colors.length]
    const deg = (g.rot * 180) / Math.PI
    if (sh.kind === 'circle') {
      const rr = g.r
      return forExport
        ? `<circle cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${color}"/>`
        : <circle key={i} cx={g.x} cy={g.y} r={rr} fill={color} />
    }
    const { w, h } = rectDims(g.r, sh.ratio)
    if (forExport) {
      return `<rect x="${(g.x - w / 2).toFixed(1)}" y="${(g.y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" transform="rotate(${deg.toFixed(2)} ${g.x.toFixed(1)} ${g.y.toFixed(1)})"/>`
    }
    return <rect key={i} x={g.x - w / 2} y={g.y - h / 2} width={w} height={h} fill={color} transform={`rotate(${deg} ${g.x} ${g.y})`} />
  }

  const buildSVG = (scale = 1) => {
    const shapesSVG = blobs.map((g, i) => shapeSVG(g, i, true)).join('')
    const crispSVG = disp.map((g, i) => shapeSVG(g, i, true)).join('')
    const defs = blend > 0
      ? `<defs><clipPath id="c3clip"><rect x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="${cw}" height="${ch}"/></clipPath>` +
        `<filter id="c3blur" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">` +
        `<feGaussianBlur stdDeviation="${blurAmt.toFixed(1)}"/>` +
        `</filter></defs>`
      : ''
    const body = blend > 0
      ? `${defs}<g clip-path="url(#c3clip)"><g filter="url(#c3blur)">${shapesSVG}</g></g>${overlay ? crispSVG : ''}`
      : crispSVG
    const gridSVG = grid
      ? guides.vx.map((x) => `<line x1="${x.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(oy + ch).toFixed(1)}" stroke="#f4ff26" stroke-opacity="0.5" stroke-width="1"/>`).join('') +
        guides.hy.map((y) => `<line x1="${ox.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(ox + cw).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#f4ff26" stroke-opacity="0.5" stroke-width="1"/>`).join('')
      : ''
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${(cw * scale).toFixed(0)}" height="${(ch * scale).toFixed(0)}" viewBox="${ox.toFixed(1)} ${oy.toFixed(1)} ${cw} ${ch}"><rect x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="${cw}" height="${ch}" fill="${bg}"/>${body}${gridSVG}</svg>`
  }

  const exportSVG = () => {
    const blob = new Blob([buildSVG(1)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'placeworks-shapes.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPNG = () => {
    const scale = 2
    const blob = new Blob([buildSVG(scale)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(cw * scale)
      canvas.height = Math.round(ch * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'placeworks-shapes.png'
      a.click()
    }
    img.src = url
  }

  const swatch = (hex: string, on: boolean, onClick: () => void) => (
    <button
      key={hex}
      onClick={onClick}
      aria-label={hex}
      title={hex}
      style={{
        width: 24, height: 24, borderRadius: 4, background: hex, cursor: 'pointer', padding: 0,
        border: on ? '2px solid var(--pw-accent)' : '1px solid rgba(255,255,255,0.28)',
        boxShadow: on ? '0 0 0 1px var(--pw-accent)' : 'none',
      }}
    />
  )

  return (
    <div className="pw-tool">
      <div className="pw-tool-stage">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label="PlaceWorks monogram breaking into a kit of parts that fits a container">
          <defs>
            <clipPath id="c3clip"><rect x={ox} y={oy} width={cw} height={ch} /></clipPath>
            {blend > 0 && (
              <filter id="c3blur" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation={blurAmt} />
              </filter>
            )}
          </defs>
          {/* background is limited to the box — the same extent as the mesh */}
          <rect x={ox} y={oy} width={cw} height={ch} fill={bg} stroke="#808080" strokeOpacity={0.45} strokeWidth={1} />
          <g clipPath={blend > 0 ? 'url(#c3clip)' : undefined}>
            <g filter={blend > 0 ? 'url(#c3blur)' : undefined}>
              {blobs.map((g, i) => shapeSVG(g, i, false))}
            </g>
          </g>
          {/* crisp shapes on top of the gradient */}
          {overlay && blend > 0 && disp.map((g, i) => shapeSVG(g, i, false))}
          {grid && (
            <g>
              {guides.vx.map((x, i) => (
                <line key={`vx${i}`} x1={x} y1={oy} x2={x} y2={oy + ch} stroke="var(--pw-accent)" strokeOpacity={0.5} strokeWidth={1} />
              ))}
              {guides.hy.map((y, i) => (
                <line key={`hy${i}`} x1={ox} y1={y} x2={ox + cw} y2={y} stroke="var(--pw-accent)" strokeOpacity={0.5} strokeWidth={1} />
              ))}
            </g>
          )}
        </svg>
      </div>

      <div className="pw-controls">
        <span className="pw-slider">
          Width
          <input type="range" min={260} max={960} value={cw} onChange={(e) => setCw(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Height
          <input type="range" min={200} max={600} value={ch} onChange={(e) => setCh(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Density
          <input type="range" min={0.6} max={1.5} step={0.02} value={density} onChange={(e) => setDensity(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Size&nbsp;var
          <input type="range" min={0} max={100} value={sizeVar} onChange={(e) => setSizeVar(+e.target.value)} />
        </span>
        <span className="pw-slider">
          Blend
          <input type="range" min={0} max={100} value={blend} onChange={(e) => setBlend(+e.target.value)} />
        </span>
        <label className="pw-toggle">
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          <span className="pw-toggle-track" />
          Overlay
        </label>

        <span className="pw-slider" style={{ flex: '0 0 auto', gap: '0.7rem' }}>
          BG
          <span style={{ display: 'inline-flex', gap: 6 }}>
            {BG_OPTIONS.map((hex) => swatch(hex, bg === hex, () => setBg(hex)))}
          </span>
        </span>
        <span className="pw-slider" style={{ flex: '0 0 auto', gap: '0.7rem' }}>
          Shapes
          <span style={{ display: 'inline-flex', gap: 6 }}>
            {PALETTE_HEX.map((hex) => swatch(hex, active.includes(hex), () => toggleColor(hex)))}
          </span>
        </span>

        <label className="pw-toggle">
          <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} />
          <span className="pw-toggle-track" />
          Grid
        </label>

        <button className="pw-btn pw-btn--solid" onClick={() => { setStarted(true); setSeed((s) => s + 1) }}>Randomise</button>
        <button className="pw-btn" onClick={exportSVG} style={{ marginLeft: 'auto' }}>Export SVG</button>
        <button className="pw-btn" onClick={exportPNG}>Export PNG</button>
      </div>
    </div>
  )
}
