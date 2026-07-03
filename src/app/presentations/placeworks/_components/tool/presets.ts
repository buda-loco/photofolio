// Preset save/load + shareable codes for the brand tool. Pure logic module
// (same convention as palette.ts / yarnMath.ts): no React, storage guarded
// for SSR, unit-tested in presets.test.ts.

import type { ToolParams } from './BrandAssetTool'

export type Preset = { id: string; name: string; created: number; params: ToolParams }

// Version-prefixed so the format can evolve: a code that doesn't start with
// the current prefix is rejected outright rather than half-parsed.
const CODE_PREFIX = 'PW1.'
const PRESETS_KEY = 'pw-tool-presets-v1'

/** Unicode-safe base64 of a JS string (btoa alone throws on non-Latin1). */
function toBase64(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)))
}

function fromBase64(b: string): string {
  const bytes = Uint8Array.from(atob(b), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Serializes the full artwork params into a portable share code another
 *  person can paste into their own copy of the generator. Deliberately
 *  excludes workspace layout / zoom / any view state — the code IS the
 *  artwork. */
export function serializePreset(params: ToolParams): string {
  return CODE_PREFIX + toBase64(JSON.stringify(params))
}

/** Light structural check — enough to reject garbage and codes from a
 *  different tool, without trying to validate every field (the caller
 *  merges the result over DEFAULT_PARAMS, which fills anything missing
 *  that a future/older version of the tool didn't include). */
function looksLikeToolParams(v: unknown): v is ToolParams {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  const canvas = o.canvas as Record<string, unknown> | undefined
  const path = o.path as Record<string, unknown> | undefined
  return (
    typeof canvas?.widthPx === 'number' &&
    typeof canvas?.heightPx === 'number' &&
    typeof path?.start === 'object' &&
    typeof o.colours === 'object' &&
    typeof o.seed === 'number'
  )
}

/** Returns null for anything that isn't a valid share code: wrong prefix,
 *  broken base64, invalid JSON, or JSON that isn't tool params. */
export function deserializePreset(code: string): ToolParams | null {
  const trimmed = code.trim()
  if (!trimmed.startsWith(CODE_PREFIX)) return null
  try {
    const parsed: unknown = JSON.parse(fromBase64(trimmed.slice(CODE_PREFIX.length)))
    return looksLikeToolParams(parsed) ? parsed : null
  } catch {
    return null
  }
}

// ── Named presets (localStorage) ────────────────────────────

export function loadPresets(): Preset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is Preset => typeof p?.id === 'string' && typeof p?.name === 'string' && looksLikeToolParams(p?.params))
  } catch {
    return []
  }
}

function persist(presets: Preset[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
  } catch {
    // storage full/unavailable — the in-memory list the caller holds is
    // still valid for this session, it just won't survive a reload
  }
}

export function savePreset(name: string, params: ToolParams): Preset[] {
  const preset: Preset = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    created: Date.now(),
    params,
  }
  const next = [...loadPresets(), preset]
  persist(next)
  return next
}

export function deletePreset(id: string): Preset[] {
  const next = loadPresets().filter((p) => p.id !== id)
  persist(next)
  return next
}
