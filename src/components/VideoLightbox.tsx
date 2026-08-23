'use client'

import { useEffect, useRef, useCallback } from 'react'
import { dropboxUrl, onelinerSrc, absoluteUrl } from '@/lib/videoEmbed'
import { stopScroll, startScroll } from '@/components/SmoothScroll'
import type { ShowreelItem } from '@/lib/showreel'

interface VideoLightboxProps {
  item: ShowreelItem | null
  onClose: () => void
}

export default function VideoLightbox({ item, onClose }: VideoLightboxProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // The element that had focus before opening, so it can be restored on close.
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    // Focus trap — the panel holds only the close button and an iframe, so
    // cycling between them is enough to keep focus inside the dialog.
    if (e.key === 'Tab' && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, iframe, a[href]'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onClose])

  useEffect(() => {
    if (!item) return

    returnFocusRef.current = document.activeElement as HTMLElement | null
    // Lenis keeps scrolling the page behind a fixed overlay unless told to stop.
    stopScroll()
    document.addEventListener('keydown', handleKey)
    // Defer focus so the panel is painted before it receives focus.
    const raf = requestAnimationFrame(() => closeRef.current?.focus())

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKey)
      startScroll()
      returnFocusRef.current?.focus?.()
    }
  }, [item, handleKey])

  if (!item) return null

  const hasUrl = Boolean(item.dropboxUrl)
  const src = hasUrl
    ? onelinerSrc(dropboxUrl(item.dropboxUrl), {
        autoplay: 'true',
        poster: absoluteUrl(item.poster),
      })
    : ''

  return (
    <div
      className="showreel-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
    >
      <div
        className="showreel-lightbox-panel"
        ref={panelRef}
        style={{ ['--lb-aspect' as string]: item.aspect }}
        onClick={e => e.stopPropagation()}
      >
        <div className="showreel-lightbox-head">
          <div>
            <p className="showreel-lightbox-title">{item.title}</p>
            <p className="showreel-lightbox-cat">{item.category}</p>
          </div>
          <button
            ref={closeRef}
            className="showreel-lightbox-close"
            onClick={onClose}
            aria-label="Close video"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4 4 L16 16 M16 4 L4 16"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </button>
        </div>

        <div className="showreel-lightbox-frame">
          {hasUrl ? (
            <iframe
              src={src}
              title={item.title}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="showreel-lightbox-missing">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.poster} alt="" />
              <p>Video link not connected yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
