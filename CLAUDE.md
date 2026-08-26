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

⚠️ **Never run `npm run build` while `npm run dev` is live.** They share
`.next`, and the build overwrites manifests the dev server is holding open —
every route then 500s with `ENOENT ... app-build-manifest.json`. It looks like
the code broke, but nothing is wrong with it. Stop the dev server, `rm -rf
.next`, and restart.

---

## Design system

The brand's generative rulebook lives in **`Working Files/Design-system.pen`** (Pencil) —
tokens, colour, type, components, motion, page templates, deck masters and accessibility
rules, all mirrored from this codebase. Use it to produce new pages, decks and documents.

**Full reference: [`Working Files/CLAUDE.md`](Working%20Files/CLAUDE.md)** — board map,
tokens, logo geometry, the contrast matrix, and how to extend it.

⚠️ It also records **three unfixed contrast defects in this codebase** (measured, not
estimated). They are documented but the code is unchanged:

1. `src/css/grid.css` — the grid-card hover tint paints above the scrim and below the
   hardcoded white title. Any project **without** a `backgroundColor` falls back to accent
   yellow and lands at **3.16:1** (`music-act`); `wonderful-world` `#FACC40` is **4.08:1**.
   Fix by deriving the title colour through `accessibleText()` in `lib/colors.ts`.
2. `src/content/design.json` — `colors.textMuted: "#767676"` is **4.62:1** on black and
   **fails (4.36:1)** on the `#141414` surfaces. `tokens.css` already defaults to
   `#999999` (7.37:1); design.json overrides the good value with the marginal one.
3. `src/css/project.css` — `.project-next-label { opacity: 0.6 }` is **3.99:1**. Needs `0.75`.

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

### Latest video work strip

Below the projects, three showreel clips loop like gifs and open the shared
`VideoLightbox` on click. `HomeVideoStrip.tsx` renders them; selection is
`getHomepageVideos()` (see the showreel section for `homepage` / `added`).

- The cards are plain `.grid-item`s — deliberately **not** inside `.bento-grid`
  or `.showreel-grid`, which `initGridHovers` skips when called globally. That
  means `AnimationsInit` binds the hover for free; do not bind it again here.
- Clips are `preload="none"` and play via IntersectionObserver, because the
  strip sits below the fold and autoplaying three videos on load is wasteful.
- Crewcible-category items carry the same `.showreel-credit` badge as
  `/showreel`. Keep `CREDITED_CATEGORY` in step across both components.

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

## Deep-linkable filters (`?service=` / `?category=`)

Both filtered grids sync the active filter to the URL, so a filtered view is
shareable: `/work?service=Photography`, `/showreel?category=Crewcible`. An
unknown value falls back to "All" rather than rendering an empty grid.

Clicking a pill writes the param with `history.replaceState` **after** the
fade-out completes. Replace, not push — otherwise Back steps through every pill
you clicked instead of leaving the page. Choosing "All" removes the param.

Three things will bite you here:

- ⚠️ **`useSearchParams` in a statically-generated page is a build error
  without `<Suspense>`.** Not a warning — `next build` fails the export with
  *"useSearchParams() should be wrapped in a suspense boundary"*. Both
  `work/page.tsx` and `showreel/page.tsx` wrap their grid for exactly this
  reason. Any new page reading query params needs the same.
- ⚠️ **Next 15 echoes your own `replaceState` back through `useSearchParams`.**
  The read effect must guard `if (value === active) return`, or the echo
  re-applies the filter a second time with no animation.
- ⚠️ **Same-pathname navigation must not run the transition mask** — see below.

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
- ⚠️ **Same-pathname navigation skips the mask entirely.** `routeReady`
  resolves off the pathname changing, so `/showreel` → `/showreel?category=…`
  (or clicking the nav pill for the page you are already on) would never
  resolve it and the mask would sit on its full 2s safety timeout with the
  screen covered. `triggerTransition` compares `href.split(/[?#]/)[0]` against
  the current pathname and, on a match, just pushes the URL and scrolls to
  top. Keep that guard if you add any link to a query-param view of the
  current page.
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

## Analytics

Three trackers, all in `layout.tsx`: Vercel Analytics, Vercel Speed Insights,
and Google Analytics 4 (`G-78BBE72KHY`) via `@next/third-parties`.

