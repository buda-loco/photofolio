# Benjamin Arnedo — Photofolio

Portfolio site for Benjamin Arnedo, photographer & cinematographer.

---

## Stack

- **Framework:** Astro 4 (static output)
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **CMS:** Pages CMS (`.pages.yml`) — edits commit directly to the repo
- **Animation:** GSAP 3 + ScrollTrigger
- **Scroll:** Lenis (smooth scroll)

---

## Commands

```bash
npm run dev      # local dev server
npm run build    # static build → dist/
npm run preview  # preview the build
```

---

## Project structure

```
src/
  content/
    design.json          # site-wide design tokens (colours, fonts, spacing)
    projects/            # one JSON file per project — edited via CMS
    about.json
    how-i-work.json
  layouts/
    Layout.astro          # global shell — nav, ViewTransitions, design token injection
  pages/
    index.astro           # homepage grid
    work/[slug].astro     # project page
    about.astro
    how-i-work.astro
    contact.astro
  css/
    tokens.css            # CSS custom properties (defaults)
    base.css              # reset + global rules + label-colour rule
    fonts.css             # @font-face declarations (self-hosted WOFF2)
    typography.css        # heading/body/label type rules
    nav.css               # fixed nav + pill styles + slide-in animation
    grid.css              # homepage grid + hover overlay animation
    project.css           # project page layout
    pages.css             # about / how-i-work / contact pages
    transitions.css       # Astro view transition styles
  js/
    app.js                # entry point — wires init/cleanup per page load
    animations.js         # GSAP scroll animations + grid hover + fit-text
    smooth-scroll.js      # Lenis init/destroy
  components/
    Block.astro           # renders content blocks (hero, gallery, video, text)
public/
  fonts/                  # WOFF2 font files (served statically)
  images/                 # project images
  logo.svg                # site logo
```

---

## Typography

All fonts are **self-hosted WOFF2** in `public/fonts/`. No Google Fonts.

| Token | Family | Use |
|---|---|---|
| `--font-display` | Adrianna Extended | H1, H2, display classes, project title, grid overlay |
| `--font-sans` | Adrianna | H3–H6, body, labels, nav |
| *(no serif)* | — | Serif removed entirely |

### Weight conventions
- **Body / labels:** 300 (Light)
- **H3–H6:** 700 (Bold)
- **H1, H2, project title, grid title:** 700 (Bold) — Adrianna Extended
- **Grid overlay title (homepage):** 300 (Light) — Adrianna Extended

### Font files
Families available: `Adrianna`, `Adrianna Extended`, `Adrianna Condensed`
Weights: Thin (100), Light (300), Regular (400), DemiBold (600), Bold (700), ExtraBold (800)
Each has normal + italic variants.

---

## Colours & design tokens

All tokens live in two places (Layout.astro injects design.json over tokens.css defaults):

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
Edit site-wide in Pages CMS under **Design → Colors → Label colour**.

### Per-project background colour
Each project can override the background via `backgroundColor` in its JSON.
Accepts any CSS value: `#1a1a2e` or `linear-gradient(135deg, #1a1a2e, #16213e)`.
Applied as inline style on `.project-page` and passed as `pageBackground` prop to Layout.

---

## Nav pills

Each nav item renders as a coloured pill box. The colour is computed at **build time** in `Layout.astro`:

1. Extract the first hex from the page's `backgroundColor` (or site default `#000000`)
2. Rotate hue 180° (complementary) + slight per-item offset (0°, +15°, −15°, +30°)
3. Adjust lightness for visibility (dark bg → lighter pill, light bg → darker pill)
4. Auto-select black or white text to meet **WCAG AA 4.5:1** contrast ratio
5. For achromatic backgrounds (black, white, grey) → falls back to `--color-accent`

Pills slide in on page load via CSS keyframe animation with staggered `animation-delay` using `--i` (item index).

---

## Homepage grid

- 12-column CSS grid; items sized via `data-size` (large=8col, medium=6col, small=4col)
- Optional `gridOffset` shifts the card right by N columns for asymmetry
- **Title overlay:** Adrianna Extended Light, font-size fitted to 100% container width via JS probe measurement (`fitOneTitle` in `animations.js`). Recalculates on resize, waits for `document.fonts.ready`.
- **Hover animation (GSAP):**
  1. Dark rectangle wipes up from bottom (`scaleY` 0→1, 0.32s, `power3.out`)
  2. Words clip-reveal staggered (0.38s each, 0.045s stagger), fires 0.18s before rect finishes
  3. Mouse leave: full timeline reverse

---

## Project page

- Hero image morphs from grid thumbnail via Astro `transition:name` (view transition)
- Project info strip: About / Date / Place / Client labels coloured via `--color-label`
- Content blocks rendered by `Block.astro`: `hero`, `gallery`, `video`, `text`
- **Next project** link loops through projects sorted by year desc

### Project title
`font-family: Adrianna Extended; font-weight: 700; letter-spacing: -1px`

---

## Animation system (`animations.js`)

| Attribute | Behaviour |
|---|---|
| `data-animate="fade-up"` | Fade + rise on scroll (skips if already in viewport — avoids conflicting with view transitions) |
| `data-animate="stagger"` | Stagger-fade children on scroll |
| `data-animate="word-reveal"` | Words clip-reveal from bottom (`.word-clip` / `.word-inner` structure) |
| `data-animate="line-reveal"` | Lines fade-up staggered |
| `data-parallax="0.2"` | Parallax scroll on image (0 = none, 0.4 = strong) |
| `.img-reveal` | Scale + fade in on scroll |

`initEntryAnimation()` runs once on initial load (not on navigations) for the nav + hero.

---

## Content management (Pages CMS)

Edit content at the Pages CMS dashboard. Changes commit directly to `main` → Vercel redeploys.

Editable collections:
- **Projects** — full project CRUD including `backgroundColor` and all content blocks
- **About** — bio, portrait, clients, social links
- **How I Work** — steps, CTA
- **Design** — site-wide colours including `labelColor` (supports gradients)

See `CONTENT.md` for the full block/field reference.

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
