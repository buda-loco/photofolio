import { initSmoothScroll, destroySmoothScroll, getLenis, stopScroll, startScroll } from './smooth-scroll.js'
import { initAnimations, fitGridTitles } from './animations.js'
import { initA11y, cleanupA11y } from './a11y.js'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'

let destroyScrollNav = null
let destroyMobileMenu = null
let destroyA11yDrawer = null

function initScrollNav() {
  const nav = document.querySelector('.site-nav')
  const mini = document.querySelector('.nav-mini')
  if (!nav) return

  let lastY = 0
  const THRESHOLD = 80

  function onScroll({ scroll }) {
    const y = scroll
    if (y > THRESHOLD) {
      const goingDown = y > lastY
      nav.classList.toggle('is-hidden', goingDown)
      if (mini) {
        if (goingDown && !mini.classList.contains('is-visible')) {
          // Force reflow so the bounce animation always replays from start
          mini.classList.remove('is-visible')
          void mini.offsetWidth
          mini.classList.add('is-visible')
        } else if (!goingDown) {
          mini.classList.remove('is-visible')
        }
      }
    } else {
      nav.classList.remove('is-hidden')
      mini?.classList.remove('is-visible')
    }
    lastY = y
  }

  const lenis = getLenis()
  lenis?.on('scroll', onScroll)
  destroyScrollNav = () => lenis?.off('scroll', onScroll)
}

function initMobileMenu() {
  const hamburger = document.querySelector('.nav-hamburger')
  const menu = document.querySelector('.mobile-menu')
  const closeBtn = document.querySelector('.mobile-menu-close')
  if (!hamburger || !menu) return

  const items = menu.querySelectorAll('.mobile-menu-item')
  const workEl = menu.querySelector('.mobile-menu-work')
  let isOpen = false
  let lastPickIndex = -1

  // Parse project list embedded at build time
  let projects = []
  try { projects = JSON.parse(menu.dataset.projects || '[]') } catch {}

  // Set GSAP initial states
  gsap.set(items, { opacity: 0, y: 48 })

  function renderWorkPreview() {
    if (!workEl || !projects.length) return

    // Exclude the project currently being viewed
    const currentSlug = window.location.pathname.match(/^\/work\/([^/]+)/)?.[1]
    const pool = currentSlug ? projects.filter(p => p.slug !== currentSlug) : projects
    if (!pool.length) return

    // Pick random, avoid repeating the same project twice in a row
    let idx
    do { idx = Math.floor(Math.random() * pool.length) }
    while (pool.length > 1 && idx === lastPickIndex)
    lastPickIndex = idx
    const p = pool[idx]

    workEl.innerHTML = `
      <span class="mobile-menu-work-label">Latest Work</span>
      <a href="/work/${p.slug}" class="mobile-menu-work-card">
        <div class="mobile-menu-work-img">
          <img src="${p.cover}" alt="${p.title}" loading="lazy" />
        </div>
        <div class="mobile-menu-work-info">
          <span class="mobile-menu-work-cat">${p.category || ''}</span>
          <span class="mobile-menu-work-title">${p.title}</span>
        </div>
      </a>
    `
    // Card click also closes the menu
    workEl.querySelector('a')?.addEventListener('click', close)
  }

  function open() {
    isOpen = true
    menu.classList.add('is-open')
    menu.setAttribute('aria-hidden', 'false')
    hamburger.setAttribute('aria-expanded', 'true')
    stopScroll()

    renderWorkPreview()

    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.07,
      ease: 'power3.out',
      delay: 0.1,
    })
  }

  function close() {
    if (!isOpen) return
    isOpen = false
    hamburger.setAttribute('aria-expanded', 'false')
    startScroll()

    gsap.to(items, {
      opacity: 0,
      y: 24,
      duration: 0.28,
      stagger: 0.04,
      ease: 'power2.in',
      onComplete: () => {
        menu.classList.remove('is-open')
        menu.setAttribute('aria-hidden', 'true')
      },
    })
  }

  hamburger.addEventListener('click', () => (isOpen ? close() : open()))
  closeBtn?.addEventListener('click', close)

  // Close when a nav item is clicked (navigation will follow)
  items.forEach(item => item.addEventListener('click', close))

  function onKeyDown(e) {
    if (e.key === 'Escape' && isOpen) close()
  }
  document.addEventListener('keydown', onKeyDown)

  destroyMobileMenu = () => {
    menu.classList.remove('is-open')
    menu.setAttribute('aria-hidden', 'true')
    hamburger.setAttribute('aria-expanded', 'false')
    startScroll()
    document.removeEventListener('keydown', onKeyDown)
    destroyMobileMenu = null
  }
}

function initA11yDrawer() {
  const fab = document.querySelector('.a11y-fab')
  const drawer = document.querySelector('.a11y-drawer')
  const backdrop = document.querySelector('.a11y-backdrop')
  if (!fab || !drawer) return

  let isOpen = false

  function open() {
    isOpen = true
    drawer.classList.add('is-open')
    drawer.setAttribute('aria-hidden', 'false')
    backdrop?.classList.add('is-open')
    fab.setAttribute('aria-expanded', 'true')
  }

  function close() {
    if (!isOpen) return
    isOpen = false
    drawer.classList.remove('is-open')
    drawer.setAttribute('aria-hidden', 'true')
    backdrop?.classList.remove('is-open')
    fab.setAttribute('aria-expanded', 'false')
  }

  fab.addEventListener('click', () => (isOpen ? close() : open()))
  backdrop?.addEventListener('click', close)

  function onKeyDown(e) {
    if (e.key === 'Escape' && isOpen) close()
  }
  document.addEventListener('keydown', onKeyDown)

  destroyA11yDrawer = () => {
    close()
    document.removeEventListener('keydown', onKeyDown)
    destroyA11yDrawer = null
  }
}

function init() {
  initSmoothScroll()
  initA11y()
  initScrollNav()
  initMobileMenu()
  initA11yDrawer()

  // Run animations IMMEDIATELY — this sets the GSAP initial states (opacity:0,
  // y:36) before the browser has a chance to paint, preventing the FOUC where
  // elements briefly appear visible then snap to hidden.
  initAnimations()

  // Title fitting needs accurate font metrics (probe element widths change with
  // the loaded typeface). Defer only this part — after fitting, refresh all
  // ScrollTrigger positions in case titles changed container heights.
  const doFit = () => { fitGridTitles(); ScrollTrigger.refresh() }
  if (document.fonts?.ready) {
    document.fonts.ready.then(doFit)
  } else {
    doFit()
  }

  updateNavActive()
}

function cleanup() {
  ScrollTrigger.getAll().forEach(t => t.kill())
  if (destroyScrollNav) { destroyScrollNav(); destroyScrollNav = null }
  if (destroyMobileMenu) { destroyMobileMenu() }
  if (destroyA11yDrawer) { destroyA11yDrawer() }
  destroySmoothScroll()
  cleanupA11y()
}

function updateNavActive() {
  const path = window.location.pathname
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href')
    link.classList.toggle(
      'active',
      href === path || (href === '/' && path.startsWith('/work/'))
    )
  })
}

// Before each page swap: clean up scroll
document.addEventListener('astro:before-swap', cleanup)

// After each page load (initial + navigations): init scroll + animations
document.addEventListener('astro:page-load', init)
