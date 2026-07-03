import { useEffect, useRef } from 'react'

export const STORAGE_KEY = 'pw-tool-params'
const DEBOUNCE_MS = 400

export function loadPersistedParams<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function savePersistedParams<T>(params: T) {
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
