import type { Metadata } from 'next'
import Link from 'next/link'
import BrandAssetTool from '../_components/tool/BrandAssetTool'

export const metadata: Metadata = {
  title: 'PlaceWorks — Brand Asset Tool',
}

export default function PlaceWorksTool() {
  return (
    <div className="pw-tool-page">
      <header className="pw-tool-page-head">
        <Link href="/presentations/placeworks/02" className="pw-credit">&larr; Concept 02</Link>
        <h1 className="pw-tool-page-title">Brand Asset Tool</h1>
      </header>
      <BrandAssetTool />
    </div>
  )
}
