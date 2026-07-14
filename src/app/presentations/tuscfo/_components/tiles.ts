/**
 * Tus CFO — orderly varied-size tiling for the pattern generators.
 *
 * Instead of scaling shapes in place (which overlaps neighbours), the
 * canvas is partitioned quadtree-style into non-overlapping square tiles:
 * 2×2 blocks occasionally merge into one big tile, single cells
 * occasionally split into four small ones — the "After" layout in the
 * client's reference. Coordinates and sizes are in base-cell units.
 */

export interface Tile {
  x: number
  y: number
  /** side length in base cells: 2 (big), 1 (base) or 0.5 (small) */
  s: number
}

export function buildTiles(
  cols: number,
  rows: number,
  rnd: () => number,
  { pBig = 0.22, pSplit = 0.18 }: { pBig?: number; pSplit?: number } = {},
): Tile[] {
  const tiles: Tile[] = []
  for (let y = 0; y < rows; y += 2) {
    for (let x = 0; x < cols; x += 2) {
      // merge a full 2×2 block into one big tile when it fits
      if (x + 1 < cols && y + 1 < rows && rnd() < pBig) {
        tiles.push({ x, y, s: 2 })
        continue
      }
      for (let dy = 0; dy < 2 && y + dy < rows; dy++) {
        for (let dx = 0; dx < 2 && x + dx < cols; dx++) {
          const cx = x + dx
          const cy = y + dy
          if (rnd() < pSplit) {
            // split this cell into four small tiles
            tiles.push(
              { x: cx, y: cy, s: 0.5 },
              { x: cx + 0.5, y: cy, s: 0.5 },
              { x: cx, y: cy + 0.5, s: 0.5 },
              { x: cx + 0.5, y: cy + 0.5, s: 0.5 },
            )
          } else {
            tiles.push({ x: cx, y: cy, s: 1 })
          }
        }
      }
    }
  }
  return tiles
}
