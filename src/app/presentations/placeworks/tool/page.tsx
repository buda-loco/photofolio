import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PlaceWorks — Brand Asset Tool',
}

export default function PlaceWorksTool() {
  return (
    <div style={{ padding: '4rem var(--pw-margin)' }}>
      <Link href="/presentations/placeworks/02" className="pw-credit">&larr; Concept 02</Link>
      <h1 className="pw-concept-name" style={{ marginTop: '1.5rem' }}>Brand Asset Tool</h1>
      <p className="pw-concept-tagline">Scaffolding — BrandAssetTool component wires in next.</p>
    </div>
  )
}
