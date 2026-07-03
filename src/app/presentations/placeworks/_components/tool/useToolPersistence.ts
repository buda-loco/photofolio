import { useEffect, useRef } from 'react'

// Versioned so a future change to ToolParams's shape is just a key bump
// (old, now-mismatched data is orphaned under the old key and simply never
// read) rather than requiring a runtime migration/validation layer.
export const STORAGE_KEY = 'pw-tool-params-v1'
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
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Debounce-saves `params` to localStorage on every change. */
export function useAutosave<T>(params: T) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => savePersistedParams(params), DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [params])
}
