import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initAnimations() {

  // ── Fade + rise ───────────────────────────────────────────────
  // Skip elements already in viewport — they may have just been placed
  // there by a view-transition morph and must not be reset to opacity:0.
  gsap.utils.toArray('[data-animate="fade-up"]').forEach(el => {
    const { top, bottom } = el.getBoundingClientRect()
    if (top < window.innerHeight && bottom > 0) return

    gsap.fromTo(
      el,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    )
  })

  // ── Stagger children ──────────────────────────────────────────
  gsap.utils.toArray('[data-animate="stagger"]').forEach(el => {
    gsap.fromTo(
      el.children,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    )
  })

  // ── Word reveal — clip mask from bottom ───────────────────────
  // Each .word-inner slides up inside an overflow:hidden .word-clip.
  // No opacity — the clip does the work. Power3 for a crisp snap.
  gsap.utils.toArray('[data-animate="word-reveal"]').forEach(el => {
    const words = el.querySelectorAll('.word-inner')
    if (!words.length) return

    gsap.fromTo(
      words,
      { y: '105%' },
      {
        y: '0%',
        duration: 0.72,
        ease: 'power3.out',
        stagger: 0.055,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    )
  })

  // ── Line reveal — faster fade-up per text line ────────────────
  gsap.utils.toArray('[data-animate="line-reveal"]').forEach(el => {
    const lines = el.querySelectorAll('.text-line')
    if (!lines.length) return

    gsap.fromTo(
      lines,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    )
  })

  // ── Parallax ──────────────────────────────────────────────────
  gsap.utils.toArray('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset.parallax ?? 0.25)
    gsap.to(el, {
      yPercent: -50 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('.img-container') || el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
  })

  // ── Image reveal — scale + fade ───────────────────────────────
  gsap.utils.toArray('.img-reveal').forEach(el => {
    const img = el.querySelector('img')
    if (!img) return

    gsap.fromTo(
      img,
      { scale: 1.07, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1.3,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      }
    )
  })

  // ── Grid title fit + hover reveal ────────────────────────────
  fitGridTitles()
  initGridHovers()

  ScrollTrigger.refresh()
}

// ── Fit grid titles to fill container width ───────────────────────
function fitGridTitles() {
  document.querySelectorAll('.grid-item-title').forEach(fitOneTitle)

  // Re-fit on resize
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      document.querySelectorAll('.grid-item-title').forEach(fitOneTitle)
    }, 100)
  })
}

function fitOneTitle(titleEl) {
  const container = titleEl.closest('.img-container')
  if (!container) return

  const text = titleEl.dataset.title || titleEl.textContent.trim()
  const cs   = getComputedStyle(titleEl)

  const probe = document.createElement('span')
  Object.assign(probe.style, {
    position:      'fixed',
    visibility:    'hidden',
    pointerEvents: 'none',
    whiteSpace:    'nowrap',
    fontFamily:    cs.fontFamily,
    fontWeight:    cs.fontWeight,
    letterSpacing: cs.letterSpacing,
    fontSize:      '100px',
  })
  probe.textContent = text
  document.body.appendChild(probe)

  const probeW = probe.offsetWidth
  document.body.removeChild(probe)

  if (!probeW) return

  const padding   = 48 // 1.5rem * 2 sides from overlay padding
  const available = container.offsetWidth - padding
  titleEl.style.fontSize = Math.max(12, Math.floor(100 * (available / probeW))) + 'px'
}

// ── Grid hover timelines ──────────────────────────────────────────
function initGridHovers() {
  document.querySelectorAll('.grid-item').forEach(item => {
    const bg    = item.querySelector('.grid-item-overlay-bg')
    const words = item.querySelectorAll('.word-inner')
    if (!bg || !words.length) return

    const tl = gsap.timeline({ paused: true })

    // 1 — rectangle builds up from bottom
    tl.to(bg, {
      scaleY:          1,
      duration:        0.32,
      ease:            'power3.out',
      transformOrigin: 'bottom',
    })

    // 2 — words clip-reveal, staggered (tight overlap with rect)
    tl.fromTo(words,
      { y: '110%' },
      { y: '0%', duration: 0.38, ease: 'power3.out', stagger: 0.045 },
      '-=0.18'
    )

    item.addEventListener('mouseenter', () => tl.play())
    item.addEventListener('mouseleave', () => tl.reverse())
  })
}

// Entry animation — initial page load only
export function initEntryAnimation() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

  tl.fromTo('.site-nav', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.7 }, 0)

  const heroEls = document.querySelectorAll('.home-intro > *')
  if (heroEls.length) {
    tl.fromTo(
      heroEls,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
      0.2
    )
  }
}
