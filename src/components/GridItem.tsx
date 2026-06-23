'use client'

import { type CSSProperties } from 'react'
import Image from 'next/image'
import { useTransition } from './PageTransition'
import Pill from './Pill'
import type { Project } from '@/lib/content'

interface GridItemProps {
  project: Project
  priority?: boolean
  animated?: boolean
}

function splitTitle(title: string): [string[], string[]] {
  const words = title.split(' ')
  if (words.length <= 2) return [words, []]
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

export default function GridItem({ project, priority = false, animated = true }: GridItemProps) {
  const { triggerTransition } = useTransition()

  // Tina's visual editor can pass an undefined project mid-update — skip
  // rendering rather than crash on project.title / project.backgroundColor.
  if (!project) return null

  // Hover animation is handled globally by initGridHovers() in animations.ts,
  // which AnimationsInit calls on every page. CSS handles initial state:
  //   .grid-item-overlay-bg  { transform: scaleY(0); transform-origin: bottom; }
  //   .grid-item-title .word-inner { transform: translateY(110%); }

  const [line1, line2] = splitTitle(project.title)
  const lines = [line1, line2].filter(l => l.length > 0)

  const itemStyle: CSSProperties = {
    ['--aspect' as string]: project.coverAspect ?? '3/2',
    ...(project.backgroundColor ? { ['--project-bg' as string]: project.backgroundColor } : {}),
  }

  const href = `/work/${project.slug}`

  return (
    <a
      href={href}
      className="grid-item"
      data-size={project.gridSize || 'medium'}
      {...(project.gridOffset ? { 'data-offset': String(project.gridOffset) } : {})}
      style={itemStyle}
      {...(animated ? { 'data-animate': 'fade-up' } : {})}
      onClick={(e) => { e.preventDefault(); triggerTransition(href, project.backgroundColor) }}
    >
      <div className="img-container">
        {project.cover && (
          <Image
            src={project.cover}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw"
            style={{ objectFit: 'cover' }}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        )}
        <div className="grid-item-overlay-bg" />
        <div className="grid-item-scrim" />
        <div className="grid-item-overlay">
          <p className="grid-item-title" data-title={project.title}>
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
      {project.services?.length ? (
        <div className="grid-item-services">
          {project.services.map(service => (
            <Pill key={service} label={service} />
          ))}
        </div>
      ) : null}
    </a>
  )
}
