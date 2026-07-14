'use client'

/**
 * Concepto 02 — "Los gráficos hablan".
 *
 * The three finance-graph glyphs that spell CFO, verbatim from the client
 * SVG (concept02.svg, viewBox 0 0 1226 377):
 *
 *   C = pie chart with a cut wedge (the wedge is a separate counter shape)
 *   F = descending bar chart — 3 bars (100% / 50% / 25%) on a square counter
 *   O = solid circle with a thin needle slit to the centre (gauge / clock)
 *
 * Each glyph occupies a 376.8 × 376.8 box in the source lockup
 * (C at x=0, F at x=424.4, O at x=848.4). Every component renders the
 * original paths/rects untouched inside its own nested <svg> viewport,
 * re-origined to local 0..376.8 coordinates, so the editors can place
 * the letters anywhere — in a row, stacked, or scattered on a grid.
 */

export const C2_VIEW = 376.8

/** Gap between glyph boxes in the source lockup (≈ 12.6% of a box). */
export const C2_GAP = 47.6

/** Glyph box x-origins in the source lockup: C, F, O. */
export const C2_BOX_X = [0, 424.4, 848.4] as const

/**
 * Animation hooks used by the pattern generator. The glyph components only
 * attach these class names (+ a phase-derived negative animation-delay);
 * the keyframes themselves live in an export-excluded <style> owned by the
 * generator, so the logo editor and all exports stay perfectly static.
 */
export const C2_ANIM_CLASS = {
  c: 'c2-anim-c',
  bar: 'c2-anim-bar',
  o: 'c2-anim-o',
  oSpin: 'c2-anim-o-spin',
} as const

/** Animation cycle lengths (seconds) — shared by classes and delay math.
 *  The O spins opposite to the C and slower (26s reverse vs the C's 14s). */
export const C2_ANIM_DUR = { c: 14, bar: 3, o: 4, oSpin: 26 } as const

export interface C2GlyphProps {
  x?: number
  y?: number
  width?: number
  height?: number
  /** Fill for the figure shapes — solid colour or a url(#gradient) ref. */
  darkFill: string
  /** Fill for the counter shapes (white in the source); 'transparent' allowed. */
  counterFill?: string
  /** Attach the pattern animation classes (parent must define the keyframes). */
  animate?: boolean
  /** 0..1 phase offset so grid cells animate out of sync. */
  animPhase?: number
}

/* Source transforms/paths, verbatim from concept02.svg */

const C_MATRIX = 'matrix(0,0.525776,-0.525776,0,1951.701805,-462.57759)'
const C_PIE =
  'M1511.211,3121.638C1566.062,3186.179 1596.493,3268.366 1596.493,3353.691C1596.493,3551.468 1435.923,3712.038 1238.146,3712.038C1040.369,3712.038 879.799,3551.468 879.799,3353.691C879.799,3289.857 896.847,3227.363 928.934,3172.581L1074.742,3274.677C1075.389,3275.13 1076.049,3275.553 1076.718,3275.946C1065.091,3300.089 1058.973,3326.649 1058.973,3353.691C1058.973,3452.58 1139.258,3532.865 1238.146,3532.865C1337.035,3532.865 1417.32,3452.58 1417.32,3353.691C1417.32,3315.918 1405.392,3279.374 1383.622,3249.096C1384.213,3248.592 1384.788,3248.061 1385.347,3247.503L1511.211,3121.638Z'
const C_WEDGE =
  'M1491.536,3100.302L1364.841,3226.996C1331.239,3193.395 1285.666,3174.518 1238.146,3174.518C1179.688,3174.518 1124.906,3203.036 1091.376,3250.922L944.606,3148.152C1011.666,3052.38 1121.23,2995.344 1238.146,2995.344C1333.186,2995.344 1424.333,3033.099 1491.536,3100.302Z'

const F_SQUARE_MATRIX = 'matrix(0.824481,0,0,0.824481,-947.346321,-2365.32427)'
/** Bar matrices, top → bottom (widths 100% / 50% / 25%). */
const F_BAR_MATRICES = [
  'matrix(0.824481,0,0,0.235566,-947.346321,-675.806111)',
  'matrix(0.412241,0,0,0.235566,-261.473612,-541.22723)',
  'matrix(0.20612,0,0,0.235566,81.462743,-406.648349)',
] as const
const F_RECT = { x: 1663.768, y: 2868.864, w: 457.04, h: 457.04 }

