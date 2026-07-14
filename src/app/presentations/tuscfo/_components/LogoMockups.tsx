'use client'

/**
 * Tus CFO — live logo mockups.
 *
 * Four very basic, always-in-sync applications rendered from the logo
 * editor's CURRENT state (logo colours + canvas background): an
 * Instagram profile picture, a website header, a personal business card
 * and a laptop wallpaper. Card and wallpaper use the canvas background
 * as their surface with the logo sitting in a white container with
 * modest side padding.
 *
 * Everything is inline SVG so the strip stays crisp and re-renders with
 * every editor change. Each editor passes a `renderLogo(x, y, w, h)`
 * that draws its live mark into the given box.
 */

import { useId, type ReactNode } from 'react'
import { luminance } from './palettes'
import { usePatternPreview } from './patternPreview'

const INK = '#000000'
const PAPER = '#ffffff'

export type LogoRenderer = (x: number, y: number, w: number, h: number) => ReactNode

/** Logo centred in a max box, aspect preserved (no container). */
function FitLogo({
  cx,
  cy,
  maxW,
  maxH,
  aspect,
  renderLogo,
}: {
  cx: number
  cy: number
  maxW: number
  maxH: number
  aspect: number
  renderLogo: LogoRenderer
}) {
  let logoW = maxW
  let logoH = logoW / aspect
  if (logoH > maxH) {
    logoH = maxH
    logoW = logoH * aspect
  }
  return <>{renderLogo(cx - logoW / 2, cy - logoH / 2, logoW, logoH)}</>
}

