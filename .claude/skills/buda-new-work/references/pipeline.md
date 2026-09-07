# The video and cover pipeline

Everything here runs from `$BL` =
`/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/INTERNAL/02 BUDA/B-LINKEDIN`.
Not a git repo — it is Dropbox, and it syncs on its own.

`$BL/README.md` is the authority on the engine. This file covers what the
publishing flow needs; read the README before changing how anything renders.

One HTML file draws every slide, one JS file holds the words, headless Chrome
steps a deterministic `__seek__(t)` into ffmpeg. Adding a project is one object
plus eight images.

```
scenes/style.css     type, colour and logo geometry, shared by video and cover
scenes/logo.js       the BA wordmark, inlined
scenes/scene.html    the video engine. Never per-project — editing it moves all of them
scenes/cover.html    the cover engine, four layouts
scenes/projects.js   the words. THIS is what you edit
render.mjs           one scene → one mp4
render_all.py        every project × both formats
cover.mjs            covers → png, contrast-gated
audit.mjs            checks every slide before you spend render time
probe.mjs            stills at chosen timestamps
```

## Adding a project

Images are already in `assets/<slug>/` if `intake.mjs` ran. Then one object in
`projects.js`, keyed by slug:

```js
"my-project": {
  slug:"my-project",                          // must match the assets/ folder
  label:"Photography · Canberra",             // top-left of every slide
  year:"2026",
  kicker:"A portrait series for a shopping precinct",
  title:"Dickson<br>Shop Photos",             // <br> stacks it, deliberately
  lead:"City Renewal Canberra, February 2026.",
  durs:[3750,9200,9200,9200,9400,8800,6000],  // slides.length + 2 entries
  cover:{ variant:"grid", bg:"#6C5A44",
          imgs:["g1","g2","g3","g4"],
          hook:"Nineteen shopfronts, and the people who run them." },
  slides:[
    {k:"hero",       lbl:"The brief",  img:"brief", frac:0.459, h2:"…", body:"…"},
    {k:"heroBelow",  lbl:"The idea",   img:"mark",  frac:0.415, h2:"…", body:"…"},
    {k:"grid4",      lbl:"The system", imgs:["g1","g2","g3","g4"], frac:0.290, h2:"…"},
    {k:"hero",       lbl:"In the world", img:"world", frac:0.459, h2:"…", body:"…"},
    {k:"reflection", h2:"…", body:"…"},
  ]
}
```

⚠️ **`durs` must hold `slides.length + 2` numbers** — the title card, each
content slide, then the logo card. One short and the last slides get `undefined`
and the video ends early.

Five content slides is the convention: the brief, the idea, the system, the work
in the world, a reflection. `hero` puts the image above the heading, `heroBelow`
below it — alternating them is what stops five slides reading as one template.

It is HTML in there: `&rsquo;` for apostrophes, `&nbsp;` to hold two words
together, `<br>` to force a break.

## Timing

```
total = sum(durs) + 1320 + 620 × (len(durs) − 2)
```

The 1320ms is the logo-mask transition, which runs **only** after the title card.
The standard seven durations give 59,970ms, which is the 60.0s the audit reports.

## Assets

Eight JPEGs, ~1400px long edge, role-named. `intake.mjs` places and renames
them; `roles.txt` in the intake folder decides which image takes which role.

| Name | Used by |
|---|---|
| `brief.jpg` | slide 2 |
| `mark.jpg` | slide 3 |
| `g1`–`g4.jpg` | the 2×2 grid on slide 4 |
| `world.jpg` | slide 5 |
| `extra.jpg` | spare — swap it in when one of the others does not hold up |

Images are `object-fit: cover`. Anything important near an edge gets cropped at
9:16, which is why the audit checks both formats.

## Audit, then render

```bash
node audit.mjs <slug>            # both formats
node audit.mjs <slug> 9x16       # one
```

It loads every slide at 70% through its own duration — text at rest, wipes
finished — and fails on content overflowing the safe area, content taller than
its box, images that did not load, and JavaScript that threw. Headings over two
lines are a warning, not a failure.

**Run it before every render.** Three minutes here against twenty-five minutes
of rendering something broken.

```bash
node render.mjs scenes/scene.html out/<slug>/<slug>-4x5.mp4  60 1080x1350 <slug>
node render.mjs scenes/scene.html out/<slug>/<slug>-9x16.mp4 60 1080x1920 <slug>
```

`python3 render_all.py` does every project in both formats — it reads the slug
list out of `projects.js`, so a new project is picked up automatically. About
three minutes per project, 8–20 MB per video at CRF 18.

To eyeball without rendering, open
`scenes/scene.html?p=<slug>&w=1080&h=1350` in Chrome and drive it with
`__seek__(12000)` from the console.

## The cover

A designed still, not a frame grabbed out of the video.

```bash
node cover.mjs <slug>                    # 4:5, 1:1 and 16:9
node cover.mjs <slug> --check            # measure, write nothing
node cover.mjs <slug> --v split          # try another layout
node cover.mjs <slug> --bg FACC40        # preview another colour
node cover.mjs <slug> --only 4x5
```

