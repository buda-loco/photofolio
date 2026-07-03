'use client'

import { useState, type ReactNode } from 'react'
import type { DockSide, PanelId } from './useWorkspaceLayout'

type Props = {
  side: DockSide
  panels: PanelId[]
  active: PanelId | null
  labels: Record<PanelId, string>
  content: Record<PanelId, ReactNode>
  onActivate: (side: DockSide, id: PanelId) => void
  onMove: (id: PanelId, side: DockSide, beforeId: PanelId | null) => void
  // Drag state lives in the parent (BrandAssetTool) because a drag that
  // starts in one dock has to be visible to the OTHER dock — it needs to
  // show its drop affordance (and an empty dock needs to materialise a drop
  // zone at all). dataTransfer can't carry this during dragover: its
  // getData() is spec-restricted to the drop event.
  dragId: PanelId | null
  onDragStart: (id: PanelId) => void
  onDragEnd: () => void
}

/** One dock column of the tool workspace: a tab bar plus the active panel.
 *  Tabs are HTML5-draggable — within the bar to reorder, across docks to
 *  move. Dropping on a tab inserts before it; dropping on the bar's empty
 *  tail (or anywhere in the dock body) appends. */
export default function Dock({ side, panels, active, labels, content, onActivate, onMove, dragId, onDragStart, onDragEnd }: Props) {
  // Which tab the dragged panel would be inserted before — purely a visual
  // affordance (the insertion caret), reset on leave/drop.
  const [overId, setOverId] = useState<PanelId | null>(null)

  // An empty dock still has to be a drop target while a drag is live,
  // otherwise panels could never be moved back into it. When nothing is
  // being dragged it renders nothing and cedes its width to the stage.
  if (panels.length === 0) {
    if (!dragId) return null
    return (
      <div
        className="pw-dock pw-dock--empty"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (dragId) onMove(dragId, side, null)
        }}
      >
        <span className="pw-dock-drop-hint">Drop panel here</span>
      </div>
    )
  }

  const tabDropProps = (id: PanelId) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!dragId || dragId === id) return
      e.preventDefault()
      e.stopPropagation()
      setOverId(id)
    },
    onDragLeave: () => setOverId((cur) => (cur === id ? null : cur)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOverId(null)
      if (dragId && dragId !== id) onMove(dragId, side, id)
    },
  })

  return (
    <div
      className="pw-dock"
      // Dock body is an "append here" drop target so a tab doesn't have to
      // land precisely on the narrow tab bar.
      onDragOver={(e) => {
        if (dragId) e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        setOverId(null)
        if (dragId) onMove(dragId, side, null)
      }}
    >
      <div className="pw-dock-tabs" role="tablist" aria-label={`${side} panel dock`}>
        {panels.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={`pw-panel-${id}`}
            className={[
              'pw-dock-tab',
              active === id ? 'pw-dock-tab--active' : '',
              overId === id ? 'pw-dock-tab--dropbefore' : '',
              dragId === id ? 'pw-dock-tab--dragging' : '',
            ].filter(Boolean).join(' ')}
            draggable
            onDragStart={(e) => {
              // setData is required for Firefox to start the drag at all;
              // the payload itself is unused (see dragId comment above).
              e.dataTransfer.setData('text/plain', id)
              e.dataTransfer.effectAllowed = 'move'
              onDragStart(id)
            }}
            onDragEnd={() => {
              setOverId(null)
              onDragEnd()
            }}
            onClick={() => onActivate(side, id)}
            {...tabDropProps(id)}
          >
            {labels[id]}
          </button>
        ))}
      </div>
      {active && (
        <div className="pw-dock-body" role="tabpanel" id={`pw-panel-${active}`}>
          {content[active]}
        </div>
      )}
    </div>
  )
}
