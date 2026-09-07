# The page: layouts, blocks, colour, tags

## Layout presets

Pick by how much material there is. The rule that holds across every project
that works: **alternate full-bleed `hero` with multi-up `gallery`, never two of
the same kind in a row.** National Triangle and Lunar New Year are eleven and
twelve blocks of strict alternation, which is why neither reads as a template.

### 1 · Single sheet — 3 to 6 images, no video
```
gallery(3)
```
Coaster Blitz. Honest when the job was small. Do not pad it out.

### 2 · Short form — 6 to 10 images, one video
```
gallery(3) → video → gallery(2)
```
Queensland Neuro Stimulation, Winter in the City.

### 3 · Standard — 10 to 16 images
```
hero → gallery(3) → hero → gallery(2) → text → hero → gallery(3) → hero
```
Dickson Shop Photos. The `text` block mid-page is where the problem/proposal
beat lands — it is the only preset with room for it.

### 4 · Video-led — a hero film, stills, verticals
```
widescreen_video → gallery(3) → vertical_reel → hero → gallery(2) → vertical_reel
```
Wonderful World. Use when the deliverable *was* the film.

### 5 · Long form — 18+ images, identity or campaign work
```
hero → gallery(3) → hero → gallery(2) → hero → hero → gallery(3)
     → hero → hero → hero → gallery(2)
```
National Triangle, Lunar New Year. One `vertical_grid` or `video` as a break in
the middle if there is 9:16 material.

## Blocks

Seven templates. `_template` is the discriminator Tina writes; use underscores,
never hyphens.

```jsonc
{ "_template": "hero", "src": "/images/projects/<slug>/x.jpg", "alt": "…",
  "aspectRatio": "16/9", "parallax": 0.2, "caption": "" }

{ "_template": "gallery", "columns": "3",
  "images": [ { "src": "…", "alt": "…", "aspectRatio": "" } ] }

{ "_template": "video", "provider": "dropbox", "src": "https://www.dropbox.com/…",
  "id": "", "poster": "…", "autoplay": true, "muted": true, "loop": true, "caption": "" }

{ "_template": "widescreen_video", "url": "https://www.dropbox.com/…",
  "poster": "…", "autoplay": true, "muted": true, "loop": true,
  "aspectRatio": "16/9", "caption": "" }

{ "_template": "vertical_reel",
  "video": { "url": "…", "poster": "…", "autoplay": true, "muted": true, "loop": true },
  "images": [ { "src": "…" }, { "src": "…" } ],   // exactly 2
  "caption": "" }

{ "_template": "vertical_grid",
  "items": [ { "type": "image", "src": "…" },
             { "type": "video", "videoUrl": "…", "poster": "…", "autoplay": true } ],  // up to 4
  "caption": "" }

{ "_template": "text", "heading": "…", "body": <rich-text AST> }
```

Booleans must be real booleans. `Block.tsx` uses `!!`, but a `"true"` string in
the JSON is a bug waiting for the next editor.

Video blocks take a Dropbox **share link**, not a file path. Nothing streams out
of the repo.

## Top-level fields

```jsonc
{
  "slug": "…",            // matches the filename, hyphens only
  "title": "…",
  "category": "…",        // one of the seven below
  "year": 2026,           // number, not string
  "cover": "/images/projects/<slug>/…jpg",
  "coverAspect": "3/2",
  "gridSize": "large",    // grid card size on /work
  "gridOffset": 0,        // optional column offset
  "featured": true,       // always true for a new job
  "backgroundColor": "#…",
  "backgroundColorSecondary": "",   // set for a gradient
  "textColor": "#…",
  "primaryColor": "#…",   // button/link text
  "secondaryColor": "#…", // button/link background, video bg, logo tint
  "invertColors": false,
  "services": [ … ],
  "ctaLabel": "Visit website", "ctaUrl": "https://…",   // both, or neither
  "info": { "about": <rich-text AST>, "date": "2026", "place": "…", "client": "…" },
  "blocks": [ … ]
}
```

`info.about` is a Tina rich-text AST, not a string — `{"type":"root","children":[
{"type":"p","children":[{"type":"text","text":"…"}]}]}`. Links are
`{"type":"a","url":"…","children":[{"type":"text","text":"…"}]}` nested inside a
paragraph. Copy the shape from `src/content/projects/wonderful-world.json`; a
plain string renders as nothing.

The **first paragraph is the lead** (1.2rem), the rest drop to `--text-sm`. Write
the first one to carry the job on its own.

## Colour and contrast

`backgroundColor` comes from the work — a colour actually in the images, or the
client's brand colour. Then:

- **`textColor` against `backgroundColor` must clear 4.5:1.** Compute it, do not
  judge it. White on `#FACC40` is 1.9:1 and looks fine on a bright laptop.
- `secondaryColor` is the button and video background; `primaryColor` is the text
  on it. That pair needs 4.5:1 too, in that direction.
- `primaryColor` also tints the nav logo via a CSS mask on project pages, so it
  has to hold against the background as well.
- Nav pills are computed at build time in `lib/colors.ts` (hue-rotate 180°, then
  auto black-or-white text for AA). An achromatic background falls back to the
  site accent. You get this for free; do not hand-set pill colours.
- A gradient goes in `backgroundColorSecondary`. Check contrast at **both** ends
  — the text colour is one value and the background is two.

## Tags

`category` — exactly one, from what already exists:

> Branding · Campaigns · Commercial · Digital Design · Events ·
> Personal Branding · Website

`services` — free text, but reuse these or the `/work` filter fragments into two
pills that mean the same thing:

> Animation · Art Direction · Brand Guidelines · Brand Identity ·
> Creative Direction · Digital Marketing · Direction · Editing ·
> Editorial Design · Event Visuals · Logo Design · Merchandise ·
> Motion Graphics · Photography · Post-production · Signage & Environmental ·
> Social Media Ads · UX/UI · Videography · Web Design · Web Development

Adding a genuinely new one is allowed. Say so, out loud, when you do.

## Homepage

`featured: true` puts the project in the pool. `HomeProjects.tsx` draws
`SLOTS` (2) at random from it on every visit, after mount.

⚠️ `SLOTS` must stay below the pool size or nothing varies. Five projects are
flagged today, so adding another only helps.

## The cover image is not a block

`cover` is the card image on `/work` and the full-bleed image at the top of the
project page. If it also appears as block 1, the same photograph fills the first
two screens and the page opens looking like a mistake. Caught on Shoreline
Estate; check it every time:

```bash
python3 -c "
import json,sys; d=json.load(open(sys.argv[1]))
u=[i['src'] for b in d['blocks'] for i in (b.get('images') or [{'src':b.get('src')}]) if i.get('src')]
print('dupes:', [x for x in set(u) if u.count(x)>1] or 'none')
print('cover repeated in blocks:', d['cover'] in u)
" src/content/projects/<slug>.json
```

Both lines must come back clean.

## Never do

- `data-animate` on anything inside `WorkGrid` — the bento grid runs its own
  GSAP and ScrollTrigger fights it.
- Spaces in the filename. `angus-comyns.json`, never `angus comyns.json`.
- `npm run build` while `npm run dev` is live. They share `.next`; every route
  then 500s with a missing manifest and it looks like the code broke.
