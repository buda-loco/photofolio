import type { Metadata } from 'next'
import ConceptPage from '../_components/ConceptPage'
import { conceptBySlug } from '../_components/concepts'

const c = conceptBySlug('02')!

export const metadata: Metadata = {
  title: `Repusearch — Concept 02: ${c.name}`,
}

export default function RepusearchConcept02() {
  return <ConceptPage c={c} />
}
