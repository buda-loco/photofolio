# Benjamin Arnedo — Photofolio

Portfolio site for Benjamin Arnedo, photographer & cinematographer.

---

## Stack

- **Framework:** Next.js 14 (App Router, React 18)
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **CMS:** Tina CMS (local only) — `npm run cms`, then `git push` to deploy
- **Animation:** GSAP 3 + ScrollTrigger
- **Scroll:** Lenis (smooth scroll)
- **Page transitions:** Custom SVG logo-window mask animated via GSAP

---

## Commands

```bash
npm run dev      # dev server (localhost:3000)
npm run cms      # Tina CMS + dev server (Tina UI at localhost:4001/admin)
npm run build    # production build (next build only — no tinacms build)
npm run start    # serve production build
```

---

## Project structure

```
src/
  app/
    layout.tsx            # root layout — nav, footer, design tokens, PageTransition
    page.tsx              # homepage — 2 latest projects + hero intro
    globals.css           # imports all CSS modules
    work/
      page.tsx            # /work listing — bento grid + service filters
    work/[slug]/
      page.tsx            # project page (server component — metadata, schema)
      ProjectClient.tsx   # project page (client component — Tina live editing)
    about/
      page.tsx
      AboutClient.tsx
    how-i-work/page.tsx
    contact/page.tsx
    presentations/          # private client pitch decks (noindex)
      placeworks/           # PlaceWorks interactive identity deck
        layout.tsx          # .pw-pitch wrapper — hides site nav/footer, warm palette
        page.tsx            # deck index — hero, brief, "why interactive", concept cards
        01|02|03/page.tsx   # one page per concept (rationale + live generators)
        _components/         # interactive generators + proof mockups
        presentations.css   # self-contained deck styles
    robots.ts
    sitemap.ts
  components/
    Nav.tsx               # fixed nav + mobile menu + scroll-triggered mini logo
    Block.tsx             # renders content blocks (hero, gallery, video, text)
    GridItem.tsx          # project card with hover animation (used on home + /work)
    WorkGrid.tsx          # /work bento grid with service filters + GSAP animations
    ExternalLinkButton.tsx # reusable CTA button with external-link icon
    PageTransition.tsx    # SVG logo-window page transition mask
    TransitionLink.tsx    # <a> wrapper that triggers page transitions
    SmoothScroll.tsx      # Lenis init + onLenisReady callback pattern
    AnimationsInit.tsx    # GSAP scroll animation setup (per-page)
  lib/
    animations.ts         # GSAP scroll animations + grid hover + fit-text
    colors.ts             # pill colour computation (hue rotation, contrast)
    content.ts            # file-based content loading (projects, design, etc.)
    richText.ts           # Tina rich-text AST → HTML converter
    tinaClient.ts         # Tina GraphQL client wrapper
    tinaClientStub.ts     # stub when tina/__generated__ doesn't exist
    tinaHelpers.ts        # Tina data helpers (buildTinaProps, etc.)
  content/
    design.json           # site-wide design tokens (colours, fonts, spacing)
    projects/             # one JSON file per project — edited via CMS
    about.json
    how-i-work.json
  css/
    tokens.css            # CSS custom properties (defaults + safe-area)
    base.css              # reset + global rules + label-colour rule
    fonts.css             # @font-face declarations (self-hosted WOFF2)
    typography.css        # heading/body/label type rules
    nav.css               # fixed nav + pill styles + mini logo + mobile menu
    grid.css              # homepage grid + hover overlay animation
    project.css           # project page layout
    pages.css             # about / how-i-work / contact / footer pages
    transitions.css       # page transition mask styles
    work.css              # /work page: bento grid, filters, latest-work section
public/
  fonts/                  # WOFF2 font files (served statically)
  images/                 # project images
  presentations/          # deck assets (slider proofs, wordmarks, tree.glb)
  llms.txt                # agentic discoverability (AI crawlers)
  logo.svg                # site wordmark logo (used in desktop nav)
  logo-mini.svg           # icon logo (used in scroll mini, footer, mobile nav)
  favicon.png             # favicon
tina/
  config.ts               # Tina CMS schema (local editing only)
  __generated__/          # gitignored — never commit
```

