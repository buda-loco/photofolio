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
    page.tsx              # homepage grid
    globals.css           # imports all CSS modules
    work/[slug]/
      page.tsx            # project page (server component — metadata, schema)
      ProjectClient.tsx   # project page (client component — Tina live editing)
    about/
      page.tsx
      AboutClient.tsx
    how-i-work/page.tsx
    contact/page.tsx
    robots.ts
    sitemap.ts
  components/
    Nav.tsx               # fixed nav + mobile menu + scroll-triggered mini logo
    Block.tsx             # renders content blocks (hero, gallery, video, text)
    GridItem.tsx          # homepage grid item with hover animation
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
public/
  fonts/                  # WOFF2 font files (served statically)
  images/                 # project images
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

---

## Homepage grid

- 12-column CSS grid; items sized via `data-size` (large=8col, medium=6col, small=4col)
- Optional `gridOffset` shifts the card right by N columns for asymmetry
- **Title overlay:** Adrianna Extended Light, font-size fitted to 100% container width via JS probe measurement (`fitOneTitle` in `animations.ts`). Recalculates on resize, waits for `document.fonts.ready`.
- **Hover animation (GSAP):**
  1. Dark rectangle wipes up from bottom (`scaleY` 0→1, 0.32s, `power3.out`)
  2. Words clip-reveal staggered (0.38s each, 0.045s stagger), fires 0.18s before rect finishes
  3. Mouse leave: full timeline reverse

---

## Page transitions

Custom SVG logo-window transition in `PageTransition.tsx`:

1. **Phase 1:** Accent-coloured SVG mask slides up from bottom, old page fades out behind it
2. **Navigate:** `router.push(href)` called; timeline **pauses** until new route mounts (prevents flash)
3. **Phase 2a:** Mask fill shifts to destination background colour
4. **Phase 2b:** Logo holes expand exponentially (`expo.in`, scale 200×) revealing new content
5. **Phase 3:** Mask dissolves, cleanup

The `routeReady` ref/promise pattern ensures the timeline waits for React to mount the new page before revealing it through the logo holes. Safety timeout of 2s prevents deadlock.

`TransitionLink` wraps `<a>` tags to trigger transitions. External links bypass the transition.

---

## Project page

- Cover image with configurable aspect ratio
- Project info strip: About / Date / Place / Client labels coloured via `--color-label`
- Content blocks rendered by `Block.tsx`: `hero`, `gallery`, `video`, `widescreen_video`, `vertical_reel`, `text`
- **Next project** link loops through projects sorted by year desc
- Tina live editing supported via `useTina` hook in `ProjectClient.tsx`

### Video blocks
- `video` — supports YouTube, Vimeo, OneLinePlayer, or native `<video>`
- `widescreen_video` — OneLinePlayer with poster image, autoplay support, configurable aspect ratio
- `vertical_reel` — vertical video + 2 side images grid layout

Boolean attributes (autoplay, muted, loop) use `!!` operator to ensure proper React boolean handling.

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

---

## Smooth scroll (Lenis)

`SmoothScroll.tsx` creates a single Lenis instance on mount (never recreated during navigation).

**`onLenisReady(callback)`** — subscribe to be notified when Lenis is available. Used by `Nav.tsx` to attach scroll listeners without polling. Returns an unsubscribe function.

Scroll resets to top on pathname change (deferred to next animation frame to avoid racing with the page transition mask).

---

## Content management (Tina CMS — local only)

```
npm run cms   →   Tina UI at localhost:4001/admin
                  edits write to src/content/**/*.json on disk
git push      →   Vercel deploys the updated files
```

Editable collections:
- **Projects** — full project CRUD including colours, services, and all content blocks
- **About** — bio (rich-text), portrait, clients, social links
- **How I Work** — steps (rich-text), CTA
- **Design** — site-wide colours including `labelColor` (supports gradients)

### Rich-text fields
`about`, `body` (text blocks), `intro`, and step `body` fields use Tina `rich-text` type, stored as AST nodes in JSON. Rendered via `TinaMarkdown` component (client) or `richToHtml()` / `richToPlain()` utilities (server).

### Block discriminator field
Content blocks in project JSON use `"_template"` as the discriminator key (written by Tina). The `Block.tsx` component also handles `"__typename"` from Tina's GraphQL client, normalising both to the template string. Use underscores in block names: `widescreen_video`, `vertical_reel` (not hyphens).

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
3. Follow the schema in `CONTENT.md`
4. Push to `main` — Vercel deploys automatically

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
