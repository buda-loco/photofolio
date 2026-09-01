# Benjamin Arnedo — Brand System

The brand system lives next door, in this folder:

```
Working Files/Design specs/
  DESIGN.md   web + the shared tokens — always read this first
  DECK.md     presentations: 1920×1080, the five masters, type at slide scale
```

`~/.claude/design-systems/benjaminarnedo` is a **symlink** to that folder, so the same
files load from any project as a brand spec. One file, two paths — edit either, there are
no copies to drift. Same wiring as `boldandgroovy`.

**Read `DESIGN.md` before designing anything for this brand** — a page, a deck, a
document, a social carousel, an illustration, a chart, or the copy that goes in any of
them. Read `DECK.md` alongside it when the output is slides.

---

## What else is in this folder

| | |
|---|---|
| `Design-system.pen` | The Pencil file — the visual instance of the system |
| `carousel-images/` | The Sept 2026 LinkedIn carousel: `*.svg` masters, `*-v2.png` finals, and `LinkedIn Carousel Final/` |
| `*.woff2` | Adrianna, all 32 cuts |

## What is and is not in git

The repo is **public**, and `.gitignore` keeps `Working Files/` out of it except for two
things:

| | |
|---|---|
| ✅ `Design specs/` and this file | Tracked. Versioned, diffable, recoverable. |
| ❌ `Design-system.pen` | 680K binary, rewritten on every save |
| ❌ `carousel-images/` | 4.8MB of artwork |
| ❌ `*.woff2` | A second copy of the licensed Adrianna cuts |

⚠️ The negations in `.gitignore` are deliberately narrow. **Do not widen them** — a
`git add -A` must not be able to sweep the fonts or the artwork into a public repo. And
everything in the ❌ rows is still unrecoverable if deleted; treat those as permanent.
