/**
 * Fan one drop folder out to the two places a new job's images have to live.
 *
 *   _intake/<slug>/            you put everything here, any filenames
 *     -> public/images/projects/<slug>/     page images, max 2400px, for the site
 *     -> <B-LINKEDIN>/assets/<slug>/        eight video stills, 1400px, role-named
 *
 * Prints a JSON manifest on stdout. The skill reads that to write the project
 * file, so the judgement (which image goes where, what the copy says) stays out
 * of here and the file shuffling stays out of the skill.
 *
 *   node scripts/new-work/intake.mjs <slug>
 *   node scripts/new-work/intake.mjs <slug> --dry
 *
 * Video roles come from `_intake/<slug>/roles.txt` if it exists — one
 * `role: filename` per line — otherwise the first eight images in sorted order,
 * which is a starting point to correct, not an answer.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.join(import.meta.dirname, '../..'));
const LINKEDIN = '/Users/budaloco/zstudios Dropbox/Benjamin Arnedo/INTERNAL/02 BUDA/B-LINKEDIN';
const ROLES = ['brief', 'mark', 'g1', 'g2', 'g3', 'g4', 'world', 'extra'];
const PAGE_MAX = 2400;   // retina on a 1200px column; more is bytes nobody sees
const VID_MAX = 1400;    // the render frame is 1080 wide

const argv = process.argv.slice(2);
const slug = argv.find(a => !a.startsWith('--'));
const dry = argv.includes('--dry');
if (!slug) { console.error('usage: node scripts/new-work/intake.mjs <slug> [--dry]'); process.exit(1); }
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`bad slug "${slug}" — lowercase and hyphens only, it becomes the URL`); process.exit(1);
}

const src = path.join(ROOT, '_intake', slug);
if (!fs.existsSync(src)) { console.error('no such folder:', src); process.exit(1); }

const IMG = /\.(jpe?g|png|webp)$/i;
const VID = /\.(mp4|mov|m4v)$/i;
const all = fs.readdirSync(src).filter(f => !f.startsWith('.')).sort();
const images = all.filter(f => IMG.test(f));
const videos = all.filter(f => VID.test(f));
if (!images.length) { console.error('no images in', src); process.exit(1); }

const pageDir = path.join(ROOT, 'public/images/projects', slug);
const vidDir = path.join(LINKEDIN, 'assets', slug);
if (!dry) { fs.mkdirSync(pageDir, { recursive: true }); fs.mkdirSync(vidDir, { recursive: true }); }

// sips is macOS-native and does not need a dependency installed. It only ever
// shrinks: --resampleHeightWidthMax leaves an already-smaller image alone.
const shrink = (from, to, max) => {
  if (dry) return;
  fs.copyFileSync(from, to);
  execFileSync('sips', ['--resampleHeightWidthMax', String(max), to], { stdio: 'ignore' });
};

const kebab = f => f.replace(IMG, '').replace(/[^a-zA-Z0-9]+/g, '-')
                    .replace(/^-|-$/g, '').toLowerCase();

// ---- page images: keep the given names, they end up in the JSON and the alt text
const page = [];
for (const f of images) {
  const out = kebab(f) + path.extname(f).toLowerCase().replace('.jpeg', '.jpg');
  shrink(path.join(src, f), path.join(pageDir, out), PAGE_MAX);
  page.push({ from: f, src: `/images/projects/${slug}/${out}` });
}

// ---- video stills: eight, renamed to the roles scene.html expects
const rolesFile = path.join(src, 'roles.txt');
let picks = {};
if (fs.existsSync(rolesFile)) {
  for (const line of fs.readFileSync(rolesFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([a-z0-9]+)\s*:\s*(.+?)\s*$/i);
    if (m && ROLES.includes(m[1])) picks[m[1]] = m[2];
  }
} else {
  ROLES.forEach((r, i) => { if (images[i]) picks[r] = images[i]; });
}

const video = [];
const missing = [];
for (const role of ROLES) {
  const f = picks[role];
  if (!f) { missing.push(role); continue; }
  if (!fs.existsSync(path.join(src, f))) { missing.push(`${role} (no file "${f}")`); continue; }
  shrink(path.join(src, f), path.join(vidDir, `${role}.jpg`), VID_MAX);
  video.push({ role, from: f });
}

const manifest = {
  slug, dry,
  counts: { images: images.length, videos: videos.length },
  pageDir: path.relative(ROOT, pageDir),
  videoDir: vidDir,
  page,
  video,
  missingRoles: missing,
  // The clips are not copied: they stream from Dropbox in the page blocks, so
  // they need a share link, not a file in the repo.
  clips: videos,
  guessedRoles: !fs.existsSync(rolesFile),
};
console.log(JSON.stringify(manifest, null, 2));
if (missing.length) console.error(`\nheads up: ${missing.length} video role(s) unfilled — ${missing.join(', ')}`);
