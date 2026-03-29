import { initSmoothScroll, destroySmoothScroll } from './smooth-scroll.js'
import { initAnimations } from './animations.js'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function init() {
  initSmoothScroll()
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
  destroySmoothScroll()
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
