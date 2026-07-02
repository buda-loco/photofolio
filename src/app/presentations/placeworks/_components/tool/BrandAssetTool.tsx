'use client'

import { useMemo, useRef, useState } from 'react'
import { buildHarmonics, buildStrokes, buildRibbonPath } from './yarnMath'
import type { Pt, ThicknessParams } from './yarnMath'
import { resolveSwatch, shadesOf, contrastRatio } from './palette'
import type { SwatchRef } from './palette'
import PlaceWorksLogo from './PlaceWorksLogo'
import { useLogoBBox } from './useLogoBBox'
import PathEditor from './PathEditor'
import ColourPanel from './ColourPanel'
import ThicknessPanel from './ThicknessPanel'

export type ToolParams = {
  canvas: { widthPx: number; heightPx: number; unit: 'px' | 'cm'; widthCm: number; heightCm: number; dpi: number }
  path: { start: Pt; startHandle: Pt; end: Pt; endHandle: Pt }
  lines: number
  mess: number
  detail: number
  resolve: number
  sharp: number
  spread: number
  thickness: ThicknessParams
  colours: { background: SwatchRef; lines: SwatchRef[]; logo: SwatchRef | 'black' | 'white' }
  mask: { x: number; y: number; width: number; height: number; style: 'hard' | 'soft' }
  logo: { scale: number }
  seed: number
}

export const DEFAULT_PARAMS: ToolParams = {
  canvas: { widthPx: 1600, heightPx: 900, unit: 'px', widthCm: 33.87, heightCm: 19.05, dpi: 300 },
  path: { start: { x: 160, y: 700 }, startHandle: { x: 500, y: 200 }, end: { x: 1440, y: 300 }, endHandle: { x: 1100, y: 750 } },
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
  },
  mask: { x: 620, y: 340, width: 360, height: 220, style: 'hard' },
  logo: { scale: 1 },
  seed: 7,
}

const CREAM_BACKING = shadesOf('cream')[0] // lightest cream tint — fixed, non-configurable mask backing

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
  const [params, setParams] = useState<ToolParams>(DEFAULT_PARAMS)
  const logoRef = useRef<SVGSVGElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const logoInkBBox = useLogoBBox(logoRef)

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
        thickness: params.thickness,
        seed: params.seed,
      }),
    [harmonics, params.path, params.lines, params.mess, params.detail, params.resolve, params.sharp, params.spread, params.thickness, params.seed]
  )

  const bgColor = resolveSwatch(params.colours.background)
  const lineColors = params.colours.lines.map(resolveSwatch)
  const logoColor =
    params.colours.logo === 'black' ? '#000000' : params.colours.logo === 'white' ? '#ffffff' : resolveSwatch(params.colours.logo)
  const lowContrast = contrastRatio(logoColor, CREAM_BACKING) < 3

  const { widthPx: W, heightPx: H } = params.canvas
  const maskId = 'pw-tool-mask'

  const logoAspect = logoInkBBox ? logoInkBBox.width / logoInkBBox.height : 1
  const baseWidthPx = W * LOGO_BASE_WIDTH_FRACTION
  const baseHeightPx = baseWidthPx / logoAspect
  const scaledWidth = logoInkBBox ? baseWidthPx * params.logo.scale : 0
  const scaledHeight = logoInkBBox ? baseHeightPx * params.logo.scale : 0
  const logoX = params.mask.x + (params.mask.width - scaledWidth) / 2
  const logoY = params.mask.y + (params.mask.height - scaledHeight) / 2

  return (
    <div className="pw-tool">
      <div className="pw-tool-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="PlaceWorks brand asset generator canvas">
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

          <g
            clipPath={params.mask.style === 'hard' ? `url(#${maskId}-hard)` : undefined}
            mask={params.mask.style === 'soft' ? `url(#${maskId}-soft)` : undefined}
          >
            {strokes.map((s, i) => (
              <path key={i} d={buildRibbonPath(s.points, s.widths)} fill={lineColors[i % lineColors.length]} fillOpacity={s.opacity} />
            ))}
          </g>

          <rect x={params.mask.x} y={params.mask.y} width={params.mask.width} height={params.mask.height} fill={CREAM_BACKING} />

          {/* Always-mounted, off-screen measuring copy — never visible, exists
              solely so useLogoBBox can read its natural ink bbox once on mount. */}
          <g aria-hidden="true">
            <PlaceWorksLogo ref={logoRef} color={logoColor} x={MEASURE_X} y={0} width={MEASURE_WIDTH} height={MEASURE_HEIGHT} />
          </g>

          {/* Visible logo — only rendered once the ink bbox is known, so it can
              be sized to its natural dimensions (not stretched) and centered
              inside the mask rect. */}
          {logoInkBBox && (
            <PlaceWorksLogo color={logoColor} x={logoX} y={logoY} width={scaledWidth} height={scaledHeight} />
          )}

          <PathEditor
            start={params.path.start}
            startHandle={params.path.startHandle}
            end={params.path.end}
            endHandle={params.path.endHandle}
            onChange={(path) => setParams((p) => ({ ...p, path }))}
            svgRef={svgRef}
            viewBoxW={W}
            viewBoxH={H}
          />
        </svg>
        {lowContrast && <p className="pw-contrast-warning">Logo colour is low-contrast against its cream backing panel.</p>}
      </div>

      <ColourPanel
        background={params.colours.background} lines={params.colours.lines} logo={params.colours.logo}
        onBackgroundChange={(background) => setParams((p) => ({ ...p, colours: { ...p.colours, background } }))}
        onLinesChange={(lines) => setParams((p) => ({ ...p, colours: { ...p.colours, lines } }))}
        onLogoChange={(logo) => setParams((p) => ({ ...p, colours: { ...p.colours, logo } }))}
      />

      <ThicknessPanel value={params.thickness} onChange={(thickness) => setParams((p) => ({ ...p, thickness }))} />
    </div>
  )
}
