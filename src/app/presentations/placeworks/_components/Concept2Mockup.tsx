/* Concept 02 mockup — site hoarding.
   The strand starts as a tangle on the left and resolves into orderly lines
   that flow into a white plane carrying the wordmark. */

const NAVY = 'var(--pw-ink)'

// A believable tangle squiggle on the left of the board.
const TANGLE =
  'M 230 510 C 300 430 330 470 300 520 C 272 568 220 548 250 500 C 282 448 360 470 345 528 C 332 578 280 600 268 545 C 258 500 320 470 380 500 C 440 528 470 500 520 510'

// Orderly lines fanning from the resolve point into the plane.
const SPLIT_TARGETS = [400, 455, 510, 565, 620]

export default function Concept2Mockup() {
  const splitX = 520
  const planeLeft = 1230
  const cy = 510
  return (
    <svg viewBox="0 0 1920 1080" role="img" aria-label="PlaceWorks site hoarding — tangle resolving into order">
      <rect width="1920" height="1080" fill="var(--pw-paper)" />

      <defs>
        <filter id="c2-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="14" />
          <feOffset dy="18" result="o" />
          <feComponentTransfer in="o" result="s">
            <feFuncA type="linear" slope="0.22" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Hoarding posts + ground */}
      <rect x="250" y="780" width="26" height="150" fill="#ffffff" opacity="0.16" />
      <rect x="1644" y="780" width="26" height="150" fill="#ffffff" opacity="0.16" />
      <line x1="120" y1="930" x2="1800" y2="930" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="3" />

      {/* The board */}
      <g filter="url(#c2-soft)">
        <rect x="120" y="230" width="1680" height="560" fill="var(--pw-paper-pure)" stroke="var(--pw-hair)" strokeWidth="1" />
      </g>

      {/* Strand: tangle → clean line */}
      <path d={`${TANGLE} L ${splitX} ${cy}`} fill="none" stroke={NAVY} strokeWidth={2.4} strokeOpacity={0.82} strokeLinecap="round" strokeLinejoin="round" />

      {/* Orderly flowing lines into the plane */}
      {SPLIT_TARGETS.map((ty, i) => (
        <path
          key={i}
          d={`M ${splitX} ${cy} C ${splitX + 340} ${cy} ${planeLeft - 340} ${ty} ${planeLeft} ${ty}`}
          fill="none"
          stroke={NAVY}
          strokeWidth={2.4}
          strokeOpacity={0.6 + (i % 3) * 0.08}
          strokeLinecap="round"
        />
      ))}

      {/* Intervention plane */}
      <rect x={planeLeft} y="230" width={1800 - planeLeft} height="560" fill="var(--pw-paper-pure)" />
      <image
        href="/presentations/placeworks/wordmark-02-white.svg"
        x={planeLeft + 55} y={cy - 60} width={420} height={120}
        preserveAspectRatio="xMidYMid meet"
      />
      <line x1={planeLeft + 90} y1={cy + 78} x2={planeLeft + 360} y2={cy + 78} stroke="var(--pw-accent)" strokeWidth="2" />
      <text x={planeLeft + 90} y={cy + 110} fontFamily="ui-monospace, monospace" fontSize="15" letterSpacing="1.5" fill="var(--pw-stone)">
        35&deg;18&prime;S 149&deg;07&prime;E
      </text>

      <text x="120" y="1000" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="1" fill="var(--pw-stone)">
        Application — site hoarding · Concept 02
      </text>
    </svg>
  )
}