---

## Typography

All fonts are **self-hosted WOFF2** in `public/fonts/`. No Google Fonts.

| Token | Family | Use |
|---|---|---|
| `--font-display` | Adrianna Extended | H1, H2, display classes, project title, grid overlay |
| `--font-sans` | Adrianna | H3–H6, body, labels, nav |

### Weight conventions
- **Body / labels:** 300 (Light)
- **H3–H6:** 700 (Bold)
- **H1, H2, project title, grid title:** 700 (Bold) — Adrianna Extended
- **Grid overlay title (homepage):** 300 (Light) — Adrianna Extended

### Font preloads
Four fonts are preloaded in `layout.tsx`: Adrianna Light, Adrianna Bold, Adrianna Extended Light, Adrianna Extended Bold.

### Font files
Families available: `Adrianna`, `Adrianna Extended`, `Adrianna Condensed`
Weights: Thin (100), Light (300), Regular (400), DemiBold (600), Bold (700), ExtraBold (800)
Each has normal + italic variants.

### Typography scale
Base font size is `1rem` (16px). Body line-height `1.7`. Lead paragraph (first `<p>` in `.body-text`): `1.2rem / 1.3lh`. Secondary body: `var(--text-sm)`. Smart hyphenation + `text-wrap: pretty` applied site-wide to `.body-text p`.

---

## Colours & design tokens

Design tokens are defined in `tokens.css` (defaults) and overridden at build time by `design.json` via `buildDesignCss()` in `lib/colors.ts`, injected as inline `<style>` in `layout.tsx`.

| Token | Default | Notes |
|---|---|---|
| `--color-bg` | `#000000` | Pure black |
| `--color-text` | `#ffffff` | Pure white |
| `--color-text-muted` | `#666666` | Secondary text |
| `--color-text-bright` | `#ffffff` | |
| `--color-border` | `rgba(255,255,255,0.1)` | |
| `--color-accent` | `#f4ff26` | Yellow accent |
| `--color-label` | `#f4ff26` | Applied to label elements; supports CSS gradients |

### Label colour
`.project-info-label`, `.label`, `.step-number`, `.grid-item-meta` all use:
```css
background: var(--color-label);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
```
This means `--color-label` accepts both solid colours and CSS gradients.

### Per-project colours
Each project JSON supports:
- `backgroundColor` / `backgroundColorSecondary` — page background (solid or gradient)
- `textColor` — text colour override
- `primaryColor` / `secondaryColor` — project accent colours
- `invertColors` — swap primary/secondary

On project pages, `ProjectClient.tsx` sets `--project-primary` and `--project-secondary` on `:root` and adds `.project-colors` class. This enables CSS mask tinting on the nav logo and mini logo.

---

## Logo system

| Element | SVG | Location | Behaviour |
|---|---|---|---|
| Desktop nav | `/logo.svg` (wordmark) | Left side of nav bar | Always visible, fades on hover |
| Scroll mini | `/logo-mini.svg` (icon) | Fixed, `left: 100px` | Bounces in when nav hides on scroll-down |
| Mobile nav | `/logo-mini.svg` | Centered in nav bar | Always visible on mobile |
| Mobile menu | `/logo-mini.svg` | Centered in menu header | Visible when menu open |
| Footer | `/logo-mini.svg` | Centered in footer | Tinted via CSS mask with `--color-accent` |
| Favicon | `/favicon.png` | Browser tab | PNG format |

### Project page logo tinting
On project pages, `.project-colors` class enables CSS mask overlays:
- Nav wordmark and mini logo use `--project-secondary` colour (fallback: `--color-accent`)
- The actual `<img>` is set to `opacity: 0` and a `::before` pseudo-element with CSS mask renders the tinted version

