'use client'

import { useCallback, useRef } from 'react'
import { bezierPoint, bezierNormal, type Bezier, type Pt } from './yarnMath'
import { EXPORT_EXCLUDE_CLASS } from './exportCanvas'

type Props = {
  bezier: Bezier
  resolve: number // 0..100
  onResolveChange: (resolve: number) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  viewBoxX: number
  viewBoxY: number
  viewBoxW: number
  viewBoxH: number
}

// Mirrors yarnMath.ts's buildStrokes: `tm = 0.1 + (resolve / 100) * 0.85` is
// the baseline "the mess resolves here" position along the spine (0..1).
// Kept in exact sync with that formula so the on-canvas stick always sits
// where the tangle actually settles, not an approximation of it.
const TM_MIN = 0.1
const TM_RANGE = 0.85

function resolveToT(resolve: number): number {
  return TM_MIN + (resolve / 100) * TM_RANGE
}

function tToResolve(t: number): number {
  return ((t - TM_MIN) / TM_RANGE) * 100
}

const COARSE_SAMPLES = 200
const REFINE_ITERATIONS = 20

function distSq(bezier: Bezier, t: number, target: Pt): number {
  const p = bezierPoint(bezier, t)
  const dx = p.x - target.x, dy = p.y - target.y
  return dx * dx + dy * dy
}

/**
 * Nearest t (0..1) on the bezier to `target`. No closed-form projection onto
 * a cubic, so this samples coarsely for a starting interval, then narrows it
 * with a ternary search — valid because distance-to-point along a smooth,
 * non-self-intersecting spine is unimodal in any small neighbourhood of its
 * true minimum, even though it isn't unimodal over the whole 0..1 span.
 */
function closestT(bezier: Bezier, target: Pt): number {
  let bestT = 0.5
  let bestDist = Infinity
  for (let i = 0; i <= COARSE_SAMPLES; i++) {
    const t = i / COARSE_SAMPLES
    const d = distSq(bezier, t, target)
    if (d < bestDist) {
      bestDist = d
      bestT = t
    }
  }
  const step = 1 / COARSE_SAMPLES
  let lo = Math.max(0, bestT - step)
  let hi = Math.min(1, bestT + step)
  for (let i = 0; i < REFINE_ITERATIONS; i++) {
    const m1 = lo + (hi - lo) / 3
    const m2 = hi - (hi - lo) / 3
    if (distSq(bezier, m1, target) < distSq(bezier, m2, target)) hi = m2
    else lo = m1
  }
  return (lo + hi) / 2
}

const STICK_HALF_LENGTH = 20 // px, perpendicular to the spine at the handle's position

/** Draggable "thick stick" constrained to slide along the (otherwise
 *  invisible) bezier spine, giving a direct-manipulation control for
 *  `resolve` as an alternative to the sidebar's Mess-end slider. */
export default function ResolveHandle({ bezier, resolve, onResolveChange, svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH }: Props) {
  const dragging = useRef(false)

  const toSvgPoint = useCallback(
    (clientX: number, clientY: number): Pt => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      return {
        x: viewBoxX + ((clientX - rect.left) / rect.width) * viewBoxW,
        y: viewBoxY + ((clientY - rect.top) / rect.height) * viewBoxH,
      }
    },
    [svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH]
  )

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {
      // no-op — see PathEditor's identical guard for why this can throw
    }
    dragging.current = true
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const p = toSvgPoint(e.clientX, e.clientY)
    const t = closestT(bezier, p)
    const next = Math.min(100, Math.max(0, tToResolve(t)))
    onResolveChange(next)
  }

  const onPointerUp = () => {
    dragging.current = false
  }

  const t = resolveToT(resolve)
  const center = bezierPoint(bezier, t)
  const normal = bezierNormal(bezier, t)
  const x1 = center.x - normal.x * STICK_HALF_LENGTH
  const y1 = center.y - normal.y * STICK_HALF_LENGTH
  const x2 = center.x + normal.x * STICK_HALF_LENGTH
  const y2 = center.y + normal.y * STICK_HALF_LENGTH

  return (
    <g className={EXPORT_EXCLUDE_CLASS} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {/* Wider transparent line underneath just for a comfortable hit target
          — the visible stick stays a slim, deliberate stroke width. */}
      <line className="pw-resolve-handle-hit" x1={x1} y1={y1} x2={x2} y2={y2} onPointerDown={onPointerDown} />
      <line className="pw-resolve-handle" x1={x1} y1={y1} x2={x2} y2={y2} pointerEvents="none" />
    </g>
  )
}
