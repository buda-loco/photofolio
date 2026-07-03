'use client'

import { useCallback, useRef } from 'react'
import { SCALE_MIN, SCALE_MAX, bezierPoint, type Pt } from './yarnMath'
import { EXPORT_EXCLUDE_CLASS } from './exportCanvas'
import { useRafPointer } from './useRafPointer'

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
// The combined transform gizmo's modes — the midpoint widget is
// Blender-style (centre = translate, ring = rotate, outboard square =
// uniform scale) and transforms the WHOLE curve; moveStart/moveEnd are the
// grab-friendly circle gizmos at the curve's two ends, translating that
// end's anchor + control handle together (tangent preserved).
type TransformKey = 'move' | 'rotate' | 'scaleUniform' | 'moveStart' | 'moveEnd'
type DragKey = PositionKey | ScaleKey | TransformKey

// Combined-gizmo geometry, in canvas units.
const GIZMO_RING_R = 46
const GIZMO_CENTER_R = 9
const GIZMO_SCALE_OFFSET = 16 // square's distance beyond the ring, along +x
const GIZMO_SCALE_SIZE = 11
// End circle gizmos: visible circle + the invisible fat hit circle that
// makes them easy to grab without pixel aim.
const END_GIZMO_R = 11
const END_GIZMO_HIT_R = 24

// Whole-curve scale-drag bounds — wide enough for dramatic resizes, tight
// enough that a twitch through the centre can't collapse or explode the
// curve irrecoverably.
const TRANSFORM_SCALE_MIN = 0.15
const TRANSFORM_SCALE_MAX = 6

