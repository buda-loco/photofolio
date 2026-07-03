'use client'

import { useCallback, useRef } from 'react'
import { SCALE_MIN, SCALE_MAX, bezierPoint, type Pt } from './yarnMath'
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
// Multi-point translate gizmos, three tiers of granularity: 'move' shifts all
// four points (the whole curve); 'startCouple'/'endCouple' shift just one
// anchor+its own control point together (one "bezier couple"), leaving the
// other end untouched.
type GroupKey = 'move' | 'startCouple' | 'endCouple'
type DragKey = PositionKey | ScaleKey | GroupKey

const GROUP_POINTS: Record<GroupKey, PositionKey[]> = {
  move: ['start', 'startHandle', 'end', 'endHandle'],
  startCouple: ['start', 'startHandle'],
  endCouple: ['end', 'endHandle'],
}

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
  // Only used while dragging a group gizmo ('move'/'startCouple'/'endCouple'):
  // a delta-drag needs a fixed reference (pointer position + all 4 points at
  // drag start), unlike the position dots which just set the dragged point
  // straight to the live pointer SVG coordinate each move event. Always
  // snapshots all 4 points regardless of which group is being dragged —
  // simpler than branching, and the unused ones are just ignored below.
  const groupOrigin = useRef<{ pointerStart: Pt; start: Pt; startHandle: Pt; end: Pt; endHandle: Pt } | null>(null)

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

  const isGroupKey = (key: DragKey): key is GroupKey => key === 'move' || key === 'startCouple' || key === 'endCouple'

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
    if (isGroupKey(key)) {
      groupOrigin.current = { pointerStart: toSvgPoint(e.clientX, e.clientY), start, startHandle, end, endHandle }
    }
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

    if (isGroupKey(key)) {
      const origin = groupOrigin.current
      if (!origin) return
      const dx = p.x - origin.pointerStart.x
      const dy = p.y - origin.pointerStart.y
      const moved = GROUP_POINTS[key]
      const shift = (k: PositionKey, current: Pt): Pt => (moved.includes(k) ? { x: origin[k].x + dx, y: origin[k].y + dy } : current)
      onChange({
        start: shift('start', start),
        startHandle: shift('startHandle', startHandle),
        end: shift('end', end),
        endHandle: shift('endHandle', endHandle),
        startScale,
        endScale,
      })
      return
    }

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
    groupOrigin.current = null
  }

  const dot = (key: PositionKey, pt: Pt) => (
    <circle key={key} className="pw-handle" cx={pt.x} cy={pt.y} r={8} onPointerDown={onPointerDown(key)} />
  )

  const scaleDot = (key: ScaleKey, pt: Pt) => (
    <circle key={key} className="pw-scale-handle" cx={pt.x} cy={pt.y} r={6} onPointerDown={onPointerDown(key)} />
  )

  // Diamond (a rotated square), not a circle: keeps this visually distinct
  // from the filled position dots, the hollow scale rings, and the dashed
  // whole-move ring, so a "couple" gizmo reads as its own kind of control at
  // a glance.
  const coupleDot = (key: 'startCouple' | 'endCouple', pt: Pt) => (
    <rect
      key={key}
      className="pw-couple-handle"
      x={pt.x - 5} y={pt.y - 5} width={10} height={10}
      transform={`rotate(45 ${pt.x} ${pt.y})`}
      onPointerDown={onPointerDown(key)}
    />
  )

  const startMid = segmentMid(start, startHandle)
  const endMid = segmentMid(end, endHandle)
  const startScalePos = scaleHandlePos(start, startHandle, startScale)
  const endScalePos = scaleHandlePos(end, endHandle, endScale)
  // Sits on the actual curve (t=0.5), not the straight start->end midpoint —
  // it's the visually obvious "grab the middle of the tangle" spot, and
  // dragging it translates all 4 points together so the whole composition
  // moves as a rigid shape without needing to touch each point in turn.
  const movePos = bezierPoint({ p0: start, p1: startHandle, p2: endHandle, p3: end }, 0.5)

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
      {coupleDot('startCouple', startMid)}
      {coupleDot('endCouple', endMid)}
      <circle className="pw-move-handle" cx={movePos.x} cy={movePos.y} r={10} onPointerDown={onPointerDown('move')} />
    </g>
  )
}
