import { FINGERPRINT_PATHS } from './fingerprintPaths'

/* Concept 05, panel 1.
   The traced ridge centrelines drawn over the macro fingerprint photograph,
   writing on with an ease-in-out and ping-ponging back off.

   Each path declares pathLength="1" so the dash animation works in normalised
   units and no measuring is needed at runtime. The stagger is a per-path
   animation-delay, and the paths are pre-sorted from the whorl outwards so the
   ripple radiates rather than jumping around the frame. Server-rendered: it is
   pure CSS, so there is no client bundle and nothing to hydrate. */

const PHOTO = '/presentations/repusearch/c05/identity.jpg'
const DRAW = 2.4 // seconds for one pass
const STAGGER = 45 // ms between neighbouring ridges

/* The artwork occupies x 301-778, y 216-867 of the original 1080 box, so the
   view is cropped square around it with 10% padding rather than showing the
   empty margin the source file carries. */
const VB = { x: 148, y: 151, s: 782 }

export default function FingerprintDraw() {
  return (
    <div className="rs-fp">
      <svg
        className="rs-fp-svg"
        viewBox={`${VB.x} ${VB.y} ${VB.s} ${VB.s}`}
        aria-label="Fingerprint ridges drawing on"
      >
        <image
          href={PHOTO}
          x={VB.x}
          y={VB.y}
          width={VB.s}
          height={VB.s}
          preserveAspectRatio="xMidYMid slice"
        />
        <rect x={VB.x} y={VB.y} width={VB.s} height={VB.s} fill="#000" opacity="0.45" />
        <g
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {FINGERPRINT_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              pathLength={1}
              style={{
                animationDuration: `${DRAW}s`,
                animationDelay: `${i * STAGGER}ms`,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
