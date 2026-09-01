# Benjamin Arnedo — Brand System

The rulebook behind benjaminarnedo.com, across every medium it ships in: web pages,
presentation decks, documents, social carousels, illustration, charts and the words
themselves. It exists to produce **new work that feels like the site** without
re-deriving the rules each time.

Colour, type, spacing, logo, motion and accessibility are mirrored into
`Design-system.pen` — that file is the visual instance of what is written here, not a
parallel system.

### Where things live

These specs live in the site repo at `<repo>/Working Files/Design specs/`, and
`~/.claude/design-systems/benjaminarnedo` is a **symlink** to that folder — one file, two
paths, no copies to drift. Same wiring as `boldandgroovy`. Every relative path below is
relative to the site repo:

`<repo>` is the [photofolio](https://github.com/buda-loco/photofolio) checkout.

| | |
|---|---|
| **These specs** | `<repo>/Working Files/Design specs/` — **tracked in git** |
| **Pencil file** | `<repo>/Working Files/Design-system.pen` — not tracked |
| **Illustration source** | `<repo>/Working Files/carousel-images/` — not tracked |
| **Fonts** | `<repo>/public/fonts/` (WOFF2) · `<repo>/Fonts/` (TTF) · installed to `~/Library/Fonts/` |
| **Live site** | <https://www.benjaminarnedo.com> — note the apex 307s to `www` |

A signpost sits at `<repo>/Working Files/CLAUDE.md` for anyone working in that folder.
Edit these files at either path — they are the same file.

### Companion specs

| File | Medium |
|---|---|
| `DESIGN.md` (this file) | Web, and the shared token source. **Always read first.** |
| `DECK.md` | Presentations — 1920×1080 slides, the five masters, type at slide scale |

Read `DESIGN.md` alongside whichever companion matches what you are building. Tokens,
colour, logo rules and the contrast matrix live here and are never repeated there.

Everything here was read out of the live codebase (`<repo>/src/css/*`,
`<repo>/src/content/design.json`, `<repo>/src/lib/colors.ts`) — it is a mirror of what
ships, not a parallel invention. Where the system now **deviates** from the code, it is
called out explicitly and the reason is a measured accessibility failure (see [Contrast](#accessibility--contrast) and
[Open defects](#open-defects-in-the-live-site)).

---

## The file

| | |
|---|---|
| **Path** | `<repo>/Working Files/Design-system.pen` |
| **In git?** | **No** — `.gitignore` excludes it, along with `carousel-images/` and the font copies. These specs *are* tracked. A deleted `.pen` is not recoverable; treat it as permanent. |
| **Edit via** | the `pencil` MCP — `get_app_state`, then `execute` |
| **Never** | open `.pen` with Read/Grep — the format is encrypted |

### The `execute` API, since the tool ships no signature

Verified 2026-09-01. `execute` takes `filePath` plus `input` (a JS snippet); on failure it
returns an `editId` and you **patch with `edits`** rather than resending the snippet.

| Need | Call |
|---|---|
| Print anything | `Print(...)` — there is no `console`, and a bare `return` is a syntax error |
| Read one node | `Get(id, { depth: n })` |
| Read many | `Get((node, ctx) => …)` — a bare `Get("document")` is refused; ctx is `{node, parentCtx, depth, index, bounds, problems, skipChildren}` |
| Top-level only | visitor + `if (ctx.depth !== 0) { ctx.skipChildren = true; return }` |
| Create / change | `Insert(parentId, {...})` · `Update(id, {...})` |
| Export | `Export([id], "png", "/out/dir")` — **positional**, and the path is a *directory* |

`ctx.bounds` is the only reliable source of rendered size; a node's own `height` reads
`NaN` when it is `fit_content`.

### Three traps that will waste your time

1. **Every write lands in whatever document is frontmost**, unless you pass `filePath` to
   `execute` — pass it every time. Call `get_app_state` first and confirm the path anyway.
   A wrong-file write only fails loudly if the node IDs don't exist; otherwise it silently
   lands in the wrong document.
2. **`alignItems: "center"` on a vertical frame corrupts the whole subtree** — children
   land at `x = parentWidth / 2`, every descendant picks up a phantom offset, and the frame
   renders pure black. Use `"start"` and size children explicitly.
3. **Fonts load at Pencil launch.** Adrianna is installed to `~/Library/Fonts/` (all 32
   TTFs, copied from `Fonts/`). If Pencil reports `Font family 'Adrianna' is invalid` and
   renders a fallback, **restart Pencil**. The `.pen` stores the correct family names
   regardless, so the warnings are cosmetic — but you cannot judge a layout through a
   fallback font.

---

## Board map

36 top-level frames, laid out on one grid (re-tidied 2026-09-01). Rows are grouped by
**artboard size**, because mixing 1440-wide system boards, 1920 decks and 1080 carousels
on one line is what made the canvas messy. Everything starts at `x = 1000`.

| Row | y | Contents | Pitch |
|---|---|---|---|
| strays | −900 | Loose component instances not yet folded into the library | — |
| components | 0 | `◆ Component Library` | — |
| 1 | 900 | `00 · Cover` → `06c` (1440 wide) | 1600 |
| 2 | 4300 | `07a`–`07e` deck masters (1920×1080) | 2080 |
| 3 | 5900 | `08 · Accessibility`, `09 · Illustration` (1440 wide) | 1600 |
| 4–6 | 9700 / 11250 / 12800 | `Carousel 01`–`15` (1080×1350), five per row in slide order | 1200 |

An empty 800×600 white frame — the artboard the document was created with — is parked at
(−2600, −900) as `· scratch (empty, safe to delete)`. It was never used; deleting it is
safe, but the `.pen` is **not in git**, so it was left rather than removed.

| Frame | Contents |
|---|---|
| `◆ Component Library` | The reusable primitives. **Instance these, never redraw.** |
| `00 · Cover` | Title + section index |
| `01 · Colour` | Core palette, white-alpha ladder, derived-colour engine, scrims |
| `02 · Typography` | Families/weights, fluid scale @1440, composed styles, DO/NEVER |
| `03 · Spacing + Grid` | 8px scale, 12-col grid, bento blueprints, aspect ratios, page anatomy |
| `04 · Components` | Pills, buttons, labels, grid card (rest + hover), info strip, nav, footer |
| `05 · Motion` | Easing curves, durations, scroll inventory, page-transition steps |
| `06a/b/c · Templates` | Home, Work, Project (recoloured `#1E3A2F` to prove the engine) |
| `07a–07e · Deck masters` | 1920×1080: Title, Section, Content, Full-bleed, Closing — spec in `DECK.md` |
| `08 · Accessibility` | Contrast matrix, scrim floor, min sizes, states, defects, ship checklist |
| `09 · Illustration` | Prompt guide for the generated carousel illustrations — constants, the three sub-styles, the base prompt, traps |
| `Carousel 01–15` | The LinkedIn carousel that shipped Sept 2026 (1080×1350) |

> Node IDs below were current as of 2026-07-15. Pencil is multiplayer — **re-read with
> `get_app_state` / `Get` before relying on any ID.**

### Reusable components

`Pill / Outline` · `Pill / Filled` · `Pill / Nav` (square) · `Button / Outline` ·
`Button / CTA` · `Label / Accent` · `Label / Block` · `Caption` · `Swatch` ·
`Spec Row` · `Section Header` · `Logo / Wordmark` · `Logo / Mini`

---

## Tokens (Pencil variables)

Reference with `$` — e.g. `fill: "$color/accent"`, `gap: "$sp/3"`.

### Colour

| Variable | Value | Use |
|---|---|---|
| `color/bg` | `#000000` | Page canvas. Pure black, always. |
| `color/surface` | `#111111` | Video containers, media fallback |
| `color/surface-deep` | `#141414` | Widescreen video wells, block labels, menu overlay |
| `color/text` | `#FFFFFF` | Headings, body, `::selection` background |
| `color/text-muted` | `#999999` | Secondary copy, outline pills, captions, footer |
| `color/text-soft` | `#FFFFFFA6` (65%) | Project body copy |
| `color/text-faint` | `#FFFFFF4D` (30%) | **Decorative only — 2.48:1, never carries words** |
| `color/border` | `#FFFFFF1A` (10%) | Decorative dividers, hairlines |
| `color/border-soft` | `#FFFFFF12` (7%) | Soft rules inside dark overlays |
| `color/border-strong` | `#FFFFFF66` (40%) | **Informational** boundaries — 3.66:1 |
| `color/accent` | `#F4FF26` | Labels, CTAs, focus ring, progress bar, transition mask |
| `color/on-accent` | `#000000` | Text on accent |
| `color/scrim` | `#000000B3` | Media scrim base |

`text-muted` and `border-strong` **intentionally differ from the live site** — see
[Open defects](#open-defects-in-the-live-site).

### Type, spacing, layout

- `font/display` = **Adrianna Extended** · `font/sans` = **Adrianna** · `font/condensed` = **Adrianna Condensed**
- `sp/1..24` = 8, 16, 24, 32, 48, 64, 80, 96, 128, 160, 192 px (8px base)
- `text/xs..5xl` = 12, 14, 16, 20, 32, 56, 80, 96, 144 px · `text/label` = 11
- `layout/nav-height` 96 · `layout/page-margin` 48 · `layout/grid-gap` 24

---

## Colour system

Pure black canvas, pure white type, one electric accent. **Colour never decorates — it
signals.** Photography carries the richness; the UI stays achromatic except for `#F4FF26`
and translucent whites.

### The white-alpha ladder

Secondary tone is **translucent white, never opaque grey**. 100% → primary · 65% → body ·
30% → quiet labels on overlays · 10% → borders · 7% → soft rules · 3–8% → shimmer.

### The derived-colour engine (`src/lib/colors.ts`)

Any project page may set its own background; the system derives the rest:
rotate hue **180°**, force saturation **≥60**, push lightness **opposite** the background,
then `accessibleText()` picks black or white to guarantee **4.5:1**. Achromatic
backgrounds (black/white/grey, `s < 8`) fall back to the accent.

| Project bg | Pill / CTA | Video well | Menu bg | Result |
|---|---|---|---|---|
| `#000000` | `#F4FF26` | `#141414` | `#141414` | Achromatic → accent |
| `#1E3A2F` | `#F8E3EB` | `#14261F` | `#0A1410` | Forest → blush |
| `#2B1E3A` | `#EEF8E3` | `#1C1426` | `#0F0A14` | Violet → mint |
| `#7A1F1F` | `#CEF3F3` | `#4F1414` | `#180606` | Oxblood → ice |
| `#E8E4DA` | `#24428F` | `#AC9D79` | `#322D1F` | Bone → cobalt, **white** text |
| `#0F2740` | `#F9EFE5` | `#0A192A` | `#060F19` | Navy → cream |

**This is the strongest part of the system.** All six land between 9.33:1 and 19.18:1
because it *measures* instead of guessing. Extend it — never hand-pick a pill hex.

### The four sanctioned gradients

| | Spec |
|---|---|
| **Card scrim** | to top · black 80% → 35% @50% → transparent @80% (**updated**, see [Scrim floor](#the-scrim-floor)) |
| **Nav fade** | to bottom · black 50% → 0 |
| **Shimmer** | 90° · white 3% → 8% → 3%, `background-size: 200%`, 1.8s loop |
| **Play vignette** | radial · transparent 40% → black 35% |

---

## Typography

One superfamily, two voices. **Adrianna Extended shouts** (H1/H2, project titles, hero
cube, menu items, giant chapter numbers). **Adrianna speaks** (H3–H6, body, labels, nav,
buttons). Condensed is installed but unused — the only sanctioned escape hatch for dense
tables or credits.

Weights run Thin 100 → ExtraBold 800, but the system lives almost entirely on **300 and
700**. All fonts are self-hosted WOFF2. **No Google Fonts. No italics, ever.**

### Scale (desktop values @1440 — every size is a `clamp()`)

| Token | px | Family / weight | Notes |
|---|---|---|---|
| `display-xl` | 144 | Extended 700 | lh 0.95, ls −1% · homepage hero |
| `display-lg` / `text-4xl` | 96 | Extended 700 | lh 1.0 · project titles |
| `text-3xl` | 80 | Extended **300** | listing-page H1s |
| block heading | 72 | Extended **300** | lh 1.0 · project text blocks |
| `display-md` / `text-2xl` | 56 | Adrianna 700 | |
| `text-xl` | 32 | Extended 300 | step + section headings |
| `text-lg` | 20 | Adrianna 300 | leads, pull copy |
| `text-base` | 16 | Adrianna 400 | **lh 1.8, max 56ch** |
| `text-sm` | 14 | Adrianna 300 | captions, meta |
| label | 11 | Adrianna 400 | **+15% tracking, uppercase** |

### Rules

**Do** — pair Light 300 body with Bold 700 headings · uppercase labels at 11px/+15% ·
brutal display leading (0.9–1.05) vs airy body (1.7–1.85) · cap measure at 52–56ch ·
Extended only for display moments · reveal display type word-by-word from a bottom clip.

**Never** — italics (not for emphasis, not for captions, not in decks) · Extended below
20px (it clogs) · a third typeface · opaque grey text · letterspacing on lowercase body ·
centred long-form copy.

---

## Spacing + grid

8px base scale, 12-column grid, one fluid page margin. Whitespace is the luxury material:
sections breathe at 64–192px, media is separated by a single 24px gap, nothing touches the
viewport edge (48px desktop, safe-area aware on mobile).

- **Grid** — 12 col, gap 24. Spans: large 8, medium 6, small 4, with offsets 1/2/4/6.
- **Bento** (`/work`) — fixed row tracks `clamp(160px, 22vw, 340px)`; one of four column
  blueprints chosen at random per session; `data-row-span=2` sits beside two stacked smalls.
- **Aspect ratios** — 3:2 stills/galleries/cards (default) · 16:9 covers/hero/video ·
  9:16 vertical reels · 1:1 occasional.

---

## Logo system

Sources: `Logo/benjamin-arnedo-logo.svg` and `Logo/logo-mini.svg` — **byte-identical** to
`public/logo.svg` and `public/logo-mini.svg`.

| | Wordmark | Mini |
|---|---|---|
| viewBox | `0 0 640 151` | `0 0 97 128` |
| Aspect | 4.238 : 1 | 0.758 : 1 |
| Content | BA monogram + BENJAMIN ARNEDO caps | monogram alone, cropped flush |
| Ink bounds | x[100.2 → 539.7] y[23.5 → 150.6] | x[0 → 96.4] y[0 → 127.2] |

### ⚠ The wordmark is not centred in its own artboard

~15.6% dead space left, right and top — but the baseline sits **flush to the bottom edge**
(0.3% gap). Its ink centre is 11.55 units *below* the box centre, so **box-centring it
vertically drops the artwork ~7.6% low**. Align optically, not with `align-items: center`.
The mini has no such problem — it bleeds to all four edges, which is exactly why it
survives at 20px.

### Sizing

The wordmark's lettering is only **10.8% of the artboard height**. At the site's nav size
(70px) the caps render ~7.6px — that is the floor.

> **Never put the wordmark in a small footer.** At 16px tall its lettering is **1.7px** —
> illegible. Use the mini instead; that is what the site's own footer does.

| Placement | Asset | Size |
|---|---|---|
| Desktop nav | wordmark | height 70 → width 296.7 |
| Scroll mini | mini | 35px (`--nav-mini-size`) |
| Mobile nav / menu | mini | 32px |
| Footer | mini | **width** 35 → height 46.2 |
| Deck footers | mini + text lockup | mini 15 × 20 + 13px/700 label — see `DECK.md` §3 |

### Tinting — the logo takes the page's colour, never its own

| Variant | Fill | Where |
|---|---|---|
| Default | `#FFFFFF` | Site pages |
| Accent @ 60% | `#F4FF26` | Footer only; lifts to 100% on hover |
| Project secondary | e.g. `#F8E3EB` | Project pages — masked to `--project-secondary` |
| Inverted | `#000000` | Light backgrounds, via `filter: invert(1)`. **No black lockup file exists — it is derived.** |

### How the Pencil paths were produced (repeatable)

The SVGs wrap every path in nested `<g transform="matrix(...)">`. Pencil paths take
`geometry` + `viewBox` but **no transform**, so the matrices must be baked into the
coordinates.

1. Every matrix is **pure scale+translate** (`b = c = 0`), so composition is trivial:
   `sx = sx·a`, `tx = sx·e + tx` (apply translate *before* updating scale).
2. Skip `fill:none` artboard rects and everything inside `<clipPath>` — they are never painted.
3. Merging all subpaths into **one** `d` with `fill-rule: nonzero` was verified safe (no
   winding conflicts), which makes each logo a **single recolourable node** instead of 18.
4. **Verify by rendering, not by reading.** Headless Chrome + a pixel diff against the
   original SVG: the mini came out byte-identical; the wordmark differs only by
   antialiasing (max delta 64 on 0.07% of pixels).

> A first attempt silently applied **no transforms at all** — an optional regex group after
> a lazy quantifier never engages, so `(?:transform="matrix\(([^)]*)\)")?` always matched
> empty. It rendered as a white slab. Match the whole `<g ...>` tag, *then* search inside it.

---

## Motion

GSAP everywhere, Lenis for scroll. Motion is a **reveal, never a decoration**: things rise,
unclip and settle with long ease-out tails. Nothing bounces except the mini logo.

| Curve | Value | Use |
|---|---|---|
| **ease-out** (house) | `cubic-bezier(0.16, 1, 0.3, 1)` | ~90% of all motion |
| ease-in-out | `cubic-bezier(0.45, 0, 0.55, 1)` | symmetric moves, cube rotation |
| ease-smooth | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | parallax, long settles |
| bounce | `cubic-bezier(0.34, 1.56, 0.64, 1)` | **mini logo only** — the one playful moment |

**Durations** — 0.2s micro (pill/button hover) · 0.35s mask dissolve, menu fade · 0.45s nav
hide/show · 0.6s nav pill stagger (80ms apart), filter fade · 0.9s image zoom · 1.0s logo-hole
expand · 1.8s backdrop sweep, shimmer loop.

**Scroll inventory** — `data-animate="fade-up" | "stagger" | "word-reveal" | "line-reveal"`,
`data-parallax="0–0.4"`, `.img-reveal`.

**Page transition** — ① accent SVG mask slides up with the BA logo punched out ② `router.push()`,
timeline **pauses** until the route mounts (`routeReady` promise, 2s safety timeout — no flash)
③ mask recolours to the destination bg (0.35s) while logo holes scale **200×** (`expo.in`, 1.0s)
and a dark backdrop sweeps down (1.8s) ④ dissolve (0.12s).
*Why 200×:* the smallest counter is ~55 SVG units — yellow stays on screen until scale 159.
*Why the inner `<path>` scales, not the `<svg>`:* scaling the SVG rasterises and hits GPU texture limits.

**Ground rules** — hover moves are tiny (−1 to −2px lift + opacity; never scale buttons or
pills) · reveals move **up**, only the backdrop sweeps down · `prefers-reduced-motion: reduce`
collapses everything to 0.01ms, non-negotiable.

---

## Accessibility — contrast

Every ratio below was computed against **WCAG 2.2 with real alpha compositing**, not
estimated. The system is at **0 failures**; the boards encode the rules so new assets are
born compliant.

### The matrix — text (rows) on background (columns)

| | on `#000000` | on `#141414` | on `#F4FF26` | on `#FFFFFF` |
|---|---|---|---|---|
| White `#FFFFFF` | **21.00** ✓ | **18.42** ✓ | 1.09 ✗ | 1.00 ✗ |
| Muted `#999999` | **7.37** ✓ | **6.47** ✓ | 2.60 ✗ | 2.85 ✗ |
| Accent `#F4FF26` | **19.18** ✓ | **16.82** ✓ | 1.00 ✗ | 1.09 ✗ |
| Black `#000000` | 1.00 ✗ | 1.14 ✗ | **19.18** ✓ | **21.00** ✓ |

**Read the diagonal.** This palette is legible in exactly two directions: light type on
black, black type on accent. **Accent-on-white is 1.09:1** — that is how every yellow brand
dies. There is no light-mode variant; if a deck needs a light slide, the accent becomes a
*background*, never a text colour.

### The scrim floor

Photography is unpredictable, so **the scrim — not the image — guarantees legibility.**
Measured against a bright sky (`#C8CDD2`, the realistic worst case):

| Scrim | Ratio | |
|---|---|---|
| 0% / 20% / 40% | 1.60 / 2.51 / 4.26 | ✗ |
| **55%** | **6.69** | ✓ **the floor** |
| 70% / 80% | 10.81 / 14.57 | ✓ |

The scrim must reach **55% black at the TOP EDGE of the text**, not at the bottom of the
card. Because it is a gradient, text placed higher gets less of it — **this is the trap.**
House gradient: `80% @0 → 35% @50% → transparent @80%`, text inside the bottom 25%.

### Minimum sizes

| | |
|---|---|
| **10.4px** | Absolute floor. Uppercase labels only, `#999999`+, ≥8% tracking. Never sentences. |
| **12px** | Body floor. Nothing forming a sentence goes below this. |
| **24px** | Large-text threshold (or 18.66px bold) — WCAG drops to 3:1. |
| **44 × 44px** | Touch target, padding included. Already enforced on the hamburger + menu-close. |

### Non-text contrast

A border that **divides space** is decorative and exempt (`--color-border`, 1.21:1 — keep it
whisper-quiet, that restraint is the brand). A border that **is the information** — swatch
chips, sample wells, the play ring — needs **3:1** → use `border-strong` `#FFFFFF66`
(3.66:1). A `#000000` swatch on a `#000000` page with a 7% border measured **1.12:1**:
literally invisible.

### Ship checklist

- [ ] Every text colour is `#999999` or brighter.
- [ ] Accent is a background or black-canvas text — never text on white, never on itself.
- [ ] Text over photography sits in the bottom 25%, scrim ≥55% at the text's top edge.
- [ ] Nothing forming a sentence is under 12px.
- [ ] Any border that identifies a thing is `#FFFFFF66`+.
- [ ] Interactive targets ≥44×44px.
- [ ] Focus rings survive — 2px accent, 3px offset, never removed.
- [ ] Colour is never the only signal.
- [ ] Recolouring a page? Route it through the derived-colour engine.

---

## Voice — how it reads

The words are brand material, not filler poured into a layout. The register is **first
person, blunt, specific, and willing to say what did not work**.

**The reference texts.** When in doubt, read these and match them — they are the voice at
its most correct: `src/content/how-i-work.json`, the `CHUNKS` array in
`src/app/about/AboutClient.tsx`, and the About copy on the `connectup` and
`national-triangle` projects. Lines like "which is either loyalty or good work",
"I didn't design it" and "a mark with a rulebook stapled to it" are the target.

### What to match

- **First person, always.** Never slip into third person for a bio. A bio that says
  "Benjamin works across…" is a press release, not a portfolio.
- **A number, a date, a filename, a real trade-off** beats any adjective. "$2.72M in local
  economic activity" does the work that "highly successful campaign" cannot.
- **Say what you did not do.** Naming a limit is what makes the rest credible — "I didn't
  design it", "neither is a strength of mine", "it has since been replaced with a version
  I did not make".
- **Credit other people's work to them.** For anything made inside someone else's studio,
  the studio is the client's supplier, not you. Over-crediting costs nothing;
  under-crediting damages a relationship. When in doubt, ask whose client it was.
  Individual shots in a showreel are fine; a completed project framed as your client is not.
- **Contractions, spoken rhythm, dry humour.** Vary sentence length deliberately — equal-
  length paragraphs read as machine output.

### Cut on sight

Third-person bio prose · "fuelled by", "at the intersection of", "a testament to",
"showcases", "seamless", "robust", "vibrant", "bespoke", "comprehensive" · forced rules of
three · negative parallelism where the "not" half is a strawman ("not just X, but Y") ·
trailing `-ing` clauses that explain nothing ("…highlighting the interplay") · colon
reveals used for drama · fake-profound closing lines · em dashes as a rhythm crutch (in
short copy, none; in long copy, one or two that clearly beat a comma).

> The full editing pass is the `no-ai-slop` skill. A sweep over the site in Sept 2026
> rewrote seven project write-ups and the About bio, and cut em dashes in project copy
> from 12 to 2.

---

## Illustration

Illustrations are **generated, not drawn** — Recraft AI, vector SVG out, then recoloured
by hand to the exact palette. Full guide on board `09 · Illustration`; the short version:

**The base prompt.** Fill `[SUBJECT]`, append one style line, keep the rest verbatim.

> [SUBJECT], centred on a pure black background, tall vertical composition with generous
> empty space around it. Flat vector illustration, white line work, a single bright
> acid-yellow accent on one element. No text, no letters, no numbers, no UI. Minimal,
> high contrast, editorial.

| Style | Append | Use for |
|---|---|---|
| **Geometric** | flat Bauhaus shapes, hard edges, thin white outlines, no shading | Concepts — a split, a distance, a system |
| **Object** | one object with subtle greyscale volume, the yellow reading as light | A single literal metaphor |
| **Character** | rounded figures, thin black linework, oversized coats, small heads | Anything about people |

**Constants** — 1200×2100 portrait · subject in the middle third, never filling the frame ·
pure `#000000` ground · white is the ink, greyscale only for volume · **exactly one**
`#F4FF26` accent, on the subject of the sentence · **never any type in the image** (type is
set on top, in Adrianna).

**Traps** — the generator invents colours (`ill-collab` returned a pink head `#F0A0B4`) and
its yellow is not our yellow; open the SVG and correct every fill that is not black, white,
a grey or `#F4FF26`. Ask for *one accent*, never "yellow accents" — the plural scatters it
over five shapes and the composition loses its subject. Every file carries a C2PA
`<metadata>` block naming Recraft; that is an AI-disclosure record, leave it in.

---

## Data visualisation

Charts follow the same discipline as the rest of the system: **colour signals, it never
decorates.**

- **One hue for magnitude.** Almost every chart here answers "how many / how much of one
  thing" — that is a single series, so it is the accent on a `#FFFFFF12` track. A second
  colour invents a dimension the data does not have.
- **Label the denominator on every chart.** If two denominators run through one page, say
  which is which every time. On `/job-market`: location and salary are out of 225 ads,
  tools and tasks out of the 149 whose full text was retrieved.
- **Never truncate an axis to manufacture a difference.** Three medians inside a 14% band
  make three near-identical bars — that is honest and boring, so use **stat tiles instead
  of a chart**. Cutting the axis to separate them is a lie.
- **Two states are not two series.** "On my CV / not" is a hatched fill plus a tick plus a
  legend — never colour alone.
- **Never a dual axis.** Two measures of different scale become two charts.
- If a categorical palette is ever genuinely needed, `#949B05, #079BA9, #CF6306` passes all
  six CVD/contrast checks on the black ground. Validate, don't eyeball.
- Figures use `font-variant-numeric: tabular-nums` and Adrianna Extended; the accent marks
  the number, the label stays white or muted.

**Implementation note.** Reveal animations use `IntersectionObserver`, **not
ScrollTrigger** — `AnimationsInit` kills every ScrollTrigger from an async import on
mount, which races the component and leaves bars stuck at zero width. `ShowreelGrid` and
`/job-market` both avoid it for this reason.

---

## Formats

| Deliverable | Size | Notes |
|---|---|---|
| LinkedIn carousel slide | 1080 × 1350 | 4:5. Boards `Carousel 01–15` |
| Carousel illustration | 1200 × 2100 | ≈4:7, generated; sits inside the 1080×1350 slide |
| Deck slide | 1920 × 1080 | Masters `07a–07e`, padding `[72, 88]` — full spec in **`DECK.md`** |
| Page template | 1440 wide | Nav 96, margins 48, 12-col / gap 24 |
| Open Graph image | 1280 × 720 | `public/social-media.jpg` |

**Long-form post pages** (`/job-market` is the worked example) live on the site rather than
in a slide deck: real URL, real metadata, `Article` JSON-LD, and the site's own nav and
footer supplying the logo top and bottom. Build them as a server `page.tsx` for metadata
plus a client component for the interactive parts, with a co-located CSS file — the same
shape as `/cv`.

---

## Fixed defects — kept for the reasoning

Found by the 2026-07-15 audit, **fixed 2026-09-01**. Kept here because the reasoning
is the reusable part; the numbers were re-measured before and after each change.

### 1. Grid card hover title — `src/css/grid.css`

The audit read the layer order as the tint painting *above* the scrim. It does not:
`.grid-item-overlay-bg` is `z-index: auto` and `.grid-item-scrim` is `z-index: 1`, so
the scrim already sits on top. The real cause was the **scrim ramp being too weak where
the title's top edge lands** — exactly the trap in [The scrim floor](#the-scrim-floor).

Measured over the documented worst-case photo (`#C8CDD2`), with the 55% tint composited
underneath, white title:

| Project | `backgroundColor` | Before | After |
|---|---|---|---|
| `music-act` | none → accent-yellow fallback | **3.11:1** ✗ | **9.23:1** ✓ |
| `wonderful-world` | `#FACC40` | **3.66:1** ✗ | **10.16:1** ✓ |
| `qldneurostimulation` | `#A0B9F2` | **4.07:1** ✗ | **10.78:1** ✓ |
| worst of all ten | — | 3.11:1 | 9.23:1 |

**Fix:** the ramp now holds 55% black at half height, which is the scrim-floor rule made
literal — `0.85 @0 · 0.55 @50% · 0.15 @75% · transparent @92%`. The title stays white; a
derived colour was unnecessary once the scrim was right, and white measured correct for
every project. Verified across title-top heights of 28 / 40 / 53% (the ceiling: titles
are capped at two lines by `splitTitle` and `.title-line` is `nowrap`).

### 2. Muted text token — `src/content/design.json`

`textMuted` was `#767676` — 4.62:1 on black, and **4.36:1** on the `#141414`-class
surfaces. `tokens.css` already declared the good value, so design.json was overriding it
with the marginal one.

**Fix:** `#999999`. Now 7.37:1 on black, 6.47:1 on `#141414`, 6.14:1 on `#1a1a12`. No
visual cost. `/job-market` had pinned its own muted value to dodge this; that local
override is gone and it follows the token again.

### 3. Next-project label — `src/css/project.css`

`.project-next-label { opacity: 0.6 }`. Note this sits on the `.project-next` **pill**,
so it fades the pill's own text toward the pill background — not white toward black.
Worst real case is a light-background project (white text on a `#24428F` pill), which
measured **4.47:1** at 12px bold.

**Fix:** `0.75` → **6.03:1** in that same worst case.

> Still open, deliberately: `.project-next-sep { opacity: 0.4 }`. It is a `·` between
> two labels — decorative, and exempt under [Non-text contrast](#non-text-contrast).

---

## Extending the system

- **New deck** — copy `07a–07e`, swap the copy, keep the chrome. Full build order,
  the type ladder at slide scale and the pre-send checks are in **`DECK.md`**.
- **New client palette** — change the Pencil variables, not the nodes. Everything
  references `$color/*`, so one edit retints the system. Same philosophy as `design.json`.
- **New page template** — start from `06a/b/c`. Nav 96px, margins 48, 12-col/gap-24.
- **Recolour** — always through the derived-colour engine.

### Outstanding

- [ ] **`04 · Components` → "Logo System" section not yet added.** Blocked when Pencil
      switched to another document mid-session. Content is specified in
      [Logo system](#logo-system): both lockups large, the four tinting variants, min
      sizes, and the artboard-geometry warning.

---

## Conventions

- Do **not** think in CSS when editing `.pen` — Pencil has its own layout model. No
  percentage sizes, no `margin`, no `alignItems: stretch/baseline`.
- Name every node. Prefer `fit_content` / `fill_container` over hardcoded sizes.
- Split `execute` into small calls; verify each section before moving on. Screenshots lie
  about freshly built nodes (a black frame is usually a capture artefact, not the design) —
  **verify with `Export` to PNG and measure**:
  `magick out.png -alpha off -format "%[fx:mean]" info:`. Strip alpha first, or an empty
  RGBA frame reads 0.25 and looks like content.
- Pencil does **not** write the `.pen` on its own. Save with
  `osascript -e 'tell application "Pen" to activate' -e 'delay 1.5' -e 'tell application "System Events" to keystroke "s" using command down'`
  and then **check the mtime actually moved** — an unfocused app swallows the keystroke.
- Build repeated UI as reusable components, then instance with `ref` + `descendants`.
