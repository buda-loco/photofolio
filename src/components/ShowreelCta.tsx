'use client'

import { useState, useEffect } from 'react'
import TransitionLink from '@/components/TransitionLink'

export interface ShowreelCtaClip {
  preview: string
  poster: string
}

interface ShowreelCtaProps {
  clips: ShowreelCtaClip[]
}

// Yellow banner at the bottom of /work pointing to the showreel, with one
// randomly-picked preview clip playing like a gif. The page is statically
// generated, so the pick happens after mount — a build-time random would be
// frozen into the HTML forever, and picking during render breaks hydration.
export default function ShowreelCta({ clips }: ShowreelCtaProps) {
  const [pick, setPick] = useState<ShowreelCtaClip | null>(null)

  useEffect(() => {
    if (clips.length) setPick(clips[Math.floor(Math.random() * clips.length)])
  }, [clips])

  return (
    <section className="work-showreel-cta" aria-label="Showreel">
      <div className="work-showreel-cta-body">
        <h2 className="work-showreel-cta-title">Not everything holds still.</h2>
        <p className="work-showreel-cta-sub">
          There&rsquo;s video too — commercial work, events and short-form, all in one archive.
        </p>
        <TransitionLink href="/showreel" className="work-showreel-cta-btn">
          Watch the showreel
        </TransitionLink>
      </div>

      {/* Duplicate of the button's link purely as a bigger click target —
          hidden from the tab order and screen readers to avoid a double stop */}
      <TransitionLink
        href="/showreel"
        className="work-showreel-cta-media"
        aria-hidden="true"
        tabIndex={-1}
      >
        {pick && (
          <video
            className="work-showreel-cta-clip"
            src={pick.preview}
            poster={pick.poster}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            tabIndex={-1}
            aria-hidden="true"
          />
        )}
      </TransitionLink>
    </section>
  )
}
