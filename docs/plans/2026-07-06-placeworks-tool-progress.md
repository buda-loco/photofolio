# PlaceWorks Brand Asset Tool — progress log (as of 2026-07-06)

Status snapshot of the tool at `/presentations/placeworks/tool` and its
Electron port, written to pick work back up later. The original build plan is
`2026-07-03-placeworks-brand-tool.md`; this documents everything added since.

---

## Where things stand

- **Web tool:** live at benjaminarnedo.com/presentations/placeworks/tool
  (deployed from `main`, latest commit `42affc4`).
- **Desktop app:** GitHub release
  [`placeworks-tool-v0.1.0`](https://github.com/buda-loco/photofolio/releases/tag/placeworks-tool-v0.1.0)
  (.dmg + .zip, macOS arm64, unsigned). Download link in the tool page header.
  The app source is NOT a copy — `placeworks-tool-electron/` imports the tool
  components from the site tree via Vite aliases, so web improvements ship in
  the app on its next `npm run dist`.
- **Tests:** 82 passing (`npx vitest run src/app/presentations/placeworks/_components/tool`).
  Pure logic modules (`yarnMath`, `palette`, `presets`, `useToolPersistence`)
  are unit-tested; UI is verified manually.
- **Code review:** full multi-agent review run; all 10 verified findings
  (4 correctness bugs, 6 cleanups) fixed in `8e0a7bf`.

## Feature inventory (built this session)

### Workspace
- Design-app layout: fixed toolbar (Export SVG/PNG, Reset, Preview, Draw
  path, Zoom 100–300%), canvas stage centered and always fully visible
  (viewport-fit via `--pw-workspace-chrome` / `--pw-stage-gutter` tokens),
  two dock columns of draggable/rearrangeable panel tabs (Randomiser,
  Colours, Line shape, Canvas, Container, Presets). Layout persists to its
  own localStorage key; panels added later are auto-appended by `sanitize()`.
- Gizmos render and stay grabbable OUTSIDE the canvas (svg overflow visible
  into the stage gutter). Preview mode clips back to the exact export frame
  and suspends zoom.

### Canvas editing
- Visible dashed spine guide for the bezier.
- Blender-style combined transform gizmo at curve midpoint: ring = rotate,
  centre = move, outboard square = uniform scale (drag math computed from a
  frozen drag-start snapshot — no drift).
- End circle gizmos (fat hit targets) move each end anchor + its control
  handle together; handle dots reshape tangents; per-end amplitude rings
  (startScale/endScale); resolve stick slides along the spine (renders under
  the gizmo so the gizmo wins overlapping hits).
- Container: drag-to-move, corner resize, avoidance field toggle+strength
  (lines bend around it, guaranteed no interior points, clip disabled while
  avoiding), logo on/off, logo scales down to fit the container
  (MASK_MIN_SIZE=24 is the only floor).
- Pencil: "Draw path" mode fits one cubic bezier (least squares + 2
  reprojection rounds) through a drawn stroke; Affinity-style rope
  stabiliser (0–150, default 30) with slack-circle + rope affordance.

### Generation params (ToolParams)
`lines, mess, detail, resolve (Mess end), sharp, spread, breadth (Array
width), messMultiplier (jitter-only tame dial), thickness{preset,min,max,
transitionPos,transitionWidth}, path{4 pts + startScale/endScale}, colours
{background|transparent, lines[1–4], logo(black/white/swatch),
container|transparent}, mask{rect, hard/soft, avoid, avoidStrength},
logo{scale, visible}, canvas{px/cm/dpi}, seed`.
Defaults: tight 10-line array, one-sided mess (resolve 35, startScale 1.5 /
endScale 0.6, spread 20, breadth 18, width 3).

### Colours
- Pickers show 7 main colours first, then a "Shades" subtitle (tints then
  darks). Transparent swatch for background + container (PNG exports get real
  alpha). Mono toggle for lines. "Mix colours" reshuffles colour roles only.

### Randomisers
- Randomiser panel: per-param min/max bounds incl. resolve/sharp/spread.
- "Randomise shape" (Line shape panel): rolls only that panel's params.
- Presets panel: named saves (localStorage `pw-tool-presets-v1`) + share
  codes (`PW1.` + base64 JSON of full params) for exchanging designs.

### Performance (two passes)
- Noise tables: all fractal trig precomputed per (seed, detail, lineCount);
  drags do zero `Math.sin`. Ribbon path strings memoized; fast `f1`
  formatter replaces `toFixed`. All six panels memoized behind stable
  callbacks / updater-style props. All five drag surfaces rAF-coalesced
  (`useRafPointer`). Avoid param resolves to a stable NO_AVOID ref when off.

## Key invariants (do not break)

- **Tool folder stays Next-free** (no `next/*` imports, no `/public` URLs) —
  that's what lets the Electron app alias the same source.
- **Persistence:** params key `pw-tool-params-v2`; schema additions must be
  handled by `mergeParamsWithDefaults` (per-nested-object merge — this is
  what backfills new fields; a key bump wipes saved artwork). NaN guards in
  `buildStrokes` for breadth/messMultiplier/avoid.strength.
- **Export path ignores view state:** `getCleanExportSVGString` re-forces
  the true canvas viewBox and strips `EXPORT_EXCLUDE_CLASS` nodes; zoom and
  gizmo overflow never leak into files.
- **Layout constants** live once in CSS (`--pw-workspace-chrome`,
  `--pw-stage-gutter` on `.pw-pitch`, overridden by `.pwe-shell` in the app);
  the stage's inline fit calc reads the same variables.
- **Canvas-shrink mask re-clamp** lives in BrandAssetTool (always mounted),
  NOT in MaskPanel (docks unmount inactive tabs).
- `THICKNESS_PRESETS` in yarnMath is the single preset pool (type derives
  from it). `svgPointer.ts` owns pointer→viewBox conversion + capture guard.

## Shipping the desktop app

```bash
cd placeworks-tool-electron
# bump "version" in package.json first
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist
gh release create placeworks-tool-vX.Y.Z release/PlaceWorks-Brand-Asset-Tool-*.dmg release/PlaceWorks-Brand-Asset-Tool-*.zip
```
The page's download link uses `releases/latest/download/<filename>`, so it
tracks the newest release only if the artifact FILENAME keeps its version —
update `MAC_APP_URL` in `tool/page.tsx` when bumping the version.

## Known gaps / candidate next steps

- App is **unsigned** (Gatekeeper right-click-Open dance) and **arm64-only**;
  no app icon (default Electron icon). Fix: Apple Developer cert +
  notarization, `--universal` build, icon asset.
- Dock tab rearranging is drag-only (no keyboard path).
- Soft-fade mask mode re-rasterises an 18px blur per frame — inherently
  heavy; consider cheaper feathering if it's ever a complaint.
- CLAUDE.md's tool section predates the workspace redesign (still describes
  the old stacked sidebar) — rewrite when convenient.
