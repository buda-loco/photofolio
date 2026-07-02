import { describe, it, expect } from 'vitest'
import { PALETTE, shadesOf, resolveSwatch, contrastRatio } from './palette'

describe('PALETTE', () => {
  it('has the 7 client-supplied swatches', () => {
    expect(PALETTE.cream).toBe('#E5C491')
    expect(PALETTE.dustyPink).toBe('#DCAAA0')
    expect(PALETTE.terracotta).toBe('#D58E6C')
    expect(PALETTE.lavender).toBe('#A7A6D2')
    expect(PALETTE.seafoam).toBe('#9EC0C7')
    expect(PALETTE.navy).toBe('#3B3D6D')
    expect(PALETTE.nearBlack).toBe('#292632')
  })
})

describe('shadesOf', () => {
  it('returns 5 steps, middle step equals the base hex', () => {
    const shades = shadesOf('terracotta')
    expect(shades).toHaveLength(5)
    expect(shades[2].toLowerCase()).toBe('#d58e6c')
  })

  it('lightens toward step 0, darkens toward step 4', () => {
    const shades = shadesOf('navy')
    const lum = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    expect(lum(shades[0])).toBeGreaterThan(lum(shades[2]))
    expect(lum(shades[4])).toBeLessThan(lum(shades[2]))
  })

  it('never returns pure white or pure black (stays on-brand)', () => {
    const shades = shadesOf('cream')
    expect(shades[0].toLowerCase()).not.toBe('#ffffff')
    expect(shades[4].toLowerCase()).not.toBe('#000000')
  })
})

describe('resolveSwatch', () => {
  it('resolves a SwatchRef to the matching shade', () => {
    expect(resolveSwatch({ base: 'seafoam', shadeStep: 2 }).toLowerCase()).toBe('#9ec0c7')
  })
})

describe('contrastRatio', () => {
  it('black vs white is the maximum ratio (21)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
  it('a colour against itself is 1', () => {
    expect(contrastRatio('#D58E6C', '#D58E6C')).toBeCloseTo(1, 1)
  })
})
