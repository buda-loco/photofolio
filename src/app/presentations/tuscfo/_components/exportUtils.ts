/**
 * Tus CFO — export pipeline. Same approach as the PlaceWorks tool
 * (see placeworks/_components/tool/exportCanvas.ts for the full
 * rationale on standalone-SVG hygiene): serialize the live canvas
 * SVG minus UI chrome, force the true canvas viewBox + explicit
 * width/height + xmlns, then download as .svg or rasterize to .png.
 */

/** Anything with this class is stripped from exports (draw overlays, guides). */
export const EXPORT_EXCLUDE_CLASS = 'tc-export-exclude'

export function getCleanExportSVGString(svg: SVGSVGElement, width: number, height: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll(`.${EXPORT_EXCLUDE_CLASS}`).forEach((el) => el.remove())

  // Force viewBox and explicit width/height from the true canvas size so the
  // file opens at its correct physical size in viewers/design tools.
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.removeAttribute('style')

  // Standalone SVG document, not a fragment.
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  return new XMLSerializer().serializeToString(clone)
}

export function downloadSVG(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Rasterizes an SVG string to PNG (async toBlob — see PlaceWorks notes). */
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

/** Download an already-rendered raster canvas (used by the 3D coin). */
export function downloadCanvasPNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('PNG encoding failed')); return }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}
