'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { buildHarmonics, buildStrokes, buildRibbonPath, OCT_MAX } from './yarnMath'
import type { Pt, ThicknessParams } from './yarnMath'
import { resolveSwatch, contrastRatio } from './palette'
import type { SwatchRef } from './palette'
import PlaceWorksLogo from './PlaceWorksLogo'
import { useLogoBBox } from './useLogoBBox'
import PathEditor from './PathEditor'
import ResolveHandle from './ResolveHandle'
import ColourPanel from './ColourPanel'
import ThicknessPanel from './ThicknessPanel'
import CanvasPanel from './CanvasPanel'
import MaskPanel, { clampMask } from './MaskPanel'
import RandomiserPanel from './RandomiserPanel'
import { EXPORT_EXCLUDE_CLASS, PNG_SIZE_CAP, downloadPNG, downloadSVG, exceedsSizeCap, getCleanExportSVGString } from './exportCanvas'
import { clearPersistedParams, loadPersistedParams, useAutosave } from './useToolPersistence'

export type ToolParams = {
  canvas: { widthPx: number; heightPx: number; unit: 'px' | 'cm'; widthCm: number; heightCm: number; dpi: number }
  path: { start: Pt; startHandle: Pt; end: Pt; endHandle: Pt; startScale: number; endScale: number }
  lines: number
  mess: number
  detail: number
  resolve: number
  sharp: number
  spread: number
  thickness: ThicknessParams
  colours: { background: SwatchRef; lines: SwatchRef[]; logo: SwatchRef | 'black' | 'white'; container: SwatchRef }
  mask: { x: number; y: number; width: number; height: number; style: 'hard' | 'soft' }
  logo: { scale: number }
  seed: number
}

export const DEFAULT_PARAMS: ToolParams = {
  canvas: { widthPx: 1600, heightPx: 900, unit: 'px', widthCm: 13.55, heightCm: 7.62, dpi: 300 }, // widthCm/heightCm are the exact cm-equivalent of 1600x900px @ 300dpi (Math.round((cm/2.54)*300) round-trips to 1600/900) — keep in sync if widthPx/heightPx/dpi defaults change
  path: {
    start: { x: 160, y: 700 }, startHandle: { x: 500, y: 200 }, end: { x: 1440, y: 300 }, endHandle: { x: 1100, y: 750 },
    startScale: 1, endScale: 1,
  },
  lines: 12,
  mess: 68,
  detail: 4,
  resolve: 58,
  sharp: 45,
  spread: 72,
  thickness: { preset: 'thick-thin', min: 1.5, max: 6, transitionPos: 0.6, transitionWidth: 0.3 },
  colours: {
    background: { base: 'nearBlack', shadeStep: 2 },
    lines: [{ base: 'terracotta', shadeStep: 2 }, { base: 'lavender', shadeStep: 2 }],
    logo: 'black',
    container: { base: 'cream', shadeStep: 0 }, // lightest cream tint — matches the old fixed CREAM_BACKING default
  },
  mask: { x: 620, y: 340, width: 360, height: 220, style: 'hard' },
  logo: { scale: 1 },
  seed: 7,
}

// Fixed zoom steps for the canvas stage — not part of ToolParams: it's a view
// preference (how much off-canvas margin is visible while dragging handles),
// not artwork data, so it shouldn't be persisted/randomised/exported.
// getCleanExportSVGString always re-forces the true canvas viewBox from
// params.canvas regardless of this, so export is unaffected by zoom.
const ZOOM_STEPS = [1, 1.5, 2, 3]

