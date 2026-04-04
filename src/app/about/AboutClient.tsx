'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTina, tinaField } from 'tinacms/dist/react'
import TransitionLink from '@/components/TransitionLink'
import { type TinaQueryResult, buildTinaProps } from '@/lib/tinaHelpers'

gsap.registerPlugin(ScrollTrigger)

const SKILLS = [
  'Brand design', 'Advertising', 'Editorial', 'Packaging',
  'Apparel', 'Digital design', 'Web', 'Apps',
  'Motion graphics', 'Sound design', 'Cinematography',
  'Photography', '3D design', 'Event visuals',
]

const CHUNKS = [
  {
    num: '01',
    ticker: 'creative director, videographer, designer',
    lines: [
      "I\u2019m Benjamin Arnedo \u2014 creative director, videographer, designer, developer, and a few other things depending on the week.",
      "I\u2019ve been making things professionally for over 23 years, and I haven\u2019t stopped learning how to make them better.",
    ],
  },
  {
    num: '02',
    ticker: 'Brand identities, advertising campaigns, editorial design',
    lines: [
      "Over the years the work has taken me everywhere. Brand identities, advertising campaigns, editorial design, packaging, apparel, digital platforms, native apps, websites, motion graphics, sound design, video editing, cinematography, photography, 3D.",
      "Sometimes all inside the same project.",
    ],
  },
  {
    num: '03',
    ticker: 'I change disciplines on purpose',
    lines: [
      "That range isn\u2019t an accident. I change disciplines on purpose. Not because I can\u2019t commit to one thing \u2014 because staying sharp means staying hungry.",
      "A cinematographer solves problems differently than a web developer. A brand strategist sees angles a photographer can\u2019t. I collect those perspectives.",
      "Every new medium teaches me something the previous one couldn\u2019t. The result is a way of thinking that crosses a lot of lines at once.",
    ],
  },
  {
    num: '04',
    ticker: 'how I\u2019m wired.',
    lines: [
      "I\u2019ve led studios, taught at universities, managed clients across continents, and built teams from the ground up.",
      "I\u2019m bilingual in Spanish and English, bicultural, and I\u2019ve worked from Brisbane to Tucum\u00e1n to Canberra \u2014 on projects ranging from one-person startups to government campaigns.",
      "I\u2019m the kind of creative who can sit in a strategy meeting, direct a shoot, and push code on the same day. That\u2019s not showing off. It\u2019s just how I\u2019m wired.",
    ],
  },
  {
    num: '05',
    ticker: 'end-to-end creative',
    lines: [
      "I co-run Bold & Groovy with my partner Guadalupe \u2014 a studio built for clients who want end-to-end creative, from brand through to production, digital, and campaign.",
      "We work with people who have something worth making. Bring us a brief worth caring about.",
    ],
  },
]

type AboutClientProps = TinaQueryResult<'about'>

