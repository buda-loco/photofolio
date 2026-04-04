import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import GridItem from '@/components/GridItem'
import TransitionLink from '@/components/TransitionLink'
import AnimationsInit from '@/components/AnimationsInit'

export const metadata: Metadata = {
  title: 'Benjamin Arnedo — Photographer & Cinematographer',
  description: 'Benjamin Arnedo is a photographer and cinematographer specializing in motion and light.',
  alternates: { canonical: 'https://benjaminarnedo.com' },
  openGraph: {
    title: 'Benjamin Arnedo — Photographer & Cinematographer',
    description: 'Benjamin Arnedo is a photographer and cinematographer specializing in motion and light.',
    url: 'https://benjaminarnedo.com',
    images: [{ url: '/images/about/portrait.gif' }],
  },
  twitter: {
    title: 'Benjamin Arnedo — Photographer & Cinematographer',
    description: 'Benjamin Arnedo is a photographer and cinematographer specializing in motion and light.',
    images: ['/images/about/portrait.gif'],
  },
}

export default async function HomePage() {
  const latest = getAllProjects().slice(0, 2)

  return (
    <div className="page">
      <AnimationsInit />

      <section className="home-intro">
        <div className="home-intro-left">
          <p className="home-intro-name" data-animate="fade-up">Benjamin Arnedo</p>
          <h1 className="home-intro-tagline" data-animate="fade-up">
            <span className="home-intro-creative">Creative</span>
            Photographer &amp;<br />Cinematographer
          </h1>
          <div className="btn-row home-intro-actions" data-animate="fade-up">
            <TransitionLink href="/about" className="btn">About me</TransitionLink>
            <TransitionLink href="/how-i-work" className="btn btn--ghost">How I work &rarr;</TransitionLink>
          </div>
        </div>
        <div className="home-intro-right" data-animate="fade-up">
          <p className="home-intro-pitch">
            I&rsquo;ve worn a lot of hats. Turns out I like them all.
          </p>
          <p className="home-intro-pitch-body">
            23 years across brand, film, web, motion, photography, 3D, sound, and a dozen disciplines in between. Bilingual. Brisbane-based. Working everywhere. The portfolio is a mix&thinsp;&mdash;&thinsp;that&rsquo;s on purpose.
          </p>
          <TransitionLink href="/work" className="home-intro-cta">
            See the work &rarr;
          </TransitionLink>
        </div>
      </section>

      <section className="latest-work" aria-label="Latest projects">
        <div className="latest-work-header">
          <h2 className="latest-work-title">Latest Projects</h2>
          <TransitionLink href="/work" className="latest-work-link">
            View all work &rarr;
          </TransitionLink>
        </div>
        <div className="latest-work-grid">
          {latest.map((project, i) => (
            <GridItem key={project.slug} project={project} priority={i < 2} />
          ))}
        </div>
      </section>
    </div>
  )
}
