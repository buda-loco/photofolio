'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTina, tinaField } from 'tinacms/dist/react'
import TransitionLink from '@/components/TransitionLink'
import Pill from '@/components/Pill'
import { type TinaQueryResult, buildTinaProps } from '@/lib/tinaHelpers'
import { SKILLS } from '@/lib/skills'

gsap.registerPlugin(ScrollTrigger)

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
  // Tina's visual editor can briefly deliver `data.about` as undefined during
  // live updates — default to {} so field reads (portrait, name, …) don't crash.
  const about = data.about ?? {}
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

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

        const ctaTexts = gsap.utils.toArray<HTMLElement>('.about-cta-text')
        if (ctaTexts.length) {
          gsap.fromTo(ctaTexts,
            { autoAlpha: 0, y: 20 },
            {
              autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out',
              stagger: 0.15,
              scrollTrigger: { trigger: '.about-cta-inner', start: 'top 85%', once: true },
            }
          )
        }

        const underline = document.querySelector('.about-cta-underline')
        if (underline) {
          gsap.fromTo(underline,
            { scaleX: 0 },
            {
              scaleX: 1, duration: 0.6, ease: 'power2.out',
              scrollTrigger: { trigger: underline, start: 'top 88%', once: true },
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

      // ═══════════════════════════════════════════════════════
      // DESKTOP — Single pinned wrapper, one master timeline
      // Hero → Chunks → Skills all stacked inside .about-stage
      // so there are zero dead-scroll gaps between scenes.
      //
      //  timeline position:
      //  0 ─── HERO ───|─── CHUNK 01 ─── ... ─── CHUNK 05 ───|─── SKILLS ───|
      //                 ↑ chunks start                         ↑ skills start
      // ═══════════════════════════════════════════════════════

      const stage = document.querySelector('.about-stage')
      if (!stage) return

      // ── Timing budget (normalised durations within the master timeline) ──
      const HERO_IN    = 0.02   // hero elements fade in
      const HERO_HOLD  = 0.02   // hero visible
      const HERO_OUT   = 0.02   // hero fades out

      const CHUNK_ENTER  = 0.03
      const CHUNK_HOLD   = 0.04
      const CHUNK_EXIT   = 0.02
      const CHUNK_OVERLAP = 0.015  // next chunk enters while current exits
      const CHUNK_DUR    = CHUNK_ENTER + CHUNK_HOLD + CHUNK_EXIT
      const CHUNKS_TOTAL = CHUNKS.length * (CHUNK_DUR - CHUNK_OVERLAP) + CHUNK_OVERLAP

      const SKILL_IN   = 0.06
      const SKILL_HOLD = 0.06
      const SKILL_SETTLE = 0.04
      const SKILL_PAUSE = 0.04
      const SKILL_OUT  = 0.03

      // Where each act starts on the timeline (0–1)
      const HERO_START   = 0
      const CHUNKS_START = HERO_IN + HERO_HOLD + HERO_OUT
      const SKILLS_START = CHUNKS_START + CHUNKS_TOTAL

      // Total scroll distance (viewport-heights)
      const SCROLL_VH = 600

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: `+=${SCROLL_VH}%`,
          pin: true,
          scrub: true,
        },
      })

      // ── Scroll hint ──
      masterTl.to('.about-scroll-hint', {
        autoAlpha: 0, y: -10, duration: HERO_IN,
      }, 0)

      // ── HERO ──
      masterTl.fromTo('.about-hero-name',
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: HERO_IN }, HERO_START)
      masterTl.fromTo('.about-hero-sub',
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: HERO_IN }, HERO_START + 0.005)
      // hold (nothing happens for HERO_HOLD)
      masterTl.to('.about-hero-portrait', {
        scale: 1.3, autoAlpha: 0, duration: HERO_OUT,
      }, HERO_START + HERO_IN + HERO_HOLD)
      masterTl.to(['.about-hero-name', '.about-hero-sub'], {
        autoAlpha: 0, y: -20, duration: HERO_OUT,
      }, HERO_START + HERO_IN + HERO_HOLD)

      // ── CHUNKS ──
      const panels = gsap.utils.toArray<HTMLElement>('.about-chunk-panel')
      panels.forEach((panel, i) => {
        const chars = panel.querySelectorAll('.about-chunk-char')
        const ticker = panel.querySelector('.about-chunk-ticker')
        const lines = panel.querySelectorAll('.about-chunk-line')
        const off = CHUNKS_START + i * (CHUNK_DUR - CHUNK_OVERLAP)

        // Number chars stagger in
        if (chars.length) {
          masterTl.fromTo(chars,
            { autoAlpha: 0, y: 50 },
            { autoAlpha: 1, y: 0, duration: CHUNK_ENTER, stagger: 0.005 },
            off)
        }

        // Ticker drifts in
        if (ticker) {
          masterTl.fromTo(ticker,
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 0.06, y: -30, duration: CHUNK_ENTER },
            off)
        }

        // Lines stagger in slowly — line by line
        if (lines.length) {
          masterTl.fromTo(lines,
            { autoAlpha: 0, y: 25 },
            { autoAlpha: 1, y: 0, duration: CHUNK_ENTER, stagger: CHUNK_ENTER * 0.4, ease: 'power2.out' },
            off)
        }

        // --- Hold: text stays visible for CHUNK_HOLD ---

        // Lines fade out
        if (lines.length) {
          masterTl.to(lines, {
            autoAlpha: 0, y: -20, duration: CHUNK_EXIT,
            stagger: CHUNK_EXIT / (lines.length + 1),
          }, off + CHUNK_ENTER + CHUNK_HOLD)
        }

        // Number + ticker fade out
        if (chars.length) {
          masterTl.to(chars, {
            autoAlpha: 0, y: -40, duration: CHUNK_EXIT, stagger: 0.002,
          }, off + CHUNK_ENTER + CHUNK_HOLD)
        }
        if (ticker) {
          masterTl.to(ticker, {
            autoAlpha: 0, duration: CHUNK_EXIT,
          }, off + CHUNK_ENTER + CHUNK_HOLD)
        }
      })

      // ── SKILL PILLS — bubble up during chunks, reverse, then take over ──
      //
      //  BUBBLE_START          BUBBLE_APEX            SKILLS_START
      //      │  pills rise ↑       │  pills fall ↓        │  burst to full
      //      │  from below         │  back down            │  opacity + explode
      //      │  (low opacity)      │  (slightly brighter)  │
      //      └─────────────────────┴───────────────────────┘
      //
      const pills = gsap.utils.toArray<HTMLElement>('.about-skill-pill')
      const skillTitleWords = gsap.utils.toArray<HTMLElement>('.about-skills-title-word')
      const skillTitle = document.querySelector('.about-skills-title')

      const vw = window.innerWidth
      const vh = window.innerHeight

      // Per-pill random lanes so they don't clump
      const pillData = pills.map(() => ({
        laneX: gsap.utils.random(-vw * 0.4, vw * 0.4),
        peakY: gsap.utils.random(-vh * 0.5, -vh * 0.3),  // how high they float
        landY: gsap.utils.random(-vh * 0.05, vh * 0.15),  // where they settle before burst
        rot: gsap.utils.random(-10, 10),
        rotPeak: gsap.utils.random(-15, 15),
      }))

      // Timeline positions for the bubble phases
      const BUBBLE_START = CHUNKS_START
      const BUBBLE_APEX  = BUBBLE_START + (SKILLS_START - BUBBLE_START) * 0.55
      const BUBBLE_LAND  = SKILLS_START

      const RISE_DUR  = BUBBLE_APEX - BUBBLE_START
      const FALL_DUR  = BUBBLE_LAND - BUBBLE_APEX

      pills.forEach((pill, i) => {
        const staggerOff = (i / pills.length) * RISE_DUR * 0.6

        // Phase A: Rise — appear from below, float up
        masterTl.fromTo(pill,
          {
            autoAlpha: 0,
            scale: 0.65,
            x: pillData[i].laneX,
            y: vh * 0.7,
            rotation: pillData[i].rot,
          },
          {
            autoAlpha: 0.45,
            scale: 0.8,
            y: pillData[i].peakY,
            x: pillData[i].laneX + gsap.utils.random(-30, 30),
            rotation: pillData[i].rotPeak,
            duration: RISE_DUR,
            ease: 'power1.out',
          },
          BUBBLE_START + staggerOff)

        // Phase B: Fall — reverse, drift back down
        masterTl.to(pill, {
          autoAlpha: 0.55,
          scale: 0.9,
          y: pillData[i].landY,
          x: pillData[i].laneX + gsap.utils.random(-60, 60),
          rotation: gsap.utils.random(-6, 6),
          duration: FALL_DUR,
          ease: 'power1.inOut',
        }, BUBBLE_APEX + staggerOff * 0.3)
      })

      // Phase C: Skills takeover — pills brighten and explode outward
      let sk = SKILLS_START

      // Title words
      masterTl.fromTo(skillTitleWords,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: SKILL_IN * 0.4, stagger: 0.005 },
        sk)

      // Pills burst to full opacity + scatter wide
      masterTl.to(pills, {
        autoAlpha: 1,
        scale: 1,
        x: () => gsap.utils.random(-vw * 0.35, vw * 0.35),
        y: () => gsap.utils.random(-vh * 0.3, vh * 0.3),
        rotation: () => gsap.utils.random(-12, 12),
        duration: SKILL_IN,
        stagger: 0.002,
      }, sk)

      sk += SKILL_IN

      // Pills drift
      masterTl.to(pills, {
        x: () => gsap.utils.random(-vw * 0.3, vw * 0.3),
        y: () => gsap.utils.random(-vh * 0.25, vh * 0.25),
        rotation: () => gsap.utils.random(-6, 6),
        duration: SKILL_HOLD, stagger: 0.001,
      }, sk)

      sk += SKILL_HOLD

      // Pills settle back to grid
      masterTl.to(pills, {
        x: 0, y: 0, rotation: 0, scale: 1,
        duration: SKILL_SETTLE, stagger: 0.001, ease: 'power2.inOut',
      }, sk)

      sk += SKILL_SETTLE

      // Pause — pills visible in grid
      sk += SKILL_PAUSE

      // Everything fades out
      masterTl.to(pills, {
        autoAlpha: 0, scale: 0.8, y: -20,
        duration: SKILL_OUT, stagger: 0.001,
      }, sk)
      if (skillTitle) {
        masterTl.to(skillTitle, {
          autoAlpha: 0, y: -20, duration: SKILL_OUT,
        }, sk)
      }

      // ── CTA: use onEnter callback to avoid pin spacer position issues ──
      gsap.set('.about-cta-text', { autoAlpha: 0, y: 25 })
      gsap.set('.about-cta-underline', { scaleX: 0 })
      gsap.set('.about-cta-link', { autoAlpha: 0, y: 12 })

      ScrollTrigger.create({
        trigger: '.about-scene-cta',
        start: 'top 80%',
        once: true,
        refreshPriority: -20,
        onEnter: () => {
          const tl = gsap.timeline()
          tl.to('.about-cta-text', {
            autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.25,
          }, 0)
          tl.to('.about-cta-underline', {
            scaleX: 1, duration: 0.6, ease: 'power2.out',
          }, 0.6)
          tl.to('.about-cta-link', {
            autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out',
          }, 0.9)
        },
      })

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

      // ── Progress bar — placed last so all pins are registered ──
      if (progressRef.current) {
        const bar = progressRef.current
        gsap.fromTo(bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: document.body,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
              refreshPriority: -100,
              onUpdate: (self) => {
                // Once full, slide out to bottom
                if (self.progress >= 0.99) {
                  gsap.to(bar, { y: 20, autoAlpha: 0, duration: 0.4, ease: 'power2.in', overwrite: true })
                } else if (self.progress < 0.99) {
                  gsap.set(bar, { y: 0, autoAlpha: 1, overwrite: true })
                }
              },
            },
          }
        )
      }

    }, containerRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div className="page about-page" ref={containerRef}>
      <div className="about-progress" ref={progressRef} aria-hidden="true" />

      {/* Single pinned stage — hero, chunks, skills all stacked */}
      <div className="about-stage">
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

        <section className="about-scene about-chunks-container">
          {CHUNKS.map(chunk => (
            <div key={chunk.num} className="about-chunk-panel">
              <span className="about-chunk-num" aria-hidden="true">
                {chunk.num.split('').map((char, ci) => (
                  <span key={ci} className="about-chunk-char">{char}</span>
                ))}
              </span>
              <span className="about-chunk-ticker" aria-hidden="true">{chunk.ticker}</span>
              <div className="about-chunk-text">
                {chunk.lines.map((line, li) => (
                  <p key={li} className="about-chunk-line">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="about-scene about-scene-skills">
          <p className="about-skills-title">
            {'This is all I can do for your brand'.split(' ').map((word, i) => (
              <span key={i} className="about-skills-title-word">{word}{' '}</span>
            ))}
          </p>
          <div className="about-skills-wrap">
            {SKILLS.map(skill => (
              <Pill key={skill} label={skill} className="about-skill-pill" />
            ))}
          </div>
        </section>
      </div>

      {/* CTA + Clients */}
      <section className="about-scene-cta">
        <div className="about-cta-inner">
          <p className="about-cta-text">The best way to understand what I do</p>
          <p className="about-cta-text">is to look at what I&rsquo;ve made.</p>
          <span className="about-cta-underline" aria-hidden="true" />
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
