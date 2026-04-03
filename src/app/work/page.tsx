import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import WorkGrid from '@/components/WorkGrid'
import AnimationsInit from '@/components/AnimationsInit'

export const metadata: Metadata = {
  title: 'Work',
  description: 'Selected projects — photography, cinematography and creative direction by Benjamin Arnedo.',
  alternates: { canonical: 'https://benjaminarnedo.com/work' },
  openGraph: {
    title: 'Work — Benjamin Arnedo',
    description: 'Selected projects — photography, cinematography and creative direction by Benjamin Arnedo.',
    url: 'https://benjaminarnedo.com/work',
    images: [{ url: '/images/about/portrait.jpg' }],
  },
  twitter: {
    title: 'Work — Benjamin Arnedo',
    description: 'Selected projects — photography, cinematography and creative direction by Benjamin Arnedo.',
  },
}

export default function WorkPage() {
  const projects = getAllProjects()
  const services = Array.from(new Set(projects.flatMap(p => p.services ?? []))).sort()

  return (
    <div className="page">
      <AnimationsInit />
      <div className="work-page-header">
        <h1 data-animate="fade-up">Work</h1>
        <p className="work-page-sub" data-animate="fade-up">
          Photography · Cinematography · Creative Direction
        </p>
      </div>
      <WorkGrid projects={projects} services={services} />
    </div>
  )
}
