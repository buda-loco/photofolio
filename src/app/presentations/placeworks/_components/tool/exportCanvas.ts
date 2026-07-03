/** Class name for anything that must never appear in an exported file:
 *  PathEditor's wrapping `<g>` (drag handles + guide lines), and
 *  BrandAssetTool's off-screen logo-measurement `<g>`. Shared here rather
 *  than hardcoded in each file so the exporter and the things it strips
 *  can't silently drift apart. */
export const EXPORT_EXCLUDE_CLASS = 'pw-export-exclude'

/**
 * Serializes the live, rendered canvas SVG into a clean, standalone SVG
 * string — the artwork only, minus UI chrome (drag handles) and independent
 * of whatever on-screen zoom level the stage is currently at.
 *
 * `width`/`height` are always the *true* canvas dimensions (params.canvas),
 * not read off the live element — the on-canvas zoom control (BrandAssetTool)
 * changes the live `<svg>`'s `viewBox` to reveal off-canvas handles, so the
 * live viewBox is only trustworthy at 100% zoom. Forcing the clone's viewBox
 * from the caller-supplied true dimensions keeps export correct at any zoom
 * level without the export path needing to know zoom exists at all.
 *
 * DOM-dependent (clones/serializes a real SVGSVGElement); not unit-testable
 * without jsdom, consistent with this tool's other DOM-dependent modules
 * (PathEditor, useLogoBBox) — verified manually instead.
 */
export function getCleanExportSVGString(svg: SVGSVGElement, width: number, height: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll(`.${EXPORT_EXCLUDE_CLASS}`).forEach((el) => el.remove())

  // Both the PathEditor drag-handle overlay AND the off-screen logo-
  // measurement copy (BrandAssetTool.tsx, x={-9999}) are explicitly stripped
  // above via EXPORT_EXCLUDE_CLASS — this does NOT rely on viewBox/overflow
  // clipping to hide the off-screen copy. That clipping is incidental, not
  // guaranteed: `svg:not(:root) { overflow: hidden }` is a UA-stylesheet rule
  // that only applies to an *embedded* <svg>. Once this markup is opened
  // standalone as a flat .svg file, that same element becomes
  // `document.documentElement` (`:root`), which the rule explicitly excludes
  // — so `overflow` computes to `visible` there, and a viewer with an
  // unbounded pasteboard (Illustrator, Figma, Inkscape) could render/select
  // the off-screen copy. A plain browser tab or Quick Look merely doesn't
  // paint outside the width/height box, which looks like clipping but isn't
  // one. Explicit removal sidesteps relying on that distinction entirely.

  // Force both the viewBox and the explicit width/height from the true
  // canvas size — see doc comment above. Explicit width/height also means
  // the file opens at its correct physical size in image viewers/design
  // tools (a viewBox-only SVG has no intrinsic size and typically renders at
  // a UA default like 300x150 when opened flat, even though it fills any
  // container fine when embedded in HTML).
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  // Ensure the exported file is a fully standalone SVG document, not just a
  // fragment (the live <svg> inherits its xmlns from the HTML document and
  // doesn't carry the attribute itself).
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  return new XMLSerializer().serializeToString(clone)
}

export const PNG_SIZE_CAP = 6000 // px, longest side — see downloadPNG's doc comment for why this exists

export function downloadSVG(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exceedsSizeCap(widthPx: number, heightPx: number): boolean {
  return Math.max(widthPx, heightPx) > PNG_SIZE_CAP
}

/**
 * Rasterizes an SVG string to PNG and triggers a download. Uses
 * `canvas.toBlob` rather than the synchronous `canvas.toDataURL` (which is
 * what ShapePlayground.tsx's exportPNG() uses for its small, fixed-size
 * canvases) because this tool's canvas can be up to PNG_SIZE_CAP² pixels —
 * e.g. 6000x6000 is 144MB of raw RGBA. `toDataURL` blocks the main thread
 * synchronously while it base64-encodes that entire buffer (base64 adds
 * ~33% overhead, so a ~192MB string momentarily), which can freeze the tab
 * for a very visible stretch at the top of the size range. `toBlob` hands
 * the encode off the main thread (implementation-dependent, but spec-
 * encouraged to be async) and returns a binary Blob with no base64 bloat,
 * so it stays responsive and lighter on memory exactly where it matters
 * most — right up against the size cap.
 */
export function downloadPNG(svg: string, widthPx: number, heightPx: number, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = widthPx
      canvas.height = heightPx
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('2D canvas context unavailable')); return }
      ctx.drawImage(img, 0, 0, widthPx, heightPx)
      URL.revokeObjectURL(url)
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('PNG encoding failed')); return }
        const pngUrl = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = filename
        a.click()
        URL.revokeObjectURL(pngUrl)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG failed to rasterize')) }
    img.src = url
  })
}
