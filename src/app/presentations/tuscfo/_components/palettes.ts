/**
 * Tus CFO — shared colour system.
 *
 * The three client palettes (A/B/C) are shared by every concept, plus a
 * shade engine that derives 3 brighter + 3 darker steps from any base
 * colour so the editors can "jugar con los tonos" without ever leaving
 * the approved system.
 */

export type PaletteId = 'A' | 'B' | 'C'

export interface Palette {
  id: PaletteId
  name: string
  colors: string[]
}

export const PALETTES: Palette[] = [
  {
    id: 'A',
    name: 'Lima + Petróleo',
    colors: ['#ecfeb6', '#d6fb00', '#00545f'],
  },
  {
    id: 'B',
    name: 'Bosque',
    colors: ['#dde9d3', '#becfbd', '#789a7f', '#405f40', '#2c4a30', '#103221'],
  },
  {
    id: 'C',
    name: 'Océano',
    colors: ['#80ed99', '#45dfb1', '#0ad1c8', '#14919b', '#0b6477', '#213a57'],
  },
]

export function getPalette(id: PaletteId): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

/* ── hex ⇄ HSL ────────────────────────────────────────────── */

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/* ── Shades ───────────────────────────────────────────────── */

/**
 * 3 brighter + base + 3 darker, ordered brightest → darkest.
 * Steps are interpolated towards near-white / near-black so extreme
 * bases (e.g. #d6fb00) still yield distinct, usable shades.
 */
export function shadesOf(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex)
  const upStep = (0.94 - l) / 3.6
  const downStep = (l - 0.07) / 3.6
  return [
    hslToHex(h, s, l + upStep * 3),
    hslToHex(h, s, l + upStep * 2),
    hslToHex(h, s, l + upStep),
    hex,
    hslToHex(h, s, l - downStep),
    hslToHex(h, s, l - downStep * 2),
    hslToHex(h, s, l - downStep * 3),
  ]
}

/** All colours of a palette expanded with their shades (flat, deduped). */
export function paletteWithShades(palette: Palette): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of palette.colors) {
    for (const s of shadesOf(c)) {
      if (!seen.has(s)) {
        seen.add(s)
        out.push(s)
      }
    }
  }
  return out
}

/** Relative luminance (WCAG) — used to keep pattern/background contrast honest. */
export function luminance(hex: string): number {
  const m = hex.replace('#', '')
  const chan = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return (
    0.2126 * chan(parseInt(m.slice(0, 2), 16)) +
    0.7152 * chan(parseInt(m.slice(2, 4), 16)) +
    0.0722 * chan(parseInt(m.slice(4, 6), 16))
  )
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Translate a colour from one palette into the equivalent slot of another,
 * so switching palettes re-dresses the current design instantly instead of
 * just changing the swatch pool. Exact palette colours map by index; shades
 * map to the same shade step of the corresponding base colour. Neutrals
 * (paper/ink) and unknown colours pass through untouched.
 */
export function remapColor(color: string, from: Palette, to: Palette): string {
  const i = from.colors.indexOf(color)
  if (i !== -1) return to.colors[i % to.colors.length]
  for (let ci = 0; ci < from.colors.length; ci++) {
    const si = shadesOf(from.colors[ci]).indexOf(color)
    if (si !== -1) return shadesOf(to.colors[ci % to.colors.length])[si]
  }
  return color
}

/**
 * Background for a palette switch: palette colours (and shades) remap to
 * their equivalent slot; neutrals FOLLOW the new palette instead of
 * staying put — dark neutrals become its darkest colour, light neutrals
 * its brightest — so clicking a palette re-dresses the whole scheme,
 * background included. Transparent stays transparent.
 */
export function autoBg(bg: string | null, from: Palette, to: Palette): string | null {
  if (!bg) return null
  const remapped = remapColor(bg, from, to)
  if (remapped !== bg) return remapped
  const sorted = [...to.colors].sort((a, b) => luminance(a) - luminance(b))
  return luminance(bg) < 0.5 ? sorted[0] : sorted[sorted.length - 1]
}

/**
 * Pool filtered to colours that stay visible on `bg` (no-op when bg is
 * null/transparent). Falls back to the full pool rather than returning
 * empty — a mushy colour beats a crash.
 */
export function visiblePool(pool: string[], bg: string | null, min = 1.6): string[] {
  if (!bg) return pool
  const ok = pool.filter((c) => contrastRatio(c, bg) >= min)
  return ok.length ? ok : pool
}
