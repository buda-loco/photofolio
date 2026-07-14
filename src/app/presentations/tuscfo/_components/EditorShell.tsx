'use client'

/**
 * Tus CFO — shared editor workspace.
 *
 * Layout contract for all six generators: a distraction-free stage on the
 * left (the canvas and nothing else) and a dock of tools on the right.
 * The shell owns the controls every editor shares — orientation
 * (Full HD horizontal / vertical), canvas rotation, "Sorprendeme" and
 * the export actions — while each generator supplies its own stage
 * markup and any concept-specific panels.
 *
 * Rotation is a *design* control, not a viewport one: the shell only
 * hosts the slider; the generator applies the angle inside its own SVG
 * (see rotationTransform) so exports include exactly what's on screen.
 */

import type { ReactNode } from 'react'
import { Panel, Seg, SliderRow } from './ui'

export type Orientation = 'horizontal' | 'vertical'

export const CANVAS: Record<Orientation, { w: number; h: number }> = {
  horizontal: { w: 1920, h: 1080 },
  vertical: { w: 1080, h: 1920 },
}

/** SVG transform that spins the artwork around the canvas centre. */
export function rotationTransform(deg: number, w: number, h: number): string {
  return `rotate(${deg} ${w / 2} ${h / 2})`
}

export default function EditorShell({
  stage,
  panels,
  orientation,
  onOrientationChange,
  rotation,
  onRotationChange,
  onSurprise,
  onExportSVG,
  onExportPNG,
  exportLabel = 'PNG (Full HD)',
}: {
  stage: ReactNode
  panels: ReactNode
  orientation?: Orientation
  onOrientationChange?: (o: Orientation) => void
  rotation?: number
  onRotationChange?: (deg: number) => void
  onSurprise: () => void
  onExportSVG?: () => void
  onExportPNG: () => void
  exportLabel?: string
}) {
  const hasCanvasPanel =
    (orientation !== undefined && onOrientationChange) ||
    (rotation !== undefined && onRotationChange)

  return (
    <div className="tc-workspace">
      <div className="tc-stage">{stage}</div>

      <div className="tc-dock">
        {panels}

        {hasCanvasPanel && (
          <Panel label="Lienzo">
            {orientation !== undefined && onOrientationChange && (
              <Seg
                options={[
                  { value: 'horizontal' as const, label: 'Horizontal' },
                  { value: 'vertical' as const, label: 'Vertical' },
                ]}
                value={orientation}
                onChange={onOrientationChange}
              />
            )}
            {rotation !== undefined && onRotationChange && (
              <SliderRow
                label="Rotación del lienzo"
                min={-180}
                max={180}
                value={rotation}
                onChange={onRotationChange}
                format={(v) => `${v}°`}
              />
            )}
          </Panel>
        )}

        <Panel label="Acciones">
          <button type="button" className="tc-btn tc-btn--primary" onClick={onSurprise}>
            Sorprendeme ✦
          </button>
          <div className="tc-btn-row">
            {onExportSVG && (
              <button type="button" className="tc-btn" onClick={onExportSVG}>
                SVG
              </button>
            )}
            <button type="button" className="tc-btn" onClick={onExportPNG}>
              {exportLabel}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
