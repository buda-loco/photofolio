import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProjects, getProject } from '@/lib/content'
import { richToPlain } from '@/lib/richText'
import { queryProject, buildTinaResult } from '@/lib/tinaClient'
import ProjectClient from './ProjectClient'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  const projects = getAllProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug)
  const project = getProject(slug)
  if (!project) return {}

  const description = project.info?.about ? richToPlain(project.info.about) : ''
  const image = project.cover
  const url = `https://benjaminarnedo.com/work/${slug}`

  return {
    title: project.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${project.title} — Benjamin Arnedo`,
      description,
      url,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} — Benjamin Arnedo`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const slug = decodeURIComponent(params.slug)

  const [project, tinaQuery] = await Promise.all([
    getProject(slug),
    queryProject(slug),
  ])
  if (!project) notFound()

  const tinaResult = buildTinaResult(tinaQuery, 'projects', project, `${slug}.json`)

  // Get adjacent project for next/prev link
  const allProjects = getAllProjects()
  const idx = allProjects.findIndex(p => p.slug === slug)
  const nextProject = allProjects.length > 1
    ? (() => {
        const p = allProjects[(idx + 1) % allProjects.length]
        return { slug: p.slug, title: p.title, backgroundColor: p.backgroundColor }
      })()
    : null

  const projectSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    url: `https://benjaminarnedo.com/work/${slug}`,
    creator: { '@type': 'Person', name: 'Benjamin Arnedo', url: 'https://benjaminarnedo.com' },
    ...(project.info?.about ? { description: richToPlain(project.info.about) } : {}),
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(project.cover ? { image: `https://benjaminarnedo.com${project.cover}` } : {}),
    ...(project.info?.client ? { sponsor: { '@type': 'Organization', name: project.info.client } } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema) }}
      />
      <ProjectClient
        query={tinaResult.query}
        variables={tinaResult.variables}
        data={tinaResult.data}
        nextProject={nextProject}
      />
    </>
  )
}
