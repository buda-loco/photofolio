import type { Metadata } from 'next'
import ConceptPage from '../_components/ConceptPage'
import { conceptBySlug } from '../_components/concepts'

const c = conceptBySlug('03')!

export const metadata: Metadata = {
  title: `Repusearch — Concept 03: ${c.name}`,
}

export default function RepusearchConcept03() {
  return <ConceptPage c={c} />
}