// Rest position (not dragging) of a per-end amplitude handle: offset
// perpendicular to the anchor->handle segment, from that segment's midpoint.
// Distance from the midpoint encodes the value; direction is just for a
// legible resting position (drag response only tracks distance — see
// scaleFromDistance).
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
  // Snapshot at transform-drag start: the four points, the gizmo centre and
  // the pointer's start position. Every transform is computed FRESH from
  // this frozen origin (never incrementally from the last frame), so
  // rotation/scale can't accumulate drift — and the centre must be frozen
  // too, because the live curve midpoint moves as the points do, which
  // would otherwise feed back into the transform mid-drag.
  const transformOrigin = useRef<{
    pointerStart: Pt
    center: Pt
    start: Pt
    startHandle: Pt
    end: Pt
    endHandle: Pt
  } | null>(null)

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

  const isTransformKey = (key: DragKey): key is TransformKey =>
    key === 'move' || key === 'rotate' || key === 'scaleUniform' || key === 'moveStart' || key === 'moveEnd'

  const onPointerDown = (key: DragKey) => (e: React.PointerEvent) => {
    e.stopPropagation()
    // setPointerCapture can throw (e.g. NotFoundError) in edge cases where the
    // browser doesn't recognise the pointer id as active. Swallow it rather
    // than let it escape as an uncaught exception — worst case we lose
    // capture (tracking degrades once the cursor leaves the hit target)
    // but the drag still starts and works while the cursor stays over it.
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {
      // no-op — see comment above
    }
    dragging.current = key
    if (isTransformKey(key)) {
      transformOrigin.current = {
        pointerStart: toSvgPoint(e.clientX, e.clientY),
        center: bezierPoint({ p0: start, p1: startHandle, p2: endHandle, p3: end }, 0.5),
        start, startHandle, end, endHandle,
      }
    }
  }

  // rAF-coalesced (useRafPointer): every drag here ends in onChange →
  // setParams → full stroke regeneration, and pointermove outruns the
  // display's frame rate — the guard re-checks dragging.current because a
  // queued frame can land just after pointerup.
  const applyMove = useRafPointer((clientX: number, clientY: number) => {
    const key = dragging.current
    if (!key) return
    const p = toSvgPoint(clientX, clientY)

    if (isTransformKey(key)) {
      const origin = transformOrigin.current
      if (!origin) return

      // End gizmos: translate just that end's anchor + control handle, so
      // the end moves as a unit and the curve's tangent there is preserved.
      if (key === 'moveStart' || key === 'moveEnd') {
        const dx = p.x - origin.pointerStart.x
        const dy = p.y - origin.pointerStart.y
        const shift = (pt: Pt): Pt => ({ x: pt.x + dx, y: pt.y + dy })
        onChange(
          key === 'moveStart'
            ? { start: shift(origin.start), startHandle: shift(origin.startHandle), end: origin.end, endHandle: origin.endHandle, startScale, endScale }
            : { start: origin.start, startHandle: origin.startHandle, end: shift(origin.end), endHandle: shift(origin.endHandle), startScale, endScale }
        )
        return
      }

      let mapPt: (pt: Pt) => Pt

      if (key === 'move') {
        const dx = p.x - origin.pointerStart.x
        const dy = p.y - origin.pointerStart.y
        mapPt = (pt) => ({ x: pt.x + dx, y: pt.y + dy })
      } else if (key === 'rotate') {
        const a0 = Math.atan2(origin.pointerStart.y - origin.center.y, origin.pointerStart.x - origin.center.x)
        const a1 = Math.atan2(p.y - origin.center.y, p.x - origin.center.x)
        const cos = Math.cos(a1 - a0)
        const sin = Math.sin(a1 - a0)
        mapPt = (pt) => {
          const rx = pt.x - origin.center.x
          const ry = pt.y - origin.center.y
          return { x: origin.center.x + rx * cos - ry * sin, y: origin.center.y + rx * sin + ry * cos }
        }
      } else {
        const r0 = Math.max(1e-6, Math.hypot(origin.pointerStart.x - origin.center.x, origin.pointerStart.y - origin.center.y))
        const r1 = Math.hypot(p.x - origin.center.x, p.y - origin.center.y)
        const f = Math.min(TRANSFORM_SCALE_MAX, Math.max(TRANSFORM_SCALE_MIN, r1 / r0))
        mapPt = (pt) => ({
          x: origin.center.x + (pt.x - origin.center.x) * f,
          y: origin.center.y + (pt.y - origin.center.y) * f,
        })
      }

      onChange({
        start: mapPt(origin.start),
        startHandle: mapPt(origin.startHandle),
        end: mapPt(origin.end),
        endHandle: mapPt(origin.endHandle),
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
  })

  // Handlers live on the wrapping <g> (not the individual shapes) so that
  // pointer capture — set on the shape in onPointerDown — continues to
  // deliver move/up events to this listener even once the cursor leaves the
  // hit target or the canvas bounds entirely. Capture routes the events to
  // the captured element, and since it's a descendant of this <g>, the
  // event still bubbles up here.
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    applyMove(e.clientX, e.clientY)
  }

  const onPointerUp = () => {
    dragging.current = null
    transformOrigin.current = null
  }

  const dot = (key: PositionKey, pt: Pt) => (
    <circle key={key} className="pw-handle" cx={pt.x} cy={pt.y} r={8} onPointerDown={onPointerDown(key)} />
  )

  const scaleDot = (key: ScaleKey, pt: Pt) => (
    <circle key={key} className="pw-scale-handle" cx={pt.x} cy={pt.y} r={6} onPointerDown={onPointerDown(key)} />
  )

  // Grab-friendly circle gizmo at a curve end: fat invisible hit circle
  // underneath, visible circle on top. Replaces the old anchor-only dot —
  // dragging it carries the control handle along (see moveStart/moveEnd),
  // which is nearly always what "move this end" means; the handle dot
  // remains for reshaping the tangent itself.
  const endGizmo = (key: 'moveStart' | 'moveEnd', pt: Pt) => (
    <g key={key}>
      <circle className="pw-end-hit" cx={pt.x} cy={pt.y} r={END_GIZMO_HIT_R} onPointerDown={onPointerDown(key)} />
      <circle className="pw-end-gizmo" cx={pt.x} cy={pt.y} r={END_GIZMO_R} pointerEvents="none" />
    </g>
  )

  const startMid = segmentMid(start, startHandle)
  const endMid = segmentMid(end, endHandle)
  const startScalePos = scaleHandlePos(start, startHandle, startScale)
  const endScalePos = scaleHandlePos(end, endHandle, endScale)
  // The combined gizmo sits ON the curve (t=0.5) — the visually obvious
  // "grab the whole shape" spot. While a transform drag is live the gizmo
  // stays rendered at the LIVE midpoint (it travels with the curve), but
  // the transform math uses the frozen origin centre — see transformOrigin.
  const center = bezierPoint({ p0: start, p1: startHandle, p2: endHandle, p3: end }, 0.5)

  return (
    <g className={EXPORT_EXCLUDE_CLASS} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {/* The spine itself — the single biggest legibility fix: the bezier
          the tangle grows from is now visible as a guide curve instead of
          having to be inferred from four floating dots. */}
      <path
        className="pw-spine-guide"
        d={`M ${start.x} ${start.y} C ${startHandle.x} ${startHandle.y} ${endHandle.x} ${endHandle.y} ${end.x} ${end.y}`}
      />

      <line className="pw-handle-line" x1={start.x} y1={start.y} x2={startHandle.x} y2={startHandle.y} />
      <line className="pw-handle-line" x1={end.x} y1={end.y} x2={endHandle.x} y2={endHandle.y} />
      <line className="pw-scale-handle-line" x1={startMid.x} y1={startMid.y} x2={startScalePos.x} y2={startScalePos.y} />
      <line className="pw-scale-handle-line" x1={endMid.x} y1={endMid.y} x2={endScalePos.x} y2={endScalePos.y} />

      {/* ── Combined transform gizmo (Blender-style) ─────────────
          ring = rotate · centre = move · outboard square = scale.
          The visible ring is thin; a fat transparent twin on top of it is
          the actual hit target so grabbing it doesn't demand pixel aim. */}
      <circle className="pw-gizmo-ring" cx={center.x} cy={center.y} r={GIZMO_RING_R} />
      <circle
        className="pw-gizmo-ring-hit"
        cx={center.x}
        cy={center.y}
        r={GIZMO_RING_R}
        onPointerDown={onPointerDown('rotate')}
      />
      <line
        className="pw-scale-handle-line"
        x1={center.x + GIZMO_RING_R} y1={center.y}
        x2={center.x + GIZMO_RING_R + GIZMO_SCALE_OFFSET} y2={center.y}
      />
      <rect
        className="pw-gizmo-scale"
        x={center.x + GIZMO_RING_R + GIZMO_SCALE_OFFSET - GIZMO_SCALE_SIZE / 2}
        y={center.y - GIZMO_SCALE_SIZE / 2}
        width={GIZMO_SCALE_SIZE}
        height={GIZMO_SCALE_SIZE}
        onPointerDown={onPointerDown('scaleUniform')}
      />
      <circle className="pw-move-handle" cx={center.x} cy={center.y} r={GIZMO_CENTER_R} onPointerDown={onPointerDown('move')} />

      {endGizmo('moveStart', start)}
      {endGizmo('moveEnd', end)}
      {dot('startHandle', startHandle)}
      {dot('endHandle', endHandle)}
      {scaleDot('startScale', startScalePos)}
      {scaleDot('endScale', endScalePos)}
    </g>
  )
}
