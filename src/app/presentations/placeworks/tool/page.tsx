import type { Metadata } from 'next'
import Link from 'next/link'
import BrandAssetTool from '../_components/tool/BrandAssetTool'

export const metadata: Metadata = {
  title: 'PlaceWorks — Brand Asset Tool',
}

// Hosted as a GitHub release asset, not in public/: a ~95MB binary doesn't
// belong in the site repo/deployment. `latest/download/<name>` always points
// at the newest release carrying that filename, so shipping a new app
// version is just `npm run dist` + `gh release create` — no site deploy.
const MAC_APP_URL =
  'https://github.com/buda-loco/photofolio/releases/latest/download/PlaceWorks-Brand-Asset-Tool-0.1.0-arm64.dmg'

export default function PlaceWorksTool() {
  return (
    <div className="pw-tool-page">
      <header className="pw-tool-page-head">
        <Link href="/presentations/placeworks/02" className="pw-credit">&larr; Concept 02</Link>
        <h1 className="pw-tool-page-title">Brand Asset Tool</h1>
        <a className="pw-credit pw-tool-download" href={MAC_APP_URL} download>
          Download Mac app &darr;
        </a>
      </header>
      <BrandAssetTool />
    </div>
  )
}
