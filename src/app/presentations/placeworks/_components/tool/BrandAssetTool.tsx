'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildHarmonics, buildNoiseTables, buildStrokes, buildRibbonPath, THICKNESS_PRESETS } from './yarnMath'
import type { Bezier, Pt, ThicknessParams } from './yarnMath'
import { resolveSwatch, contrastRatio } from './palette'
import type { SwatchRef } from './palette'
import PlaceWorksLogo from './PlaceWorksLogo'
import { useLogoBBox } from './useLogoBBox'
import PathEditor from './PathEditor'
import ResolveHandle from './ResolveHandle'
import DrawPathOverlay from './DrawPathOverlay'
import ColourPanel from './ColourPanel'
import CanvasPanel from './CanvasPanel'
import { clampMask } from './MaskPanel'
import LineShapePanel from './LineShapePanel'
import ContainerPanel from './ContainerPanel'
import RandomiserPanel from './RandomiserPanel'
import PresetsPanel from './PresetsPanel'
import Dock from './Dock'
import { useWorkspaceLayout, type PanelId } from './useWorkspaceLayout'
import { useRafPointer } from './useRafPointer'
import { capturePointer, useViewBoxPoint } from './svgPointer'
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
  breadth: number // 0..100 — perpendicular width of the whole array (see yarnMath BuildParams)
  messMultiplier: number // 0..100% — global tame dial on the NOISE terms only (see yarnMath BuildParams)
  thickness: ThicknessParams
  // background/container accept 'transparent' alongside a palette swatch:
  // a transparent background exports a PNG with real alpha; a transparent
  // container turns the backing panel into pure negative space (or lets the
  // yarn run behind the logo when avoidance has the clip disabled).
  colours: { background: SwatchRef | 'transparent'; lines: SwatchRef[]; logo: SwatchRef | 'black' | 'white'; container: SwatchRef | 'transparent' }
  mask: { x: number; y: number; width: number; height: number; style: 'hard' | 'soft'; avoid: boolean; avoidStrength: number }
  // visible is checked as `!== false` everywhere so params persisted before
  // the field existed (undefined) keep showing the logo.
  logo: { scale: number; visible: boolean }
  seed: number
}

export const DEFAULT_PARAMS: ToolParams = {
  canvas: { widthPx: 1600, heightPx: 900, unit: 'px', widthCm: 13.55, heightCm: 7.62, dpi: 300 }, // widthCm/heightCm are the exact cm-equivalent of 1600x900px @ 300dpi (Math.round((cm/2.54)*300) round-trips to 1600/900) — keep in sync if widthPx/heightPx/dpi defaults change
  path: {
    start: { x: 160, y: 700 }, startHandle: { x: 500, y: 200 }, end: { x: 1440, y: 300 }, endHandle: { x: 1100, y: 750 },
    // Amplitude biased to the start end: paired with the low resolve below,
    // the default reads as a tight 10-line array that frays into moderate
    // mess on ONE side and runs clean on the other.
    startScale: 1.5, endScale: 0.6,
  },
  // A close-together 10-line array (low spread keeps lanes tight) with
  // moderate one-sided mess — a composition to refine, not a wall of
  // tangle to deconstruct.
  lines: 10,
  mess: 55,
  detail: 4,
  resolve: 35,
  sharp: 55,
  spread: 20,
  breadth: 18, // narrower than yarnMath's legacy 35 — the full-width default read as too big
  messMultiplier: 100,
  thickness: { preset: 'thick-thin', min: 1, max: 3, transitionPos: 0.6, transitionWidth: 0.3 },
  colours: {
    background: { base: 'nearBlack', shadeStep: 2 },
    lines: [{ base: 'terracotta', shadeStep: 2 }, { base: 'lavender', shadeStep: 2 }],
    logo: 'black',
    container: { base: 'cream', shadeStep: 0 }, // lightest cream tint — matches the old fixed CREAM_BACKING default
  },
  // avoidStrength pre-set to a visible default so toggling `avoid` on shows
  // an immediate effect rather than a silent no-op at strength 0.
  mask: { x: 620, y: 340, width: 360, height: 220, style: 'hard', avoid: false, avoidStrength: 50 },
  logo: { scale: 1, visible: true },
  seed: 7,
}