- `NEXT_PUBLIC_GA_ID` is set on Vercel for **Production only**, so preview
  deployments and local dev never reach the property. The tag renders only when
  the var is present.
- ⚠️ **`NEXT_PUBLIC_*` is inlined at build time.** Changing it in Vercel does
  nothing until a rebuild. `vercel redeploy` is not reliably enough — it can
  reuse the previous build output. Push a commit to force a real build.
- ⚠️ **Do not add manual `page_view` tracking.** GA4 counts a pageview on every
  browser history change, which is what this site's client-side `router.push()`
  navigations are. Verified on production: navigating `/` → `/about` sends a
  second `page_view` with the right `dl` and `dt`. Sending our own would double
  every figure.
- That behaviour depends on Enhanced Measurement → "Page changes based on
  browser history events" staying enabled in the GA property. If it is ever
  turned off, every navigation here goes uncounted and only the first page of a
  visit registers — because nothing on this site is a full page load.
- `@next/third-parties` is pinned to the **15.x** line to match `next@15.5.14`;
  `@latest` is 16.x and conflicts.

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

## Showreel (`/showreel`)

Video archive: 64 videos, six categories, streaming from Dropbox through
OneLinePlayer. Filter pills reuse `/work`'s styles; cards reuse `.grid-item`
and `initGridHovers`, so the hover is the same timeline as home and `/work`
with the tint forced to the accent.

**To add videos, use the pipeline — don't do it by hand:**

```bash
cd scripts/showreel
cp config.example.sh config.sh   # first time; holds the Dropbox token
source config.sh && ./showreel.py all
```

`scripts/showreel/README.md` has the full detail. It is incremental — every
stage skips work already done, so re-running only touches new files, and
`./showreel.py status` reports what's pending without changing anything.

### Things that will bite you

- **A Dropbox token keeps the scopes it was born with.** Ticking new
  permissions does nothing for an existing token: tick, Submit, *then*
  regenerate. Needs `files.metadata.read`, `files.content.write`,
  `sharing.read`, `sharing.write`.
- **This is a Business team space.** Every API call needs a
  `Dropbox-API-Path-Root` header; without it the API sees only `/Apps` and
  reports the account as empty.
- **TLS interception on this machine breaks Python but not curl.** The script
  builds a combined certifi + macOS-keychain CA bundle rather than disabling
  verification. Any other Python script here hitting HTTPS will hit the same
  wall.
- **Slugs can collide.** "Winter in the City Promo" and "Winter in the city
  Promo" differ only by case. `slug_map()` is the single source of truth and
  appends `-2`; never call `slugify()` directly from a stage.
- **Hand edits survive a rebuild.** `manifest` preserves `title`, `category`,
  `added` and `homepage` on entries that already exist.

### The two hand-set fields

Everything in `showreel.json` is derived from the file except `added` and
`homepage`.

`added` is the ISO date the video entered the archive, stamped once on first
`manifest` and preserved after. It exists because **the videos carry no date of
their own** — not in the filename, the folder, or the Dropbox metadata — so
without it the set can only be sorted alphabetically. It is what "latest" means
here. The 64 original imports all carry `2026-08-23` and therefore tie;
anything uploaded later sorts above them.

`homepage: true` pins a video to the strip on `/`. `getHomepageVideos()` in
`lib/showreel.ts` takes pinned videos in file order, falling back to the three
most recently `added` when none are pinned — the same shape as the projects
rule above it, so the section survives an upload untouched.

### Animation timings are bounded by total, not per item

`/work` staggers per item (`stagger: 0.07`), which is fine for ~11 projects.
At 64 cards that costs 4.5s to reveal and 1.8s to filter. ShowreelGrid uses
`stagger: { amount: N }` for the filter fade and reveals per viewport-batch
via IntersectionObserver. **Keep any new stagger here bounded by total time.**

The reveal deliberately avoids ScrollTrigger: `AnimationsInit` kills every
ScrollTrigger from an async import on mount, which races the component and
leaves cards stuck invisible.

### Category notes

`CATEGORY_NOTES` in `ShowreelGrid.tsx` shows context above the grid for a
given category — currently Crewcible, with a CTA to crewcible.com. Add a key
to that map to give another category one.

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

### Self-serve quote builder (`/quote` EN/AUD · `/cotizacion` ES/USD)

Public, parametrised quote builder covering all eight services on offer. Five
steps: disciplines → scope → project conditions → details → **quote document**.

