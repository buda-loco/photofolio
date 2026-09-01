import type { MetadataRoute } from 'next'
import { getAllProjects } from '@/lib/content'

const BASE_URL = 'https://benjaminarnedo.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const projects = getAllProjects()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/how-i-work`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/work`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/job-market`,
      lastModified: new Date('2026-09-01'),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date('2026-04-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const projectRoutes: MetadataRoute.Sitemap = projects.map(project => ({
    url: `${BASE_URL}/work/${project.slug}`,
    lastModified: project.year ? new Date(`${project.year}-01-01`) : new Date('2026-01-01'),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }))

  return [...staticRoutes, ...projectRoutes]
}
