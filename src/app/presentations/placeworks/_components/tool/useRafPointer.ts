import { useCallback, useEffect, useRef } from 'react'

/**
 * Coalesces high-frequency pointer coordinates down to at most one handler
 * call per animation frame, always with the LATEST coordinates.
 *
 * Why: pointermove fires at the pointing device's report rate — commonly
 * 120Hz, up to 1000Hz on gaming mice — and every drag handler in this tool
 * ends in setParams, i.e. a full React render plus stroke regeneration.
 * Running that above the display's frame rate is pure waste: frames between
 * paints are thrown away, but their renders still burn main-thread time,
 * which is exactly what reads as "sluggish" while dragging. This trades
 * nothing visible (the screen can't show more than one update per frame
 * anyway) for a hard cap on update work.
 *
 * The handler is kept in a ref, refreshed every render, so the rAF callback
 * never closes over stale props/state.
 */
export function useRafPointer(handler: (clientX: number, clientY: number) => void) {
  const latest = useRef<{ x: number; y: number } | null>(null)
  const frame = useRef(0)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    },
    []
  )

  return useCallback((clientX: number, clientY: number) => {
    latest.current = { x: clientX, y: clientY }
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const p = latest.current
      if (p) handlerRef.current(p.x, p.y)
    })
  }, [])
}