### Mini logo sizing
Uses `--nav-mini-size` CSS custom property (35px desktop, 20px mobile) for both `height` and `top` positioning.

---

## Nav pills

Each nav item renders as a coloured pill box. The colour is computed at **build time** in `lib/colors.ts` (`computeBasePill`):

1. Extract the first hex from the page's `backgroundColor` (or site default `#000000`)
2. Rotate hue 180° (complementary)
3. Adjust lightness for visibility (dark bg → lighter pill, light bg → darker pill)
4. Auto-select black or white text to meet **WCAG AA 4.5:1** contrast ratio
5. For achromatic backgrounds (black, white, grey) → falls back to `--color-accent`

Pills slide in on page load via CSS keyframe animation with staggered `animation-delay` using `--i` (item index).

### Nav "Work" active state
The Work pill (`href="/work"`) is marked active on `/` (homepage), `/work`, and all `/work/[slug]` project pages. `isActive` uses `pathname === '/' || pathname.startsWith('/work/')`.

---

## Homepage

The homepage (`/`) shows a **hero intro** + **2 latest projects** (sorted by year desc) under a "Latest Projects" label with a "View all work →" link to `/work`. It does not show all projects — use `/work` for the full portfolio.

- Section: `.latest-work` with `.latest-work-header` (label + link) and `.latest-work-grid`
- The 2 latest projects render as equal 6-col cards (overriding their `data-size`)
- `getAllProjects()` is memoized — no duplicate file reads

---

## Work page (`/work`)

The full portfolio listing at `/work` with bento-box layout and service filters.

### Bento grid
- 12-column CSS grid with `data-span` attribute for column spans (4–12)
- 4 pre-defined column-span blueprints, randomly selected per session on mount (client-only, after hydration)
- Blueprint randomisation uses `useState` (not `useRef`) so the re-render after mount is intentional — ensures hydration safety (SSR and client both start at blueprint 0)
- `WorkGrid.tsx` is the client component; `work/page.tsx` is the server component that reads projects and computes services

### Service filters
- Pill buttons: "All" + all unique services collected from `projects.flatMap(p => p.services ?? [])`, deduped and sorted
- Filter animation: GSAP fade-out current items (0.18s, `power2.in`) → state update → fade-in new items (0.5s stagger, `power3.out`)
- `isFiltering` ref prevents concurrent animation conflicts on rapid clicks
- GSAP tweens are cleaned up on component unmount via `useEffect` cleanup

### GridItem `animated` prop
`GridItem` accepts `animated={false}` (default `true`) to suppress `data-animate="fade-up"`. WorkGrid passes `animated={false}` because it manages all animation via GSAP directly, avoiding conflicts with `AnimationsInit`'s ScrollTrigger processing.

---

## Page transitions

Custom SVG logo-window transition in `PageTransition.tsx` with three layers:

- **SVG mask** (z-index 9999) — accent-coloured fill with BA logo punched as transparent holes
- **Dark backdrop** (z-index 9998) — gradient panel (transparent → darkened destination colour) for layered reveal
- **Content** — the page itself

### Transition sequence

1. **Phase 1:** SVG mask slides up from bottom; dark backdrop is already positioned behind it; old page fades out
2. **Navigate:** `router.push(href)` called; timeline **pauses** until new route mounts (prevents flash)
3. **Phase 2 (simultaneous):**
   - Mask fill shifts to destination background colour (0.35s linear)
   - Logo holes expand exponentially (`expo.in`, scale 200×, 1.0s) — reveals dark backdrop through holes
   - Dark backdrop sweeps down off-screen (1.8s, `power2.out`) with gradient soft edge — graceful layered reveal of new content
4. **Phase 3:** Mask dissolves (0.12s), cleanup

### Key details