// Off-screen "measuring" instance of the logo: it needs a real, non-zero
// width/height and must stay out of `display:none` (getBBox() returns all-
// zero for display:none content — see useLogoBBox.ts's doc comment). Because
// this is a *nested* <svg> viewport (not a CSS-positioned HTML element),
// "off-screen" just means positioning it via the SVG `x`/`y` geometry
// attributes outside the outer <svg>'s viewBox — the outermost <svg> clips
// content outside its viewBox by default (UA stylesheet `overflow: hidden`),
// so nothing bleeds into the visible canvas. getBBox() itself measures the
// element's content in its *own* local user-space (the viewBox="0 0 2221
// 754" coordinate system), so the pixel width/height given to this nested
// viewport don't affect the measured ink box at all — any real, non-zero
// value works.
const MEASURE_X = -9999
const MEASURE_WIDTH = 400
const MEASURE_HEIGHT = 136

// The measured ink bbox (from getBBox()) is in the logo's own local viewBox
// coordinate system (0 0 2221 754 units) — NOT canvas pixels, so its raw
// width/height can't be used directly as canvas-pixel dimensions. Only the
// *ratio* (width/height, i.e. aspect ratio) survives the coordinate-space
// change; the absolute size has to be redefined in canvas terms. "Natural"
// (scale=1.0) logo width is deliberately defined as a fraction of the canvas
// width, not derived from the SVG file itself. Task 7.4's mask-rectangle
// clamping must reuse this same formula (LOGO_BASE_WIDTH_FRACTION * canvas
// width, scaled by aspect) to stay consistent with what "scale=1.0" means here.
const LOGO_BASE_WIDTH_FRACTION = 0.22 // logo's natural (scale=1.0) width, as a fraction of canvas width

