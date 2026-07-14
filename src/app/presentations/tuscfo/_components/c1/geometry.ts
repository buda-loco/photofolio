/**
 * Concepto 01 — "Tres letras, una moneda".
 *
 * The four component paths of the monogram, verbatim from the client
 * SVG (concept01.svg, viewBox 0 0 444 444), each individually
 * colourable. The C, F and O are concealed in the interplay of these
 * parts — so both the logo editor and the pattern generator work from
 * the same source of truth.
 */

export const C1_VIEW = 444

export interface C1Part {
  id: string
  name: string
  transform: string
  d: string
}

export const C1_PARTS: C1Part[] = [
  {
    id: 'ring',
    name: 'Anillo (O)',
    transform: 'matrix(0.540615,0,0,0.540615,-707.447466,-310.746278)',
    d: 'M1718.369,574.802C1944.527,574.802 2128.139,758.414 2128.139,984.572C2128.139,1210.731 1944.527,1394.343 1718.369,1394.343C1492.21,1394.343 1308.598,1210.731 1308.598,984.572C1308.598,758.414 1492.21,574.802 1718.369,574.802ZM1718.369,636.451C1526.235,636.451 1370.247,792.439 1370.247,984.572C1370.247,1176.706 1526.235,1332.694 1718.369,1332.694C1910.502,1332.694 2066.49,1176.706 2066.49,984.572C2066.49,792.439 1910.502,636.451 1718.369,636.451Z',
  },
  {
    id: 'arc',
    name: 'Arco derecho',
    transform: 'matrix(0.360092,0,0,0.360092,-397.242167,-133.008232)',
    d: 'M1869.562,723.319C1847.474,710.494 1839.954,682.149 1852.78,660.061C1865.605,637.974 1893.949,630.454 1916.037,643.279C2033.641,711.565 2112.768,838.905 2112.768,984.572C2112.768,1130.239 2033.641,1257.58 1916.037,1325.866C1893.949,1338.691 1865.605,1331.171 1852.78,1309.083C1839.954,1286.995 1847.474,1258.65 1869.562,1245.825C1959.594,1193.549 2020.213,1096.088 2020.213,984.572C2020.213,873.056 1959.594,775.595 1869.562,723.319Z',
  },
  {
    id: 'base',
    name: 'Arco inferior',
    transform: 'matrix(0.360092,0,0,0.360092,-397.242167,-133.008232)',
    d: 'M1718.369,1286.416C1743.91,1286.416 1764.646,1307.153 1764.646,1332.694C1764.646,1358.235 1743.91,1378.971 1718.369,1378.971C1572.702,1378.971 1445.361,1299.844 1377.075,1182.241C1364.25,1160.153 1371.77,1131.808 1393.858,1118.983C1415.946,1106.158 1444.29,1113.678 1457.116,1135.766C1509.392,1225.797 1606.853,1286.416 1718.369,1286.416Z',
  },
  {
    id: 'c',
    name: 'C con barra (C·F)',
    transform: 'matrix(0.360092,0,0,0.360092,-397.242167,-133.008232)',
    d: 'M1370.247,1030.849C1344.706,1030.849 1323.97,1010.113 1323.97,984.572C1323.97,766.897 1500.694,590.173 1718.369,590.173C1743.91,590.173 1764.646,610.909 1764.646,636.451C1764.646,661.992 1743.91,682.728 1718.369,682.728C1567.511,682.728 1442.353,793.637 1420.057,938.295L1560.692,938.295C1586.233,938.295 1606.969,959.031 1606.969,984.572C1606.969,1010.113 1586.233,1030.85 1560.692,1030.85L1370.488,1030.849C1370.408,1030.849 1370.327,1030.849 1370.247,1030.849Z',
  },
]

/**
 * Tight bounding boxes of each part in the 444 viewBox (measured via
 * getBBox with the group matrices applied). Used by the pattern
 * generator's "Conexión" mode to zoom a piece to its own box so arc
 * tips land exactly on the cell edge and chains actually touch.
 */
export const C1_BBOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
  ring: { x: 0.2, y: 0, w: 443.1, h: 443.1 },
  arc: { x: 267.68, y: 96.37, w: 95.87, h: 250.3 },
  base: { x: 96.38, y: 267.67, w: 141.82, h: 95.87 },
  c: { x: 79.51, y: 79.5, w: 158.68, h: 158.68 },
}

/** Bbox of a part after rotating it `q` quarter-turns about the view centre. */
export function rotatedBBox(
  b: { x: number; y: number; w: number; h: number },
  q: number,
): { x: number; y: number; w: number; h: number } {
  const V = C1_VIEW
  switch (((q % 4) + 4) % 4) {
    case 1:
      return { x: V - (b.y + b.h), y: b.x, w: b.h, h: b.w }
    case 2:
      return { x: V - (b.x + b.w), y: V - (b.y + b.h), w: b.w, h: b.h }
    case 3:
      return { x: b.y, y: V - (b.x + b.w), w: b.h, h: b.w }
    default:
      return b
  }
}

/** Standalone SVG string of the full mark — fed to three's SVGLoader for the coin. */
export function c1SvgString(): string {
  const paths = C1_PARTS.map(
    (p) => `<g transform="${p.transform}"><path d="${p.d}" fill-rule="evenodd"/></g>`,
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${C1_VIEW} ${C1_VIEW}">${paths}</svg>`
}
