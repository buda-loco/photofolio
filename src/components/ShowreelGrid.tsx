'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { gsap } from 'gsap'
import { initGridHovers } from '@/lib/animations'
import VideoLightbox from '@/components/VideoLightbox'
import ExternalLinkButton from '@/components/ExternalLinkButton'
import type { ShowreelItem } from '@/lib/showreel'

// Optional context shown above the grid for a given category. Keyed by the
// category name exactly as it appears in showreel.json.
interface CategoryNote {
  text: string
  ctaHref?: string
  ctaLabel?: string
}

// Work made at Crewcible, for Crewcible's clients. The category note below
// only renders while that filter is active and most people browse "All", so
// every card in this category also carries the credit — see .showreel-credit.
const CREDITED_CATEGORY = 'Crewcible'

const CATEGORY_NOTES: Record<string, CategoryNote> = {
  [CREDITED_CATEGORY]: {
    text: 'These are Crewcible productions, made while I was on the team in ' +
          'Canberra — the clients were theirs, not mine. I filmed most of these ' +
          'and directed some, and edited a few. The rest is the work of a very ' +
          'talented team I was lucky to be part of.',
    ctaHref: 'https://crewcible.com/',
    ctaLabel: 'Visit Crewcible',
  },
}

interface ShowreelGridProps {
  items: ShowreelItem[]
  categories: string[]
}

// Titles are split across two lines the same way GridItem does it, so the
// word-reveal stagger reads identically to the home and /work cards.
function splitTitle(title: string): string[][] {
  const words = title.split(' ')
  if (words.length < 2) return [words]
  if (words.length === 2) return [[words[0]], [words[1]]]
  const total = title.replace(/ /g, '').length
  let best = 1
  let bestDiff = Infinity
  let running = 0
  for (let i = 0; i < words.length - 1; i++) {
    running += words[i].length
    const diff = Math.abs(running - (total - running))
    if (diff < bestDiff) {
      bestDiff = diff
      best = i + 1
    }
  }
  return [words.slice(0, best), words.slice(best)]
}

function forCategory(items: ShowreelItem[], category: string): ShowreelItem[] {
  return category === 'All' ? items : items.filter(i => i.category === category)
}

