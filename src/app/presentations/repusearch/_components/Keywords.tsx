'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Keywords — chips that pop in one after another the first time the row
 * scrolls into view. Stagger and easing live in presentations.css; this
 * only flips the `is-in` class once. Replays if the row is remounted.
 */
export default function Keywords({ words }: { words: string[] }) {
  const ref = useRef<HTMLUListElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <ul ref={ref} className={`rs-keywords${on ? ' is-in' : ''}`} aria-label="Keywords">
      {words.map((w, i) => (
        <li key={`${w}-${i}`} className="rs-keyword" style={{ '--i': i } as React.CSSProperties}>
          {w}
        </li>
      ))}
    </ul>
  )
}
