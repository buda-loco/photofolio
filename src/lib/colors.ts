import type { DesignData } from './content'

/** Extract the first hex colour from any CSS string (handles gradients) */
export function extractHex(css: string): string | null {
  const m = css.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
  return '#' + h
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2 = (t: number): number => {
    t = (t % 1 + 1) % 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const r = s === 0 ? l : hue2(h + 1 / 3)
  const g = s === 0 ? l : hue2(h)
  const b = s === 0 ? l : hue2(h - 1 / 3)
  const toHex = (n: number): string => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function luminance(r: number, g: number, b: number): number {
  return [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }).reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0)
}

function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2)
  const l1 = luminance(c1.r, c1.g, c1.b)
  const l2 = luminance(c2.r, c2.g, c2.b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** Pick black or white text — whichever hits WCAG AA (4.5:1) against bg */
export function accessibleText(pillBg: string): string {
  return contrastRatio(pillBg, '#ffffff') >= 4.5 ? '#ffffff' : '#000000'
}

/** Complementary pill colour with accessible text */
export function pillColors(
  bgCss: string,
  fallbackAccent: string,
  offset: number = 0
): { bg: string; text: string } {
  const fallback = { bg: fallbackAccent, text: '#000000' }
  const hex = extractHex(bgCss)
  if (!hex) return fallback

  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)

  // Achromatic (grey/black/white) — use accent colour
  if (s < 8) return fallback

  const compH = (h + 180 + offset + 360) % 360
  const compL = l < 50 ? Math.max(55, 100 - l * 0.4) : Math.min(35, l * 0.4)
  const compS = Math.min(100, Math.max(60, s))

  const bg = hslToHex(compH, compS, compL)
  return { bg, text: accessibleText(bg) }
}

/** Very dark tint of the page background for mobile menu overlay */
export function menuBg(bgCss: string): string {
  const hex = extractHex(bgCss)
  if (!hex) return '#0d0d0d'
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const newL = l < 5 ? 8 : Math.max(l * 0.18, 6)
  return hslToHex(h, s, newL)
}

/** Darken background for widescreen video container */
export function darkenBg(bgCss: string): string {
  const hex = extractHex(bgCss)
  if (!hex) return '#141414'
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const newL = l < 8 ? Math.min(l + 8, 14) : Math.max(l * 0.65, 2)
  return hslToHex(h, s, newL)
}

/** Build CSS custom properties string from design.json + optional project overrides */
export function buildDesignCss(
  design: DesignData,
  opts?: {
    pageBackground?: string
    textColor?: string
  }
): string {
  const bgSource = opts?.pageBackground ?? design.colors.background ?? '#000000'
  const labelPrimary = design.colors.labelColor ?? '#f4ff26'
  const labelSecondary = (design.colors as unknown as Record<string, unknown>).labelColorSecondary as string | undefined
  const labelColorValue = labelSecondary
    ? `linear-gradient(90deg, ${labelPrimary}, ${labelSecondary})`
    : labelPrimary

  const autoText = opts?.pageBackground
    ? accessibleText(bgSource)
    : (design.colors.text ?? '#ffffff')
  const pageText = opts?.textColor ?? autoText
  const isLightBg = autoText === '#000000'
  const pageTextMuted = opts?.pageBackground
    ? (isLightBg ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)')
    : (design.colors.textMuted ?? '#666666')
  const pageBorder = opts?.pageBackground
    ? (isLightBg ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)')
    : (design.colors.border ?? 'rgba(255,255,255,0.1)')
  const autoLabelColor = opts?.pageBackground
    ? (isLightBg ? 'rgba(0,0,0,0.85)' : labelColorValue)
    : labelColorValue
  const pageLabelColor = autoLabelColor
  const basePill = pillColors(bgSource, labelPrimary, 0)

  return `:root {
  --color-bg:          ${design.colors.background};
  --color-text:        ${pageText};
  --color-text-muted:  ${pageTextMuted};
  --color-text-bright: ${design.colors.textBright ?? '#ffffff'};
  --color-border:      ${pageBorder};
  --color-label:       ${pageLabelColor};

  --pill-base-bg:   ${basePill.bg};
  --pill-base-text: ${basePill.text};

  --widescreen-bg:   ${darkenBg(bgSource)};
  --widescreen-text: ${accessibleText(darkenBg(bgSource))};

  --menu-bg: ${menuBg(bgSource)};

  --logo-filter: ${isLightBg ? 'invert(1)' : 'none'};

  --font-sans:    ${design.typography?.sans ?? "'Adrianna', system-ui, sans-serif"};
  --font-display: ${design.typography?.display ?? "'Adrianna Extended', system-ui, sans-serif"};

  --heading-weight:          ${design.typography?.headings?.weight ?? '700'};
  --heading-letter-spacing:  ${design.typography?.headings?.letterSpacing ?? '-0.01em'};
  --heading-line-height:     ${design.typography?.headings?.lineHeight ?? '1.05'};

  --label-size:           ${design.typography?.labels?.size ?? '0.6875rem'};
  --label-letter-spacing: ${design.typography?.labels?.letterSpacing ?? '0.15em'};

  --body-size:        ${design.typography?.body?.size ?? '1rem'};
  --body-line-height: ${design.typography?.body?.lineHeight ?? '1.8'};

  --tb-heading-size:           ${design.textBlock?.headingSize ?? 'clamp(2.5rem, 5vw, 5.5rem)'};
  --tb-heading-weight:         ${design.textBlock?.headingWeight ?? '300'};
  --tb-heading-letter-spacing: ${design.textBlock?.headingLetterSpacing ?? '0em'};
  --tb-heading-line-height:    ${design.textBlock?.headingLineHeight ?? '1.0'};
  --tb-body-size:              ${design.textBlock?.bodySize ?? '1rem'};
  --tb-body-line-height:       ${design.textBlock?.bodyLineHeight ?? '1.85'};
  --tb-max-width:              ${design.textBlock?.maxWidth ?? '52ch'};
  --tb-gap:                    ${design.textBlock?.gap ?? '2.5rem'};

  --btn-font-size:      ${design.buttons?.fontSize ?? '0.6875rem'};
  --btn-letter-spacing: ${design.buttons?.letterSpacing ?? '0.15em'};
  --btn-padding-v:      ${design.buttons?.paddingV ?? '0.7rem'};
  --btn-padding-h:      ${design.buttons?.paddingH ?? '1.75rem'};
}`
}

/** Convenience: same computation layout needs for Nav pill props, without re-running buildDesignCss. */
export function computeBasePill(design: DesignData): { bg: string; text: string } {
  const bgSource = design.colors.background ?? '#000000'
  const labelPrimary = design.colors.labelColor ?? '#f4ff26'
  return pillColors(bgSource, labelPrimary, 0)
}
