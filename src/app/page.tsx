import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import GridItem from '@/components/GridItem'
import TransitionLink from '@/components/TransitionLink'
import AnimationsInit from '@/components/AnimationsInit'

export const metadata: Metadata = {
  title: 'Benjamin Arnedo — Photographer & Cinematographer',
  description: 'Benjamin Arnedo is a photographer and cinematographer specializing in motion and light.',
  openGraph: {
    title: 'Benjamin Arnedo — Photographer & Cinematographer',
    description: 'Benjamin Arnedo is a photographer and cinematographer specializing in motion and light.',
  },
}

export default async function HomePage() {
  const projects = getAllProjects()

  return (
    <div className="page">
      <AnimationsInit />

      <section className="home-intro">
        <p className="home-intro-name" data-animate="fade-up">Benjamin Arnedo</p>
        <h1 className="home-intro-tagline" data-animate="fade-up">
          <span className="home-intro-creative">Creative</span>
          Photographer &amp;<br />Cinematographer
        </h1>
        <div className="btn-row home-intro-actions" data-animate="fade-up">
          <TransitionLink href="/about" className="btn">About me</TransitionLink>
          <TransitionLink href="/how-i-work" className="btn btn--ghost">How I work &rarr;</TransitionLink>
        </div>
      </section>

      <section className="work-grid" aria-label="Selected work">
        {projects.map((project, i) => (
          <GridItem key={project.slug} project={project} priority={i === 0} />
        ))}
      </section>
    </div>
  )
}