- **Catalogue:** `src/data/quoteCatalogue.ts` — eight disciplines (graphic
  design, branding, photography, videography, post-production, animated
  graphics, web design, design consultancy, event visuals), the hourly `RATES`
  by craft, and the project-level `TURNAROUND` / `TRAVEL` / `LICENCES` tables.
  This is the only place rates and prices are defined.
- **Engine:** `src/lib/quotePricing.ts` — pure and total (never returns `NaN`).
  Tests: `npm test` (`src/lib/quotePricing.test.ts`).
- **Everything is hours-driven.** Each item has `baseHours`, plus `params` that
  move those hours: `qty` (steppers — pages, images, shoot hours, runtime),
  `choice` (crew size, retouch level, edit complexity — usually `hoursMult`),
  and `toggle` (add-ons, usually a flat `feeAdd` for gear). Additive effects sum
  first, then multipliers scale the whole line. Fixed `fee`s are hard costs
  only — gear, hire, travel, licensing — never labour.
- **Project modifiers**, applied in `priceQuote()`:
  - *Priority* multiplies **production labour only** — never travel, expenses,
    licensing or working-files fees.
  - *Travel* bills time at the shoot rate plus an estimated expense line, and is
    only charged when a selected item is flagged `onLocation`.
  - *Usage licence* is a flat fee line, only charged when a selected item is
    flagged `licensable`.
  - *Working files* (source/project files) are priced off production labour
    (20%, min $250) — a value transfer, not extra effort.
  - Extra revision rounds are labour (2 rounds included).
