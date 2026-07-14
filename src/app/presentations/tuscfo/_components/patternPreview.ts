'use client'

/**
 * Tus CFO — live pattern → mockup bridge.
 *
 * The logo editor and the pattern generator are sibling components, but
 * the mockup strip under the logo editor wants to show the CURRENT
 * pattern canvas (laptop wallpaper, business-card band). Each generator
 * publishes its rendered SVG here (debounced, as a Blob URL) and the
 * mockups subscribe via useSyncExternalStore — no state lifting, works
 * identically for every concept.
 */

import { useEffect, useSyncExternalStore, type RefObject } from 'react'
import { getCleanExportSVGString } from './exportUtils'

interface Entry {
  url: string | null
  listeners: Set<() => void>
}

const entries = new Map<string, Entry>()

function entry(key: string): Entry {
  let e = entries.get(key)
  if (!e) {
    e = { url: null, listeners: new Set() }
    entries.set(key, e)
  }
  return e
}

export function publishPattern(key: string, svgString: string | null) {
  const e = entry(key)
  if (e.url) URL.revokeObjectURL(e.url)
  // When an <image> references an SVG that has a viewBox, browsers honour
  // the REFERENCED svg's own preserveAspectRatio (default "meet"/contain),
  // not the <image>'s — so the snapshot gets "slice" injected to behave as
  // a cover background in the mockups.
  const covered = svgString?.replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')
  e.url = covered
    ? URL.createObjectURL(new Blob([covered], { type: 'image/svg+xml' }))
    : null
  e.listeners.forEach((l) => l())
}

/** Latest pattern snapshot for a concept (null until first publish / on SSR). */
export function usePatternPreview(key: string): string | null {
  return useSyncExternalStore(
    (cb) => {
      const e = entry(key)
      e.listeners.add(cb)
      return () => {
        e.listeners.delete(cb)
      }
    },
    () => entry(key).url,
    () => null,
  )
}

/**
 * Call from a generator: after every committed change (debounced), the
 * live canvas is serialized and published for the mockups.
 */
export function usePublishPattern(
  key: string,
  svgRef: RefObject<SVGSVGElement | null>,
  w: number,
  h: number,
) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (svgRef.current) {
        try {
          publishPattern(key, getCleanExportSVGString(svgRef.current, w, h))
        } catch {
          /* serialization is best-effort — mockups fall back to flat colour */
        }
      }
    }, 250)
    return () => clearTimeout(t)
  })
}