export default function ShowreelGrid({ items, categories }: ShowreelGridProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState('All')
  const [visible, setVisible] = useState<ShowreelItem[]>(items)
  const [open, setOpen] = useState<ShowreelItem | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const isFiltering = useRef(false)

  // Read ?category= on mount and on navigation, so /showreel?category=Crewcible
  // deep-links a filter. filterTo writes the param via replaceState, which the
  // Next 15 router echoes back into searchParams — the guard keeps that echo
  // from re-applying the filter without its animation.
  useEffect(() => {
    const param = searchParams.get('category') ?? 'All'
    const cat = param === 'All' || categories.includes(param) ? param : 'All'
    if (cat === active) return
    setActive(cat)
    setVisible(forCategory(items, cat))
  }, [pathname, searchParams, categories, items, active])

  // One observer drives both the reveal and preview playback.
  //
  // The reveal deliberately does NOT use ScrollTrigger: AnimationsInit kills
  // every ScrollTrigger on mount from an async import, which would race this
  // component's setup and silently leave cards invisible.
  //
  // It also can't be a single staggered tween over the whole set the way
  // WorkGrid does it — that's tuned for ~11 projects, and at 64 items a 0.07
  // stagger takes 4.5s to reach the last card. Staggering per viewport-batch
  // keeps the same feel at any collection size.
  //
  // useLayoutEffect runs before paint, so there's no flash of un-hidden cards.
  useLayoutEffect(() => {
    const root = gridRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('.showreel-item'))
    if (!els.length) return

    const reduce =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // React reuses DOM nodes when an item survives a filter change, so the
    // revealed flag has to be cleared explicitly or those cards never re-show.
    els.forEach(el => { delete el.dataset.revealed })
    gsap.set(els, reduce ? { autoAlpha: 1, y: 0 } : { autoAlpha: 0, y: 28 })

    const cleanupHovers = initGridHovers(root)

    // Cards crossing the boundary in the same frame are revealed as one
    // staggered group rather than each starting its own tween.
    let queue: HTMLElement[] = []
    let raf = 0
    const flush = () => {
      raf = 0
      if (!queue.length) return
      const batch = queue
      queue = []
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const el = entry.target as HTMLElement
          const video = el.querySelector<HTMLVideoElement>('.showreel-preview')
          if (entry.isIntersecting) {
            if (!reduce && el.dataset.revealed !== '1') {
              el.dataset.revealed = '1'
              queue.push(el)
              if (!raf) raf = requestAnimationFrame(flush)
            }
            if (!reduce) {
              video?.play().catch(() => {
                /* autoplay can be refused; the poster stays up, which is fine */
              })
            }
          } else {
            video?.pause()
          }
        })
      },
      { rootMargin: '200px 0px', threshold: 0.2 }
    )

    els.forEach(el => io.observe(el))

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      cleanupHovers()
      gsap.killTweensOf(els)
    }
  }, [visible])

  const filterTo = useCallback((category: string) => {
    if (isFiltering.current) return
    if (category === active) return
    isFiltering.current = true

    const syncUrl = () => {
      const url = category === 'All'
        ? pathname
        : `${pathname}?category=${encodeURIComponent(category)}`
      window.history.replaceState(null, '', url)
    }

    const els = gridRef.current?.querySelectorAll<HTMLElement>('.showreel-item')
    const next = forCategory(items, category)

    if (!els?.length) {
      setActive(category)
      setVisible(next)
      syncUrl()
      isFiltering.current = false
      return
    }

    gsap.to(Array.from(els), {
      autoAlpha: 0,
      y: 16,
      duration: 0.16,
      // `amount` spreads the whole stagger across this fixed total instead of
      // costing 0.025s PER CARD — at 64 cards a per-item stagger delays the
      // switch by ~1.6s before onComplete even fires.
      stagger: { amount: 0.1 },
      ease: 'power2.in',
      onComplete() {
        setActive(category)
        setVisible(next)
        syncUrl()
        isFiltering.current = false
      },
    })
  }, [items, active, pathname])

  const tabs = ['All', ...categories]
  const note = CATEGORY_NOTES[active]

  return (
    <div className="work-section">
      <div className="work-layout">
        <aside className="work-sidebar" role="navigation" aria-label="Filter by category">
          <ul className="work-sidebar-list">
            {tabs.map(cat => (
              <li key={cat}>
                <button
                  className={`work-sidebar-btn${active === cat ? ' is-active' : ''}`}
                  aria-pressed={active === cat}
                  onClick={() => filterTo(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="work-main">
          <div className="work-filters" role="group" aria-label="Filter by category">
            {tabs.map(cat => (
              <button
                key={cat}
                className={`work-filter-btn${active === cat ? ' is-active' : ''}`}
                aria-pressed={active === cat}
                onClick={() => filterTo(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {note ? (
            <aside className="showreel-note" key={active}>
              <p className="showreel-note-text">{note.text}</p>
              {note.ctaHref && note.ctaLabel ? (
                <ExternalLinkButton href={note.ctaHref} label={note.ctaLabel} />
              ) : null}
            </aside>
          ) : null}

          <div className="showreel-grid" ref={gridRef}>
            {visible.length === 0 ? (
              <p className="bento-empty">No videos in this category.</p>
            ) : (
              visible.map(item => {
                const lines = splitTitle(item.title)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="grid-item showreel-item"
                    data-orientation={item.orientation}
                    style={{ ['--aspect' as string]: item.aspect }}
                    onClick={() => setOpen(item)}
                    aria-label={`Play ${item.title}`}
                  >
                    <div className="img-container">
                      <video
                        className="showreel-preview"
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
                          {lines.map((line, li) => (
                            <span key={li} className="title-line">
                              {line.map((word, wi) => (
                                <span key={wi} className="word-clip">
                                  <span className="word-inner">{word}</span>
                                </span>
                              ))}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      <VideoLightbox item={open} onClose={() => setOpen(null)} />
    </div>
  )
}