- **Discount codes.** `PROMOS` in `quoteCatalogue.ts` — currently `matesrates`
  (25%) and `supermatesrates` (45%). Matched case-insensitively and trimmed; an
  unrecognised code says so and charges nothing. The field sits at the end of
  the quote step, right above the document whose total it changes, and the
  discount appears as its own line on the quote. It sits **last on the Project
  step**, below Delivery — at the end of the flow nobody found it.
  - The field is a warm invitation ("Do we know each other?" / "¿Nos
    conocemos?") rather than a form label. ⚠️ **Never put a working code in the
    placeholder** — it read "e.g. matesrates…" and was handing one out.
  - The hard-cost caveat only appears once a code lands, so the idle state stays
    an invitation instead of a wall of terms.
  - ⚠️ **The discount base excludes hard costs** — `itemFees` (gear and studio
    hire) and `travelExpenses`. Knocking 45% off a studio hire or a flight isn't
    a discount, it's paying out of pocket. It applies to labour, priority,
    travel *time*, licensing and the working-files fee. Change
    `discountable` in `priceQuote` if that judgement should differ.
  - ⚠️ Percentages don't scale per region — a 25% discount is 25% in both.
  - ⚠️ The codes ship in the client bundle and are readable in devtools. Fine
    for mates' rates; don't put anything sensitive there.
  - Money formatting rounds the **magnitude**, not the signed value:
    `Math.round(-337.5)` is `-337`, which disagreed with the `-338` shown
    elsewhere for the same figure.
- **Delivery calendar & priority — the only speed lever.** There are
  deliberately no "1 week / 2 week" rush tiers: a tier promises a duration the
  job's own hours can contradict, whereas a date derived from those hours
  cannot. `SCHEDULE` in `quoteCatalogue.ts` holds the whole model —
  `hoursPerDay: 2` (standard, sharing the week with other work),
  `priorityHoursPerDay: 6` (sole focus), `priorityUplift: 0.35`, `leadDays: 7`.
  - Working days ÷ Mon–Fri, weekends skipped, part-days rounded up. The hours
    counted are items + extra revisions + travel time.
  - ⚠️ **All date maths runs at midday UTC** (`parseISODate`). Parsing
    `YYYY-MM-DD` as local midnight shifts the day backwards for anyone west of
    Greenwich; the document formats with `timeZone: 'UTC'` for the same reason.
  - The start date default and its `min` are set in a `useEffect`, never during
    render — "today" computed on the server disagrees with the client.
  - Everything time-related lives in **one block at the end of the Project
    step**: the priority toggle, the date picker, the duration, the delivery
    date and the caveat. Don't scatter it.
  - ⚠️ The estimate is **an indication, not a commitment**, and says so in the
    UI and on the document. Keep that wording.
- **Scope presets — bare minimum / recommended / complete.** One control at the
  top of the Scope step sets every selected item at once, and anything added
  afterwards adopts the active preset (`options.preset`, so it rides share
  links). The rule is generic, which is what makes it work for every job:
  quantities step to ×0.5 / ×1 / ×1.5 of their default (deliberately *not* the
  param's own min/max — a "complete" 300-page editorial is absurd), choices take
  the leanest or richest option, and toggles are all-off or all-on. "Complete"
  also adds a revision round and the working files.
  - Choices are ranked by a computed cost weight, not by authoring order, so
    reordering options in the catalogue can't silently change what a preset does.
  - ⚠️ Params marked **`descriptive: true`** are skipped — they describe the
    client's own situation, not a level of service ("how much footage do you
    have", "whose design is it"). A preset must not claim you have five hours of
    rushes. Mark new params accordingly.
  - The active button is **recomputed from the selection**, not trusted from
    state, so fine-tuning one item honestly clears the highlight and shows
    "Custom" rather than leaving a button asserting something untrue.
  - Matching ignores the hours dial: dialling time down is a budget decision and
    doesn't stop a scope being "complete".
- **Hours dial — buying less than recommended.** The params compute what the
  scope *needs* (`recommendedHours`); the client can then buy a share of it,
  stored per item under the reserved `HOURS_FACTOR_KEY` (`__hoursFactor`) in the
  same values object, so it rides share links with no extra plumbing.
  - **Global dial** on the Project step flattens every selected item to the same
    share. **Per-item dial** in each item's detail panel nudges one line; the
    global readout then shows the weighted mix (e.g. 83%).
  - `HOURS_FACTOR_MIN` = **0.6** is the floor — below that the work isn't
    deliverable and the UI says so instead of quoting. `HOURS_FACTOR_MAX` = 1:
    you cannot buy *more* than the estimate.
  - It scales **labour only**. Gear hire and studio time are hard costs and
    don't get cheaper because fewer hours were bought.
  - It applies **after** the param multipliers, so a ×2 crew line reduces from
    its multiplied total, not its base.
  - ⚠️ **Reducing hours must never read as the same work for less.** The
    deliverable list is unchanged but each gets proportionally less depth, and
    the quote says so in three places: `bought of recommended` on every reduced
    line, a `.qd-reduced` note under the table, and an extra term. Keep all
    three if editing — dropping them turns an honest trade-off into a promise
    that can't be met.
- **Output:** `QuoteDocument.tsx` renders a real quote — number, issue date,
  30-day validity, scope grouped by discipline with each item's parameters spelt
  out, project costs, total, 50% deposit and terms. "Save as PDF" is
  `window.print()`; the `@media print` block in `quote.css` strips all site
  chrome so the document prints as a standalone sheet. No PDF dependency.
- **State lives in the URL.** Scope and project options are encoded into `?q=`
  (base64url) and written back with `history.replaceState` on every change,
  debounced 300ms. A refresh, a browser-back or a forwarded link all survive.
  - The encoded `p` field is the step. A URL written by the **live sync**
    carries it, so a refresh lands you where you were; a URL from the
    **"Copy link" button** omits it and therefore opens on the finished quote —
    a shared link exists to be read, not rebuilt. Don't add `step` to the
    `share()` call or that distinction collapses.
  - The sync is blocked behind a `hydrated` flag until the incoming `?q=` has
    been read, otherwise mount would overwrite the link before restoring it.
  - Malformed links are ignored rather than throwing; items absent from the
    region are dropped, not priced.
- **Contact details never enter the URL** — they'd end up pasted into chats.
  They persist in `sessionStorage` (`ba-quote-details`) instead: survives a
  refresh, never leaves the tab, honeypot excluded. The document shows a generic
  "Prepared for" until they're filled in, and sending is gated on name + email.
  ⚠️ Because step 4 is reachable directly from a link, that gate is
  load-bearing — without it the API just returns a 400.
- **Form conventions** (from a Web Interface Guidelines pass):
  - The details step is a real `<form onSubmit>` with a visually-hidden submit
    button, so Enter finishes the step. Without the button, Enter does nothing
    in a multi-input form.
  - Continue uses `aria-disabled`, not `disabled`, and stays clickable: pressing
    it focuses the first invalid field instead of doing nothing. A per-step hint
    beside it says *why* it won't advance.
  - Errors are inline, tied by `aria-describedby` + `aria-invalid`, and stay
    quiet until a field is blurred or the step is submitted.
  - `aria-live` sits on the **running total only**, never the whole rail —
    on the panel it made every slider tick re-read each line item and the
    deposit.
  - **Touch targets are 44px.** `.quote-slider` is a 44px-tall control whose
    visible 4px track is drawn by `::-webkit-slider-runnable-track` /
    `::-moz-range-track`, with negative margins absorbing the height and a
    `margin-top: -8px` thumb to sit centred. Setting `height: 4px` on the input
    itself (the old approach) left a 4px hit area. Steppers are 44px; a
    `(pointer: coarse)` block lifts `.qw-item-toggle` and friends, whose height
    would otherwise be whatever their text happens to be (~21px for a one-liner).
  - `touch-action: manipulation` across the page kills iOS's ~300ms double-tap
    wait — the builder is almost entirely taps.
  - ⚠️ **Never `outline: none` without a replacement.** `.qw-stepper-input` had
    exactly that and its keyboard focus was invisible; it now pairs
    `:focus-visible` with a `:focus-within` highlight on the group. Text inputs
    keep the accent border on `:focus` but no longer suppress the global
    `:focus-visible` ring in base.css.
- **Submission:** `/api/quote-submit` (Resend) emails the itemised quote to
  Benjamin *and* a copy to the client. The client copy failing never fails the
  request. Falls back to a `mailto:` if `RESEND_API_KEY` is unset.
- **The quote is named after the client**, not after a random number:
  `BA-NORTHLIGHTSTUD-260723`, or `BA-AR-…` on the Spanish page. Built by
  `quoteReference()` from company name (preferred) or personal name, folding
  accents so "García" reads GARCIA rather than GARCA, stripping everything
  non-alphanumeric and capping at 14 characters so it stays speakable. Falls
  back to `BA-260723` when there's no name yet — a shared link opens the quote
  before the recipient has identified themselves.
  - It is **derived, not stored**, so it follows the name as it's typed. Only
    the dates live in state.
  - `printQuote()` swaps `document.title` to the reference before printing and
    restores it on `afterprint`. Browsers use the title as the suggested
    filename, so without this every saved PDF is called "Build your quote" and
    a folder of them is indistinguishable.
- **Dates are generated in a `useEffect`**, never during render — otherwise SSR
  and client disagree and hydration breaks.
- No GST line (not registered).
- **WhatsApp is the phone channel.** `quoteCatalogue.ts` holds `CONTACT_PHONE`
  (display form) and `WHATSAPP_NUMBER` (digits only — wa.me rejects `+`, spaces
  or dashes), plus `whatsappLink(message?)` which builds the deep link with the
  message pre-filled. Used in three places: the document letterhead, a button
  beside Copy link / Save as PDF on the quote step, and the sent screen. The
  pre-filled message is per-language and carries the quote number and total.

#### Regions — the two language/price variants

One catalogue, one engine, two fronts. `src/data/quoteRegions.ts` builds a
**bundle** per region: the catalogue scaled by a price factor, translated, and
filtered. `getQuoteBundle('au' | 'ar')` is memoized per region.

| | `/quote` | `/cotizacion` |
|---|---|---|
| Language | English | Spanish, **es-AR voseo** |
| Currency | AUD, `$` | USD, **`US$`** (a bare `$` reads as pesos in Argentina) |
| Prices | catalogue as authored | `AR_PRICE_FACTOR` = **0.75** |
| Travel | offered | none — remote only |
| On-location items | all | removed |

**The adjustable levers**, all at the top of `quoteRegions.ts`:

- **`AR_PRICE_FACTOR`** — the single number controlling Argentine pricing.
  Change it and every rate, equipment fee, licence tier and the working-files
  minimum move together. Nothing downstream hardcodes a price.
  Scaled values are rounded to clean increments (rates to $5, fees to $10,
  licences to $50), so a 25% cut reads "US$75/h", not "US$75.375/h" — which
  shifts the effective discount by a fraction of a percent, deliberately.
- **`LICENSING_ENABLED`** — currently **`false`**. Switching it off clears the
  `licensable` flag on every item, which is all it takes: the engine only
  charges the licence fee when a licensable item is selected, and the UI asks
  the question on the same condition. The tiers stay defined, so flipping it
  back to `true` restores licensing in both regions at once.
- **`REGIONS[x].remoteOnly`** — drops every `onLocation` item. Because the
  engine also gates travel on those items, this removes the travel question and
  any travel charge automatically; no separate travel flag needed.

**Copy** lives in `quoteCopy.ts` (types + `EN_COPY`) and `quoteCopy.es.ts`
(`ES_COPY` + `ES_CATALOGUE`). Catalogue translations are keyed by the ids in
`quoteCatalogue.ts` and fall back to English when a key is missing —
`quoteRegions.test.ts` fails the build if any item, param or option on the
Spanish page still matches its English source (bar an allowlist of words that
are identical in both languages: Simple, Wireframes, WooCommerce).

⚠️ **`QuoteWizard` takes a `regionId`, not the bundle.** The copy object holds
formatting functions, and functions cannot be serialised across the
server→client boundary — passing the bundle as a prop throws
"Functions cannot be passed directly to Client Components". The page stays a
server component (so it can export metadata) and the client resolves the bundle
itself.

Both language bundles ship to both routes (~8 kB). Not worth code-splitting yet.

### Per-client quote builder (`/quote/<client>`)
A separate, older tool: budget-slider scope calculator. One JSON doc per client
in `src/content/quotes/<slug>.json` → rendered at `/quote/<slug>` (statically
generated, `noindex`). Logic in `src/lib/quote.ts` — unrelated to the engine
above, though both share `src/css/quote.css`.

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

### Tus CFO deck (`/presentations/tuscfo`) — the reference implementation

Second deck (July 2026, es-AR voseo): 4 concepts, each with a live logo editor
+ pattern/system generator, sharing a reusable editor infrastructure in
`tuscfo/_components/`: `EditorShell` (stage + dock workspace), `ui` controls,
`palettes` (client palettes + shade/remap/contrast engine), `exportUtils`
(SVG/PNG Full HD), `rand` (seeded, hydration-safe), `tiles` (quadtree grids),
`LogoMockups` (4 live mockups under every logo editor), `patternPreview`
(generator → mockups blob-URL bridge) and `paletteSync` (one palette per page).
Highlights: 3D coin (three.js, transparent PNG export), animated glyph
patterns, pixel-lettering generator with draw mode/heatmaps/Excel selection,
multi-stage Sankey flow generator.

### Adding a new presentation

**Full replication guide: [`docs/deck-playbook.md`](docs/deck-playbook.md)** —
skeleton, shared-component APIs, editor conventions (seed model, contrast
guards, invert/sorprendeme/export), known gotchas, and the new-client
checklist. Short version:

1. Create `src/app/presentations/<client>/layout.tsx` (noindex + pitch wrapper
   + own CSS) and `page.tsx`; copy from **tuscfo**, not placeworks.
2. Swap the `PALETTES` array; reuse the shared editor infrastructure.
3. Put deck-only styles in a co-located `presentations.css`; put assets in
   `public/presentations/<client>/`.
4. Keep it `noindex` — these are private client links, not public pages.
5. Push to `main` — Vercel deploys automatically.

### Brand Asset Tool — Electron app (`placeworks-tool-electron/`)

Standalone desktop version of `/presentations/placeworks/tool`. Own
`package.json` (Vite + React + Electron), fully separate from the site's
build — root `tsconfig.json` excludes the folder, and Vercel ignores it.

- **Single source of truth:** the app does NOT copy the tool — it imports the
  React components straight from `src/app/presentations/placeworks/_components/tool/`
  via Vite aliases (`@tool`, `@deck` in its `vite.config.ts`). Improving the
  web tool improves the app. This works because the tool folder has zero
  Next.js imports — keep it that way (no `next/*`, no `/public` asset URLs).
- **Commands** (run inside `placeworks-tool-electron/`):
  `npm run dev` — Vite + Electron with HMR · `npm run build` — typecheck +
  bundle renderer · `npm start` — build + run packaged-style from `dist/` ·
  `npm run dist` — electron-builder .dmg/.zip into `release/`.
- Renderer is sandboxed (no Node, no preload, no IPC); exports go through the
  browser anchor-download path, which Electron routes to the OS save dialog.
- `src/app.css` supplies the site-level tokens `presentations.css` expects
  (`--font-sans`, `--ease-out`, `--nav-height: 0`).

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
