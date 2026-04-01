import type { Metadata } from 'next'
import { getAbout } from '@/lib/content'
import { queryAbout, buildTinaResult } from '@/lib/tinaClient'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About',
  description: 'Photographer & Cinematographer based in Brisbane — about Benjamin Arnedo.',
  alternates: { canonical: 'https://benjaminarnedo.com/about' },
  openGraph: {
    title: 'About — Benjamin Arnedo',
    description: 'Photographer & Cinematographer based in Brisbane — about Benjamin Arnedo.',
    url: 'https://benjaminarnedo.com/about',
  },
  twitter: {
    title: 'About — Benjamin Arnedo',
    description: 'Photographer & Cinematographer based in Brisbane — about Benjamin Arnedo.',
  },
}

export default async function AboutPage() {
  const [about, tinaQuery] = await Promise.all([
    Promise.resolve(getAbout()),
    queryAbout(),
  ])

  const tinaResult = buildTinaResult(tinaQuery, 'about', about, 'about.json')

  return (
    <AboutClient
      query={tinaResult.query}
      variables={tinaResult.variables}
      data={tinaResult.data}
    />
  )
}
