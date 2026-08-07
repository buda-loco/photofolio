'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const CYCLE_INTERVAL = 2600 // ms a line stays on screen

/**
 * Vertical jackpot reel. One line visible; the track slides up by exactly one
 * line height each cycle. The first item is duplicated at the end so the wrap
 * from last → first is a slide like every other step, not a jump back.
 *
 * Mirrors the easing of the homepage cube ticker (back.out) so the two read as
 * the same device in different orientations.
 */
export default function CvReel({ items }: { items: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let intervalId: ReturnType<typeof setInterval> | undefined

    const ctx = gsap.context(() => {
      const track = wrapRef.current?.querySelector<HTMLElement>('.cv-reel-track')
      const first = track?.querySelector<HTMLElement>('li')
      if (!track || !first) return

      let i = 0
      const total = items.length // real items; the clone sits at index `total`

      const step = () => {
        i++
        const lineHeight = first.offsetHeight
        gsap.to(track, {
          y: -i * lineHeight,
          duration: 0.75,
          ease: 'back.out(1.3)',
          onComplete: () => {
            // Landed on the clone — snap back to the real first item. The two
            // are identical, so nothing visibly changes.
            if (i >= total) {
              i = 0
              gsap.set(track, { y: 0 })
            }
          },
        })
      }

      intervalId = setInterval(step, CYCLE_INTERVAL)
    }, wrapRef)

    return () => {
      if (intervalId) clearInterval(intervalId)
      ctx.revert()
    }
  }, [items])

  return (
    <div className="cv-reel" ref={wrapRef}>
      <ul className="cv-reel-track">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
        {/* Seam-free wrap: a copy of the first line. Hidden from assistive tech
            because the list has already been read. */}
        <li aria-hidden="true">{items[0]}</li>
      </ul>
    </div>
  )
}
