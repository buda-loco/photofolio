# TODOS

## Astro `<Image>` component migration

**What:** Replace all raw `<img>` tags in `Block.astro`, `about.astro`, and `index.astro` with Astro's built-in `<Image>` component (`import { Image } from 'astro:assets'`).

**Why:** Astro's `<Image>` auto-generates optimised WebP/AVIF variants, produces correct `width`/`height` attributes to eliminate Cumulative Layout Shift (CLS), and enforces `alt` text at build time.

**Why deferred:** Astro's `<Image>` component requires explicit `width` and `height` props for every image. The current content schema stores images as `{ src, alt, aspectRatio? }` with no pixel dimensions. The migration requires:
1. Adding `width` and `height` fields to all `image` entries in the project JSON files and the Pages CMS config (`.pages.yml`)
2. Updating `Block.astro` to consume those fields and pass them to `<Image>`
3. Deciding how to handle images in `public/` vs `src/assets/` (Astro Image works best with `src/assets/` imports)

**Current state:** All images live in `public/images/`. The `Block.astro` gallery and hero blocks use `<img>` with `object-fit: cover` inside an aspect-ratio container — this prevents CLS via CSS, not intrinsic dimensions. This is acceptable but not ideal for Core Web Vitals.

**How to start:**
- Add `"width": 1920, "height": 1080` (or actual dimensions) to the `images` array schema in `.pages.yml`
- Move images from `public/images/` to `src/assets/images/` and use static imports, OR keep them in `public/` and use string paths with explicit w/h
- Replace `<img>` with `<Image>` in Block.astro hero/gallery and in index.astro grid