export default function LogoMockups({
  bg,
  aspect,
  renderLogo,
  patternKey,
}: {
  bg: string | null
  aspect: number
  renderLogo: LogoRenderer
  /** concept id whose pattern generator feeds the card band + wallpaper */
  patternKey?: string
}) {
  const pattern = usePatternPreview(patternKey ?? '')
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const surface = bg ?? PAPER
  const onSurface = luminance(surface) < 0.4 ? PAPER : INK

  // Instagram avatar: the logo on the canvas background, clipped to a circle.
  const avatarR = 64
  const avatarLogoW = avatarR * 2 * 0.62
  const avatarLogoH = avatarLogoW / aspect

  return (
    <div className="tc-mockups" aria-label="Mockups básicos del logo">
      <figure className="tc-mockup-tile">
        <svg viewBox="0 0 320 240" role="img" aria-label="Foto de perfil de Instagram">
          <defs>
            <clipPath id={`${uid}-av`}>
              <circle cx={92} cy={108} r={avatarR} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}-av)`}>
            <rect x={92 - avatarR} y={108 - avatarR} width={avatarR * 2} height={avatarR * 2} fill={surface} />
            {renderLogo(92 - avatarLogoW / 2, 108 - avatarLogoH / 2, avatarLogoW, avatarLogoH)}
          </g>
          <circle cx={92} cy={108} r={avatarR + 3} fill="none" stroke="rgba(127,127,127,0.35)" strokeWidth="1.5" />
          {/* profile stats + bio placeholders */}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={176 + i * 44} y={86} width={28} height={9} rx={2} fill="rgba(127,127,127,0.55)" />
              <rect x={176 + i * 44} y={101} width={28} height={6} rx={2} fill="rgba(127,127,127,0.3)" />
            </g>
          ))}
          <rect x={44} y={190} width={78} height={9} rx={2} fill="rgba(127,127,127,0.55)" />
          <rect x={44} y={206} width={128} height={6} rx={2} fill="rgba(127,127,127,0.3)" />
        </svg>
        <figcaption className="tc-mockup-label">Perfil de Instagram</figcaption>
      </figure>

      <figure className="tc-mockup-tile">
        <svg viewBox="0 0 320 240" role="img" aria-label="Header de sitio web">
          {/* browser window */}
          <rect x={16} y={26} width={288} height={190} rx={10} fill={PAPER} />
          <path d="M16 36 a10 10 0 0 1 10-10 h268 a10 10 0 0 1 10 10 v16 h-288 Z" fill="#e6e6e6" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={32 + i * 13} cy={39} r={4} fill="#c4c4c4" />
          ))}
          <rect x={84} y={33} width={150} height={12} rx={6} fill="#d4d4d4" />
          {/* site header band = canvas background + live logo */}
          <rect x={16} y={52} width={288} height={44} fill={surface} />
          {renderLogo(30, 63, Math.min(22 * aspect, 90), Math.min(22 * aspect, 90) / aspect)}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={196 + i * 34} y={70} width={24} height={7} rx={2} fill={onSurface} opacity={0.75} />
          ))}
          {/* page content placeholders */}
          <rect x={40} y={116} width={168} height={13} rx={2} fill="#3a3a3a" />
          <rect x={40} y={138} width={128} height={8} rx={2} fill="#bdbdbd" />
          <rect x={40} y={152} width={148} height={8} rx={2} fill="#bdbdbd" />
          <rect x={40} y={174} width={64} height={19} rx={9.5} fill={luminance(surface) < 0.9 ? surface : INK} />
          <rect x={228} y={116} width={62} height={77} rx={4} fill="#e2e2e2" />
        </svg>
        <figcaption className="tc-mockup-label">Header web</figcaption>
      </figure>

      <figure className="tc-mockup-tile">
        <svg viewBox="0 0 320 240" role="img" aria-label="Tarjeta personal">
          {/* business card, 85.6 × 54 — pattern band on top, logo left, details right */}
          <defs>
            <clipPath id={`${uid}-card`}>
              <rect x={30} y={38} width={260} height={164} rx={10} />
            </clipPath>
          </defs>
          <rect x={34} y={42} width={260} height={164} rx={10} fill="rgba(0,0,0,0.35)" transform="translate(4 6)" />
          <rect x={30} y={38} width={260} height={164} rx={10} fill={surface} stroke="rgba(127,127,127,0.25)" />
          <g clipPath={`url(#${uid}-card)`}>
            {pattern ? (
              <image href={pattern} x={30} y={38} width={260} height={48} preserveAspectRatio="xMidYMid slice" />
            ) : (
              <rect x={30} y={38} width={260} height={48} fill={surface} />
            )}
          </g>
          <FitLogo cx={86} cy={146} maxW={88} maxH={72} aspect={aspect} renderLogo={renderLogo} />
          <g fill={onSurface} style={{ fontFamily: 'var(--font-sans)' }}>
            <text x={148} y={124} fontSize={14} fontWeight={700}>
              Martina Paz
            </text>
            <text x={148} y={140} fontSize={9} opacity={0.75}>
              Directora Financiera
            </text>
            <rect x={148} y={150} width={116} height={1} opacity={0.25} />
            <text x={148} y={166} fontSize={8.5} opacity={0.75}>
              martina@tuscfo.com
            </text>
            <text x={148} y={180} fontSize={8.5} opacity={0.75}>
              +54 9 11 5555 0123
            </text>
            <text x={148} y={194} fontSize={8.5} opacity={0.75}>
              tuscfo.com
            </text>
          </g>
        </svg>
        <figcaption className="tc-mockup-label">Tarjeta personal</figcaption>
      </figure>

      <figure className="tc-mockup-tile">
        <svg viewBox="0 0 320 240" role="img" aria-label="Wallpaper de laptop">
          {/* laptop — the pattern generator's live canvas is the wallpaper */}
          <defs>
            <clipPath id={`${uid}-screen`}>
              <rect x={65} y={35} width={190} height={122} rx={3} />
            </clipPath>
          </defs>
          <rect x={58} y={28} width={204} height={136} rx={9} fill="#161616" />
          <rect x={65} y={35} width={190} height={122} rx={3} fill={surface} />
          <g clipPath={`url(#${uid}-screen)`}>
            {pattern && (
              <image href={pattern} x={65} y={35} width={190} height={122} preserveAspectRatio="xMidYMid slice" />
            )}
          </g>
          <FitLogo cx={160} cy={96} maxW={110} maxH={64} aspect={aspect} renderLogo={renderLogo} />
          <path d="M40 164 h240 l16 20 a6 6 0 0 1 -6 6 H30 a6 6 0 0 1 -6-6 Z" fill="#242424" />
          <rect x={140} y={164} width={40} height={5} rx={2.5} fill="#3a3a3a" />
        </svg>
        <figcaption className="tc-mockup-label">Wallpaper</figcaption>
      </figure>
    </div>
  )
}
