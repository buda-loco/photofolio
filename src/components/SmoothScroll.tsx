'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Module-level lenis instance for external access
let lenisInstance: InstanceType<typeof import('lenis').default> | null = null
const readyCallbacks: Array<(lenis: NonNullable<typeof lenisInstance>) => void> = []

export function stopScroll(): void {
  lenisInstance?.stop()
}

export function startScroll(): void {
  lenisInstance?.start()
}

export function getLenis() {
  return lenisInstance
}

export function onLenisReady(cb: (lenis: NonNullable<typeof lenisInstance>) => void): () => void {
  if (lenisInstance) {
    cb(lenisInstance)
    return () => {}
  }
  readyCallbacks.push(cb)
  return () => {
    const i = readyCallbacks.indexOf(cb)
    if (i !== -1) readyCallbacks.splice(i, 1)
  }
}

export default function SmoothScroll() {
  const pathname = usePathname()
  const rafRef = useRef<((time: number) => void) | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { default: Lenis } = await import('lenis')

      if (!mounted) return

      const lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        autoRaf: false,
      })

      lenisInstance = lenis
      readyCallbacks.splice(0).forEach(fn => fn(lenis))
      lenis.on('scroll', ScrollTrigger.update)

      const raf = (time: number) => lenis.raf(time * 1000)
      rafRef.current = raf
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }

    init()

    return () => {
      mounted = false
      if (rafRef.current) {
        gsap.ticker.remove(rafRef.current)
        rafRef.current = null
      }
      if (lenisInstance) {
        lenisInstance.destroy()
        lenisInstance = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to top on navigation — use requestAnimationFrame to ensure
  // the DOM has updated and the transition mask is covering the screen
  useEffect(() => {
    requestAnimationFrame(() => {
      lenisInstance?.scrollTo(0, { immediate: true })
    })
  }, [pathname])

  return null
}
