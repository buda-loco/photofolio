'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { gsap } from 'gsap'
import TransitionLink from './TransitionLink'
import { useTransition } from './PageTransition'
import { stopScroll, startScroll, getLenis, onLenisReady } from './SmoothScroll'

interface NavProps {
  pillBg: string
  pillText: string
  menuProjects: Array<{ slug: string; title: string; category?: string; cover?: string }>
}

const navItems = [
  { href: '/work', label: 'Work' },
  { href: '/showreel', label: 'Showreel' },
  { href: '/about', label: 'About' },
  { href: '/how-i-work', label: 'Process' },
  { href: '/cv', label: 'CV' },
  { href: '/contact', label: 'Contact' },
]

export default function Nav({ pillBg, pillText, menuProjects }: NavProps) {
  const pathname = usePathname()
  const { triggerTransition } = useTransition()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [previewProject, setPreviewProject] = useState<typeof menuProjects[0] | null>(null)
  const menuItemsRef = useRef<HTMLAnchorElement[]>([])

  function isActive(href: string): boolean {
    if (href === '/work') return pathname === '/' || pathname.startsWith('/work/')
    return href === pathname
  }

  function openMenu() {
    setMobileOpen(true)
    stopScroll()

    // Pick random work preview (avoid current page)
    const currentSlug = pathname.match(/^\/work\/([^/]+)/)?.[1]
    const pool = currentSlug ? menuProjects.filter(p => p.slug !== currentSlug) : menuProjects
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      setPreviewProject(pick)
    }
  }

  function closeMenu() {
    setMobileOpen(false)
    startScroll()
  }

  // Animate menu items on open
  useEffect(() => {
    const items = menuItemsRef.current.filter(Boolean)
    if (!items.length) return

    if (mobileOpen) {
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 48 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.1 }
      )
    } else {
      gsap.to(items, {
        autoAlpha: 0,
        y: 24,
        duration: 0.28,
        stagger: 0.04,
        ease: 'power2.in',
      })
    }
  }, [mobileOpen])

  // Close menu on Escape + focus trap
  useEffect(() => {
    if (!mobileOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { closeMenu(); return }

      // Focus trap: cycle focus within .mobile-menu
      if (e.key === 'Tab') {
        const menu = document.querySelector('.mobile-menu')
        if (!menu) return
        const focusable = menu.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
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
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen])

  // Close menu on route change (browser back/forward)
  useEffect(() => {
    if (mobileOpen) closeMenu()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Scroll-hide nav
  useEffect(() => {
    const nav = document.querySelector('.site-nav')
    const mini = document.querySelector('.nav-mini')
    if (!nav) return

    let lastY = 0
    const THRESHOLD = 80

    function onScroll({ scroll }: { scroll: number }) {
      const y = scroll
      if (y > THRESHOLD) {
        const goingDown = y > lastY
        nav!.classList.toggle('is-hidden', goingDown)
        if (mini) {
          if (goingDown) {
            // Remove + reflow + add to restart the CSS bounce animation
            mini.classList.remove('is-visible')
            void (mini as HTMLElement).offsetWidth
            mini.classList.add('is-visible')
          } else {
            mini.classList.remove('is-visible')
          }
        }
      } else {
        nav!.classList.remove('is-hidden')
        mini?.classList.remove('is-visible')
      }
      lastY = y
    }

    const unsubscribe = onLenisReady((lenis) => {
      lenis.on('scroll', onScroll)
    })

    return () => {
      unsubscribe()
      getLenis()?.off('scroll', onScroll)
    }
  }, [pathname])

  const pillStyle = { '--pill-bg': pillBg, '--pill-text': pillText } as React.CSSProperties

  return (
    <>
      {/* Mini logo */}
      <TransitionLink href="/" className="nav-mini" aria-label="Back to home">
        <Image src="/logo-mini.svg" alt="Benjamin Arnedo" width={35} height={35} style={{ width: 'auto', height: 'auto' }} />
      </TransitionLink>

      <nav className="site-nav" aria-label="Main navigation">
        {/* Desktop logo */}
        <TransitionLink href="/" className="nav-logo">
          <Image
            src="/logo.svg"
            alt="Benjamin Arnedo"
            className="nav-logo-img"
            width={200}
            height={50}
            priority
          />
        </TransitionLink>

        {/* Mobile: centered mini logo */}
        <TransitionLink href="/" className="nav-logo-mobile" aria-label="Home">
          <Image src="/logo-mini.svg" alt="Benjamin Arnedo" width={36} height={36} style={{ width: 'auto', height: '32px' }} />
        </TransitionLink>

        {/* Desktop nav links */}
        <ul className="nav-links" role="list">
          {navItems.map(({ href, label }, i) => (
            <li key={href} style={{ '--i': i } as React.CSSProperties}>
              <TransitionLink
                href={href}
                className="nav-link"
                style={pillStyle}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                {label}
              </TransitionLink>
            </li>
          ))}
        </ul>

        {/* Mobile: hamburger */}
        <button
          className="nav-hamburger"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={openMenu}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu${mobileOpen ? ' is-open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-menu-header">
          <div className="mobile-menu-header-end" aria-hidden="true" />
          <TransitionLink href="/" className="mobile-menu-logo" aria-label="Home" onClick={closeMenu}>
            <Image src="/logo-mini.svg" alt="Benjamin Arnedo" width={36} height={36} style={{ width: 'auto', height: 'auto' }} />
          </TransitionLink>
          <button
            className="mobile-menu-close"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <line x1="1" y1="1" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="21" y1="1" x2="1" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Mobile navigation">
          {navItems.map(({ href, label }, i) => (
            <a
              key={href}
              href={href}
              className="mobile-menu-item"
              aria-current={isActive(href) ? 'page' : undefined}
              ref={(el) => { if (el) menuItemsRef.current[i] = el }}
              onClick={(e) => { e.preventDefault(); closeMenu(); triggerTransition(href) }}
            >
              {label}
            </a>
          ))}
        </nav>

        {previewProject && (
          <div className="mobile-menu-work">
            <span className="mobile-menu-work-label">Latest Work</span>
            <TransitionLink
              href={`/work/${previewProject.slug}`}
              className="mobile-menu-work-card"
              onClick={closeMenu}
            >
              {previewProject.cover && (
                <div className="mobile-menu-work-img">
                  <Image
                    src={previewProject.cover}
                    alt={previewProject.title}
                    width={80}
                    height={53}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </div>
              )}
              <div className="mobile-menu-work-info">
                <span className="mobile-menu-work-cat">{previewProject.category ?? ''}</span>
                <span className="mobile-menu-work-title">{previewProject.title}</span>
              </div>
            </TransitionLink>
          </div>
        )}
      </div>
    </>
  )
}
