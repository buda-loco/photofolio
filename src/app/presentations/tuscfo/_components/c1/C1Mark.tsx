'use client'

import { C1_PARTS } from './geometry'

/**
 * The full Concepto 01 monogram as a colourable <g>. Render inside an
 * <svg viewBox="0 0 444 444"> (or a nested <svg> that establishes it).
 * `colors` maps part id → fill; missing entries fall back to `fallback`.
 */
export default function C1Mark({
  colors,
  fallback = '#000000',
}: {
  colors?: Partial<Record<string, string>>
  fallback?: string
}) {
  return (
    <g>
      {C1_PARTS.map((p) => (
        <g key={p.id} transform={p.transform}>
          <path d={p.d} fill={colors?.[p.id] ?? fallback} fillRule="evenodd" />
        </g>
      ))}
    </g>
  )
}
