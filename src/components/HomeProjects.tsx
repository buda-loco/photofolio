'use client'

import { useEffect, useState } from 'react'
import GridItem from '@/components/GridItem'
import type { Project } from '@/lib/content'

/**
 * How many project cards the homepage shows. The grid gives each card
 * `grid-column: span 6`, so 2 fills exactly one row.
 *
 * This is also what makes the shuffle visible: the pool is the projects flagged
 * "Feature in homepage", and if SLOTS >= the pool size there is nothing to
 * choose between and only the order would change. Raise it and flag more
 * projects together, or the section just shows everything again.
 */
const SLOTS = 2

/** Fisher-Yates. Copies first — never shuffle the array the server handed us. */
function shuffled<T>(input: readonly T[]): T[] {
  const a = [...input]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Picks a random handful of projects on every visit, so the homepage is not the
 * same page twice.
 *
 * ⚠️ The randomness has to happen *after* mount. This page is statically
 * generated, so anything random at build time is frozen until the next deploy,
 * and anything random during render makes the server and client markup disagree
 * and throws a hydration error. So the first render is deterministic — the
 * first `SLOTS` of the pool, which is what the server rendered — and the
 * shuffle lands in an effect. Same approach as WorkGrid's bento blueprints, and
 * `useState` (not `useRef`) because the re-render is the point.
 *
 * The visible cost is a swap: the first paint shows the pool's first two cards
 * and hydration may replace them. On a static page that gap is tens of
 * milliseconds, and the cards fade in on top of it.
 */
export default function HomeProjects({ pool }: { pool: Project[] }) {
  const [picks, setPicks] = useState<Project[]>(() => pool.slice(0, SLOTS))

  useEffect(() => {
    if (pool.length <= SLOTS) return // nothing to choose between
    setPicks(shuffled(pool).slice(0, SLOTS))
    // Deliberately once per mount. Navigating home again remounts this and
    // reshuffles, which is the behaviour we want.
  }, [pool])

  return (
    <div className="latest-work-grid">
      {picks.map((project, i) => (
        <GridItem key={project.slug} project={project} priority={i < SLOTS} />
      ))}
    </div>
  )
}
