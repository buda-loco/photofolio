# Tus CFO brand deck — progress log (as of 2026-07-15)

Status snapshot of the interactive client pitch at `/presentations/tuscfo`,
written to pick work back up later or brief the client. The reusable recipe
distilled from this build is `docs/deck-playbook.md`; this documents what
exists and how it got here.

Client: **Tus CFO** — an external-CFO accounting service, partner brand of Fer
Bolagay. Deck is Spanish (Argentina, voseo). Second deck after PlaceWorks;
now the reference implementation for future ones.

Source assets (client's working files, not in repo):
`W-CLIENTS/01 ACTIVE/FerBolagay/TusCFO/Working files/Concept presentation/`.

---

## Where things stand

- **Live:** deployed from `main` — benjaminarnedo.com/presentations/tuscfo
  (noindex; private client link). Landing + 4 concept routes, all static.
- **Latest commits:**
  - `39ac191` feat(tuscfo): the whole deck (36 files, ~6981 insertions)
  - `28d9ed5` docs: the deck playbook + CLAUDE.md pointer
  - `7b81f13` fix(seo): site-wide social image → `/social-media.jpg`
- **Build:** `npm run build` clean; `npx tsc --noEmit` clean; existing 109
  unit tests still pass (deck logic verified in-browser, not unit-tested).
- **Palettes (shared by all concepts):** A = Lima+Petróleo
  (`#ecfeb6 #d6fb00 #00545f`), B = Bosque (6 greens), C = Océano (6 teals).
  Deck chrome itself is the site scheme (black/white/yellow) — the client
  rejected an earlier petróleo-tinted deck background; brand work carries the colour.

## The four concepts

Each concept route = rationale + brandmark strip + **live logo editor** + 4
live mockups + a **pattern/system generator**. Client SVG geometry is pasted
verbatim into a `geometry` module per concept (never redrawn).

- **01 — "Tres letras, una moneda"** (`01/page.tsx`, `_components/c1/`)
  Circular CFO monogram (TUS hidden in it). Logo editor (único / por parte,
  random colours, invert). Pattern generator: quadtree varied sizes, brick
  offsets, part toggles, connected chains (garlands/beads), mono shade fields.
  **3D coin** (`C1Coin3D`, three.js) — orbit, colour face/relief/edge,
  transparent-bg Full HD PNG export.
- **02 — "Los gráficos hablan"** (`_components/c2/`)
  Finance-graph glyphs (pie/bars/dial) spelling CFO. Logo editor: horizontal/
  vertical lockup, dúo/mono colour, palette gradients (radial circles, linear
  bars), invert. Animated pattern: pie spins, bars breathe, dial
  counter-rotates + pulses (CSS in export-excluded `<style>` → static exports);
  quadtree varied sizes; the bar-chart glyph drops its bg and 90°-rotates.
- **03 — "La celda de siempre"** (`_components/c3/`)
  Spreadsheet-cell wordmark. Logo editor: horizontal / apilado / vertical
  column, tonos/dúo/por-celda cell + letter colours, gradients, invert.
  Pattern generator is the richest: 2 pixel fonts (Alta 6×12 / Ancha 5×7,
  full A–Z), free text with X/Y position, **draw mode** (stabilised vector
  stroke paints cells), **Invertir** (field fills, content punched as a hole),
  colour sequence 3–6, gap clusters, plus the three "make it attractive"
  additions: **Campo de color** heatmap (Aleatorio/Ondas/Diagonal/Radial),
  **Selección** (Excel marquee w/ fill-handle, highlights the range, exports),
  **Combinar celdas** (merged wide cells).
- **04 — "El flujo"** (`_components/c4/`)
  Sober corporate direction: CFO wordmark in Fer Bolagay's typeface, TUS in the
  C counter. Logo editor: único / dúo (TUS+CFO) / por-letra. Flow generator is
  a real **multi-stage Sankey** (`C4FlowGenerator`): 2/3/4 stages
  (sources → aggregator → categories → leaves), value-weighted ribbons,
  category colour families, junction nodes, movable origin/split/end,
  gradients, blend modes (Overlay/Suma/Multipl.), directions Vertical /
  Horizontal / **Ambos lados** (two flows crossing).

## Shared infrastructure (`_components/`, reusable across clients)

`EditorShell` (stage + right dock workspace), `ui` (Panel/Seg/SliderRow/
Swatches/Check), `palettes` (palettes + `shadesOf`/`paletteWithShades`/
`remapColor`/`autoBg`/`visiblePool`/`contrastRatio`), `exportUtils`
(SVG + Full HD PNG + WebGL canvas), `rand` (seeded, hydration-safe), `tiles`
(quadtree), `LogoMockups` (IG avatar, web header, business card "Martina Paz",
laptop wallpaper), `patternPreview` (generator → mockups blob-URL bridge),
`paletteSync` (one palette per concept page, each tool applies its own remap).

## Cross-component wiring (added iteratively, worth remembering)

- **Live mockups** sit between every logo editor and its generator. Card band +
  laptop wallpaper show the CURRENT pattern canvas (via `patternPreview`);
  card + Instagram + web-header use the canvas background + live logo.
- **Palette sync:** picking A/B/C anywhere on a concept page re-dresses every
  tool there (`useSyncedPalette`), including the coin on 01.
- **Instant palette remap:** a palette click doesn't just swap the swatch pool —
  it maps applied colours to the equivalent slot of the new palette, and
  neutral backgrounds follow via `autoBg`.

## Gotchas paid for this session (see playbook §4 for the full list)

- Hydration: seed via fixed constant + `useEffect(setSeed(newSeed()))`, never
  `Math.random()` in a `useState` initializer.
- Dock scrollbars: `grid-template-rows: 100%` + `min-height: 0` + styled
  always-visible scrollbar (macOS hides overlay scrollbars → looked "cut").
- `<image>` referencing a viewBox'd SVG honours the *referenced* svg's
  `preserveAspectRatio` — snapshots get `slice` injected to cover.
- Gradient `url(#id)` doesn't cross `<svg>` documents → mockups carry `-mk` defs.
- Blend modes need `isolation: isolate` on the canvas svg.

## Loose ends / ideas if resumed

- Deck logic is browser-verified only; the pure modules (`palettes`, `tiles`,
  `rand`, Sankey layout math) are unit-testable if we want regression cover.
- Inverted Números in C3 with a 20-char string makes tens of thousands of
  rects — heavy but functional; left uncapped to preserve the punched-hole look.
- No shared brand-asset tool / Electron app for this deck (PlaceWorks has one);
  could follow the same single-source-of-truth pattern if the client wants it.
- Untracked `docs/plans/2026-07-06-placeworks-tool-progress.md` predates this
  work — not part of the deck; commit separately if wanted.
