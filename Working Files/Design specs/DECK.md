# Benjamin Arnedo — presentation spec

Companion to `DESIGN.md`. That file is the **web** spec and the token source; this one
covers **decks** — 1920×1080 slides. Read both: colour, the type families, the logo rules
and the contrast matrix all live in `DESIGN.md` and are not repeated here.

Measured out of the five masters `07a`–`07e` in `Design-system.pen`, not invented. Every
number below is what those boards actually contain.

---

## 1. Frame and margin

| | |
|---|---|
| Frame | 1920 × 1080, `clip: true` |
| Padding | `[72, 88]` — 72 top and bottom, 88 left and right |
| Content width | **1744** (1920 − 88 × 2) |
| Footer baseline | y = 1000 |
| Column gap | 64 (two columns) |

88 is the deck's page margin. Nothing crosses it except a **full-bleed image**, which runs
the entire 1920 × 1080 with the chrome sitting on top of it.

Two masters (`07b` Section, `07d` Full Bleed) use `layout: "none"` and place children by
coordinate, because both are composition-led. The other three are vertical flex frames.

---

## 2. Type at slide scale

The web ladder in `DESIGN.md` is set for a 1440 frame and read at arm's length. A deck is
1920 and read across a room, so display steps land far higher and body copy never goes
below 17.

| Role | Family | Size | Weight | LH | Tracking | Colour |
|---|---|---|---|---|---|---|
| Title (`07a`) | Extended | **176** | 700 | 0.92 | −5.3 | line 1 text, line 2 **accent** |
| Closing (`07e`) | Extended | **160** | 700 | 0.92 | — | text |
| Section numeral (`07b`) | Extended | **420** | 700 | 0.75 | −16.8 | accent |
| Section watermark (`07b`) | Extended | **200** | **100** | 0.75 | −8 | `#FFFFFF0F` |
| Section heading (`07b`) | Extended | 96 | 300 | 1.0 | −1.9 | text |
| Slide heading (`07c`) | Extended | 72 | 300 | 1.0 | −1.4 | text |
| Full-bleed title (`07d`) | Extended | 64 | 700 | 0.95 | −1.6 | `#FFFFFF` |
| Email (`07e`) | Adrianna | 32 | 300 | — | 0.64 | text |
| Lead column | Adrianna | 24 | 300 | 1.6 | — | text |
| Subtitle | Adrianna | 22 | 300 | 1.6 | — | muted |
| Body column | Adrianna | 17 | 300 | 1.8 | — | `text-soft` (65%) |
| Eyebrow / label | Adrianna | 14 | 400 | — | **2.1** | accent or muted |
| Logo label | Adrianna | 13 | 700 | — | 1.56 | text |
| Image caption chip | Adrianna | 12 | 400 | — | — | `#FFFFFF` |

**The pattern to notice:** headings above 96 are Extended **Bold**; headings at 72–96 are
Extended **Light**. The weight drops as the size drops, which is why a 72px Bold heading
looks wrong on these slides.

Measures are capped — the `07c` heading is 1300 wide, the `07a` subtitle 760. Do not let a
heading run the full 1744.

---

## 3. Slide chrome

Every slide carries the same three marks. They are what makes a deck read as one deck.

| Position | Content | Spec |
|---|---|---|
| Top left | Running label | 14px, tracking 2.1, uppercase, **accent** on content slides, muted on the title slide |
| Top right | Date or context | 14px, tracking 2.1, uppercase, muted |
| Bottom left | Logo lockup | `Logo / Mini` at **15 × 20** + gap 12 + "BENJAMIN ARNEDO" at 13px/700/ls 1.56 |
| Bottom right | Page number | 14px, 700, tracking 1.4, **accent** |

The footer row is 1744 wide at y = 1000, `justifyContent: space-between`.

> **Never put the wordmark on a slide footer.** At that size its lettering renders under
> 2px — see the logo geometry warning in `DESIGN.md`. The mini plus a text label is the
> lockup, and it is the only sanctioned small-size logo.

---

## 4. The five masters

Copy the master, swap the copy, keep the chrome. Do not rebuild a slide from scratch.

| Master | Use it for | Composition |
|---|---|---|
| **07a · Title** | Deck opener, once | Two-line 176px title, second line accent; 760-wide subtitle under it |
| **07b · Section** | Chapter break | 420px accent numeral bottom-left at (88, 330); 200px `#FFFFFF0F` watermark of the section word bleeding off the top-right at (1878, 48); heading block at (820, 430) |
| **07c · Content** | The workhorse | Eyebrow + 72px heading, then two columns gap 64 — lead at 24px carries the argument, body at 17px supports it |
| **07d · Full Bleed** | Let an image talk | Image, scrim, then a caption chip and a 64px title in the bottom band |
| **07e · Closing** | Contact, once | 160px "Let's talk." over a 420 × 6 accent underline, email at 32px, then contact pills |

**One idea per content slide.** The `07c` heading is written as one thought, and the two
columns are an argument and its support — not two unrelated points.

---

## 5. Images and the scrim

The scrim, not the image, guarantees legibility. Photography is unpredictable; a fixed
gradient is not.

```
linear-gradient · rotation 0
  #000000CC (80%)  @ 0
  #00000059 (35%)  @ 0.5
  #00000000 ( 0%)  @ 0.8
```

The dark end sits at the text. Text lives in the **bottom band** — the `07d` title block
starts at y = 870, inside the bottom 25% — because a gradient gives less cover higher up,
and that is the trap: a two-line title creeping upward loses its scrim.

**The floor is 55% black at the top edge of the text**, measured against a bright sky
(`#C8CDD2`) at 6.69:1. Anything less fails. Full working in `DESIGN.md`.

Image captions sit in a chip: `#000000CC` ground, padding `[5, 11]`, 12px white.

---

## 6. Building a new deck

1. Copy `07a`–`07e` as a block. Keep the frames 1920 × 1080 and `clip: true`.
2. Swap the running label, the date, and the page numbers.
3. Keep the chrome exactly. It is the only thing holding 20 slides together.
4. Recolour only through the derived-colour engine in `DESIGN.md` — never hand-pick a
   pill or accent hex for a client deck.
5. Slides are built in Pencil; the `execute` API and its traps are documented in
   `DESIGN.md` under "The file".

---

## 7. Checks before sending

- [ ] Every slide carries the label, the lockup and the page number
- [ ] The wordmark appears nowhere at small size — mini + label only
- [ ] No heading above 96 is Light; none at 72–96 is Bold
- [ ] No body copy under 17px
- [ ] Text over any image sits in the bottom band with the full scrim behind it
- [ ] Headings are measure-capped, not running the full 1744
- [ ] Accent is a background or black-canvas text — never accent type on white
- [ ] **No italics.** Not for emphasis, not for captions, not anywhere
- [ ] One idea per content slide
