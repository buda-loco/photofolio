'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function AnimationsInit() {
  const pathname = usePathname()

  useEffect(() => {
    let cleanupFn: (() => void) | undefined

    async function init() {
      const { initScrollAnimations, initGridHovers } = await import('@/lib/animations')

      ScrollTrigger.getAll().forEach(t => t.kill())

      initScrollAnimations()
      const cleanupHovers = initGridHovers()
      ScrollTrigger.refresh()

      cleanupFn = () => {
        ScrollTrigger.getAll().forEach(t => t.kill())
        cleanupHovers()
      }
    }

    init()

    return () => {
      cleanupFn?.()
    }
  }, [pathname])

  return null
}