// Smallest the container can be shrunk to, in canvas px — a usability floor
// (a zero-size rect would be undraggable and invisible), NOT the logo's size:
// the logo now scales down to fit inside whatever size the container is.
const MASK_MIN_SIZE = 24

/** Reconciles params from OUTSIDE this build (localStorage saves, imported
 *  share codes, loaded presets) with the current schema: merges the top
 *  level AND each known nested object over DEFAULT_PARAMS, so fields added
 *  after the data was written (breadth, messMultiplier, mask.avoid,
 *  mask.avoidStrength, logo.visible, …) pick up their defaults instead of
 *  arriving undefined. A top-level-only merge was the bug here: nested
 *  objects like `mask` were replaced wholesale, so pre-avoidance saves
 *  loaded a mask with no avoidStrength — NaN in the generator, avoidance
 *  silently dead, and the clip disabled with it. */
export function mergeParamsWithDefaults(persisted: Partial<ToolParams>): ToolParams {
  return {
    ...DEFAULT_PARAMS,
    ...persisted,
    canvas: { ...DEFAULT_PARAMS.canvas, ...persisted.canvas },
    path: { ...DEFAULT_PARAMS.path, ...persisted.path },
    thickness: { ...DEFAULT_PARAMS.thickness, ...persisted.thickness },
    colours: { ...DEFAULT_PARAMS.colours, ...persisted.colours },
    mask: { ...DEFAULT_PARAMS.mask, ...persisted.mask },
    logo: { ...DEFAULT_PARAMS.logo, ...persisted.logo },
  }
}

