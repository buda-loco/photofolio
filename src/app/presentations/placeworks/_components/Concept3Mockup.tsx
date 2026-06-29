/* Concept 03 mockup — presentation slide.
   The five-part monogram at large scale on the left; the wordmark, tagline
   and body on the right. Clean white. */

export default function Concept3Mockup() {
  return (
    <svg viewBox="0 0 1920 1080" role="img" aria-label="PlaceWorks presentation slide — monogram and wordmark">
      <rect width="1920" height="1080" fill="var(--pw-paper)" />

      {/* Monogram — five basic shapes, slightly playful */}
      <g>
        <rect x="430" y="360" width="120" height="300" fill="var(--pw-accent)" transform="rotate(-3 490 510)" />
        <rect x="585" y="430" width="74" height="150" fill="#ffffff" transform="rotate(4 622 505)" />
        <rect x="560" y="300" width="170" height="170" fill="#777777" transform="rotate(24 645 385)" />
        <rect x="470" y="560" width="150" height="150" fill="#bbbbbb" transform="rotate(-22 545 635)" />
        <circle cx="690" cy="610" r="78" fill="#ffffff" />
      </g>

      {/* Wordmark + copy */}
      <text x="1050" y="430" fontFamily="var(--font-display), sans-serif" fontWeight="700" fontSize="64" letterSpacing="6" fill="var(--pw-ink)">
        PLACEWORKS
      </text>
      <text x="1054" y="496" fontFamily="var(--font-sans), sans-serif" fontWeight="300" fontSize="32" letterSpacing="1" fill="var(--pw-ink-soft)">
        Part of something great.
      </text>

      <line x1="1054" y1="556" x2="1660" y2="556" stroke="var(--pw-ink)" strokeOpacity="0.16" strokeWidth="1" />

      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="1054" y={610 + i * 30} width={i === 3 ? 360 : 580} height="10" rx="5" fill="var(--pw-stone)" opacity="0.6" />
      ))}

      <text x="1054" y="940" fontFamily="ui-monospace, monospace" fontSize="14" letterSpacing="1.5" fill="var(--pw-stone)">
        Concept 03 — Presentation slide
      </text>
    </svg>
  )
}
