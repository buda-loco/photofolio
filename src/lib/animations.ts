import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initScrollAnimations(): void {
  if (document.documentElement.classList.contains('reduce-motion')) return
  if (typeof window === 'undefined') return

  // Fade + rise
  gsap.utils.toArray<HTMLElement>('[data-animate="fade-up"]').forEach(el => {
    const { top, bottom } = el.getBoundingClientRect()
    if (top < window.innerHeight && bottom > 0) return

    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 36 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    )
  })

  // Stagger children
  gsap.utils.toArray<HTMLElement>('[data-animate="stagger"]').forEach(el => {
    gsap.fromTo(
      el.children,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    )
  })

  // Word reveal — clip mask from bottom
  gsap.utils.toArray<HTMLElement>('[data-animate="word-reveal"]').forEach(el => {
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

  // Line reveal
  gsap.utils.toArray<HTMLElement>('[data-animate="line-reveal"]').forEach(el => {
    const lines = el.querySelectorAll('p, li')
    if (!lines.length) return

    gsap.fromTo(
      lines,
      { autoAlpha: 0, y: 14 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    )
  })

  // Parallax
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset['parallax'] ?? '0.25')
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

  // Image reveal — scale + fade
  gsap.utils.toArray<HTMLElement>('.img-reveal').forEach(el => {
    const img = el.querySelector('img')
    if (!img) return

    gsap.fromTo(
      img,
      { scale: 1.07, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 1.3,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      }
    )
  })
}

export function initGridHovers(container?: HTMLElement | null): () => void {
  if (typeof window === 'undefined') return () => {}
  if (document.documentElement.classList.contains('reduce-motion')) return () => {}

  const cleanups: Array<() => void> = []
  const root = container ?? document;

  (root.querySelectorAll<HTMLElement>('.grid-item') as NodeListOf<HTMLElement>).forEach(item => {
    // Skip bento grid items when called globally — WorkGrid manages its own hovers
    if (!container && item.closest('.bento-grid')) return

    const bg = item.querySelector<HTMLElement>('.grid-item-overlay-bg')
    const words = item.querySelectorAll<HTMLElement>('.word-inner')
    if (!bg || !words.length) return

    const tl = gsap.timeline({ paused: true })

    tl.to(bg, {
      scaleY: 1,
      duration: 0.32,
      ease: 'power3.out',
      transformOrigin: 'bottom',
    })

    tl.fromTo(
      words,
      { y: '110%' },
      { y: '0%', duration: 0.38, ease: 'power3.out', stagger: 0.045 },
      '-=0.18'
    )

    const play = () => tl.play()
    const reverse = () => tl.reverse()

    item.addEventListener('mouseenter', play)
    item.addEventListener('mouseleave', reverse)
    item.addEventListener('focusin', play)
    item.addEventListener('focusout', reverse)

    cleanups.push(() => {
      item.removeEventListener('mouseenter', play)
      item.removeEventListener('mouseleave', reverse)
      item.removeEventListener('focusin', play)
      item.removeEventListener('focusout', reverse)
      tl.kill()
    })
  })

  return () => cleanups.forEach(fn => fn())
}

export function destroyScrollAnimations(): void {
  ScrollTrigger.getAll().forEach(t => t.kill())
}

export function initEntryAnimation(): void {
  if (document.documentElement.classList.contains('reduce-motion')) return
  if (typeof window === 'undefined') return

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

  tl.fromTo('.site-nav', { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0)

  const heroEls = document.querySelectorAll('.home-intro > *')
  if (heroEls.length) {
    tl.fromTo(
      heroEls,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 },
      0.2
    )
  }
}
