import { useCallback } from 'react'
import type { Pt } from './yarnMath'

/**
 * Pointer capture with the NotFoundError guard every drag surface needs:
 * setPointerCapture can throw when the browser doesn't recognise the
 * pointer id as active. Swallow it rather than let it escape as an uncaught
 * exception — worst case we lose capture (tracking degrades once the cursor
 * leaves the hit target) but the drag still starts and works while the
 * cursor stays over it. Previously copy-pasted in five components.
 */
export function capturePointer(e: React.PointerEvent) {
  try {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  } catch {
    // no-op — see doc comment
  }
}

/**
 * Client-coordinate → SVG-viewBox-coordinate converter, shared by every
 * canvas gizmo (path editor, resolve stick, draw overlay, mask drag/resize).
 * The viewBox rect is NOT assumed to start at (0,0): the zoom control
 * expands it symmetrically around the canvas, so the origin offset is part
 * of the mapping. One implementation instead of four verbatim copies — a
 * fix here (e.g. guarding a zero-size rect) now lands everywhere at once.
 */
export function useViewBoxPoint(
  svgRef: React.RefObject<SVGSVGElement | null>,
  viewBoxX: number,
  viewBoxY: number,
  viewBoxW: number,
  viewBoxH: number
) {
  return useCallback(
    (clientX: number, clientY: number): Pt => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return { x: viewBoxX, y: viewBoxY }
      return {
        x: viewBoxX + ((clientX - rect.left) / rect.width) * viewBoxW,
        y: viewBoxY + ((clientY - rect.top) / rect.height) * viewBoxH,
      }
    },
    [svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH]
  )
}
