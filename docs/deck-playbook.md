# Interactive brand deck playbook

How to build a client pitch deck like **PlaceWorks** (`/presentations/placeworks`)
and **Tus CFO** (`/presentations/tuscfo`): a private, noindex mini-site where
each brand concept ships its **live editors** (logo + pattern/system generators)
instead of static boards. The pitch is always the same: *you're not buying a
mark, you're buying the machine that produces the system*.

Tus CFO is the most complete reference — copy from it, not from PlaceWorks.

---

## 1. Skeleton (per client)

```
src/app/presentations/<client>/
  layout.tsx            # noindex + .<px>-pitch wrapper + imports presentations.css
  presentations.css     # self-contained, prefixed (tc- for tuscfo) — NOT in globals
  page.tsx              # index: hero → brief → "por qué no es un PDF" → concept cards
  01/page.tsx …         # one route per concept: header → rationale → brandmark
                        #   strip → tool sections (logo editor, generator, extras)
  _components/          # everything below
public/presentations/<client>/   # client SVGs/assets (logos, samples)
```

Rules that make it safe:
- `layout.tsx` sets `robots: { index: false, follow: false }` and wraps children
  in the pitch class; `:has()` rules in the CSS hide the site nav/footer.
- Everything self-contained: own CSS pipeline, no edits to site files. The
  whole deck lands as **new files only** (the tuscfo commit touched nothing else).
- Language/tone per client (tuscfo: es-AR voseo — "Pintá", "Descargá").
- Deck chrome = site scheme (black/white/yellow); the brand work carries the colour.

## 2. Shared editor infrastructure (already built — reuse from `tuscfo/_components`)

These are generic; for a new client either import across, or copy the folder
and re-prefix the CSS. The APIs:

| Module | What it gives you |
|---|---|
| `EditorShell.tsx` | The workspace contract: distraction-free stage left, tools dock right. Props: `stage`, `panels`, optional `orientation`/`rotation` + handlers, `onSurprise`, `onExportSVG?`, `onExportPNG`. Exports `CANVAS` (1920×1080 ↔ 1080×1920) and `rotationTransform()`. |
| `ui.tsx` | Dock controls: `Panel`, `Seg` (string-valued!), `SliderRow`, `Swatches`, `Check`. |
| `palettes.ts` | Client palettes + the colour engine: `shadesOf` (3 up/3 down), `paletteWithShades`, `remapColor` (instant palette switching maps colours to the equivalent slot), `autoBg` (backgrounds follow the palette; neutrals → darkest/brightest), `visiblePool`/`contrastRatio` (nothing ever vanishes into the background). **Swap the `PALETTES` array per client — everything else is generic.** |
| `exportUtils.ts` | `getCleanExportSVGString` (strips `EXPORT_EXCLUDE_CLASS`, forces true viewBox/size/xmlns) + `downloadSVG`/`downloadPNG` (Full HD) + `downloadCanvasPNG` (WebGL). |
| `rand.ts` | `seededRand` (mulberry32), `newSeed`, `pick`/`shuffle` etc. |
| `tiles.ts` | Quadtree tiling for orderly varied-size grids (2× / 1× / ½, never overlapping). |
| `LogoMockups.tsx` | The 4 live mockups under every logo editor (IG avatar, web header, business card w/ fictitious person, laptop wallpaper). Props: `bg`, `aspect`, `renderLogo(x,y,w,h)`, `patternKey`. |
| `patternPreview.ts` | Generator → mockups bridge: `usePublishPattern(key, svgRef, w, h)` in the generator, `usePatternPreview(key)` in consumers. Publishes the live canvas as a blob URL (debounced). |
| `paletteSync.ts` | `useSyncedPalette(key, paletteId, applyPalette)` — one palette decision per concept page, every tool follows via its own remap. |

## 3. Editor conventions (the invariants)

- **Seed model**: generators keep a `seed`; sliders/palettes *re-dress* the same
  arrangement, "Generar" = new seed. Derive per-cell values from one
  `seededRand(seed)` stream; keep call counts stable across toggles (single-float
  picks) so options don't scramble the layout.
- **Hydration-safe randomness**: `useState(20260714)` + `useEffect(() => setSeed(newSeed()), [])`.
  NEVER `Math.random()` in a useState initializer (SSR mismatch — we hit this).
- **Contrast guards everywhere**: colour picks go through `visiblePool`/stepping
  so elements read against the background (≥1.5 for pattern pieces, ~2.5 for text-like).
- **Every editor gets**: palette Seg wired to an `applyPalette` (remap + `autoBg`) +
  `useSyncedPalette`; "Jugar con tonos"; background swatches + Transparente;
  "Invertir" (negative: shapes ↔ background); "Sorprendeme ✦"; SVG + PNG Full HD export.
- **Logo geometry**: paste the client SVG's groups verbatim into a `geometry.ts(x)`
  with per-part fills — never redraw. Nested `<svg viewBox>` per part/glyph for
  re-layout (horizontal/vertical/column lockups).
- **Animations** (if any): CSS keyframes in a `<style className={EXPORT_EXCLUDE_CLASS}>`
  inside the canvas svg → exports stay static. `transform-box: fill-box` for
  own-centre rotation.
- **3D** (if any): dynamic-import `three` + `three/addons` (see `C1Coin3D`),
  `alpha: true` renderer for transparent-bg PNG exports, render one Full HD
  frame off-loop for export, dispose everything on unmount.

## 4. Gotchas we already paid for

- **Dock scroll**: `.tc-workspace` needs `grid-template-rows: 100%` and the dock
  `min-height: 0` + always-visible styled scrollbar (macOS hides overlay
  scrollbars and clients think controls are missing).
- **`<image>` + SVG cover**: browsers honour the *referenced* SVG's
  `preserveAspectRatio` (default meet/contain), not the `<image>`'s —
  `publishPattern` injects `preserveAspectRatio="xMidYMid slice"` into snapshots.
- **Gradients across svg boundaries**: `url(#id)` doesn't cross `<svg>` documents;
  mockups need their own `-mk`-suffixed defs.
- **Blend modes**: `mix-blend-mode` on paths + `isolation: isolate` on the canvas
  svg so flows blend with each other, not the page.
- **`Seg` is string-typed** — numeric options need `String()`/`Number()` bridging.
- Don't run `next build` while `next dev` is up (shared `.next`).

## 5. New client checklist

1. `mkdir src/app/presentations/<client>` — copy tuscfo's `layout.tsx`,
   `presentations.css` (re-prefix if diverging), `page.tsx`; drop client SVGs in
   `public/presentations/<client>/`.
2. Swap `PALETTES` (and INK/PAPER neutrals if the client isn't black/white).
3. Per concept: `geometry` from the client SVG → logo editor (colour modes ~
   único/dúo/por parte) → generator (whatever mechanic sells the concept) →
   page with rationale copy → index card.
4. Wire `LogoMockups` (+ `patternKey`), `usePublishPattern`, `useSyncedPalette`.
5. Verify: `npx tsc --noEmit`, `npm run build`, walk every page in the browser
   (test Sorprendeme, palette sync, exports), then push to `main` → Vercel.

Parallelising with agents works well: build shared infra + concept 01 as the
reference implementation first, then fan out one agent per remaining concept
with C1 as the pattern to mirror.
