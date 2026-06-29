/* Concept 01 mockup — document cover.
   Warm paper sheet, the W treated as a dimensional vessel holding spheres
   (echoing the brand's 3D study), with the real wordmark as the lockup. */

const W_PATH =
  'M1812.466,1107.628C1817.163,1107.628 1821.57,1109.9 1824.295,1113.726C1827.019,1117.552 1827.725,1122.46 1826.189,1126.898C1812.326,1166.957 1780.437,1259.099 1765.39,1302.578C1760.516,1316.66 1747.253,1326.105 1732.352,1326.105C1730.313,1326.105 1728.27,1326.105 1726.274,1326.105C1714.37,1326.105 1703.837,1318.397 1700.236,1307.051C1687.508,1266.952 1659.121,1177.515 1659.121,1177.515C1659.121,1177.515 1630.337,1260.686 1615.839,1302.578C1610.966,1316.66 1597.702,1326.105 1582.801,1326.105C1580.763,1326.105 1578.72,1326.105 1576.724,1326.105C1564.82,1326.105 1554.287,1318.397 1550.685,1307.051C1537.54,1265.637 1506.496,1167.83 1493.392,1126.542C1491.991,1122.128 1492.779,1117.311 1495.514,1113.574C1498.249,1109.837 1502.602,1107.628 1507.233,1107.628C1567.979,1107.628 1750.992,1107.628 1812.466,1107.628Z'

// W is placed via this transform (glyph bbox ~[1493–1826] × [1107–1326]).
const W_TRANSFORM = 'translate(-1313.5,-1196.6) scale(1.37)'

type Sphere = { cx: number; cy: number; r: number }
// Sphere centres in glyph space, nestled in the W's upper pockets.
const SPHERES: Sphere[] = [
  { cx: 1598, cy: 1172, r: 50 },
  { cx: 1676, cy: 1158, r: 40 },
  { cx: 1641, cy: 1228, r: 34 },
]

export default function Concept1Mockup() {
  return (
    <svg viewBox="0 0 1920 1080" role="img" aria-label="PlaceWorks document cover — the W as a vessel holding forms">
      <rect width="1920" height="1080" fill="var(--pw-paper)" />

      <defs>
        <linearGradient id="c1-w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#b8b8b8" />
        </linearGradient>
        <radialGradient id="c1-sphere" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#d4d4d4" />
          <stop offset="1" stopColor="#8a8a8a" />
        </radialGradient>
        <filter id="c1-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="9" />
          <feOffset dy="10" result="o" />
          <feComponentTransfer in="o" result="s">
            <feFuncA type="linear" slope="0.28" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Document sheet */}
      <g filter="url(#c1-soft)">
        <rect x="650" y="110" width="620" height="860" rx="2" fill="var(--pw-paper-pure)" stroke="var(--pw-hair)" strokeWidth="1" />
      </g>

      <text x="690" y="170" fontFamily="ui-monospace, monospace" fontSize="15" letterSpacing="1" fill="var(--pw-stone)">
        benjaminarnedo
      </text>

      {/* W vessel + contained spheres */}
      <g transform={W_TRANSFORM}>
        <path d={W_PATH} fill="url(#c1-w)" />
        {/* shadows pooled in the vessel */}
        {SPHERES.map((s, i) => (
          <ellipse key={`sh${i}`} cx={s.cx} cy={s.cy + s.r * 0.78} rx={s.r * 0.92} ry={s.r * 0.32} fill="#000000" opacity="0.45" />
        ))}
        {SPHERES.map((s, i) => (
          <circle key={`sp${i}`} cx={s.cx} cy={s.cy} r={s.r} fill="url(#c1-sphere)" />
        ))}
      </g>

      {/* Wordmark lockup */}
      <image
        href="/presentations/placeworks/wordmark-01-white.svg"
        x="730" y="690" width="460" height="68"
        preserveAspectRatio="xMidYMid meet"
      />
      <line x1="730" y1="800" x2="1190" y2="800" stroke="var(--pw-ink)" strokeOpacity="0.16" strokeWidth="1" />
      <text x="730" y="840" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="1.5" fill="var(--pw-accent)">
        A WINDOW TO WHAT&rsquo;S POSSIBLE
      </text>

      <text x="690" y="930" fontFamily="ui-monospace, monospace" fontSize="12" letterSpacing="1" fill="var(--pw-stone)">
        35&deg;18&prime;S 149&deg;07&prime;E
      </text>

      <text x="1190" y="1010" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="12" letterSpacing="1" fill="var(--pw-stone)">
        Concept 01 / Cover
      </text>
    </svg>
  )
}
