import type { Metadata } from 'next'
import ConceptPage from '../_components/ConceptPage'
import { conceptBySlug } from '../_components/concepts'

const c = conceptBySlug('05')!

export const metadata: Metadata = {
  title: `Repusearch — Concept 05: ${c.name}`,
}

export default function RepusearchConcept05() {
  return <ConceptPage c={c} />
}
