'use client'

import { useEffect, useState } from 'react'

/* Reusable hero proof slider — auto-playing, eased horizontal slide. */

const INTERVAL = 4200

export default function ProofSlider({ slides, label = 'Application proofs' }: { slides: string[]; label?: string }) {
  const N = slides.length
  const [cur, setCur] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [dir, setDir] = useState(1)
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)

  // warm the cache so unseen slides don't flash on first show
  useEffect(() => {
    slides.forEach((s) => { const im = new window.Image(); im.src = s })
  }, [slides])

  const navTo = (next: number, d: number) => {
    if (next === cur) return
    setPrev(cur)
    setDir(d)
    setCur(next)
    setTick((t) => t + 1)
  }

  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => navTo((cur + 1) % N, 1), INTERVAL)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, paused, N])

  const fwd = dir < 0 // inverted slide direction

  return (
    <div
      className="pw-hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="pw-hero-slider-stage">
        {prev !== null && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`out-${tick}`}
            src={slides[prev]}
            alt=""
            aria-hidden="true"
            className={`pw-hero-slide ${fwd ? 'pw-slide-out-fwd' : 'pw-slide-out-bwd'}`}
            draggable={false}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`in-${tick}`}
          src={slides[cur]}
          alt={`${label} ${cur + 1} of ${N}`}
          className={`pw-hero-slide ${tick === 0 ? '' : fwd ? 'pw-slide-in-fwd' : 'pw-slide-in-bwd'}`}
          draggable={false}
          loading="eager"
          onAnimationEnd={() => setPrev(null)}
        />

        <button className="pw-slide-arrow pw-slide-arrow--prev" aria-label="Previous" onClick={() => navTo((cur - 1 + N) % N, -1)}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <polyline points="14,4 8,11 14,18" />
          </svg>
        </button>
        <button className="pw-slide-arrow pw-slide-arrow--next" aria-label="Next" onClick={() => navTo((cur + 1) % N, 1)}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <polyline points="8,4 14,11 8,18" />
          </svg>
        </button>
      </div>

      <div className="pw-slide-dots" role="tablist">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`pw-slide-dot${idx === cur ? ' is-active' : ''}`}
            aria-label={`Go to ${idx + 1}`}
            aria-selected={idx === cur}
            role="tab"
            onClick={() => navTo(idx, idx >= cur ? 1 : -1)}
          />
        ))}
      </div>
    </div>
  )
}
