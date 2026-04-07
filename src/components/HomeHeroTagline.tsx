'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { HERO_NOUNS } from '@/lib/skills'

const SLOT_COUNT = 3
const FACES_PER_SLOT = 4
const CYCLE_INTERVAL = 3000 // ms between rotations
const STAGGER_DELAY = 150  // ms between each slot's rotation

/**
 * Build the word grid deterministically: SLOT_COUNT slots, each with FACES_PER_SLOT words.
 * Distributes nouns evenly across slots so no slot repeats a word.
 */
export function buildSlots(nouns: readonly string[]): string[][] {
  if (nouns.length === 0) return Array.from({ length: SLOT_COUNT }, () => ['Creative'])

  const slots: string[][] = []
  for (let s = 0; s < SLOT_COUNT; s++) {
    const faces: string[] = []
    for (let f = 0; f < FACES_PER_SLOT; f++) {
      faces.push(nouns[(s * FACES_PER_SLOT + f) % nouns.length])
    }
    slots.push(faces)
  }
  return slots
}

// Pre-computed at module level — deterministic, same on server and client
const SLOTS = buildSlots(HERO_NOUNS)

export default function HomeHeroTagline() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) return

    let intervalId: ReturnType<typeof setInterval> | undefined

    const ctx = gsap.context(() => {
      const cubes = containerRef.current?.querySelectorAll<HTMLElement>('.hero-cube')
      if (!cubes?.length) return

      // Compute half the cube height for the Z offset that keeps face 0 flush
      const cubeHeight = cubes[0].offsetHeight
      const zOffset = -(cubeHeight / 2)

      // Set initial transform — GSAP manages all transform components from here
      cubes.forEach(cube => {
        gsap.set(cube, { z: zOffset, rotationX: 0 })
      })

      // Update face opacity based on angle — fade out as faces turn away
      function updateFaceOpacity(cube: HTMLElement) {
        const rx = gsap.getProperty(cube, 'rotationX') as number
        const faces = cube.querySelectorAll<HTMLElement>('.hero-cube-face')
        faces.forEach((face, fi) => {
          // Each face sits at fi * 90°; compute how far it is from front-facing
          const faceAngle = ((rx + fi * 90) % 360 + 360) % 360
          // 0° = front (opacity 1), 90°/270° = side (opacity 0), 180° = back (opacity 0)
          const distFromFront = Math.min(faceAngle, 360 - faceAngle)
          const opacity = Math.max(0, 1 - distFromFront / 70)
          face.style.opacity = String(opacity)
        })
      }

      // Set initial face opacity
      cubes.forEach(cube => updateFaceOpacity(cube))

      let faceIndex = 0

      intervalId = setInterval(() => {
        faceIndex++
        cubes.forEach((cube, i) => {
          gsap.to(cube, {
            rotationX: -90 * faceIndex,
            z: zOffset,
            duration: 0.7,
            ease: 'back.out(1.4)',
            delay: i * (STAGGER_DELAY / 1000),
            onUpdate: () => updateFaceOpacity(cube),
          })
        })
      }, CYCLE_INTERVAL)
    }, containerRef)

    return () => {
      if (intervalId) clearInterval(intervalId)
      ctx.revert()
    }
  }, [])

  return (
    <h1 className="hero-tagline" ref={containerRef} data-animate="fade-up">
      {/* Screen-reader accessible text */}
      <span className="sr-only">Photographer, Cinematographer, Director</span>
      <span className="hero-cubes-row" aria-hidden="true">
        {SLOTS.map((faces, slotIndex) => (
          <span key={slotIndex} className="hero-cube-viewport">
            <span className="hero-cube">
              {faces.map((word, faceIndex) => (
                <span
                  key={faceIndex}
                  className="hero-cube-face"
                  data-face={faceIndex}
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </h1>
  )
}
