import { initSmoothScroll, destroySmoothScroll, getLenis } from './smooth-scroll.js'
import { initAnimations } from './animations.js'
import { initA11y, cleanupA11y } from './a11y.js'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let destroyScrollNav = null

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

function init() {
  initSmoothScroll()
  initA11y()
  initScrollNav()
  // Wait for fonts before initialising — fit-text needs accurate measurements
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => initAnimations())
  } else {
    initAnimations()
  }
  updateNavActive()
}

function cleanup() {
  ScrollTrigger.getAll().forEach(t => t.kill())
  if (destroyScrollNav) { destroyScrollNav(); destroyScrollNav = null }
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