- The `routeReady` ref/promise pattern ensures the timeline waits for React to mount the new page before revealing it through the logo holes. Safety timeout of 2s prevents deadlock.
- `darkenBg()` (from `colors.ts`) computes the backdrop colour at 25% brightness of the destination background
- Backdrop uses `linear-gradient(to bottom, transparent 0%, dark 35%, dark 100%)` so the leading edge fades softly
- `TransitionLink` wraps `<a>` tags to trigger transitions. External links bypass the transition.
- WHY `SCALE_FACTOR = 200`: the inner A-triangle connector is only ~55 SVG units wide; the yellow counter stays on-screen until scale > 159. 200 clears all yellow off-screen on any viewport.
- WHY animate `<path>` not `<svg>`: scaling the SVG element hits browser GPU texture limits (~16–32 Kpx) at 200×. Animating the inner path keeps the SVG at viewport size — pure SVG vector with no rasterisation limit.

---

## Project page

- Cover image with configurable aspect ratio
- Project info strip: About / Date / Place / Client labels coloured via `--color-label`
- First paragraph of About is the lead (1.2rem / 1.3lh), subsequent paragraphs use `--text-sm`
- **Block captions** use `color-mix(in srgb, var(--color-bg) 85%, transparent)` for a dark tinted background matching the project theme
- Optional CTA button rendered via `ExternalLinkButton` when `project.ctaUrl` + `project.ctaLabel` are set
- Content blocks rendered by `Block.tsx`: `hero`, `gallery`, `video`, `widescreen_video`, `vertical_reel`, `text`
- **Next project** link loops through projects sorted by year desc
- Tina live editing supported via `useTina` hook in `ProjectClient.tsx`

### Video blocks
- `video` — supports YouTube, Vimeo, OneLinePlayer, or native `<video>`
- `widescreen_video` — OneLinePlayer with poster image, autoplay support, configurable aspect ratio
- `vertical_reel` — vertical video + 2 side images grid layout

Boolean attributes (autoplay, muted, loop) use `!!` operator to ensure proper React boolean handling.

---

## ExternalLinkButton

`src/components/ExternalLinkButton.tsx` — reusable CTA for projects with external links.

```tsx
<ExternalLinkButton href="https://..." label="Visit website" />
```

Renders an `<a target="_blank" rel="noopener noreferrer">` with a small SVG external-link icon. Styled via `.external-link-btn` and `.external-link-icon` in `project.css`. Shown in `ProjectClient.tsx` when the project has both `ctaUrl` and `ctaLabel` fields.

---

## Animation system (`animations.ts`)

| Attribute | Behaviour |
|---|---|
| `data-animate="fade-up"` | Fade + rise on scroll |
| `data-animate="stagger"` | Stagger-fade children on scroll |
| `data-animate="word-reveal"` | Words clip-reveal from bottom (`.word-clip` / `.word-inner` structure) |
| `data-animate="line-reveal"` | Lines fade-up staggered |
| `data-parallax="0.2"` | Parallax scroll on image (0 = none, 0.4 = strong) |
| `.img-reveal` | Scale + fade in on scroll |

`AnimationsInit.tsx` is included on every page. It dynamically imports `animations.ts`, kills old ScrollTriggers, and re-initialises on each pathname change.

**Note:** Do not put `data-animate` on elements inside `WorkGrid` — the bento grid manages its own GSAP animations and would conflict with ScrollTrigger processing.

---

## Smooth scroll (Lenis)

`SmoothScroll.tsx` creates a single Lenis instance on mount (never recreated during navigation).

**`onLenisReady(callback)`** — subscribe to be notified when Lenis is available. Used by `Nav.tsx` to attach scroll listeners without polling. Returns an unsubscribe function.

Scroll resets to top on pathname change (deferred to next animation frame to avoid racing with the page transition mask).

---

## SEO

