'use client'

/**
 * Tus CFO — shared palette per concept page.
 *
 * The logo editor, the pattern generator (and the coin, on 01) each keep
 * their own colour state, but the PALETTE choice is one brand decision —
 * switching it anywhere should re-dress every tool on the page. Each
 * editor calls useSyncedPalette: it publishes local palette changes to a
 * per-concept store and, when another editor publishes a different one,
 * invokes this editor's own applyPalette so its colours remap through
 * the usual remapColor/autoBg path.
 */

import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { PaletteId } from './palettes'

interface Entry {
  id: PaletteId | null
  listeners: Set<() => void>
}

const entries = new Map<string, Entry>()

function entry(key: string): Entry {
  let e = entries.get(key)
  if (!e) {
    e = { id: null, listeners: new Set() }
    entries.set(key, e)
  }
  return e
}

function publish(key: string, id: PaletteId) {
  const e = entry(key)
  if (e.id === id) return
  e.id = id
  e.listeners.forEach((l) => l())
}

export function useSyncedPalette(
  key: string,
  local: PaletteId,
  apply: (next: PaletteId) => void,
) {
  const remote = useSyncExternalStore(
    (cb) => {
      const e = entry(key)
      e.listeners.add(cb)
      return () => {
        e.listeners.delete(cb)
      }
    },
    () => entry(key).id,
    () => null,
  )

  const applyRef = useRef(apply)
  applyRef.current = apply
  const localRef = useRef(local)
  localRef.current = local

  // Publish local changes (covers applyPalette, Sorprendeme, anything).
  useEffect(() => {
    publish(key, local)
  }, [key, local])

  // Follow remote changes — deliberately only reacting to `remote` so a
  // local change doesn't re-trigger the follower.
  useEffect(() => {
    if (remote && remote !== localRef.current) applyRef.current(remote)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote])
}
