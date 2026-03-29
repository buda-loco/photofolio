# TODOS

## Astro `<Image>` component migration

**What:** Replace all raw `<img>` tags in `Block.astro`, `about.astro`, and `index.astro` with Astro's built-in `<Image>` component (`import { Image } from 'astro:assets'`).

**Why:** Astro's `<Image>` auto-generates optimised WebP/AVIF variants, produces correct `width`/`height` attributes to eliminate Cumulative Layout Shift (CLS), and enforces `alt` text at build time.

**Why deferred:** Astro's `<Image>` component requires explicit `width` and `height` props for every image. The current content schema stores images as `{ src, alt, aspectRatio? }` with no pixel dimensions. The migration requires:
1. Adding `width` and `height` fields to all `image` entries in the project JSON files and `tina/config.ts`
2. Updating `Block.astro` to consume those fields and pass them to `<Image>`
3. Deciding how to handle images in `public/` vs `src/assets/` (Astro Image works best with `src/assets/` imports)

**Current state:** All images live in `public/images/`. The `Block.astro` gallery and hero blocks use `<img>` with `object-fit: cover` inside an aspect-ratio container — this prevents CLS via CSS, not intrinsic dimensions. This is acceptable but not ideal for Core Web Vitals.

**How to start:**
- Add `"width": 1920, "height": 1080` (or actual dimensions) to the `images` array schema in `tina/config.ts`
- Move images from `public/images/` to `src/assets/images/` and use static imports, OR keep them in `public/` and use string paths with explicit w/h
- Replace `<img>` with `<Image>` in Block.astro hero/gallery and in index.astro grid

---

## Tina Cloud branch connection (post-deploy setup)

**What:** After pushing to GitHub, connect the repo to Tina Cloud so that `tinacms build` can succeed both locally and on Vercel.

**Why:** `tinacms build` currently fails with "Branch 'main' is not on TinaCloud" because the GitHub repo hasn't been connected in the Tina Cloud dashboard. Once connected, Tina indexes the content and enables the visual editor at `/admin`.

**Steps:**
1. Go to https://app.tina.io/projects/8941095a-bd26-4e92-bf7a-621e1545d94b/configuration
2. Connect your GitHub repository under the "GitHub" section
3. Set the branch to `main`
4. Add `TINA_PUBLIC_CLIENT_ID` and `TINA_TOKEN` to Vercel's environment variables (Settings → Environment Variables)
5. Trigger a new Vercel deploy — `tinacms build && astro build` will now run successfully
6. The Tina visual editor will be available at `https://benjaminarnedo.com/admin`

**Note:** The `tinacms build` step generates the admin SPA at `public/admin/` (gitignored). This only needs Tina Cloud connected — the Astro build works independently and all static pages render correctly without it.

---

## Remove `.pages.yml` once Tina is confirmed in production

**What:** Delete `.pages.yml` from the repo once Tina CMS is the confirmed content editing workflow.

**Why:** `.pages.yml` is the config for Pages CMS (the previous CMS). Keeping both is confusing. Once Tina is working in production, `.pages.yml` should be removed to avoid editors accidentally using the old CMS.

**When to do it:** After the first successful production deploy with Tina connected, and after confirming all content collections are editable via the Tina admin.
