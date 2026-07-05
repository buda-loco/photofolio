'use client'

import { useRef, useState } from 'react'
import { fitCubicBezier, type Bezier, type Pt } from './yarnMath'
import { EXPORT_EXCLUDE_CLASS } from './exportCanvas'
import { capturePointer, useViewBoxPoint } from './svgPointer'

type Props = {
  onCommit: (bezier: Bezier) => void
  // Rope-stabiliser length in canvas px, 0 = off. Affinity-style "rope"
  // smoothing: the nib is dragged behind the cursor on a virtual rope of
  // this length — the nib only moves once the rope is taut, and then only
  // along the rope's direction, so hand jitter shorter than the rope never
  // reaches the stroke at all (vs. window-averaging, which only dampens it).
  stabiliser: number
  svgRef: React.RefObject<SVGSVGElement | null>
  viewBoxX: number
  viewBoxY: number
  viewBoxW: number
  viewBoxH: number
}

// Ignore pointer jitter below this many canvas px between samples — keeps
// the captured polyline lean without visibly changing the fitted curve.
const MIN_SAMPLE_DIST = 3
// Fewer distinct samples than this is a click/twitch, not a drawn stroke —
// committing a bezier fitted to it would trash the current path for nothing.
const MIN_SAMPLES = 8

/** Freehand "pencil" mode: covers the canvas, captures a drawn stroke, and
 *  on release fits ONE cubic bezier through it (fitCubicBezier) which
 *  becomes the tangle's new spine — so instead of pulling four handles into
 *  position, the main shape is just... drawn. The tangle regenerates from
 *  the fitted spine, deliberately not from the raw polyline: the whole
 *  generator (resolve/scale/normals) is built around a cubic bezier. */
export default function DrawPathOverlay({ onCommit, stabiliser, svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH }: Props) {
  // The stroke lives in BOTH a ref and state: the ref is the source of
  // truth that event handlers read and write synchronously (so pointer-up
  // can fit + commit OUTSIDE any state updater — React requires updaters to
  // be pure, and calling onCommit inside one double-fires the parent
  // setState under StrictMode); the state mirror exists only to render the
  // live preview polyline. setStroke here always receives a plain value,
  // never an updater with side effects.
  const strokeRef = useRef<Pt[]>([])
  const [stroke, setStroke] = useState<Pt[]>([])
  // Live cursor position while drawing — only used to render the rope
  // affordance (nib→cursor line + slack-radius circle), never fed to the fit.
  const [cursor, setCursor] = useState<Pt | null>(null)
  const drawing = useRef(false)
  // The stabilised pen tip. With stabiliser 0 this is just the cursor.
  const nib = useRef<Pt | null>(null)

  const setStrokeBoth = (pts: Pt[]) => {
    strokeRef.current = pts
    setStroke(pts)
  }

  const toSvgPoint = useViewBoxPoint(svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH)

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    capturePointer(e)
    drawing.current = true
    const p = toSvgPoint(e.clientX, e.clientY)
    nib.current = p
    setCursor(p)
    setStrokeBoth([p])
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const c = toSvgPoint(e.clientX, e.clientY)
    setCursor(c)

    // Rope constraint: the nib stays put until the cursor is more than
    // `stabiliser` px away, then advances only by the excess, along the
    // rope. Jitter inside the rope's slack is structurally filtered out.
    const n = nib.current ?? c
    const dx = c.x - n.x
    const dy = c.y - n.y
    const dist = Math.hypot(dx, dy)
    if (dist <= stabiliser || dist === 0) return
    const advance = dist - stabiliser
    const next = { x: n.x + (dx / dist) * advance, y: n.y + (dy / dist) * advance }
    nib.current = next

    const cur = strokeRef.current
    const last = cur[cur.length - 1]
    if (last && Math.hypot(next.x - last.x, next.y - last.y) < MIN_SAMPLE_DIST) return
    setStrokeBoth([...cur, next])
  }

  const onPointerUp = () => {
    if (!drawing.current) return
    drawing.current = false
    nib.current = null
    setCursor(null)
    // Read + clear via the ref, then fit/commit as plain event-handler code
    // — no work inside a state updater (see strokeRef comment above).
    const pts = strokeRef.current
    setStrokeBoth([])
    if (pts.length >= MIN_SAMPLES) {
      const fitted = fitCubicBezier(pts)
      if (fitted) onCommit(fitted)
    }
    // Too short / unfittable: quietly discard and stay in draw mode so the
    // user just draws again.
  }

  const nibPoint = stroke[stroke.length - 1] ?? null

  return (
    <g className={EXPORT_EXCLUDE_CLASS} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {/* Full-viewBox capture surface — sized to the CURRENT (possibly
          zoomed-out) viewBox so strokes can be drawn into the off-canvas
          margin too. */}
      <rect
        className="pw-draw-surface"
        x={viewBoxX}
        y={viewBoxY}
        width={viewBoxW}
        height={viewBoxH}
        fill="transparent"
        onPointerDown={onPointerDown}
      />
      {stroke.length > 1 && (
        <polyline
          className="pw-draw-preview"
          points={stroke.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        />
      )}
      {/* Rope affordance while stabilised drawing: the slack circle around
          the nib (movement inside it is ignored) and the rope line out to
          the cursor — same visual language Affinity uses, so the lag reads
          as a tool behaviour rather than input latency. */}
      {cursor && nibPoint && stabiliser > 0 && (
        <>
          <circle className="pw-draw-rope-radius" cx={nibPoint.x} cy={nibPoint.y} r={stabiliser} />
          <line className="pw-draw-rope" x1={nibPoint.x} y1={nibPoint.y} x2={cursor.x} y2={cursor.y} />
        </>
      )}
    </g>
  )
}
