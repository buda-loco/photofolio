'use client'

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { extractHex, darkenBg } from '@/lib/colors'

/*
 * Logo-window page transition
 *
 * SVG path: fill-rule evenodd — outer rectangle fills yellow,
 * BA logo subpaths punch transparent windows through the fill.
 *
 * WHY animate <path> not root <svg>:
 *   Scaling the SVG element creates a GPU bitmap layer. At the required
 *   ~200× scale that exceeds browser texture limits (16–32 Kpx), which
 *   silently caps the render. Animating the inner <path> keeps the SVG
 *   element at viewport size — the path scale is pure SVG vector with
 *   no rasterisation or texture limit.
 *
 * WHY overflow="visible":
 *   SVG clips children to the viewBox by default. Without it the scaled
 *   path is clipped to viewBox bounds — the animation stops mid-screen
 *   showing a tiny zoomed slice of the logo interior.
 *
 * WHY SCALE_FACTOR = 200:
 *   The logo has a bottleneck — the inner A-triangle connector is only
 *   ~55 SVG units wide at y=1103. The yellow A-counter (subpath overlap
 *   y=1061–1103) stays on-screen until scale > 159. 200 clears every
 *   yellow region off-screen on any viewport from phone portrait to 8K.
 *
 * Sequence:
 *
 *   IDLE  (mask off-screen, main at natural opacity)
 *         │
 *         │ triggerTransition(href)
 *         ▼
 *   ┌─────────────────────────────────────────┐
 *   │ SLIDE-IN   0.49s  power2.out            │ ← mask rises from below
 *   │ BACKDROP   already at y:0% behind mask  │ ← no enter animation
 *   │ FADE-OUT   0.32s  power1.in  (delayed)  │ ← old page fades out
 *   └──────────────┬──────────────────────────┘   simultaneously
 *                  │ onComplete: set main opacity:0, router.push(href)
 *                  ▼
 *   COLOUR + EXPAND + BACKDROP EXIT  (simultaneous)
 *     fill shift 0.35s linear         ← mask changes to destination bg
 *     scale 1.0s expo.in              ← logo holes grow (extreme accel)
 *     backdrop 0.7s power4.inOut      ← dark panel sweeps down off-screen
 *       (starts +0.25s after reveal     visible through holes briefly
 *        so dark panel peeks through    before sweeping to reveal content)
 *                  │
 *                  ▼
 *   FADE-MASK  0.12s  power1.in       ← mask dissolves, page fully visible
 *                  │
 *                  │ onComplete → clearProps, reset, isAnimating=false
 *                  ▼
 *   IDLE
 */

const SVG_ORIGIN   = '1919.9 1109.7'   // inner A-triangle, SVG viewBox coords
const SCALE_FACTOR = 200               // see WHY above
const ACCENT_FILL  = '#f4ff26'         // fallback when no target bg is provided

// Resolve the fill colour for the transition mask.
// Pure black is remapped to near-black — it would be invisible against the site bg.
function maskFill(bgColor?: string): string {
  const hex = bgColor ? (extractHex(bgColor) ?? '#1a1a1a') : '#1a1a1a'
  return (hex === '#000000') ? '#1a1a1a' : hex
}

interface TransitionContextValue {
  triggerTransition: (href: string, bgColor?: string) => void
}

const TransitionContext = createContext<TransitionContextValue>({
  triggerTransition: (href: string) => { window.location.href = href },
})

