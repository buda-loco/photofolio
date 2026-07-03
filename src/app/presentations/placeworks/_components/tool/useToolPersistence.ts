import { useEffect, useRef } from 'react'

// Versioned so a future change to ToolParams's shape is just a key bump
// (old, now-mismatched data is orphaned under the old key and simply never
// read) rather than requiring a runtime migration/validation layer.
// Bumped to v2: added colours.container, path.startScale/endScale — old v1
// data lacks these and would crash resolveSwatch()/buildStrokes() on load.
export const STORAGE_KEY = 'pw-tool-params-v2'
const DEBOUNCE_MS = 400

export function loadPersistedParams<T>(): T | null {
  // Deliberate, not incidental: Next.js renders this module's code path in
  // Server Components (and during the SSR pass of this client component)
  // where `window`/`localStorage` don't exist. Guard explicitly rather than
  // relying on the try/catch below to happen to swallow the ReferenceError.
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function savePersistedParams<T>(params: T) {
  // See loadPersistedParams — same deliberate SSR guard.
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // storage unavailable/full — silently skip, not critical to core function
  }
}

export function clearPersistedParams() {
  // See loadPersistedParams — same deliberate SSR guard.
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Debounce-saves `params` to localStorage on every change. */
export function useAutosave<T>(params: T) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Kept in sync on every render so the unmount-flush effect below (which
  // intentionally has an empty dep array — see its comment) can always read
  // the latest params without needing to be in its own dependency list.
  const latestParams = useRef(params)
  latestParams.current = params

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => savePersistedParams(params), DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [params])

  // Separate effect, deliberately with an EMPTY dep array: its cleanup only
  // ever runs once, on true unmount (route navigation away from the tool) —
  // not on every params change like the effect above's cleanup would. If a
  // user tweaks a control and navigates away inside the DEBOUNCE_MS window,
  // the pending timer above never fires (it's an in-flight setTimeout, torn
  // down along with everything else on unmount), so that edit would
  // otherwise be silently lost. This flushes it synchronously via the ref so
  // the last edit is always saved, while leaving the debounce above alone
  // for the common case (rapid successive changes, e.g. dragging a slider,
  // still coalesce into a single write instead of one per change).
  useEffect(() => {
    return () => {
      clearTimeout(timer.current)
      savePersistedParams(latestParams.current)
    }
  }, [])
}
