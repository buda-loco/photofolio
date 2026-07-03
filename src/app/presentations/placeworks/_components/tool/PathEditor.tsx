'use client'

import { useCallback, useRef } from 'react'
import { SCALE_MIN, SCALE_MAX, type Pt } from './yarnMath'
import { EXPORT_EXCLUDE_CLASS } from './exportCanvas'

export type PathValue = { start: Pt; startHandle: Pt; end: Pt; endHandle: Pt; startScale: number; endScale: number }

type Props = PathValue & {
  onChange: (next: PathValue) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  // Current viewBox rect of svgRef's <svg>, in its own coordinate units — NOT
  // assumed to start at (0,0): the zoom control in BrandAssetTool expands the
  // viewBox symmetrically around the canvas to reveal off-canvas handles, so
  // pointer->SVG-point conversion has to account for that origin, not just
  // the width/height.
  viewBoxX: number
  viewBoxY: number
  viewBoxW: number
  viewBoxH: number
}

type PositionKey = 'start' | 'startHandle' | 'end' | 'endHandle'
type ScaleKey = 'startScale' | 'endScale'
type DragKey = PositionKey | ScaleKey

// Rest position (not dragging) of a scale handle: offset perpendicular to the
// anchor->handle segment, from that segment's midpoint — "on the center of
// the handles" per the brief. Distance from the midpoint encodes the scale
// value; direction is just for a legible resting position, not meaningful in
// itself, since drag response only tracks distance (see scaleFromDistance).
const SCALE_HANDLE_BASE_RADIUS = 22 // px from midpoint at scale === 1
const SCALE_HANDLE_RADIUS_PER_UNIT = 16 // px per 1.0 of scale beyond 1

function segmentMid(anchor: Pt, handle: Pt): Pt {
  return { x: (anchor.x + handle.x) / 2, y: (anchor.y + handle.y) / 2 }
}

function scaleHandlePos(anchor: Pt, handle: Pt, scale: number): Pt {
  const dx = handle.x - anchor.x, dy = handle.y - anchor.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len, ny = dx / len // perpendicular to the anchor->handle segment
  const mid = segmentMid(anchor, handle)
  const radius = SCALE_HANDLE_BASE_RADIUS + (scale - 1) * SCALE_HANDLE_RADIUS_PER_UNIT
  return { x: mid.x + nx * radius, y: mid.y + ny * radius }
}

function scaleFromDistance(mid: Pt, pointer: Pt): number {
  const dist = Math.hypot(pointer.x - mid.x, pointer.y - mid.y)
  const raw = 1 + (dist - SCALE_HANDLE_BASE_RADIUS) / SCALE_HANDLE_RADIUS_PER_UNIT
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, raw))
}

export default function PathEditor({
  start, startHandle, end, endHandle, startScale, endScale,
  onChange, svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH,
}: Props) {
  const dragging = useRef<DragKey | null>(null)

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
    const key = dragging.current
    if (!key) return
    const p = toSvgPoint(e.clientX, e.clientY)

    if (key === 'startScale' || key === 'endScale') {
      const anchor = key === 'startScale' ? start : end
      const handle = key === 'startScale' ? startHandle : endHandle
      const scale = scaleFromDistance(segmentMid(anchor, handle), p)
      onChange({
        start, startHandle, end, endHandle,
        startScale: key === 'startScale' ? scale : startScale,
        endScale: key === 'endScale' ? scale : endScale,
      })
      return
    }

    onChange({ start, startHandle, end, endHandle, startScale, endScale, [key]: p })
  }

  const onPointerUp = () => {
    dragging.current = null
  }

  const dot = (key: PositionKey, pt: Pt) => (
    <circle key={key} className="pw-handle" cx={pt.x} cy={pt.y} r={8} onPointerDown={onPointerDown(key)} />
  )

  const scaleDot = (key: ScaleKey, pt: Pt) => (
    <circle key={key} className="pw-scale-handle" cx={pt.x} cy={pt.y} r={6} onPointerDown={onPointerDown(key)} />
  )

  const startMid = segmentMid(start, startHandle)
  const endMid = segmentMid(end, endHandle)
  const startScalePos = scaleHandlePos(start, startHandle, startScale)
  const endScalePos = scaleHandlePos(end, endHandle, endScale)

  return (
    <g className={EXPORT_EXCLUDE_CLASS} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <line className="pw-handle-line" x1={start.x} y1={start.y} x2={startHandle.x} y2={startHandle.y} />
      <line className="pw-handle-line" x1={end.x} y1={end.y} x2={endHandle.x} y2={endHandle.y} />
      <line className="pw-scale-handle-line" x1={startMid.x} y1={startMid.y} x2={startScalePos.x} y2={startScalePos.y} />
      <line className="pw-scale-handle-line" x1={endMid.x} y1={endMid.y} x2={endScalePos.x} y2={endScalePos.y} />
      {dot('start', start)}
      {dot('startHandle', startHandle)}
      {dot('end', end)}
      {dot('endHandle', endHandle)}
      {scaleDot('startScale', startScalePos)}
      {scaleDot('endScale', endScalePos)}
    </g>
  )
}