export function useTransition() {
  return useContext(TransitionContext)
}

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const svgRef       = useRef<SVGSVGElement>(null)
  const pathRef      = useRef<SVGPathElement>(null)
  const panelRef     = useRef<HTMLDivElement>(null)
  const router       = useRouter()
  const pathname     = usePathname()
  const isAnimating  = useRef(false)
  const prevPathname = useRef(pathname)
  // Resolve when the new route mounts so the timeline can wait
  const routeReady = useRef<(() => void) | null>(null)

  // When the new route mounts, fade the page content in from under the mask
  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname

    // Signal the timeline that the new route has mounted
    if (routeReady.current) {
      routeReady.current()
      routeReady.current = null
    }

    // Fade new page content in (mask is still covering screen during early scale)
    gsap.fromTo(
      '#main-content',
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out', overwrite: true,
        clearProps: 'opacity' },
    )

    // Safety reset of mask if navigation happened outside triggerTransition
    // (back/forward button, direct link)
    if (!isAnimating.current) {
      if (svgRef.current)   gsap.set(svgRef.current,   { opacity: 0, y: '100%' })
      if (pathRef.current)  gsap.set(pathRef.current,  { scale: 1 })
      if (panelRef.current) gsap.set(panelRef.current, { opacity: 0, y: '0%' })
    }
  }, [pathname])

  const triggerTransition = useCallback(
    (href: string, bgColor?: string) => {
      if (isAnimating.current) return
      isAnimating.current = true

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        isAnimating.current = false
        router.push(href)
        return
      }

      const svg   = svgRef.current
      const path  = pathRef.current
      const panel = panelRef.current
      if (!svg || !path || !panel) {
        isAnimating.current = false
        router.push(href)
        return
      }

      gsap.killTweensOf([svg, path, panel, '#main-content'])
      gsap.set(svg,   { opacity: 0, y: '100%' })
      gsap.set(path,  { scale: 1, attr: { fill: ACCENT_FILL } })
      const darkColor = darkenBg(maskFill(bgColor))
      gsap.set(panel, {
        opacity: 1,
        y: '0%',
        background: `linear-gradient(to bottom, transparent 0%, ${darkColor} 35%, ${darkColor} 100%)`,
      })

      const tl = gsap.timeline()

      // ── Phase 1: Mask slides up, backdrop slides down, old page fades ───
      tl.to(svg, {
          y: '0%',
          opacity: 1,
          duration: 0.49,
          ease: 'power2.out',
          force3D: true,
        }, 0)
        .to('#main-content', {
          opacity: 0,
          duration: 0.32,
          ease: 'power1.in',
          overwrite: true,
        }, 0.1)

        // ── Navigate and wait for new route to mount ───────────────────────
        .call(() => {
          gsap.set('#main-content', { opacity: 0 })

          // Create a promise that resolves when the pathname useEffect fires
          const routeMounted = new Promise<void>((resolve) => {
            routeReady.current = resolve
            // Safety timeout — don't block forever if route change is instant
            // (same-page navigation) or fails
            setTimeout(resolve, 2000)
          })

          router.push(href)

          // Pause the timeline until the new route is ready
          tl.pause()
          routeMounted.then(() => {
            tl.resume()
          })
        })

        // ── Phase 2: Colour shift + logo expand + backdrop exit ─────────────
        .addLabel('reveal')
        .to(path, {
          attr: { fill: maskFill(bgColor) },
          duration: 0.35,
          ease: 'none',
        }, 'reveal')
        .to(path, {
          scale: SCALE_FACTOR,
          svgOrigin: SVG_ORIGIN,
          duration: 1.0,
          ease: 'expo.in',
          force3D: true,
        }, 'reveal')
        // Backdrop sweeps down to reveal content — starts slightly after
        // the logo begins expanding so it's visible through the holes first.
        // Slow + power2.out for a graceful, decelerating exit.
        .to(panel, {
          y: '100%',
          duration: 1.8,
          ease: 'power2.out',
          force3D: true,
        }, 'reveal+=0.2')

        // ── Phase 3: Mask dissolves ────────────────────────────────────────
        .to(svg, {
          opacity: 0,
          duration: 0.12,
          ease: 'power1.in',
          onComplete() {
            gsap.set(svg,   { y: '100%' })
            gsap.set(path,  { scale: 1, attr: { fill: 'var(--color-label, #f4ff26)' } })
            gsap.set(panel, { opacity: 0, y: '0%' })
            isAnimating.current = false
          },
        })
    },
    [router],
  )

  return (
    <TransitionContext.Provider value={{ triggerTransition }}>
      {/*
       * overflow="visible" — lets scaled path render beyond viewBox bounds.
       * preserveAspectRatio slice — fills every aspect ratio, no letterbox.
       */}
      <svg
        ref={svgRef}
        className="page-transition-mask"
        aria-hidden="true"
        viewBox="0 0 3840 2160"
        preserveAspectRatio="xMidYMid slice"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          ref={pathRef}
          fillRule="evenodd"
          clipRule="evenodd"
          fill="var(--color-label, #f4ff26)"
          d="M3840,0L3840,2160L0,2160L0,0L3840,0ZM1959.883,965.802L1833.455,965.802L1833.455,1027.69L1959.883,1027.69C1976.962,1027.69 1990.827,1013.824 1990.827,996.746C1990.827,979.668 1976.962,965.802 1959.883,965.802ZM1889.62,1102.741L1920.312,1055.097L1926.975,1055.097L1957.728,1102.741L1970.1,1102.741C1990.214,1102.741 2006.545,1086.411 2006.545,1066.296C2006.545,1046.182 1990.214,1029.851 1970.1,1029.851L1833.455,1029.851L1833.455,1102.741L1889.62,1102.741ZM1833.455,1194.198L2006.348,1194.198L1975.573,1146.652L1864.3,1146.652L1833.455,1194.198ZM1865.575,1144.688L1974.302,1144.688L1920,1060.795L1865.575,1144.688Z"
        />
      </svg>
      <div
        ref={panelRef}
        className="page-transition-backdrop"
        aria-hidden="true"
      />
      {children}
    </TransitionContext.Provider>
  )
}
