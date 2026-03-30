'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function AnimationsInit() {
  const pathname = usePathname()

  useEffect(() => {
    let cleanupFn: (() => void) | undefined

    async function init() {
      const { initScrollAnimations, initGridHovers, fitGridTitles } =
        await import('@/lib/animations')

      ScrollTrigger.getAll().forEach(t => t.kill())

      initScrollAnimations()
      const cleanupHovers = initGridHovers()

      let cleanupFitTitles: (() => void) | undefined

      const doFit = () => {
        cleanupFitTitles = fitGridTitles()
        ScrollTrigger.refresh()
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(doFit)
      } else {
        doFit()
      }

      cleanupFn = () => {
        ScrollTrigger.getAll().forEach(t => t.kill())
        cleanupHovers()
        cleanupFitTitles?.()
      }
    }

    init()

    return () => {
      cleanupFn?.()
    }
  }, [pathname])

  return null
}
