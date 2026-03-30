import type { Metadata } from 'next'
import { getAbout } from '@/lib/content'
import { queryAbout, buildTinaResult } from '@/lib/tinaClient'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About',
  description: 'Photographer & Cinematographer based in Canberra — about Benjamin Arnedo.',
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
