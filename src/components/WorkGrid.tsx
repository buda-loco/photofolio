'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import GridItem from '@/components/GridItem'
import type { Project } from '@/lib/content'

interface WorkGridProps {
  projects: Project[]
  services: string[]
}

// Column-span blueprints (12-col). Randomised per visit so the grid never
// looks the same twice — each number is the grid-column span for that slot.
const BLUEPRINTS = [
  [8, 4, 4, 8, 12],
  [6, 6, 12, 5, 7],
  [12, 4, 4, 4, 8],
  [7, 5, 12, 6, 6],
]

export default function WorkGrid({ projects, services }: WorkGridProps) {
  const [active, setActive] = useState('All')
  const [visible, setVisible] = useState<Project[]>(projects)
  const [blueprint, setBlueprint] = useState<number[]>(BLUEPRINTS[0])
  const gridRef = useRef<HTMLDivElement>(null)
  const isFiltering = useRef(false)

  // Pick random blueprint on mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    const idx = Math.floor(Math.random() * BLUEPRINTS.length)
    setBlueprint(BLUEPRINTS[idx])
    return () => {
      const items = gridRef.current?.querySelectorAll<HTMLElement>('.bento-item')
      if (items?.length) gsap.killTweensOf(Array.from(items))
    }
  }, [])

  // Fade-in items after visible changes
  useEffect(() => {
    const items = gridRef.current?.querySelectorAll<HTMLElement>('.bento-item')
    if (!items?.length) return
    gsap.fromTo(
      Array.from(items),
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }
    )
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
      opacity: 0,
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
      <div className="work-filters" role="group" aria-label="Filter by service">
        {['All', ...services].map(svc => (
          <button
            key={svc}
            className={`work-filter-btn${active === svc ? ' is-active' : ''}`}
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
          visible.map((project, i) => (
            <div
              key={project.slug}
              className="bento-item"
              data-span={blueprint[i % blueprint.length]}
            >
              <GridItem project={project} animated={false} priority={i < 2} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
