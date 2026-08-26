'use client'

import { useState, useEffect, useRef } from 'react'
import VideoLightbox from '@/components/VideoLightbox'
import type { ShowreelItem } from '@/lib/showreel'

interface HomeVideoStripProps {
  items: ShowreelItem[]
}

// Kept in step with ShowreelGrid: work made at Crewcible carries the credit
// wherever it appears, not only on /showreel.
const CREDITED_CATEGORY = 'Crewcible'

export default function HomeVideoStrip({ items }: HomeVideoStripProps) {
  const [open, setOpen] = useState<ShowreelItem | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // The clips sit below the fold, so they only play once scrolled to —
  // autoplaying three videos on load costs bandwidth nobody asked for.
  // The hover animation itself is bound globally by AnimationsInit, which
  // skips .bento-grid and .showreel-grid but picks these up as normal cards.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('.home-video-clip'))
    if (!videos.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            video.play().catch(() => {
              /* autoplay can be refused; the poster stays up, which is fine */
            })
          } else {
            video.pause()
          }
        })
      },
      { rootMargin: '200px 0px', threshold: 0.2 }
    )

    videos.forEach(v => io.observe(v))
    return () => io.disconnect()
  }, [items])

  return (
    <>
      <div className="home-video-grid" ref={rootRef}>
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className="grid-item home-video-item"
            onClick={() => setOpen(item)}
            aria-label={`Play ${item.title}`}
          >
            <div className="img-container">
              <video
                className="home-video-clip"
                src={item.preview}
                poster={item.poster}
                muted
                loop
                playsInline
                preload="none"
                tabIndex={-1}
                aria-hidden="true"
              />
              <div className="grid-item-overlay-bg" />
              <div className="grid-item-scrim" />
              {item.category === CREDITED_CATEGORY && (
                <span className="showreel-credit">Made at Crewcible</span>
              )}
              <div className="grid-item-overlay">
                <p className="grid-item-title">
                  <span className="title-line">
                    {item.title.split(' ').map((word, i) => (
                      <span key={i} className="word-clip">
                        <span className="word-inner">{word}</span>
                      </span>
                    ))}
                  </span>
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <VideoLightbox item={open} onClose={() => setOpen(null)} />
    </>
  )
}