const O_MATRIX = 'matrix(0.525776,0,0,0.525776,-462.343162,-1574.881122)'
const O_DIAL =
  'M3114.567,3110.81C3173.504,3174.684 3209.527,3260.014 3209.527,3353.691C3209.527,3551.468 3048.957,3712.038 2851.18,3712.038C2653.403,3712.038 2492.833,3551.468 2492.833,3353.691C2492.833,3155.914 2653.403,2995.344 2851.18,2995.344C2944.857,2995.344 3030.187,3031.367 3094.061,3090.304L2840.927,3343.438C2835.268,3349.097 2835.268,3358.285 2840.927,3363.944C2846.586,3369.603 2855.774,3369.603 2861.433,3363.944L3114.567,3110.81Z'

/* ── Glyphs ───────────────────────────────────────────────── */

/** C — pie chart. Dark pie + separate counter wedge. */
export function C2GlyphC({
  x,
  y,
  width,
  height,
  darkFill,
  counterFill = 'transparent',
  animate,
  animPhase = 0,
}: C2GlyphProps) {
  return (
    <svg x={x} y={y} width={width} height={height} viewBox={`0 0 ${C2_VIEW} ${C2_VIEW}`} overflow="visible">
      {/* whole pie (figure + wedge) spins together */}
      <g
        className={animate ? C2_ANIM_CLASS.c : undefined}
        style={animate ? { animationDelay: `${(-animPhase * C2_ANIM_DUR.c).toFixed(2)}s` } : undefined}
      >
        <g transform={C_MATRIX}>
          <path d={C_PIE} fill={darkFill} />
        </g>
        <g transform={C_MATRIX}>
          <path d={C_WEDGE} fill={counterFill} />
        </g>
      </g>
    </svg>
  )
}

/** F — descending bar chart. Square counter + 3 dark bars (each animatable). */
export function C2GlyphF({
  x,
  y,
  width,
  height,
  darkFill,
  counterFill = 'transparent',
  animate,
  animPhase = 0,
}: C2GlyphProps) {
  return (
    <svg x={x} y={y} width={width} height={height} viewBox={`0 0 ${C2_VIEW} ${C2_VIEW}`} overflow="visible">
      <g transform={`translate(${-C2_BOX_X[1]} 0)`}>
        <g transform={F_SQUARE_MATRIX}>
          <rect x={F_RECT.x} y={F_RECT.y} width={F_RECT.w} height={F_RECT.h} fill={counterFill} />
        </g>
        {F_BAR_MATRICES.map((m, i) => (
          <g
            key={i}
            className={animate ? C2_ANIM_CLASS.bar : undefined}
            // each bar slightly out of phase with its siblings
            style={animate ? { animationDelay: `${(-animPhase * C2_ANIM_DUR.bar - i * 0.35).toFixed(2)}s` } : undefined}
          >
            <g transform={m}>
              <rect x={F_RECT.x} y={F_RECT.y} width={F_RECT.w} height={F_RECT.h} fill={darkFill} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  )
}

/** O — gauge dial. Single path; the needle slit shows whatever is behind. */
export function C2GlyphO({
  x,
  y,
  width,
  height,
  darkFill,
  animate,
  animPhase = 0,
}: C2GlyphProps) {
  return (
    <svg x={x} y={y} width={width} height={height} viewBox={`0 0 ${C2_VIEW} ${C2_VIEW}`} overflow="visible">
      {/* two nested groups because a single element can't run two transform
          animations: the outer one rotates (reverse, slower than the C),
          the inner one keeps the subtle size pulse */}
      <g
        className={animate ? C2_ANIM_CLASS.oSpin : undefined}
        style={animate ? { animationDelay: `${(-animPhase * C2_ANIM_DUR.oSpin).toFixed(2)}s` } : undefined}
      >
        <g
          className={animate ? C2_ANIM_CLASS.o : undefined}
          style={animate ? { animationDelay: `${(-animPhase * C2_ANIM_DUR.o).toFixed(2)}s` } : undefined}
        >
          <g transform={`translate(${-C2_BOX_X[2]} 0)`}>
            <g transform={O_MATRIX}>
              <path d={O_DIAL} fill={darkFill} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

/** Glyphs indexed C / F / O — handy for seeded per-cell picks. */
export const C2_GLYPHS = [C2GlyphC, C2GlyphF, C2GlyphO] as const