Writes `out/<slug>/<slug>-cover-{4x5,1x1,16x9}.png`. 4:5 is the post cover, 1:1
the grid thumbnail, 16:9 the website or OG card.

**Four layouts. Pick by what the images can carry, and do not use the same one
twice in a row:**

- `stack` — one image full-bleed, title over a scrim at the bottom. A poster.
  Needs a photograph with empty space in it.
- `split` — image on top, words on a clean colour field. The safe one. Use it
  when the photograph is busy and type over it would lose.
- `frame` — the image hung with a margin, like a print. Quiet. For identity and
  design work where the artefact, not the moment, is the subject.
- `grid` — four images and a title band. For a body of work, where the answer to
  "what did you make" is a list.

**Contrast is enforced, not advised.** `cover.mjs` fails and writes nothing if
the title, hook or kicker falls under 4.5:1, or if the words run outside the safe
area. Text colour is derived from `cover.bg`, never authored. The site's yellow
accent fails on any light background, so it falls back to the foreground colour
and the run says `[accent fell back to fg]` — that is working as intended, not a
warning to fix.

Set `cover.bg` to the same colour as the page's `backgroundColor`. Post and page
being the same colour is the point.

## Mockups with FAL — never let the model draw text

**HARD RULE.** A generative image model must never render words, numbers, logos
or QR codes. Two things follow from that, and you need both.

**In the prompt**, say it explicitly every time: all text comes from the
reference image and is reproduced verbatim, no redrawing, restyling, translating
or inventing. Describe the material, the light, the surface and the camera; never
retype the copy.

**In the pipeline**, composite the artwork in anyway, because the instruction is
not enough. Generate the scene, then perspective-warp the real artwork file onto
the flat surface with `scripts/new-work/warp.py` (`cv2.getPerspectiveTransform`
+ `warpPerspective`, feathered mask, luminance matched to the render). The model
supplies paper texture, shadow and reflection; the file supplies every pixel of
type.

**Then read it.** Crop every text area at full resolution and check it against
the source before showing anyone. Any render carrying a phone number, email, URL
or price is wrong until proven right.

Nano Banana Pro on the Shoreline Estate signs changed the client's phone number
from 0419487803 to 0419487093, rewrote "Beechford, Tasmania" as "Bexshlnck
Torawans", turned "Sea your future" into "See your future" and invented an email
address. At thumbnail size all of it looked fine.

Model: `fal-ai/nano-banana-pro/edit`, `resolution: "2K"`. Upload sources to the
fal CDN first — the MCP server cannot read local files, and the base64 fallback
caps at 1MB:

```bash
K=$(cat ~/.config/fal/key)
init=$(curl -s -X POST https://rest.alpha.fal.ai/storage/upload/initiate \
  -H "Authorization: Key $K" -H "Content-Type: application/json" \
  -d '{"file_name":"x.jpg","content_type":"image/jpeg"}')
# PUT the bytes to .upload_url, then use .file_url in image_urls
```

## When the type has to be exact: Blender, not FAL

For a brand manual, a sign with a phone number, anything with hex codes —
build the mockup in Blender through `mcp__blender__blender_execute`. The pages
are image textures, so nothing can rewrite them; a foliage-alpha plane between
a Sun lamp and the set gives real dapple; Cycles gives real depth of field. The
Shoreline brand manual scene is the template:
`W-CLIENTS/01 ACTIVE/Mbbo/04 Delivery/Mockups/shoreline-brand-manual.blend`.
Swap the two page textures and re-render `CamTop` / `CamClose`.

Gotchas are in memory (`project_blender_mockups`): `transform_apply` bakes
location in 5.1, the page block must sit under the gutter, gobo masks need fine
octaves only, and crop timber from bare surface.

## Things that have cost time

**A `const` that collides with a `window` global throws the whole scene, silently.**
`const chrome` did it once; `const top` did it again in cover.html. Symptom is a
blank frame or a layout number coming back `NaN`, never an error you notice.
`audit.mjs` and `cover.mjs` both listen for `pageerror` because of this.

**`alignItems: "center"` on a vertical flex frame** put a same-width child at half
the parent width and rendered the frame black. Use `start` and size children.

**`playwright-core` is CommonJS.** `await import()` gives no named export, which
is why `createRequire(import.meta.url)(PW)` looks the way it does.

**`| head -N` kills a long render** with SIGPIPE, mid-write. Never pipe a render
or a probe through `head`.

**zsh does not word-split unquoted expansions.** `for f in $FILES` iterates once
with the whole string. `render_all.py` is Python for exactly this reason.

**`ls -la <dir>` comes back empty through RTK.** Use `find`, or `rtk proxy`,
whenever you need an exact count or an error location.

**A very wide image loses its middle in the `grid4` cells.** Each cell is about
4:3 and images are `object-fit: cover`, so a 2.75:1 website screenshot gets its
left and right thirds cut and the headline goes with them. Crop web captures to
roughly 1.4:1 or squarer before they become `g1`-`g4`. Full-page screenshots are
the usual offender.

**Fixed percentage heights break at other aspect ratios.** The cover layouts are
flex columns with the media on `flex:1` so the image gives up room instead of the
paragraph running off the frame. Keep them that way if you add a fifth.
