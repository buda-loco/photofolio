'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { initGridHovers } from '@/lib/animations'
import GridItem from '@/components/GridItem'
import type { Project } from '@/lib/content'

interface WorkGridProps {
  projects: Project[]
  services: string[]
}

// Fixed repeating layout pattern (12-col grid).
// Groups: [1 big + 2 small stacked] → [3 small] → [2 medium] → repeat
// The big item spans 2 rows; the two smalls fill that same 2-row space beside it.
const PATTERN = [
  { col: 8, row: 2 },  // big — 2 rows tall
  { col: 4, row: 1 },  // small — top-right of big
  { col: 4, row: 1 },  // small — bottom-right of big
  { col: 4, row: 1 },  // small ─┐
  { col: 4, row: 1 },  // small  │ 3-small row
  { col: 4, row: 1 },  // small ─┘
  { col: 6, row: 1 },  // medium ─┐ 2-medium row
  { col: 6, row: 1 },  // medium ─┘
]

function getServiceParam(): string {
  if (typeof window === 'undefined') return 'All'
  const params = new URLSearchParams(window.location.search)
  return params.get('service') ?? 'All'
}

export default function WorkGrid({ projects, services }: WorkGridProps) {
  const pathname = usePathname()
  const [active, setActive] = useState('All')
  const [visible, setVisible] = useState<Project[]>(projects)
  const gridRef = useRef<HTMLDivElement>(null)
  const isFiltering = useRef(false)

  // Read ?service= param on mount and on navigation
  useEffect(() => {
    const param = getServiceParam()
    const svc = param === 'All' || services.includes(param) ? param : 'All'
    setActive(svc)
    setVisible(svc === 'All' ? projects : projects.filter(p => p.services?.includes(svc)))
  }, [pathname, services, projects])

  // Cleanup tweens on unmount
  useEffect(() => {
    return () => {
      const items = gridRef.current?.querySelectorAll<HTMLElement>('.bento-item')
      if (items?.length) gsap.killTweensOf(Array.from(items))
    }
  }, [])

  // Fade-in items and re-init hover effects after visible changes
  useEffect(() => {
    const items = gridRef.current?.querySelectorAll<HTMLElement>('.bento-item')
    if (!items?.length) return
    gsap.fromTo(
      Array.from(items),
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }
    )
    const cleanupHovers = initGridHovers(gridRef.current)
    return () => cleanupHovers()
  }, [visible])

  const filterTo = useCallback((service: string) => {
    if (isFiltering.current) return
    isFiltering.current = true

    const items = gridRef.current?.querySelectorAll<HTMLElement>('.bento-item')
    const next = service === 'All'
      ? projects
      : projects.filter(p => p.services?.includes(service))

    if (!items?.length) {
      setActive(service)
      setVisible(next)
      isFiltering.current = false
      return
    }

    gsap.to(Array.from(items), {
      autoAlpha: 0,
      y: 16,
      duration: 0.18,
      stagger: 0.025,
      ease: 'power2.in',
      onComplete() {
        setActive(service)
        setVisible(next)
        isFiltering.current = false
      },
    })
  }, [projects])

  return (
    <div className="work-section">
      <div className="work-layout">
        <aside className="work-sidebar" role="navigation" aria-label="Filter by service">
          <ul className="work-sidebar-list">
            {['All', ...services].map(svc => (
              <li key={svc}>
                <button
                  className={`work-sidebar-btn${active === svc ? ' is-active' : ''}`}
                  aria-pressed={active === svc}
                  onClick={() => filterTo(svc)}
                >
                  {svc}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="work-main">
          <div className="work-filters" role="group" aria-label="Filter by service">
            {['All', ...services].map(svc => (
              <button
                key={svc}
                className={`work-filter-btn${active === svc ? ' is-active' : ''}`}
                aria-pressed={active === svc}
                onClick={() => filterTo(svc)}
              >
                {svc}
              </button>
            ))}
          </div>

          <div className="bento-grid" ref={gridRef}>
            {visible.length === 0 ? (
              <p className="bento-empty">No projects for this service.</p>
            ) : (
              visible.map((project, i) => {
                const slot = PATTERN[i % PATTERN.length]
                return (
                  <div
                    key={project.slug}
                    className="bento-item"
                    data-span={slot.col}
                    data-row-span={slot.row}
                  >
                    <GridItem project={project} animated={false} priority={i < 2} />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
