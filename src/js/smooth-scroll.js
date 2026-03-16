import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis
let rafCallback

export function initSmoothScroll() {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    autoRaf: false,
  })

  lenis.on('scroll', ScrollTrigger.update)

  rafCallback = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(rafCallback)
  gsap.ticker.lagSmoothing(0)
}

export function destroySmoothScroll() {
  if (rafCallback) {
    gsap.ticker.remove(rafCallback)
    rafCallback = null
  }
  if (lenis) {
    lenis.destroy()
    lenis = null
  }
}

export function getLenis() {
  return lenis
}
