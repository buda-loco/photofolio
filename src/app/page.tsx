import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import { getShowreelItems, getHomepageVideos } from '@/lib/showreel'
import HomeProjects from '@/components/HomeProjects'
import TransitionLink from '@/components/TransitionLink'
import AnimationsInit from '@/components/AnimationsInit'
import HomeHeroTagline from '@/components/HomeHeroTagline'
import HomeVideoStrip from '@/components/HomeVideoStrip'

export const metadata: Metadata = {
  title: 'Benjamin Arnedo — Creative Director',
  description: 'Creative director. Brand, film and web, across Argentina and Australia. Brisbane-based, working remote.',
  alternates: { canonical: 'https://benjaminarnedo.com' },
  openGraph: {
    title: 'Benjamin Arnedo — Creative Director',
    description: 'Creative director. Brand, film and web, across Argentina and Australia. Brisbane-based, working remote.',
    url: 'https://benjaminarnedo.com',
    images: [{ url: '/social-media.jpg', width: 1280, height: 720 }],
  },
  twitter: {
    title: 'Benjamin Arnedo — Creative Director',
    description: 'Creative director. Brand, film and web, across Argentina and Australia. Brisbane-based, working remote.',
    images: ['/social-media.jpg'],
  },
}

export default async function HomePage() {
  // The CMS labels this field "Feature in homepage", so it selects what shows here.
  // It previously did not: this was slice(0, 2), the two most recent by year, and
  // `featured` was only ever read as an exclusion inside getAllProjects (featured ===
  // false hides a project everywhere). Ticking the box therefore changed nothing, which
  // is not what the label promises. Falls back to the two most recent when none are
  // flagged, so the section is never empty.
  //
  // HomeProjects then shows a random handful of this pool on each visit, so the
  // homepage is never the same twice. The flag stays authoritative: only what is
  // flagged can appear, and the shuffle only chooses between them. Flag more
  // projects to get more variety.
  const all = getAllProjects()
  const picked = all.filter(p => p.featured === true)
  const pool = picked.length ? picked : all.slice(0, 2)

  // Pinned via "homepage": true in showreel.json, falling back to the most
  // recently added. Same rule as the projects above it.
  const videos = getHomepageVideos(getShowreelItems())

  return (
    <div className="page">
      <AnimationsInit />

      <section className="home-intro">
        <div className="home-intro-left">
          <p className="home-intro-name" data-animate="fade-up">Benjamin Arnedo</p>
          <HomeHeroTagline />
          <div className="btn-row home-intro-actions" data-animate="fade-up">
            <TransitionLink href="/about" className="btn">About me</TransitionLink>
            <TransitionLink href="/how-i-work" className="btn btn--ghost">How I work &rarr;</TransitionLink>
          </div>
        </div>
        <div className="home-intro-right" data-animate="fade-up">
          <p className="home-intro-pitch">
            I&rsquo;ve worn a lot of hats.
          </p>
          <p className="home-intro-pitch-accent">
            Turns out I like them all.
          </p>
          <p className="home-intro-pitch-body">
            Brand, film, web, motion, photography, 3D and sound. Bilingual. Brisbane-based, working everywhere. I&rsquo;ve run every seat in the pipeline&thinsp;&mdash;&thinsp;so nothing in it is a mystery to me.
          </p>
          <TransitionLink href="/work" className="home-intro-cta">
            See the work &rarr;
          </TransitionLink>
        </div>
      </section>

      <section className="latest-work" aria-label="Selected projects">
        <div className="latest-work-header">
          <h2 className="latest-work-title">Selected Projects</h2>
          <TransitionLink href="/work" className="latest-work-link">
            View all work &rarr;
          </TransitionLink>
        </div>
        <HomeProjects pool={pool} />
      </section>

      {videos.length > 0 && (
        <section className="latest-work home-video" aria-label="Latest video work">
          <div className="latest-work-header">
            <h2 className="home-video-heading">Latest video work</h2>
            <TransitionLink href="/showreel" className="latest-work-link">
              Watch the showreel &rarr;
            </TransitionLink>
          </div>
          <HomeVideoStrip items={videos} />
        </section>
      )}
    </div>
  )
}