- `metadataBase: new URL('https://benjaminarnedo.com')` set in root `layout.tsx`
- Every page has `alternates.canonical`, `openGraph` (title, description, url), and `twitter` metadata
- Root layout has Person JSON-LD schema with `addressLocality: 'Brisbane'`
- Project pages have CreativeWork JSON-LD with `url`, `creator`, `image`, `dateCreated`
- `robots.ts` explicitly allows AI crawlers: GPTBot, ClaudeBot, anthropic-ai, PerplexityBot
- `public/llms.txt` for agentic discoverability
- `sitemap.ts` uses static dates (not `new Date()`) — project routes use the project's `year` field
- City is **Brisbane** (not Canberra) — about.json confirms this

---

## Content management (Tina CMS — local only)

```
npm run cms   →   Tina UI at localhost:4001/admin
                  edits write to src/content/**/*.json on disk
git push      →   Vercel deploys the updated files
```

Editable collections:
- **Projects** — full project CRUD including colours, services, CTA, and all content blocks
- **About** — bio (rich-text), portrait, clients, social links
- **How I Work** — steps (rich-text), CTA
- **Design** — site-wide colours including `labelColor` (supports gradients)
- **Quotes** — per-client interactive scope & pricing tools (see below)

### Quote builder (`/quote/<client>`)
Reusable, config-driven client quote tool. One JSON doc per client in
`src/content/quotes/<slug>.json` → rendered at `/quote/<slug>` (statically
generated, `noindex`). `/quote` redirects to the first available client.

- **Edit in Tina:** "Quotes" collection. Each doc holds the work types
  (hourly rates), budget slider bounds, focus options, and deliverables.
- **Two pricing modes per deliverable** (Tina templates, `_template`
  discriminator — same pattern as project blocks):
  - **Job — by hours** (`hourly`): `category` (a work-type id) × `hours`.
  - **Job — fixed price** (`fixed`): flat `amount`; optional `estHours` is
    display-only and ignored by the math.
- **Core vs extras:** each deliverable has `tier: "core" | "extra"`. Core
  (the brief) is funded first; extras only fund once core is fully covered.
  Lowering the budget drops extras before anything core.
- **Logic lives in `src/lib/quote.ts`** (pure, unit-tested):
  `normalizeQuote()` coerces any raw/partial doc so `cost()` never returns
  `NaN`; `computeQuote()` does the greedy core-first funding. Loaded via
  `getQuote()/getAllQuotes()` in `content.ts`; live editing via `useTina` in
  `QuoteBuilder.tsx`. Coverage bar is by **core $ funded** (not hours, since
  fixed jobs have none). Tests: `npm test` (`src/lib/quote.test.ts`).
- Adding a work type that hourly jobs reference: set its `id`, then use that
  id as a deliverable's `category`. Unknown category → that line is priced
  `$0` with a build-time `console.warn` (never breaks the page).

### Rich-text fields
`about`, `body` (text blocks), `intro`, and step `body` fields use Tina `rich-text` type, stored as AST nodes in JSON. Rendered via `TinaMarkdown` component (client) or `richToHtml()` / `richToPlain()` utilities (server).

### Block discriminator field
Content blocks in project JSON use `"_template"` as the discriminator key (written by Tina). The `Block.tsx` component also handles `"__typename"` from Tina's GraphQL client, normalising both to the template string. Use underscores in block names: `widescreen_video`, `vertical_reel` (not hyphens).

### Slugify
Tina's slug field normalises: lowercase, spaces → hyphens, strips non-alphanumeric. File must be named with hyphens (e.g. `angus-comyns.json`), not spaces.

### Services
Free-text field (no fixed options). `getAllProjects()` collects all unique services for the filter UI.

### Featured field
Projects with `"featured": false` are hidden from the homepage and `/work`. Projects without the field (undefined) default to shown (`featured !== false`). The `getAllProjects()` result is memoized at the module level (`_projectsCache`).

### CTA fields
`ctaLabel` and `ctaUrl` — optional. When both are set, an `ExternalLinkButton` is rendered below the project info strip.

### Build
Production build runs `next build` only — `tinacms build` is not included because Tina Cloud is not configured. Tina is local-only.

---

## Mobile support