export default function BrandAssetTool() {
  // Initial state is always DEFAULT_PARAMS, never `loadPersistedParams()`
  // inline here. This is a 'use client' component, but Next.js still does an
  // initial SSR/static render of it for the HTML shell before hydration —
  // during that pass `loadPersistedParams()` returns null (no `window`), so
  // if the `useState` initializer called it directly, the server-rendered
  // markup would show defaults while the client's *first* render (which also
  // runs the initializer, now with localStorage available) could show
  // different persisted values. React's hydration diffs the client's first
  // render against the already-painted server HTML, so that mismatch would
  // surface as a hydration warning (and, worse, a flash/inconsistency in
  // exactly the props this SVG-heavy canvas renders from). Loading persisted
  // params in the effect below instead means both the server render and the
  // client's pre-hydration render agree on DEFAULT_PARAMS; the persisted
  // values are applied in a post-hydration update.
  const [params, setParams] = useState<ToolParams>(DEFAULT_PARAMS)
  // useLayoutEffect, not useEffect: this tool is meant to be driven live in
  // front of a client (see the export-state comments below), so a visible
  // "flash of defaults then snap to persisted state" on reload is a real
  // concern, not a cosmetic one. useLayoutEffect fires synchronously after
  // DOM mutations but before the browser paints, so — unlike useEffect,
  // which fires after paint — the persisted values are applied before
  // anything is shown on screen, eliminating the flash. This doesn't affect
  // the hydration-match reasoning above: the effect body still never runs
  // during SSR (no window there), and it still only runs client-side after
  // the initial DEFAULT_PARAMS render has been committed/hydrated — it's
  // just scheduled to run (and, critically, to have its DOM effects applied)
  // before that first client paint rather than after it.
  useLayoutEffect(() => {
    const persisted = loadPersistedParams<ToolParams>()
    if (persisted) setParams(persisted)
  }, [])
  useAutosave(params)

  const handleReset = () => {
    clearPersistedParams()
    setParams(DEFAULT_PARAMS)
  }

  const logoRef = useRef<SVGSVGElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const logoInkBBox = useLogoBBox(logoRef)

  const [sizeCapBlocked, setSizeCapBlocked] = useState(false)

  // The warning is a statement about the CURRENT canvas size, not a one-off
  // event — if the user shrinks the canvas (or lowers DPI) via CanvasPanel
  // while it's showing, it should disappear on its own rather than sit there
  // making a claim that's no longer true. Manual dismissal still exists for
  // "I've read this, go away" without touching the canvas size.
  useEffect(() => {
    if (sizeCapBlocked && !exceedsSizeCap(params.canvas.widthPx, params.canvas.heightPx)) {
      setSizeCapBlocked(false)
    }
  }, [sizeCapBlocked, params.canvas.widthPx, params.canvas.heightPx])

  // PNG rasterization can take a visible moment near the size cap (this tool
  // may be driven live in front of a client), so the button needs to reflect
  // "still working" vs "silently failed" rather than leaving the user to
  // guess. 'error' auto-clears on the next export attempt (same "next state
  // change wins" logic as sizeCapBlocked above) as well as via manual
  // dismiss.
  const [pngExportState, setPngExportState] = useState<'idle' | 'exporting' | 'error'>('idle')

  const handleExportSVG = () => {
    if (!svgRef.current) return
    downloadSVG(getCleanExportSVGString(svgRef.current, params.canvas.widthPx, params.canvas.heightPx), 'placeworks-brand-asset.svg')
  }

  const handleExportPNG = () => {
    if (!svgRef.current) return
    if (exceedsSizeCap(params.canvas.widthPx, params.canvas.heightPx)) {
      setSizeCapBlocked(true)
      return
    }
    setPngExportState('exporting')
    downloadPNG(
      getCleanExportSVGString(svgRef.current, params.canvas.widthPx, params.canvas.heightPx),
      params.canvas.widthPx,
      params.canvas.heightPx,
      'placeworks-brand-asset.png'
    )
      .then(() => setPngExportState('idle'))
      .catch((err) => {
        console.error('PNG export failed:', err)
        setPngExportState('error')
      })
  }

  const harmonics = useMemo(() => buildHarmonics(params.seed), [params.seed])
  const strokes = useMemo(
    () =>
      buildStrokes(harmonics, {
        bezier: { p0: params.path.start, p1: params.path.startHandle, p2: params.path.endHandle, p3: params.path.end },
        lines: params.lines,
        mess: params.mess,
        detail: params.detail,
        resolve: params.resolve,
        sharp: params.sharp,
        spread: params.spread,
        startScale: params.path.startScale,
        endScale: params.path.endScale,
        thickness: params.thickness,
        seed: params.seed,
      }),
    [harmonics, params.path, params.lines, params.mess, params.detail, params.resolve, params.sharp, params.spread, params.thickness, params.seed]
  )

  const bgColor = resolveSwatch(params.colours.background)
  const lineColors = params.colours.lines.map(resolveSwatch)
  const logoColor =
    params.colours.logo === 'black' ? '#000000' : params.colours.logo === 'white' ? '#ffffff' : resolveSwatch(params.colours.logo)
  const containerColor = resolveSwatch(params.colours.container)
  const lowContrast = contrastRatio(logoColor, containerColor) < 3

  const { widthPx: W, heightPx: H } = params.canvas
  const maskId = 'pw-tool-mask'

  // Zoom expands the SVG's own viewBox symmetrically around the true canvas
  // rect so off-canvas path/scale handles become visible and draggable —
  // see the ZOOM_STEPS comment above for why this stays out of ToolParams.
  const [zoomStep, setZoomStep] = useState(1)
  const zoomPadX = (W * (zoomStep - 1)) / 2
  const zoomPadY = (H * (zoomStep - 1)) / 2
  const viewBoxX = -zoomPadX
  const viewBoxY = -zoomPadY
  const viewBoxW = W * zoomStep
  const viewBoxH = H * zoomStep

  // Drag-to-move for the mask/container rect — moves x/y only (size is still
  // set via MaskPanel's sliders), clamped so the rect can't be dragged past
  // the canvas edge. Zoom-aware: converts client coords through the SVG's
  // *current* viewBox (which may be padded out by zoomStep), not a fixed 0,0
  // origin, so dragging still tracks the cursor correctly while zoomed out.
  const maskDrag = useRef<{ pointerStart: Pt; maskStart: Pt } | null>(null)

  const toCanvasPoint = (clientX: number, clientY: number): Pt => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: viewBoxX + ((clientX - rect.left) / rect.width) * viewBoxW,
      y: viewBoxY + ((clientY - rect.top) / rect.height) * viewBoxH,
    }
  }

  const onMaskPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // no-op — see PathEditor's identical guard for why this can throw
    }
    maskDrag.current = { pointerStart: toCanvasPoint(e.clientX, e.clientY), maskStart: { x: params.mask.x, y: params.mask.y } }
  }

  const onMaskPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!maskDrag.current) return
    const p = toCanvasPoint(e.clientX, e.clientY)
    const dx = p.x - maskDrag.current.pointerStart.x
    const dy = p.y - maskDrag.current.pointerStart.y
    const nextX = Math.min(Math.max(maskDrag.current.maskStart.x + dx, 0), W - params.mask.width)
    const nextY = Math.min(Math.max(maskDrag.current.maskStart.y + dy, 0), H - params.mask.height)
    setParams((p2) => ({ ...p2, mask: { ...p2.mask, x: nextX, y: nextY } }))
  }

  const onMaskPointerUp = () => {
    maskDrag.current = null
  }

  // Corner resize gizmo: bottom-right corner only, top-left (x/y) stays
  // fixed while width/height follow the pointer directly (not a delta-drag
  // like the move handles — the corner just tracks the cursor). Reuses
  // MaskPanel's own clampMask so on-canvas resizing can never disagree with
  // what the Width/Height sliders would allow.
  const resizing = useRef(false)

  const onResizePointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // no-op — see PathEditor's identical guard for why this can throw
    }
    resizing.current = true
  }

  const onResizePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!resizing.current) return
    const p = toCanvasPoint(e.clientX, e.clientY)
    const nextMask = clampMask(
      { ...params.mask, width: p.x - params.mask.x, height: p.y - params.mask.y },
      W, H, scaledWidth, scaledHeight
    )
    setParams((p2) => ({ ...p2, mask: nextMask }))
  }

  const onResizePointerUp = () => {
    resizing.current = false
  }

  // Hides every on-canvas gizmo (path/scale/couple/move handles, the
  // resolve stick, the mask drag+resize overlays, the zoomed-out canvas
  // boundary marker) so the artwork can be seen the way it'll actually
  // export, without needing to reach for Export just to check. Toggling
  // this never touches params — it's a view mode, same reasoning as zoomStep.
  const [previewMode, setPreviewMode] = useState(false)

  const logoAspect = logoInkBBox ? logoInkBBox.width / logoInkBBox.height : 1
  const baseWidthPx = W * LOGO_BASE_WIDTH_FRACTION
  const baseHeightPx = baseWidthPx / logoAspect
  // Rounded to hundredths of a px before it becomes MaskPanel's minWidth/
  // minHeight. logoAspect's division can produce a value with 15+
  // significant digits (e.g. 106.5927706376724); when the mask width/height
  // slider is clamped to exactly that number, the browser's <input
  // type="range"> value serialization doesn't perfectly round-trip such
  // long floats, occasionally landing one ULP below the `min` attribute's
  // (unrounded, exactly-reflected) string and tripping native rangeUnderflow
  // — surfacing as aria-invalid on a slider sitting at a perfectly valid
  // value. Rounding keeps min/value short enough to serialize identically.
  const scaledWidth = logoInkBBox ? Math.round(baseWidthPx * params.logo.scale * 100) / 100 : 0
  const scaledHeight = logoInkBBox ? Math.round(baseHeightPx * params.logo.scale * 100) / 100 : 0
  const logoX = params.mask.x + (params.mask.width - scaledWidth) / 2
  const logoY = params.mask.y + (params.mask.height - scaledHeight) / 2

  return (
    <div className="pw-tool">
      <div className="pw-tool-stage">
        <svg ref={svgRef} viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`} role="img" aria-label="PlaceWorks brand asset generator canvas">
          <defs>
            <clipPath id={`${maskId}-hard`}>
              {/* everything EXCEPT the mask rect — approximated with 4 surrounding rects since SVG clipPath has no native "subtract" */}
              <rect x={0} y={0} width={W} height={params.mask.y} />
              <rect x={0} y={params.mask.y + params.mask.height} width={W} height={H} />
              <rect x={0} y={params.mask.y} width={params.mask.x} height={params.mask.height} />
              <rect x={params.mask.x + params.mask.width} y={params.mask.y} width={W} height={params.mask.height} />
            </clipPath>
            {params.mask.style === 'soft' && (
              <mask id={`${maskId}-soft`}>
                <rect x={0} y={0} width={W} height={H} fill="white" />
                <rect
                  x={params.mask.x}
                  y={params.mask.y}
                  width={params.mask.width}
                  height={params.mask.height}
                  fill="black"
                  opacity={0.9}
                  style={{ filter: 'blur(18px)' }}
                />
              </mask>
            )}
          </defs>

          <rect width={W} height={H} fill={bgColor} />

          {/* True-canvas boundary marker — only shown while zoomed out, so the
              user can tell what's actually inside the exported frame vs. the
              extra off-canvas margin the zoom control reveals. Non-interactive
              and export-excluded: purely a UI aid, so it's also hidden in
              preview mode along with the rest of the gizmos. */}
          {zoomStep > 1 && !previewMode && (
            <rect
              className={EXPORT_EXCLUDE_CLASS}
              x={0} y={0} width={W} height={H}
              fill="none" stroke="var(--pw-ink-soft)" strokeDasharray="6 4" strokeWidth={1}
              pointerEvents="none"
            />
          )}

          <g
            clipPath={params.mask.style === 'hard' ? `url(#${maskId}-hard)` : undefined}
            mask={params.mask.style === 'soft' ? `url(#${maskId}-soft)` : undefined}
          >
            {strokes.map((s, i) => (
              <path key={i} d={buildRibbonPath(s.points, s.widths)} fill={lineColors[i % lineColors.length]} fillOpacity={s.opacity} />
            ))}
          </g>

          <rect x={params.mask.x} y={params.mask.y} width={params.mask.width} height={params.mask.height} fill={containerColor} />

          {/* Always-mounted, off-screen measuring copy — never visible, exists
              solely so useLogoBBox can read its natural ink bbox once on mount.
              Marked with EXPORT_EXCLUDE_CLASS so getCleanExportSVGString strips
              it explicitly — it stays off-canvas in a browser tab/on-screen
              purely because the viewport doesn't paint outside its width/height
              box, not because of any guaranteed SVG clipping rule (a root <svg>
              opened standalone has `overflow: visible` per the UA stylesheet,
              unlike an embedded `svg:not(:root)`, so a tool with an unbounded
              pasteboard — Illustrator, Figma, Inkscape — could otherwise render
              it). See exportCanvas.ts. */}
          <g aria-hidden="true" className={EXPORT_EXCLUDE_CLASS}>
            <PlaceWorksLogo ref={logoRef} color={logoColor} x={MEASURE_X} y={0} width={MEASURE_WIDTH} height={MEASURE_HEIGHT} />
          </g>

          {/* Visible logo — only rendered once the ink bbox is known, so it can
              be sized to its natural dimensions (not stretched) and centered
              inside the mask rect. */}
          {logoInkBBox && (
            <PlaceWorksLogo color={logoColor} x={logoX} y={logoY} width={scaledWidth} height={scaledHeight} />
          )}

          {!previewMode && (
            <>
              {/* Position gizmo for the container (and, since the logo is
                  always centered inside it, the logo along with it): drag
                  anywhere inside the mask/backing rect to move it. */}
              <rect
                className={`pw-mask-rect ${EXPORT_EXCLUDE_CLASS}`}
                x={params.mask.x} y={params.mask.y} width={params.mask.width} height={params.mask.height}
                // fill:none means the default `pointer-events: visiblePainted`
                // would only hit-test the thin dashed stroke — `all` makes the
                // whole rect area (including its transparent interior) draggable.
                pointerEvents="all"
                onPointerDown={onMaskPointerDown}
                onPointerMove={onMaskPointerMove}
                onPointerUp={onMaskPointerUp}
                onPointerCancel={onMaskPointerUp}
              />

              {/* Corner resize gizmo — bottom-right only. Top-left (x/y)
                  stays put; width/height track the pointer directly, run
                  through the same clampMask MaskPanel's sliders use. */}
              <rect
                className={`pw-resize-handle ${EXPORT_EXCLUDE_CLASS}`}
                x={params.mask.x + params.mask.width - 6}
                y={params.mask.y + params.mask.height - 6}
                width={12} height={12}
                pointerEvents="all"
                onPointerDown={onResizePointerDown}
                onPointerMove={onResizePointerMove}
                onPointerUp={onResizePointerUp}
                onPointerCancel={onResizePointerUp}
              />

              <PathEditor
                start={params.path.start}
                startHandle={params.path.startHandle}
                end={params.path.end}
                endHandle={params.path.endHandle}
                startScale={params.path.startScale}
                endScale={params.path.endScale}
                onChange={(path) => setParams((p) => ({ ...p, path }))}
                svgRef={svgRef}
                viewBoxX={viewBoxX}
                viewBoxY={viewBoxY}
                viewBoxW={viewBoxW}
                viewBoxH={viewBoxH}
              />

              {/* Direct-manipulation control for `resolve`, as an alternative
                  to the sidebar's Mess-end slider: a thick stick constrained
                  to slide along the (otherwise invisible) bezier spine,
                  always sitting exactly where the tangle actually resolves. */}
              <ResolveHandle
                bezier={{ p0: params.path.start, p1: params.path.startHandle, p2: params.path.endHandle, p3: params.path.end }}
                resolve={params.resolve}
                onResolveChange={(resolve) => setParams((p) => ({ ...p, resolve }))}
                svgRef={svgRef}
                viewBoxX={viewBoxX}
                viewBoxY={viewBoxY}
                viewBoxW={viewBoxW}
                viewBoxH={viewBoxH}
              />
            </>
          )}
        </svg>
        {lowContrast && <p className="pw-contrast-warning">Logo colour is low-contrast against its container background.</p>}
      </div>

      {/* Side panel on wide viewports (below the canvas stacked on narrow
          ones — see the min-width: 900px breakpoint in presentations.css).
          Scrolls independently of the canvas so it stays reachable mid-drag
          instead of pushing the canvas out of view above the fold. */}
      <div className="pw-tool-sidebar">
        <div className="pw-controls">
          <span className="pw-slider" style={{ flex: 'none' }}>Zoom</span>
          {ZOOM_STEPS.map((z) => (
            <button
              key={z}
              type="button"
              className={`pw-btn${zoomStep === z ? ' pw-btn--solid' : ''}`}
              onClick={() => setZoomStep(z)}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>

        <div className="pw-controls">
          <button type="button" className="pw-btn pw-btn--solid" onClick={handleExportSVG}>Export SVG</button>
          <button
            type="button"
            className="pw-btn pw-btn--solid"
            onClick={handleExportPNG}
            disabled={pngExportState === 'exporting'}
          >
            {pngExportState === 'exporting' ? 'Exporting…' : 'Export PNG'}
          </button>
          <button type="button" className="pw-btn" onClick={handleReset}>Reset to defaults</button>
          <button
            type="button"
            className={`pw-btn${previewMode ? ' pw-btn--solid' : ''}`}
            onClick={() => setPreviewMode((v) => !v)}
          >
            {previewMode ? 'Exit preview' : 'Preview'}
          </button>
        </div>

        {/* Whole-tool action, like Export/Reset above it, rather than a
            per-property panel — placed right after them so it reads as part of
            the same "act on the whole composition" group before the
            property-by-property panels (colours, thickness, canvas, mask)
            below. */}
        <RandomiserPanel params={params} onRandomise={setParams} />

        {sizeCapBlocked && (
          <div className="pw-tool-hint" role="alert">
            This export is {params.canvas.widthPx}&times;{params.canvas.heightPx}px &mdash; larger than the {PNG_SIZE_CAP}px safety cap and may hang your browser.
            Reduce canvas size or DPI to continue.
            <button type="button" className="pw-btn" onClick={() => setSizeCapBlocked(false)}>Dismiss</button>
          </div>
        )}

        {pngExportState === 'error' && (
          <div className="pw-tool-hint" role="alert">
            PNG export failed &mdash; your browser may be low on memory at this canvas size, or the export was interrupted. Try again, or reduce canvas size/DPI.
            <button type="button" className="pw-btn" onClick={() => setPngExportState('idle')}>Dismiss</button>
          </div>
        )}

        <ColourPanel
          background={params.colours.background} lines={params.colours.lines} logo={params.colours.logo} container={params.colours.container}
          onBackgroundChange={(background) => setParams((p) => ({ ...p, colours: { ...p.colours, background } }))}
          onLinesChange={(lines) => setParams((p) => ({ ...p, colours: { ...p.colours, lines } }))}
          onLogoChange={(logo) => setParams((p) => ({ ...p, colours: { ...p.colours, logo } }))}
          onContainerChange={(container) => setParams((p) => ({ ...p, colours: { ...p.colours, container } }))}
        />

        <ThicknessPanel value={params.thickness} onChange={(thickness) => setParams((p) => ({ ...p, thickness }))} />

        <div className="pw-controls">
          <span className="pw-slider">
            Mess&nbsp;end
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={params.resolve}
              onChange={(e) => setParams((p) => ({ ...p, resolve: +e.target.value }))}
            />
          </span>
          <span className="pw-slider">
            Mess&nbsp;detail
            <input
              type="range"
              min={1}
              max={OCT_MAX}
              step={1}
              value={params.detail}
              onChange={(e) => setParams((p) => ({ ...p, detail: +e.target.value }))}
            />
          </span>
        </div>

        <CanvasPanel value={params.canvas} onChange={(canvas) => setParams((p) => ({ ...p, canvas }))} />

        {/* minWidth/minHeight reuse scaledWidth/scaledHeight verbatim — the same
            LOGO_BASE_WIDTH_FRACTION formula that sizes the visible logo above —
            so the mask can never be shrunk smaller than the logo actually
            renders at. Before the ink bbox is measured (logoInkBBox === null),
            scaledWidth/scaledHeight are 0, so the sliders simply have no
            enforced minimum yet (harmless — they're re-clamped the instant the
            measurement lands and this component re-renders with real values). */}
        <MaskPanel
          value={params.mask}
          onChange={(mask) => setParams((p) => ({ ...p, mask }))}
          canvasW={W}
          canvasH={H}
          minWidth={scaledWidth}
          minHeight={scaledHeight}
        />

        <div className="pw-controls">
          <span className="pw-slider">
            Logo&nbsp;scale
            <input
              type="range"
              min={1}
              // max={4} is numerically coupled to LOGO_BASE_WIDTH_FRACTION: 0.22 * 4 = 0.88,
              // staying under 1 so minWidth (= scaledWidth) stays under canvasW at the default
              // canvas proportions. Raising this max later isn't free — past ~1/0.22 (~4.5) it
              // reproduces on the width axis the same "minWidth/minHeight exceeds canvas bounds"
              // overflow that MaskPanel's clampMask currently only sees via the height axis
              // (e.g. a very short canvas) or an even larger scale.
              max={4}
              step={0.1}
              value={params.logo.scale}
              onChange={(e) => setParams((p) => ({ ...p, logo: { ...p.logo, scale: +e.target.value } }))}
            />
          </span>
        </div>
      </div>
    </div>
  )
}
