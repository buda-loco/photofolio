/** Class name for anything that must never appear in an exported file:
 *  PathEditor's wrapping `<g>` (drag handles + guide lines), and
 *  BrandAssetTool's off-screen logo-measurement `<g>`. Shared here rather
 *  than hardcoded in each file so the exporter and the things it strips
 *  can't silently drift apart. */
export const EXPORT_EXCLUDE_CLASS = 'pw-export-exclude'

/**
 * Serializes the live, rendered canvas SVG into a clean, standalone SVG
 * string — WYSIWYG with what's on screen, minus UI chrome (drag handles).
 * DOM-dependent (clones/serializes a real SVGSVGElement); not unit-testable
 * without jsdom, consistent with this tool's other DOM-dependent modules
 * (PathEditor, useLogoBBox) — verified manually instead.
 */
export function getCleanExportSVGString(svg: SVGSVGElement): string {
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

  // Explicit width/height so the file opens at its correct physical size in
  // image viewers/design tools (a viewBox-only SVG has no intrinsic size and
  // typically renders at a UA default like 300x150 when opened flat, even
  // though it fills any container fine when embedded in HTML).
  const width = svg.viewBox.baseVal?.width || svg.getAttribute('width')
  const height = svg.viewBox.baseVal?.height || svg.getAttribute('height')
  if (width) clone.setAttribute('width', String(width))
  if (height) clone.setAttribute('height', String(height))

  // Ensure the exported file is a fully standalone SVG document, not just a
  // fragment (the live <svg> inherits its xmlns from the HTML document and
  // doesn't carry the attribute itself).
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  return new XMLSerializer().serializeToString(clone)
}
