# Content Reference

All site content lives in `src/content/`. Edit these JSON files, commit, and Vercel redeploys automatically.

---

## Projects — `src/content/projects.json`

The file is an array of projects. Order in the array = order on the home grid.

### Project fields

```json
{
  "slug": "project-name",        // URL: /work/project-name — use hyphens, no spaces
  "title": "Project Title",
  "category": "Photography",     // Shown next to title on grid and project page
  "year": 2026,
  "cover": "/images/projects/project-name/cover.jpg",   // Grid thumbnail + hero transition image
  "coverAspect": "3/4",          // Aspect ratio of the thumbnail on the home grid
  "gridSize": "large",           // "large" (wide), "medium", or "small" — see Grid Sizes below
  "gridOffset": 2,               // Optional: nudge item right by 2, 4, or 6 columns
  "hidden": false,               // true = hidden from grid but still accessible by URL
  "blocks": [ ... ]             // Page content — see Block Types below
}
```

### Grid sizes

| `gridSize`  | Width on desktop | Use for                          |
|-------------|-----------------|----------------------------------|
| `"large"`   | 8 of 12 columns | Hero projects, lead image        |
| `"medium"`  | 6 of 12 columns | Standard projects                |
| `"small"`   | 4 of 12 columns | Supporting work, film stills     |

**Tips for asymmetry:**
```json
{ "gridSize": "large" }                        // fills left side
{ "gridSize": "small" }                        // sits right of it
{ "gridSize": "medium", "gridOffset": 2 }      // indented, creates whitespace
{ "gridSize": "small",  "gridOffset": 6 }      // pushed to right half
```

### Cover aspect ratios

```
"coverAspect": "3/4"    portrait   — great for people, fashion
"coverAspect": "4/3"    landscape  — standard editorial
"coverAspect": "16/9"   widescreen — film, landscapes
"coverAspect": "1/1"    square     — product, detail
```

---

## Block types

Blocks are the content sections inside a project page. Mix and match in any order.

---

### Hero — full-width image

```json
{
  "type": "hero",
  "src": "/images/projects/project-name/01.jpg",
  "alt": "Brief description for accessibility",
  "aspectRatio": "16/9",   // optional — defaults to 16/9
  "parallax": 0.2,         // optional — subtle scroll parallax (0 = off, 0.4 = strong)
  "caption": "Optional caption text"
}
```

---

### Gallery — grid of images

```json
{
  "type": "gallery",
  "columns": 2,            // 1, 2, or 3
  "images": [
    { "src": "/images/projects/project-name/02.jpg", "alt": "" },
    { "src": "/images/projects/project-name/03.jpg", "alt": "" },
    { "src": "/images/projects/project-name/04.jpg", "alt": "" }
  ]
}
```

You can add `"aspectRatio"` per image to control individual crops:
```json
{ "src": "/images/projects/project-name/05.jpg", "alt": "", "aspectRatio": "3/4" }
```

---

### Video — Dropbox or YouTube

**Dropbox** — paste your share link exactly as Dropbox gives it:
```json
{
  "type": "video",
  "src": "https://www.dropbox.com/s/abc123/my-film.mp4?dl=0",
  "poster": "/images/projects/project-name/poster.jpg",
  "caption": "Film title — 2026"
}
```
The `?dl=0` is converted to `?raw=1` automatically so the browser can stream it.

**YouTube**:
```json
{
  "type": "video",
  "provider": "youtube",
  "id": "dQw4w9WgXcQ",
  "caption": "Optional caption"
}
```

---

### Text — quote or description block

```json
{
  "type": "text",
  "heading": "Optional heading",
  "body": "A paragraph of text that appears centred on the page."
}
```

---

### Full project example

```json
{
  "slug": "my-project",
  "title": "My Project",
  "category": "Photography",
  "year": 2026,
  "cover": "/images/projects/my-project/cover.jpg",
  "coverAspect": "3/4",
  "gridSize": "large",
  "hidden": false,
  "blocks": [
    {
      "type": "hero",
      "src": "/images/projects/my-project/cover.jpg",
      "alt": "Opening image",
      "aspectRatio": "16/9",
      "parallax": 0.2
    },
    {
      "type": "gallery",
      "columns": 2,
      "images": [
        { "src": "/images/projects/my-project/02.jpg", "alt": "" },
        { "src": "/images/projects/my-project/03.jpg", "alt": "" }
      ]
    },
    {
      "type": "text",
      "heading": "A heading",
      "body": "Some context about the project."
    },
    {
      "type": "hero",
      "src": "/images/projects/my-project/04.jpg",
      "alt": "",
      "aspectRatio": "3/2"
    },
    {
      "type": "gallery",
      "columns": 3,
      "images": [
        { "src": "/images/projects/my-project/05.jpg", "alt": "" },
        { "src": "/images/projects/my-project/06.jpg", "alt": "" },
        { "src": "/images/projects/my-project/07.jpg", "alt": "" }
      ]
    },
    {
      "type": "video",
      "src": "https://www.dropbox.com/s/abc123/film.mp4?dl=0",
      "poster": "/images/projects/my-project/poster.jpg"
    }
  ]
}
```

---

## Images

Drop images into `public/images/projects/[slug]/`. They're served at `/images/projects/[slug]/filename.jpg`.

```
public/
└── images/
    ├── projects/
    │   └── my-project/
    │       ├── cover.jpg     ← grid thumbnail + hero transition
    │       ├── 01.jpg
    │       ├── 02.jpg
    │       └── poster.jpg    ← video poster frame
    └── about/
        └── portrait.jpg
```

**Recommended formats:** JPEG for photos, WebP if you want smaller files.
**Recommended sizes:** Cover images at 1600px wide. Hero/gallery images at 2400px wide.

---

## About page — `src/content/about.json`

```json
{
  "name": "Benjamin Arnedo",
  "title": "Photographer & Cinematographer",
  "bio": [
    "First paragraph.",
    "Second paragraph — each string becomes its own paragraph."
  ],
  "portrait": "/images/about/portrait.jpg",
  "clients": [
    "Client One",
    "Client Two"
  ],
  "email": "hello@benjaminarnedo.com",
  "instagram": "https://instagram.com/yourhandle",
  "vimeo": "https://vimeo.com/yourhandle"
}
```

---

## How I Work — `src/content/how-i-work.json`

```json
{
  "title": "How I Work",
  "intro": "One-line intro shown below the title.",
  "steps": [
    {
      "number": "01",
      "title": "Step title",
      "body": "Description of this step."
    }
  ],
  "cta": {
    "text": "Ready to work together?",
    "link": "/contact",
    "label": "Get in touch"
  }
}
```

---

## Adding a new project — checklist

1. Add images to `public/images/projects/[slug]/`
2. Add a new entry to `src/content/projects.json`
3. Set `"cover"` to the same file you use as your first hero block — this is the image that morphs from the grid thumbnail into the project page
4. Set `"hidden": false` to make it visible
5. Commit and push — Vercel rebuilds in ~30 seconds

## Hiding a project without deleting it

```json
{ "hidden": true }
```

The project page still exists at `/work/slug` but won't appear in the grid.

## Reordering projects

Drag the objects in the `projects.json` array into the order you want. Top of array = top-left of grid.
