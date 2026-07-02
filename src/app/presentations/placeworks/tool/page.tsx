import type { Metadata } from 'next'
import Link from 'next/link'
import BrandAssetTool from '../_components/tool/BrandAssetTool'

export const metadata: Metadata = {
  title: 'PlaceWorks — Brand Asset Tool',
}

export default function PlaceWorksTool() {
  return (
    <div style={{ padding: '4rem var(--pw-margin)' }}>
      <Link href="/presentations/placeworks/02" className="pw-credit">&larr; Concept 02</Link>
      <h1 className="pw-concept-name" style={{ marginTop: '1.5rem' }}>Brand Asset Tool</h1>
      <div style={{ marginTop: '2rem' }}>
        <BrandAssetTool />
      </div>
    </div>
  )
}