// Module-level constant, not recreated per render: when avoidance is OFF,
// the strokes useMemo receives this same reference every time, so container
// drags/resizes (which change params.mask on every pointer frame) no longer
// invalidate the memo and regenerate every strand for nothing.
const NO_AVOID = { rect: { x: 0, y: 0, width: 0, height: 0 }, strength: 0 }

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
    // Deep-merged over DEFAULT_PARAMS (top level AND known nested objects —
    // see mergeParamsWithDefaults) so fields added after the state was
    // saved pick up defaults instead of arriving undefined, without a
    // storage key bump discarding the saved artwork.
    if (persisted) setParams(mergeParamsWithDefaults(persisted))
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
  // All the trig in stroke generation, precomputed: the fractal noise only
  // depends on (seed, detail) and the fixed sample grid, so it's rebuilt
  // only when those (or the strand count it's capped to) change — dragging
  // handles/sliders does zero sin calls. Capped to the current line count:
  // buildStrokes falls back to inline fractal() for missing rows, so this
  // can never under-serve, only avoid tabulating strands nothing reads.
  const noiseTables = useMemo(() => buildNoiseTables(harmonics, params.detail, params.lines), [harmonics, params.detail, params.lines])

  // Keeps the container inside the canvas when the CANVAS changes size out
  // from under it. Lives here — always mounted — and not in MaskPanel:
  // Dock only mounts the active tab, and Canvas/Container share a dock, so
  // an effect inside MaskPanel is guaranteed to NOT be running at exactly
  // the moment the Canvas panel is being used to shrink the canvas. An
  // out-of-bounds container silently crops the logo out of exports and
  // makes the drag clamps produce negative positions.
  useEffect(() => {
    setParams((p) => {
      const next = clampMask(p.mask, p.canvas.widthPx, p.canvas.heightPx, MASK_MIN_SIZE, MASK_MIN_SIZE)
      if (next.x === p.mask.x && next.y === p.mask.y && next.width === p.mask.width && next.height === p.mask.height) return p
      return { ...p, mask: next }
    })
  }, [params.canvas.widthPx, params.canvas.heightPx])

  // Resolved separately from the strokes memo so its identity only changes
  // when the field can actually affect the artwork: with avoidance OFF this
  // is always the same NO_AVOID reference, so moving/resizing the container
  // (every pointer frame of a drag) no longer regenerates the strokes at
  // all. With avoidance ON the rect genuinely feeds the generator, so those
  // same drags must recompute — that cost buys the lines bending live.
  const avoid = useMemo(
    () =>
      params.mask.avoid
        ? {
            rect: { x: params.mask.x, y: params.mask.y, width: params.mask.width, height: params.mask.height },
            strength: params.mask.avoidStrength,
          }
        : NO_AVOID,
    [params.mask.avoid, params.mask.avoidStrength, params.mask.x, params.mask.y, params.mask.width, params.mask.height]
  )

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
        breadth: params.breadth,
        messMultiplier: params.messMultiplier,
        avoid,
        thickness: params.thickness,
        seed: params.seed,
        noise: noiseTables,
      }),
    [harmonics, noiseTables, params.path, params.lines, params.mess, params.detail, params.resolve, params.sharp, params.spread, params.breadth, params.messMultiplier, params.thickness, params.seed, avoid]
  )

  // Ribbon outline strings are the most expensive per-stroke artefact
  // (per-vertex normals + two Catmull-Rom path builds each). Cached against
  // the strokes they're derived from — without this they were rebuilt inside
  // the JSX on EVERY render, including ones that can't change them (tab
  // clicks, colour changes, zoom, mask drags with avoidance off).
  const ribbonPaths = useMemo(() => strokes.map((s) => buildRibbonPath(s.points, s.widths)), [strokes])

  const bgColor = params.colours.background === 'transparent' ? 'none' : resolveSwatch(params.colours.background)
  const lineColors = params.colours.lines.map(resolveSwatch)
  const logoColor =
    params.colours.logo === 'black' ? '#000000' : params.colours.logo === 'white' ? '#ffffff' : resolveSwatch(params.colours.logo)
  const containerColor = params.colours.container === 'transparent' ? 'none' : resolveSwatch(params.colours.container)
  // Contrast is checked against whatever actually sits behind the logo: the
  // container if it has a colour, else the page background; if both are
  // transparent there's nothing meaningful to compare against, so no warning.
  const logoVisible = params.logo.visible !== false
  const contrastBacking = containerColor !== 'none' ? containerColor : bgColor !== 'none' ? bgColor : null
  const lowContrast = logoVisible && contrastBacking !== null && contrastRatio(logoColor, contrastBacking) < 3

  const { widthPx: W, heightPx: H } = params.canvas
  const maskId = 'pw-tool-mask'

  // Hides every on-canvas gizmo (path/scale/move handles, the resolve
  // stick, the mask drag+resize overlays, the zoomed-out canvas boundary
  // marker) so the artwork can be seen the way it'll actually export,
  // without needing to reach for Export just to check. Toggling this never
  // touches params — it's a view mode, same reasoning as zoomStep below.
  const [previewMode, setPreviewMode] = useState(false)

  // Zoom expands the SVG's own viewBox symmetrically around the true canvas
  // rect so off-canvas path/scale handles become visible and draggable —
  // see the ZOOM_STEPS comment above for why this stays out of ToolParams.
  //
  // Preview overrides all of it: the viewBox pins to the exact export frame
  // (zoom margin included would show artwork outside the canvas), and the
  // CSS class set below flips the svg back to overflow:hidden so strands
  // running past the canvas edge are clipped exactly as they will be in the
  // exported file. The user's zoom choice is preserved, just suspended.
  const [zoomStep, setZoomStep] = useState(1)
  const zoomPadX = (W * (zoomStep - 1)) / 2
  const zoomPadY = (H * (zoomStep - 1)) / 2
  const viewBoxX = previewMode ? 0 : -zoomPadX
  const viewBoxY = previewMode ? 0 : -zoomPadY
  const viewBoxW = previewMode ? W : W * zoomStep
  const viewBoxH = previewMode ? H : H * zoomStep

  // Drag-to-move for the mask/container rect — moves x/y only (size is still
  // set via MaskPanel's sliders), clamped so the rect can't be dragged past
  // the canvas edge. Zoom-aware: converts client coords through the SVG's
  // *current* viewBox (which may be padded out by zoomStep), not a fixed 0,0
  // origin, so dragging still tracks the cursor correctly while zoomed out.
  const maskDrag = useRef<{ pointerStart: Pt; maskStart: Pt } | null>(null)

  const toCanvasPoint = useViewBoxPoint(svgRef, viewBoxX, viewBoxY, viewBoxW, viewBoxH)

  const onMaskPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.stopPropagation()
    capturePointer(e)
    maskDrag.current = { pointerStart: toCanvasPoint(e.clientX, e.clientY), maskStart: { x: params.mask.x, y: params.mask.y } }
  }

  // rAF-coalesced (see useRafPointer): drag updates land at most once per
  // frame regardless of the pointing device's report rate. The drag-state
  // guard is INSIDE the coalesced handler too — a queued frame can fire
  // just after pointerup, and must be a no-op then.
  const applyMaskMove = useRafPointer((clientX, clientY) => {
    if (!maskDrag.current) return
    const p = toCanvasPoint(clientX, clientY)
    const dx = p.x - maskDrag.current.pointerStart.x
    const dy = p.y - maskDrag.current.pointerStart.y
    const nextX = Math.min(Math.max(maskDrag.current.maskStart.x + dx, 0), W - params.mask.width)
    const nextY = Math.min(Math.max(maskDrag.current.maskStart.y + dy, 0), H - params.mask.height)
    setParams((p2) => ({ ...p2, mask: { ...p2.mask, x: nextX, y: nextY } }))
  })

  const onMaskPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!maskDrag.current) return
    applyMaskMove(e.clientX, e.clientY)
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
    capturePointer(e)
    resizing.current = true
  }

  // Same rAF coalescing (and same post-pointerup guard) as applyMaskMove.
  const applyResize = useRafPointer((clientX, clientY) => {
    if (!resizing.current) return
    const p = toCanvasPoint(clientX, clientY)
    const nextMask = clampMask(
      { ...params.mask, width: p.x - params.mask.x, height: p.y - params.mask.y },
      W, H, MASK_MIN_SIZE, MASK_MIN_SIZE
    )
    setParams((p2) => ({ ...p2, mask: nextMask }))
  })

  const onResizePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!resizing.current) return
    applyResize(e.clientX, e.clientY)
  }

  const onResizePointerUp = () => {
    resizing.current = false
  }

  // Dockable-panel workspace state (which panels sit in which dock, and
  // which tab is active per dock) + the panel currently being tab-dragged.
  // Drag state lives here rather than in either Dock so both docks can see
  // it — see Dock.tsx's dragId prop comment.
  const { layout, activate, movePanel } = useWorkspaceLayout()
  const [dragPanel, setDragPanel] = useState<PanelId | null>(null)

  // Pencil mode: freehand-draw the tangle's spine instead of positioning
  // four handles individually. While active the normal gizmos are hidden
  // (the draw surface owns the canvas); committing a stroke fits a cubic
  // bezier through it (fitCubicBezier) and swaps it in as the new path.
  const [drawMode, setDrawMode] = useState(false)
  // Rope-stabiliser length (canvas px) for the pencil — tool preference,
  // not artwork state, same reasoning as zoomStep. Defaults to a light
  // touch of smoothing rather than 0 so the first drawn stroke already
  // feels like a pen tool, not a raw mouse trace.
  const [stabiliser, setStabiliser] = useState(30)

  useEffect(() => {
    if (!drawMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawMode])

  const handleDrawCommit = (b: Bezier) => {
    setParams((p) => ({ ...p, path: { ...p.path, start: b.p0, startHandle: b.p1, endHandle: b.p2, end: b.p3 } }))
    setDrawMode(false)
  }

  // Stable per-panel callbacks (setParams itself is stable, so empty deps):
  // combined with React.memo on the panel components, canvas drags no longer
  // re-reconcile the dock panels at all — the colour panel alone is ~110
  // swatch buttons that were being diffed on every pointer frame.
  const onBackgroundChange = useCallback((background: SwatchRef | 'transparent') => setParams((p) => ({ ...p, colours: { ...p.colours, background } })), [])
  const onLineColoursChange = useCallback((lines: SwatchRef[]) => setParams((p) => ({ ...p, colours: { ...p.colours, lines } })), [])
  const onLogoColourChange = useCallback((logo: SwatchRef | 'black' | 'white') => setParams((p) => ({ ...p, colours: { ...p.colours, logo } })), [])
  const onContainerColourChange = useCallback((container: SwatchRef | 'transparent') => setParams((p) => ({ ...p, colours: { ...p.colours, container } })), [])
  const onThicknessChange = useCallback((thickness: ThicknessParams) => setParams((p) => ({ ...p, thickness })), [])
  const onCanvasChange = useCallback((canvas: ToolParams['canvas']) => setParams((p) => ({ ...p, canvas })), [])
  const onMaskChange = useCallback((mask: ToolParams['mask']) => setParams((p) => ({ ...p, mask })), [])

  // Preset/share-code plumbing: PresetsPanel gets a GETTER (reading a ref
  // kept current every render) instead of the params object itself, so the
  // memoised panel doesn't re-render per drag frame but Save/Copy still
  // snapshot click-time state. Applied params merge over DEFAULT_PARAMS so
  // codes from older versions of the tool pick up defaults for fields they
  // predate — same policy as the persistence load above.
  const paramsRef = useRef(params)
  paramsRef.current = params
  const getParams = useCallback(() => paramsRef.current, [])
  const applyPreset = useCallback((next: ToolParams) => setParams(mergeParamsWithDefaults(next)), [])

  // Scoped randomiser for the Line shape panel only: rolls the params this
  // panel owns (count, thickness profile, mess character, array width) and
  // deliberately leaves colours, seed, and the drawn path alone — so it
  // explores line treatments without trashing the composition.
  const randomiseLineShape = useCallback(() => {
    const r = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
    setParams((p) => ({
      ...p,
      lines: Math.round(r(3, 24)),
      detail: Math.round(r(2, 7)),
      resolve: r(15, 85),
      sharp: r(20, 90),
      breadth: r(8, 45),
      thickness: {
        preset: THICKNESS_PRESETS[Math.floor(Math.random() * THICKNESS_PRESETS.length)],
        min: r(0.5, 3),
        max: r(2, 10),
        transitionPos: r(0.2, 0.8),
        transitionWidth: r(0.1, 0.5),
      },
    }))
  }, [])

  const logoAspect = logoInkBBox ? logoInkBBox.width / logoInkBBox.height : 1
  const baseWidthPx = W * LOGO_BASE_WIDTH_FRACTION
  // Natural size (the Logo-scale slider's target), then shrunk to FIT the
  // container: the container is free to be made smaller than the logo's
  // natural size, and the logo scales down with it, aspect preserved —
  // instead of the old inverse arrangement where the logo's size was a hard
  // floor on how small the container could go.
  const naturalWidth = logoInkBBox ? baseWidthPx * params.logo.scale : 0
  const fitWidth = logoInkBBox ? Math.min(naturalWidth, params.mask.width, params.mask.height * logoAspect) : 0
  const fitHeight = logoInkBBox ? fitWidth / logoAspect : 0
  const logoX = params.mask.x + (params.mask.width - fitWidth) / 2
  const logoY = params.mask.y + (params.mask.height - fitHeight) / 2

  const panelLabels: Record<PanelId, string> = {
    randomiser: 'Randomiser',
    colours: 'Colours',
    line: 'Line shape',
    canvas: 'Canvas',
    container: 'Container',
    presets: 'Presets',
  }

  const panelContent: Record<PanelId, ReactNode> = {
    randomiser: <RandomiserPanel onRandomise={setParams} />,
    presets: <PresetsPanel getParams={getParams} onApply={applyPreset} />,
    colours: (
      <ColourPanel
        background={params.colours.background} lines={params.colours.lines} logo={params.colours.logo} container={params.colours.container}
        onBackgroundChange={onBackgroundChange}
        onLinesChange={onLineColoursChange}
        onLogoChange={onLogoColourChange}
        onContainerChange={onContainerColourChange}
      />
    ),
    line: (
      <LineShapePanel
        lines={params.lines}
        thickness={params.thickness}
        resolve={params.resolve}
        detail={params.detail}
        messMultiplier={params.messMultiplier}
        breadth={params.breadth}
        onUpdate={setParams}
        onThicknessChange={onThicknessChange}
        onRandomiseShape={randomiseLineShape}
      />
    ),
    canvas: <CanvasPanel value={params.canvas} onChange={onCanvasChange} />,
    container: (
      <ContainerPanel
        mask={params.mask}
        logoScale={params.logo.scale}
        logoVisible={logoVisible}
        canvasW={W}
        canvasH={H}
        maskMinSize={MASK_MIN_SIZE}
        onMaskChange={onMaskChange}
        onUpdate={setParams}
      />
    ),
  }

  const dockProps = {
    labels: panelLabels,
    content: panelContent,
    onActivate: activate,
    onMove: movePanel,
    dragId: dragPanel,
    onDragStart: setDragPanel,
    onDragEnd: () => setDragPanel(null),
  }

  return (
    <div className="pw-tool pw-workspace-root">
      {/* Global actions in a fixed toolbar — always reachable regardless of
          how the panel docks are arranged, like any design app's app bar. */}
      <div className="pw-toolbar">
        <div className="pw-toolbar-group">
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
          <button
            type="button"
            className={`pw-btn${drawMode ? ' pw-btn--solid' : ''}`}
            // Preview hides every canvas overlay including the draw
            // surface, so entering draw mode force-exits preview — the two
            // modes can't meaningfully coexist.
            onClick={() => {
              setPreviewMode(false)
              setDrawMode((v) => !v)
            }}
          >
            {drawMode ? 'Cancel draw (Esc)' : 'Draw path'}
          </button>
          {drawMode && (
            <span className="pw-slider" style={{ flex: 'none', minWidth: 0, width: '13rem' }}>
              Stabiliser
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={stabiliser}
                onChange={(e) => setStabiliser(+e.target.value)}
              />
            </span>
          )}
        </div>
        <div className="pw-toolbar-group">
          <span className="pw-toolbar-label">Zoom</span>
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
      </div>

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

      <div className="pw-workspace">
        <Dock side="left" panels={layout.left} active={layout.active.left} {...dockProps} />

        <div className="pw-stage">
          {/* maxWidth caps the stage so the FULL artwork always fits the
              viewport height — the whole point of the workspace is tweaking
              values while watching results, which breaks the moment the
              canvas is taller than the screen. Ratio-based (not a fixed
              width) so any canvas proportion gets the largest fit. Zoom
              scales W and H equally, so the ratio is zoom-invariant. */}
          <div
            className={`pw-tool-stage${previewMode ? ' pw-tool-stage--preview' : ''}`}
            style={{ maxWidth: `min(100%, calc((100vh - var(--pw-workspace-chrome) - 2 * var(--pw-stage-gutter)) * ${(W / H).toFixed(4)}))` }}
          >
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

          {/* While the avoidance field is on, the clip is off: the field
              already bends strands around the container, and clipping the
              few that still graze it would chop them mid-air at the rect
              edge — exactly the "cut" look avoidance exists to replace. Any
              residual overlap is covered by the container fill drawn on top
              (or deliberately visible when the container is transparent). */}
          <g
            clipPath={params.mask.style === 'hard' && !params.mask.avoid ? `url(#${maskId}-hard)` : undefined}
            mask={params.mask.style === 'soft' && !params.mask.avoid ? `url(#${maskId}-soft)` : undefined}
          >
            {strokes.map((s, i) => (
              <path key={i} d={ribbonPaths[i]} fill={lineColors[i % lineColors.length]} fillOpacity={s.opacity} />
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
              inside the mask rect. The Logo on/off toggle hides just the
              mark; the container panel stays (turn IT off by making its
              colour transparent). */}
          {logoInkBBox && logoVisible && (
            <PlaceWorksLogo color={logoColor} x={logoX} y={logoY} width={fitWidth} height={fitHeight} />
          )}

          {/* While drawing, the normal gizmos step aside entirely — the draw
              surface owns the whole canvas so a stroke can start anywhere,
              including on top of where a handle used to be. */}
          {drawMode && !previewMode && (
            <DrawPathOverlay
              onCommit={handleDrawCommit}
              stabiliser={stabiliser}
              svgRef={svgRef}
              viewBoxX={viewBoxX}
              viewBoxY={viewBoxY}
              viewBoxW={viewBoxW}
              viewBoxH={viewBoxH}
            />
          )}

          {!previewMode && !drawMode && (
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

              {/* Direct-manipulation control for `resolve`, as an alternative
                  to the sidebar's Mess-end slider: a thick stick constrained
                  to slide along the bezier spine, always sitting exactly
                  where the tangle actually resolves.

                  Rendered BEFORE PathEditor deliberately: later SVG siblings
                  win hit-testing, and the stick's fat invisible hit line
                  crosses the spine — at resolve ~47% its centre coincides
                  with the transform gizmo (t=0.5), and rendering the stick
                  on top made grabbing the gizmo silently drag the stick,
                  destroying the user's resolve value. */}
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
            </>
          )}
            </svg>
            {lowContrast && <p className="pw-contrast-warning">Logo colour is low-contrast against its container background.</p>}
          </div>
        </div>

        <Dock side="right" panels={layout.right} active={layout.active.right} {...dockProps} />
      </div>
    </div>
  )
}