- `viewport-fit=cover` enabled for iPhone notch/Dynamic Island
- Safe-area inset padding on `--page-margin` and mobile menu
- Mobile nav shows centered `logo-mini.svg` + hamburger menu
- Desktop nav links hidden on mobile; replaced by full-screen overlay menu
- Mini scroll logo hidden on mobile (`display: none !important` below 768px)

---

## Adding a new project

1. Create `src/content/projects/your-slug.json` (or use CMS)
2. Add images to `public/images/projects/your-slug/`
3. Set `"featured": true` (or omit — defaults to shown)
4. Use hyphenated slugs only (e.g. `my-project`, not `my project`)
5. Push to `main` — Vercel deploys automatically

---

## Presentations (client pitch decks)

Private, self-contained pitch decks under `/presentations/<client>` — used to
present brand/identity work directly in the browser instead of a static PDF.
First deck: **PlaceWorks** (`/presentations/placeworks`).

- **Noindex + isolated chrome:** `placeworks/layout.tsx` sets
  `robots: { index: false, follow: false }` and wraps everything in a
  `.pw-pitch` div. That class triggers `:has()` rules in `presentations.css`
  that hide the global site nav/footer and switch to the deck's warm "paper"
  palette — so the deck doesn't inherit the main site shell.
- **Self-contained styles:** all deck CSS lives in
  `placeworks/presentations.css` (imported by the layout), prefixed `pw-`. It
  is NOT part of the global `globals.css` pipeline.
- **Structure:** `page.tsx` is the index (hero → brief → "why interactive"
  framing → concept cards). Each concept is its own route (`01/`, `02/`, `03/`)
  with a rationale block followed by one or more live generators.
- **Interactive generators** live in `placeworks/_components/` (all
  `'use client'`):
  - `Concept1Room` / `Concept1Forest` — 3D scenes built with **three** +
    **cannon-es** physics (the `three`/`cannon-es`/`@types/three` deps exist
    only for these). `tree.glb` model is in `public/presentations/placeworks/`.
  - `YarnGenerator` — Concept 02 entropy/untangle generator.
  - `ShapePlayground` — Concept 03 shape-kit builder.
  - `ProofSlider` — proof image carousel; `Concept{1,2,3}Mockup` — static
    proof mockups.
- **The decks are interactive on purpose:** the pitch is that the brand is a
  *system that generates itself*, so each concept ships the actual generator,
  not a screenshot. The index page's "why interactive" section explains this to
  the client — keep that framing if editing copy.
- **Assets:** deck images/models go in `public/presentations/<client>/`
  (slider proofs, wordmark SVGs, GLB models).

### Adding a new presentation

1. Create `src/app/presentations/<client>/layout.tsx` (copy PlaceWorks: noindex
   + `.pw-pitch` wrapper + import its CSS) and `page.tsx`.
2. Put deck-only styles in a co-located `presentations.css`; put assets in
   `public/presentations/<client>/`.
3. Keep it `noindex` — these are private client links, not public pages.
4. Push to `main` — Vercel deploys automatically.

---

## Adding a new client quote

1. Create `src/content/quotes/your-slug.json` (or use the CMS "Quotes" collection)
2. Set `workTypes` (ids + hourly rates), `budget` bounds, and `deliverables`
   (each `core`/`extra`, priced `hourly` or `fixed`)
3. Live at `/quote/your-slug` — statically generated, no extra wiring
4. Use hyphenated slugs only; `placeworks.json` and `acme.json` are worked examples
5. Push to `main` — Vercel deploys automatically

---

## Font conversion

Source TTF files live in `Fonts/`. To convert new fonts to WOFF2:

```bash
pip3 install fonttools brotli   # one-time
cd Fonts
for f in *.ttf; do
  python3 -c "from fontTools.ttLib import TTFont; tt = TTFont('$f'); tt.flavor='woff2'; tt.save('woff2/${f%.ttf}.woff2')"
done
cp woff2/*.woff2 ../public/fonts/
```

Then add `@font-face` entries in `src/css/fonts.css`.
