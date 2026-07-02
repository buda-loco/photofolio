import { useEffect, useRef, useState } from 'react'

export type BBox = { width: number; height: number }

/** Measures an SVG element's true painted-content bounding box on mount.
 *  Do NOT use `display: none` on the element being measured — getBBox()
 *  returns all-zero for display:none elements. Keep it in normal flow but
 *  visually hidden (off-screen absolute + zero-size clip) instead. */
export function useLogoBBox(ref: React.RefObject<SVGSVGElement>): BBox | null {
  const [bbox, setBBox] = useState<BBox | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const raw = ref.current.getBBox()
    setBBox({ width: raw.width, height: raw.height })
  }, [ref])

  return bbox
}
