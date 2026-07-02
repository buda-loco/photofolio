'use client'

import { useCallback, useRef } from 'react'
import type { Pt } from './yarnMath'

type Props = {
  start: Pt
  startHandle: Pt
  end: Pt
  endHandle: Pt
  onChange: (next: { start: Pt; startHandle: Pt; end: Pt; endHandle: Pt }) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  viewBoxW: number
  viewBoxH: number
}

type DragKey = 'start' | 'startHandle' | 'end' | 'endHandle'

export default function PathEditor({ start, startHandle, end, endHandle, onChange, svgRef, viewBoxW, viewBoxH }: Props) {
  const dragging = useRef<DragKey | null>(null)

  const toSvgPoint = useCallback(
    (clientX: number, clientY: number): Pt => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      return {
        x: ((clientX - rect.left) / rect.width) * viewBoxW,
        y: ((clientY - rect.top) / rect.height) * viewBoxH,
      }
    },
    [svgRef, viewBoxW, viewBoxH]
  )

  const onPointerDown = (key: DragKey) => (e: React.PointerEvent) => {
    e.stopPropagation()
    // setPointerCapture can throw (e.g. NotFoundError) in edge cases where the
    // browser doesn't recognise the pointer id as active. Swallow it rather
    // than let it escape as an uncaught exception — worst case we lose
    // capture (tracking degrades once the cursor leaves the 16px hit target)
    // but the drag still starts and works while the cursor stays over it.
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {
      // no-op — see comment above
    }
    dragging.current = key
  }

  // Handlers live on the wrapping <g> (not the individual circles) so that
  // pointer capture — set on the circle in onPointerDown — continues to
  // deliver move/up events to this listener even once the cursor leaves the
  // 16px-diameter circle or the canvas bounds entirely. Capture routes the
  // events to the captured element (the circle), and since the circle is a
  // descendant of this <g>, the event still bubbles up here.
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const p = toSvgPoint(e.clientX, e.clientY)
    const next = { start, startHandle, end, endHandle }
    next[dragging.current] = p
    onChange(next)
  }

  const onPointerUp = () => {
    dragging.current = null
  }

  const dot = (key: DragKey, pt: Pt) => (
    <circle key={key} className="pw-handle" cx={pt.x} cy={pt.y} r={8} onPointerDown={onPointerDown(key)} />
  )

  return (
    <g onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <line className="pw-handle-line" x1={start.x} y1={start.y} x2={startHandle.x} y2={startHandle.y} />
      <line className="pw-handle-line" x1={end.x} y1={end.y} x2={endHandle.x} y2={endHandle.y} />
      {dot('start', start)}
      {dot('startHandle', startHandle)}
      {dot('end', end)}
      {dot('endHandle', endHandle)}
    </g>
  )
}
