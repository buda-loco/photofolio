---
name: buda-new-work
description: Publish a finished job end to end — portfolio page, homepage placement, tags, animated 4:5 and 9:16 social videos, a designed cover image and the post text. Use when Benjamin says he has a new job to put up, hands over images or mockups for a project, or asks to add work to the site, to LinkedIn or to Instagram.
---

# Publishing a new job

One job in, six things out: a Tina-editable project page, a slot on the
homepage, the right tags, a 4:5 video, a 9:16 video, a cover image, and the post
text. Run the steps in order — later steps read what earlier ones wrote.

Two repos are involved and neither imports the other:

| | where | holds |
|---|---|---|
| site | `photofolio/` (this repo, git, deploys to Vercel) | the page, the images the page serves |
| video | `INTERNAL/02 BUDA/B-LINKEDIN/` (Dropbox, not git) | the render engine, the video stills, the outputs |

`$BL` below means `/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/INTERNAL/02 BUDA/B-LINKEDIN`.

---

## 1. Take delivery

Ask for, or confirm you have:

- **The slug.** Lowercase, hyphens, no spaces. It is the URL and the folder name in both repos, forever.
- **The images.** Into `_intake/<slug>/` at the repo root (gitignored, originals live there). If Benjamin pasted them into the chat instead, write them there yourself.
- **Any video clips.** These are *not* copied anywhere — page video blocks stream from Dropbox, so what you need is a share link per clip, not a file.
- **Whatever he already wrote** about the job, plus any reference (the client's site, the live campaign, a brief).

Then run the intake. It resizes once and places into both repos:

```bash
node scripts/new-work/intake.mjs <slug> --dry   # look first
node scripts/new-work/intake.mjs <slug>
```

It prints a JSON manifest — the page image paths, and which image took which
video role. **Read `missingRoles` and `guessedRoles` in the output.** With no
`roles.txt` it just takes the first eight in filename order, which is a starting
point to correct, not an answer. Write `_intake/<slug>/roles.txt` (`brief: DSC_401.jpg`,
one per line, roles `brief mark g1 g2 g3 g4 world extra`) and re-run.

## 2. Settle the colour

The page background comes from the work. Read the images and propose a colour
with a reason ("the red from the lanterns", "the brown of the shopfront awnings"),
then say what it means for the text. Ask only if the images genuinely don't
suggest one, or if a brand colour must be matched exactly.

Every colour decision is checked, never eyeballed — `references/page-layouts.md`
has the rules and the ratios to hit. The cover renderer enforces its own and
refuses to write a failing file; the page does not, so you check it.

## 3. Write the copy

**Interview him before writing a word.** The structure is fixed: problem,
proposal, execution, result — that is what makes it sell rather than describe.

`references/copy.md` holds the questions, the voice rules, the mapping from his
four answers onto the page's About, the video's five slides and the post text,
and the one hard test every reflection has to pass.

Ask the questions in one batch, take the answers, write a draft, show it, revise.
Do not skip to writing because there is enough on the client's website.

## 4. Build the page

Write `src/content/projects/<slug>.json`. Pick a block layout by how much
material there is — five presets in `references/page-layouts.md`, which also
carries the block schemas and the field list.

**Vary it.** Two projects in a row on the same preset read as a template.
Check the last two projects added (`git log --diff-filter=A -- src/content/projects/`)
and pick a different shape.

Set `"featured": true` — every new job goes on the homepage.

**Tag from the existing vocabulary**, in `references/page-layouts.md`. A new
service string that means the same as an existing one splits the `/work` filter
into two pills that should be one. Adding a genuinely new service is fine; say
you are doing it.

Check it renders before moving on:

```bash
npm run dev     # /work/<slug>, /work, and /
```

Never run `npm run build` while `npm run dev` is live — they share `.next` and
every route then 500s. Stop dev, `rm -rf .next`, restart.

## 5. Video, cover, post text

All three come out of `$BL`. `references/pipeline.md` has the commands, the data
model, the timing formula and the gotchas that have cost time before.

Order matters: **audit before you render.** Three minutes of audit against
twenty-five minutes of rendering something broken.

```bash
cd "$BL"
node audit.mjs <slug>                     # must pass
node cover.mjs <slug>                     # covers, contrast-gated
python3 render_all.py                     # or the two render.mjs lines for this slug
```

The cover is a designed still, not a frame grabbed from the video — four
layouts, the project's own colour, contrast enforced. Pick the layout from what
the images can carry, not from what the last project used.

## 6. Ship

Show him: the page in the browser, the two videos, the three covers, the post
text. Then, with his go-ahead:

```bash
git add -A && git commit && git push      # Vercel deploys main automatically
```

The videos and covers stay in `$BL/out/<slug>/`. They are Dropbox files, not
repo files — nothing to commit, they sync on their own.

## Done means

- `/work/<slug>` renders, colours pass contrast, no console errors
- the project shows on `/work` under the right filter pills, and is eligible for `/`
- `$BL/out/<slug>/` holds `-4x5.mp4`, `-9x16.mp4`, three `-cover-*.png` and `<slug>.txt`
- `audit.mjs` and `cover.mjs --check` both exit clean
- pushed to `main`
