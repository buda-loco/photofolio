import BrandAssetTool from '@tool/BrandAssetTool'
// The deck's stylesheet is the tool's design system — imported from the site
// tree (via alias), not copied, so restyling the web tool restyles the app.
import '@deck/presentations.css'
import './app.css'

// .pw-pitch supplies the --pw-* token scope every pw-* class depends on.
// .pwe-shell (app.css) replaces the website's page chrome: no nav offset, a
// slim gutter, and the workspace as the entire window.
export default function App() {
  return (
    <div className="pw-pitch pwe-shell">
      <BrandAssetTool />
    </div>
  )
}
