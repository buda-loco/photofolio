// Pure, dependency-free palette + shade-ramp logic for the PlaceWorks brand
// tool. No fs, no React — mirrors src/lib/quote.ts's shape so it's
// unit-testable in isolation. Mixing happens in OKLab (perceptually uniform)
// rather than raw RGB/HSL so a 5-step ramp doesn't muddy through grey at the
// midpoint the way naive RGB lerp does.

export const PALETTE = {
  cream: '#E5C491',
  dustyPink: '#DCAAA0',
  terracotta: '#D58E6C',
  lavender: '#A7A6D2',
  seafoam: '#9EC0C7',
  navy: '#3B3D6D',
  nearBlack: '#292632',
} as const

export type PaletteKey = keyof typeof PALETTE
export type SwatchRef = { base: PaletteKey; shadeStep: number } // 0..4, 2 = base hex

const SHADE_STEPS = 5
const MAX_LIGHTEN = 0.7 // cap toward white so the lightest step stays tinted
const MAX_DARKEN = 0.55 // cap toward black so the darkest step stays tinted

// ── colour space conversions ────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function srgbToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
  return s * 255
}

function rgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ]
}

function oklabToRgb([L, a, b]: [number, number, number]): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)]
}

/** Mix two hex colours in OKLab space. t=0 → hexA, t=1 → hexB. */
export function mix(hexA: string, hexB: string, t: number): string {
  const a = rgbToOklab(hexToRgb(hexA))
  const b = rgbToOklab(hexToRgb(hexB))
  const lab: [number, number, number] = [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
  return rgbToHex(...oklabToRgb(lab))
}

/** 5-step tint/shade ramp for one base swatch. Step 2 is always the exact base hex. */
export function shadesOf(key: PaletteKey, steps = SHADE_STEPS): string[] {
  const base = PALETTE[key]
  const mid = Math.floor(steps / 2)
  const out: string[] = []
  for (let i = 0; i < steps; i++) {
    if (i === mid) { out.push(base); continue }
    if (i < mid) out.push(mix(base, '#ffffff', ((mid - i) / mid) * MAX_LIGHTEN))
    else out.push(mix(base, '#000000', ((i - mid) / (steps - 1 - mid)) * MAX_DARKEN))
  }
  return out
}

export function resolveSwatch(ref: SwatchRef): string {
  const shades = shadesOf(ref.base)
  const step = Math.max(0, Math.min(shades.length - 1, ref.shadeStep))
  return shades[step]
}

/** WCAG relative luminance + contrast ratio. src/lib/colors.ts has the same
 *  formula but doesn't export it — duplicated here rather than exporting it
 *  from that unrelated production file for one small private-tool use. */
function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relLuminance(hexA)
  const l2 = relLuminance(hexB)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
