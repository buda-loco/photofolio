import { useEffect, useLayoutEffect, useState } from 'react'

// Which panels exist in the workspace and where they sit. View state only —
// deliberately a separate localStorage key from the artwork params
// (useToolPersistence): resetting the artwork shouldn't blow away how the
// user arranged their workspace, and vice versa.
export type PanelId = 'randomiser' | 'colours' | 'line' | 'canvas' | 'container' | 'presets'
export type DockSide = 'left' | 'right'

export type WorkspaceLayout = {
  left: PanelId[]
  right: PanelId[]
  active: { left: PanelId | null; right: PanelId | null }
}

export const ALL_PANELS: PanelId[] = ['randomiser', 'colours', 'line', 'canvas', 'container', 'presets']

// Colours on the right where the mouse naturally rests next to the canvas;
// generation controls on the left. Canvas setup last — it's set once per
// asset, not tweaked live. Panels added after a user's layout was persisted
// (e.g. presets) are appended to their DEFAULT_LAYOUT dock by sanitize().
export const DEFAULT_LAYOUT: WorkspaceLayout = {
  left: ['line', 'randomiser', 'presets'],
  right: ['colours', 'container', 'canvas'],
  active: { left: 'line', right: 'colours' },
}

const LAYOUT_KEY = 'pw-tool-layout-v1'

/** Rebuild a trustworthy layout from whatever was persisted: unknown ids are
 *  dropped, duplicates keep their first placement, panels missing entirely
 *  (e.g. added in a later version) are appended to their DEFAULT_LAYOUT dock,
 *  and each dock's active tab is re-validated against what it now holds. */
function sanitize(raw: unknown): WorkspaceLayout {
  const isPanelId = (v: unknown): v is PanelId => typeof v === 'string' && (ALL_PANELS as string[]).includes(v)
  const obj = (raw ?? {}) as Partial<WorkspaceLayout>
  const seen = new Set<PanelId>()
  const takeDock = (v: unknown): PanelId[] => {
    if (!Array.isArray(v)) return []
    const out: PanelId[] = []
    for (const id of v) {
      if (isPanelId(id) && !seen.has(id)) {
        seen.add(id)
        out.push(id)
      }
    }
    return out
  }
  const left = takeDock(obj.left)
  const right = takeDock(obj.right)
  for (const id of ALL_PANELS) {
    if (!seen.has(id)) (DEFAULT_LAYOUT.left.includes(id) ? left : right).push(id)
  }
  const activeFor = (dock: PanelId[], wanted: unknown): PanelId | null => {
    if (isPanelId(wanted) && dock.includes(wanted)) return wanted
    return dock[0] ?? null
  }
  return {
    left,
    right,
    active: { left: activeFor(left, obj.active?.left), right: activeFor(right, obj.active?.right) },
  }
}

export function useWorkspaceLayout() {
  // Same SSR/hydration pattern as BrandAssetTool's params: initial render
  // always agrees with the server (DEFAULT_LAYOUT), persisted layout applied
  // in a pre-paint layout effect.
  const [layout, setLayout] = useState<WorkspaceLayout>(DEFAULT_LAYOUT)

  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY)
      if (raw) setLayout(sanitize(JSON.parse(raw)))
    } catch {
      // corrupt/unavailable storage — keep defaults
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
    } catch {
      // storage full/unavailable — layout just won't persist, not critical
    }
  }, [layout])

  const activate = (side: DockSide, id: PanelId) =>
    setLayout((prev) => ({ ...prev, active: { ...prev.active, [side]: id } }))

  /** Move `id` into `side`, inserted before `beforeId` (or appended when
   *  null). Handles same-dock reordering, cross-dock moves, and the active
   *  tab in both docks. `beforeId` is resolved against the target dock
   *  AFTER the dragged panel is removed, so same-dock moves need no index
   *  arithmetic at the call site. */
  const movePanel = (id: PanelId, side: DockSide, beforeId: PanelId | null) =>
    setLayout((prev) => {
      const sourceSide: DockSide = prev.left.includes(id) ? 'left' : 'right'
      const without = {
        left: prev.left.filter((p) => p !== id),
        right: prev.right.filter((p) => p !== id),
      }
      const target = [...without[side]]
      const at = beforeId ? target.indexOf(beforeId) : -1
      target.splice(at === -1 ? target.length : at, 0, id)
      const next = { ...without, [side]: target }
      const active = { ...prev.active, [side]: id }
      if (sourceSide !== side && prev.active[sourceSide] === id) {
        active[sourceSide] = next[sourceSide][0] ?? null
      }
      return { left: next.left, right: next.right, active }
    })

  return { layout, activate, movePanel }
}
