'use client'

import { useCallback, useRef, useState } from 'react'
import { fitCubicBezier, type Bezier, type Pt } from './yarnMath'
import { EXPORT_EXCLUDE_CLASS } from './exportCanvas'

type Props = {
  onCommit: (bezier: Bezier) => void
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
export default function DrawPathOverlay({ onCommit, svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH }: Props) {
  // The in-progress stroke is React state (it renders as a live preview
  // polyline); appends are gated by MIN_SAMPLE_DIST so re-renders track hand
  // movement, not the device's report rate.
  const [stroke, setStroke] = useState<Pt[]>([])
  const drawing = useRef(false)

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
    drawing.current = true
    setStroke([toSvgPoint(e.clientX, e.clientY)])
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const p = toSvgPoint(e.clientX, e.clientY)
    setStroke((cur) => {
      const last = cur[cur.length - 1]
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < MIN_SAMPLE_DIST) return cur
      return [...cur, p]
    })
  }

  const onPointerUp = () => {
    if (!drawing.current) return
    drawing.current = false
    setStroke((cur) => {
      if (cur.length >= MIN_SAMPLES) {
        const fitted = fitCubicBezier(cur)
        if (fitted) onCommit(fitted)
      }
      // Too short / unfittable: quietly discard and stay in draw mode so
      // the user just draws again.
      return []
    })
  }

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
    </g>
  )
}