- Review leftovers deliberately dropped under the cap (low value): `seed`
  declared in BuildParams but unused by buildStrokes; workspace layout
  persists a default-layout write on first mount (harmless).
- Dev-server quirk all session: `npm run dev` intermittently decays into
  serving 500s for every route; fix is kill + restart. Cause not found —
  suspect environment, not the code.

## Session commit trail (oldest → newest)

`38ceb63` randomiser bounds + autosave/vNext groundwork · `5deb092` side
panel + whole-curve move + Mess end · `bffffd6` couple gizmos + visible
scrollbar · `f7bcc41` resolve stick · `791392b` mess detail + preview +
corner resize · `8fd32e3` mix colours + avoidance field · `2ef2a88`
avoidance fill-blob fix · `89bfc1b` dockable workspace · `9f8ca31` Electron
app · `6ff06e7` perf pass 1 · `a95d05f` pencil + avoidance guarantee +
logo-fits-container + viewport fit · `c81b311` lines/width sliders + rope
stabiliser · `fd29b49` combined gizmo + visible spine + new defaults ·
`dc307f8` end gizmos + array width · `7db6dc6` perf pass 2 + six features ·
`b5da335` preview = export frame · `b8386f0` presets + share codes ·
`8e0a7bf` all 10 review findings fixed · `42affc4` downloadable app + link.
