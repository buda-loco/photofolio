'use client'

import { type MouseEvent, type ReactNode, type CSSProperties } from 'react'
import { useTransition } from './PageTransition'

interface TransitionLinkProps {
  href: string
  children: ReactNode
  className?: string
  style?: CSSProperties
  target?: string
  rel?: string
  bgColor?: string
  onClick?: () => void
  'aria-label'?: string
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'
  [key: string]: unknown
}

export default function TransitionLink({
  href,
  children,
  className,
  style,
  target,
  rel,
  bgColor,
  onClick,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
  ...rest
}: TransitionLinkProps) {
  const { triggerTransition } = useTransition()

  // External links — bypass transition
  const isExternal =
    href.startsWith('http') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    target === '_blank'

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.()
    if (isExternal) return
    e.preventDefault()
    triggerTransition(href, bgColor)
  }

  // Filter out non-standard HTML attributes
  const htmlRest: Record<string, unknown> = {}
  for (const key of Object.keys(rest)) {
    if (key.startsWith('data-') || key.startsWith('aria-')) {
      htmlRest[key] = rest[key]
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      {...htmlRest}
    >
      {children}
    </a>
  )
}
