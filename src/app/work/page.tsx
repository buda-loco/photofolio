import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import { getShowreelItems } from '@/lib/showreel'
import WorkGrid from '@/components/WorkGrid'
import AnimationsInit from '@/components/AnimationsInit'
import ShowreelCta from '@/components/ShowreelCta'

export const metadata: Metadata = {
  title: 'Work',
  description: 'Selected projects — photography, cinematography and creative direction by Benjamin Arnedo.',
  alternates: { canonical: 'https://benjaminarnedo.com/work' },
  openGraph: {
    title: 'Work — Benjamin Arnedo',
    description: 'Selected projects — photography, cinematography and creative direction by Benjamin Arnedo.',
    url: 'https://benjaminarnedo.com/work',
    images: [{ url: '/social-media.jpg', width: 1280, height: 720 }],
  },
  twitter: {
    title: 'Work — Benjamin Arnedo',
    description: 'Selected projects — photography, cinematography and creative direction by Benjamin Arnedo.',
    images: ['/social-media.jpg'],
  },
}

export default function WorkPage() {
  const projects = getAllProjects()
  const services = Array.from(new Set(projects.flatMap(p => p.services ?? []))).sort()
  const clips = getShowreelItems().map(i => ({ preview: i.preview, poster: i.poster }))

  return (
    <div className="page">
      <AnimationsInit />
      <div className="work-page-header">
        <h1 data-animate="fade-up">Work</h1>
        <p className="work-page-sub" data-animate="fade-up">
          Photography · Cinematography · Creative Direction
        </p>
      </div>
      {/* Suspense is required: WorkGrid reads useSearchParams for ?service= */}
      <Suspense>
        <WorkGrid projects={projects} services={services} />
      </Suspense>

      {/* No data-animate on this: the grid above changes height when filtered,
          which would leave a ScrollTrigger'd element with stale positions. */}
      <ShowreelCta clips={clips} />
    </div>
  )
}
