/** Class name PathEditor puts on its wrapping `<g>` (drag handles + guide
 *  lines). Shared here rather than hardcoded in both files so the exporter
 *  and the thing it strips can't silently drift apart. */
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

  // The off-screen logo-measurement copy (positioned at x={-9999} inside the
  // canvas viewBox, purely so useLogoBBox can read its ink bbox) does NOT
  // need explicit stripping: the outermost <svg> element clips content
  // outside its viewBox by default (UA stylesheet `overflow: hidden` on the
  // root <svg>), and that clipping is a property of being the *root* SVG
  // element in the document — it applies identically whether this element is
  // embedded live in the page or opened standalone as a flat .svg file.
  // Verified manually (see Task 8.1 notes): the measuring copy never paints
  // in either context.

  // Explicit width/height so the file opens at its correct physical size in
  // image viewers/design tools (a viewBox-only SVG has no intrinsic size and
  // typically renders at a UA default like 300x150 when opened flat, even
  // though it fills any container fine when embedded in HTML).
  const width = svg.viewBox.baseVal.width || svg.getAttribute('width')
  const height = svg.viewBox.baseVal.height || svg.getAttribute('height')
  if (width) clone.setAttribute('width', String(width))
  if (height) clone.setAttribute('height', String(height))

  // Ensure the exported file is a fully standalone SVG document, not just a
  // fragment (the live <svg> inherits its xmlns from the HTML document and
  // doesn't carry the attribute itself).
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  return new XMLSerializer().serializeToString(clone)
}