export default function AboutClient(props: AboutClientProps) {
  const { data } = useTina(buildTinaProps(props))
  const about = data.about
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches

    const ctx = gsap.context(() => {

      if (isMobile) {
        gsap.utils.toArray<HTMLElement>('.about-scene, .about-chunk-panel').forEach(el => {
          gsap.fromTo(el.children,
            { autoAlpha: 0, y: 30 },
            {
              autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out',
              stagger: 0.1,
              scrollTrigger: { trigger: el, start: 'top 80%', once: true },
            }
          )
        })

        gsap.utils.toArray<HTMLElement>('.about-cta-line').forEach(line => {
          gsap.fromTo(line,
            { autoAlpha: 0, y: 15 },
            {
              autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out',
              scrollTrigger: { trigger: line, start: 'top 85%', once: true },
            }
          )
        })

        const underline = document.querySelector('.about-cta-underline')
        if (underline) {
          gsap.fromTo(underline,
            { scaleX: 0 },
            {
              scaleX: 1, duration: 0.6, ease: 'power2.out',
              scrollTrigger: { trigger: underline, start: 'top 85%', once: true },
            }
          )
        }

        gsap.set('.about-client-item', { autoAlpha: 0, y: 20 })
        gsap.utils.toArray<HTMLElement>('.about-client-item').forEach((item, i) => {
          gsap.to(item, {
            autoAlpha: 1, y: 0,
            duration: 0.5, ease: 'power2.out',
            delay: i * 0.08,
            scrollTrigger: { trigger: item, start: 'top 92%', once: true },
          })
        })

        return
      }

      // ═══════════════════════════════════════════
      // DESKTOP
      // ═══════════════════════════════════════════

      // Scroll hint fades
      gsap.to('.about-scroll-hint', {
        autoAlpha: 0, y: -10,
        scrollTrigger: {
          trigger: '.about-scene-hero',
          start: 'top top',
          end: '+=15%',
          scrub: true,
        },
      })

      // ── HERO ──
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.about-scene-hero',
          start: 'top top',
          end: '+=30%',
          pin: true,
          scrub: true,
        },
      })

      heroTl
        .fromTo('.about-hero-name',
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.15 }, 0)
        .fromTo('.about-hero-sub',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.15 }, 0.05)
        .to('.about-hero-portrait', {
          scale: 1.3, autoAlpha: 0, duration: 0.35 }, '>')
        .to(['.about-hero-name', '.about-hero-sub'], {
          autoAlpha: 0, y: -20, duration: 0.25 }, '<')

      // ── CHUNKS: single pinned container, crossfade between panels ──
      // All 5 chunks are stacked (position: absolute) inside one
      // pinned viewport. A master timeline crossfades them — the exit
      // of chunk N overlaps with the entrance of chunk N+1.
      const chunkContainer = document.querySelector('.about-chunks-container')
      const panels = gsap.utils.toArray<HTMLElement>('.about-chunk-panel')

      if (chunkContainer && panels.length) {
        // Children start at autoAlpha: 0 via their fromTo immediateRender.
        // Panels themselves stay visible — they're just transparent containers.

        // Per-chunk duration in the master timeline
        const ENTER = 0.12
        const HOLD = 0.08
        const EXIT = 0.08
        const OVERLAP = 0.04 // how much the next chunk's enter overlaps this chunk's exit
        const CHUNK_DUR = ENTER + HOLD + EXIT

        // Total duration: 5 chunks with overlap between them
        // Each chunk starts at: i * (CHUNK_DUR - OVERLAP)
        const totalDur = CHUNKS.length * (CHUNK_DUR - OVERLAP) + OVERLAP

        const masterTl = gsap.timeline({
          scrollTrigger: {
            trigger: chunkContainer,
            start: 'top top',
            end: `+=${CHUNKS.length * 50}%`,
            pin: true,
            scrub: true,
          },
        })

        panels.forEach((panel, i) => {
          const num = panel.querySelector('.about-chunk-num')
          const ticker = panel.querySelector('.about-chunk-ticker')
          const lines = panel.querySelectorAll('.about-chunk-line')
          const offset = i * (CHUNK_DUR - OVERLAP)

          // Number enters
          if (num) {
            masterTl.fromTo(num,
              { autoAlpha: 0, y: 40 },
              { autoAlpha: 1, y: -20, duration: ENTER + HOLD + EXIT },
              offset)
          }

          // Ticker drifts slowly through the whole chunk duration
          if (ticker) {
            masterTl.fromTo(ticker,
              { autoAlpha: 0, y: 40 },
              { autoAlpha: 0.06, y: -100, duration: ENTER + HOLD + EXIT },
              offset)
          }

          // Lines stagger in
          masterTl.fromTo(lines,
            { autoAlpha: 0, y: 25 },
            { autoAlpha: 1, y: 0, duration: ENTER, stagger: ENTER / (lines.length + 1) },
            offset)

          // Lines fade out (overlaps with next chunk's enter)
          masterTl.to(lines, {
            autoAlpha: 0, y: -20, duration: EXIT, stagger: EXIT / (lines.length + 1),
          }, offset + ENTER + HOLD)

          // Number + ticker fade out
          if (num) {
            masterTl.to(num, { autoAlpha: 0, duration: EXIT }, offset + ENTER + HOLD)
          }
          if (ticker) {
            masterTl.to(ticker, { autoAlpha: 0, duration: EXIT }, offset + ENTER + HOLD)
          }
        })
      }

      // ── SKILLS ──
      const skillScene = document.querySelector('.about-scene-skills')
      const pills = gsap.utils.toArray<HTMLElement>('.about-skill-pill')
      const skillTitle = document.querySelector('.about-skills-title')
      const skillTitleWords = gsap.utils.toArray<HTMLElement>('.about-skills-title-word')

      if (skillScene && pills.length) {
        const skillTl = gsap.timeline({
          scrollTrigger: {
            trigger: skillScene,
            start: 'top top',
            end: '+=250%',
            pin: true,
            scrub: true,
            refreshPriority: -10,
          },
        })

        skillTl.fromTo(skillTitleWords,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.03 },
          0)

        skillTl.to({}, { duration: 0.15 })

        skillTl.fromTo(pills, {
          autoAlpha: 0, scale: 0, x: 0, y: 0,
        }, {
          autoAlpha: 1, scale: 1,
          x: () => gsap.utils.random(-window.innerWidth * 0.35, window.innerWidth * 0.35),
          y: () => gsap.utils.random(-window.innerHeight * 0.3, window.innerHeight * 0.3),
          rotation: () => gsap.utils.random(-12, 12),
          duration: 0.15, stagger: 0.01,
        }, '>')

        skillTl.to(pills, {
          x: () => gsap.utils.random(-window.innerWidth * 0.3, window.innerWidth * 0.3),
          y: () => gsap.utils.random(-window.innerHeight * 0.25, window.innerHeight * 0.25),
          rotation: () => gsap.utils.random(-6, 6),
          duration: 0.1, stagger: 0.005,
        }, '>')

        skillTl.to(pills, {
          x: 0, y: 0, rotation: 0, scale: 1,
          duration: 0.1, stagger: 0.005, ease: 'power2.inOut',
        }, '>')

        skillTl.to({}, { duration: 0.15 })

        skillTl.to(pills, {
          autoAlpha: 0, scale: 0.8, y: -20,
          duration: 0.08, stagger: 0.005,
        }, '>')
        if (skillTitle) {
          skillTl.to(skillTitle, {
            autoAlpha: 0, y: -20, duration: 0.08,
          }, '<')
        }
      }

      // ── CTA ──
      const ctaLines = gsap.utils.toArray<HTMLElement>('.about-cta-line')
      if (ctaLines.length) {
        const ctaTl = gsap.timeline({
          scrollTrigger: { trigger: '.about-cta-inner', start: 'top 70%', once: true },
        })

        ctaTl.fromTo(ctaLines,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.3 },
          0)

        ctaTl.fromTo('.about-cta-underline',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.1')

        ctaTl.fromTo('.about-cta-link',
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          '-=0.15')
      }

      // ── Clients ──
      gsap.set('.about-client-item', { autoAlpha: 0, y: 20 })
      gsap.utils.toArray<HTMLElement>('.about-client-item').forEach((item, i) => {
        gsap.to(item, {
          autoAlpha: 1, y: 0,
          duration: 0.5, ease: 'power2.out',
          delay: i * 0.1,
          scrollTrigger: { trigger: '.about-clients', start: 'top 85%', once: true },
        })
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="page about-page" ref={containerRef}>

      {/* SCENE 1: Hero */}
      <section className="about-scene about-scene-hero">
        <div className="about-hero-portrait">
          {about.portrait && (
            <Image
              src={about.portrait}
              alt={about.name ?? 'Benjamin Arnedo'}
              width={420}
              height={560}
              style={{ width: 'auto', height: 'auto' }}
              priority
              unoptimized
              data-tina-field={tinaField(about, 'portrait')}
            />
          )}
        </div>
        <div className="about-hero-text">
          <h1 className="about-hero-name">{about.name ?? 'Benjamin Arnedo'}</h1>
          <p className="about-hero-sub">Creative Director</p>
        </div>
        <div className="about-scroll-hint" aria-hidden="true">
          <span className="about-scroll-hint-text">Scroll</span>
          <span className="about-scroll-hint-line" />
        </div>
      </section>

      {/* CHUNKS: all stacked in one pinned container for crossfade */}
      <section className="about-scene about-chunks-container">
        {CHUNKS.map(chunk => (
          <div key={chunk.num} className="about-chunk-panel">
            <span className="about-chunk-num" aria-hidden="true">{chunk.num}</span>
            <span className="about-chunk-ticker" aria-hidden="true">{chunk.ticker}</span>
            <div className="about-chunk-text">
              {chunk.lines.map((line, li) => (
                <p key={li} className="about-chunk-line">{line}</p>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* SKILLS */}
      <section className="about-scene about-scene-skills">
        <p className="about-skills-title">
          {'This is all I can do for your brand'.split(' ').map((word, i) => (
            <span key={i} className="about-skills-title-word">{word}{' '}</span>
          ))}
        </p>
        <div className="about-skills-wrap">
          {SKILLS.map(skill => (
            <span key={skill} className="about-skill-pill">{skill}</span>
          ))}
        </div>
      </section>

      {/* CTA + Clients */}
      <section className="about-scene-cta">
        <div className="about-cta-inner">
          <p className="about-cta-heading">
            <span className="about-cta-line">The best way to understand what I do</span>
            <span className="about-cta-line about-cta-line--underlined">
              is to look at what I&rsquo;ve made.
              <span className="about-cta-underline" aria-hidden="true" />
            </span>
          </p>
          <TransitionLink href="/work" className="about-cta-link">
            See the work &rarr;
          </TransitionLink>
        </div>

        <div className="about-clients" data-tina-field={tinaField(about, 'clients')}>
          <span className="label">Selected Clients</span>
          <ul className="about-clients-list">
            {(about.clients ?? []).filter(Boolean).map((client: string) => (
              <li key={client} className="about-client-item">{client}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
