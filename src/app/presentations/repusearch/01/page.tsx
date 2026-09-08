import type { Metadata } from 'next'
import ConceptPage from '../_components/ConceptPage'
import { conceptBySlug } from '../_components/concepts'

const c = conceptBySlug('01')!

export const metadata: Metadata = {
  title: `Repusearch — Concept 01: ${c.name}`,
}

export default function RepusearchConcept01() {
  return <ConceptPage c={c} />
}
