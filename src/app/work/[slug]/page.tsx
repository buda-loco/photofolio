import type { Metadata } from 'next'
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
  const { slug } = params
  const project = getProject(slug)
  if (!project) return {}

  const description = project.info?.about ? richToPlain(project.info.about) : ''
  const image = project.cover

  return {
    title: project.title,
    description,
    openGraph: {
      title: `${project.title} — Benjamin Arnedo`,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
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
  const { slug } = params

  const [project, tinaQuery] = await Promise.all([
    Promise.resolve(getProject(slug)),
    queryProject(slug),
  ])
  if (!project) throw new Error(`Project not found: ${slug}`)

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
    creator: { '@type': 'Person', name: 'Benjamin Arnedo' },
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
