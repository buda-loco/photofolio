'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { useTransition } from './PageTransition'
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
  const itemRef = useRef<HTMLAnchorElement>(null)
  const { triggerTransition } = useTransition()

  useEffect(() => {
    const item = itemRef.current
    if (!item) return

    const bg = item.querySelector<HTMLElement>('.grid-item-overlay-bg')
    const words = Array.from(item.querySelectorAll<HTMLElement>('.word-inner'))
    if (!bg || !words.length) return

    // Set initial GSAP state so overwrite-based tweens always have a known start
    gsap.set(bg, { scaleY: 0, transformOrigin: 'bottom' })
    gsap.set(words, { y: '110%' })

    function onEnter() {
      gsap.to(bg,    { scaleY: 1, duration: 0.32, ease: 'power3.out', overwrite: 'auto' })
      gsap.to(words, { y: '0%',   duration: 0.38, ease: 'power3.out', stagger: 0.045, overwrite: 'auto', delay: 0.14 })
    }

    function onLeave() {
      gsap.to(bg,    { scaleY: 0, duration: 0.28, ease: 'power3.in', overwrite: 'auto' })
      gsap.to(words, { y: '110%', duration: 0.28, ease: 'power3.in', stagger: { each: 0.04, from: 'end' }, overwrite: 'auto' })
    }

    item.addEventListener('mouseenter', onEnter)
    item.addEventListener('mouseleave', onLeave)
    item.addEventListener('focusin',    onEnter)
    item.addEventListener('focusout',   onLeave)

    return () => {
      item.removeEventListener('mouseenter', onEnter)
      item.removeEventListener('mouseleave', onLeave)
      item.removeEventListener('focusin',    onEnter)
      item.removeEventListener('focusout',   onLeave)
      gsap.killTweensOf([bg, ...words])
    }
  }, [])

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
      ref={itemRef}
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
    </a>
  )
}
