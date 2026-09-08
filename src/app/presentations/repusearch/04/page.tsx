import type { Metadata } from 'next'
import ConceptPage from '../_components/ConceptPage'
import { conceptBySlug } from '../_components/concepts'

const c = conceptBySlug('04')!

export const metadata: Metadata = {
  title: `Repusearch — Concept 04: ${c.name}`,
}

export default function RepusearchConcept04() {
  return <ConceptPage c={c} />
}
