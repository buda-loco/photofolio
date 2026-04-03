#!/usr/bin/env node

/**
 * Patches Tina CMS's local media upload handler to prevent filename collisions.
 * When uploading a file that already exists, appends -01, -02, etc. instead of overwriting.
 *
 * Runs automatically via npm postinstall. Safe to re-run.
 */

const fs = require('fs')
const path = require('path')

const target = path.join(__dirname, '..', 'node_modules', '@tinacms', 'cli', 'dist', 'index.js')

if (!fs.existsSync(target)) {
  console.log('patch-tina-media: @tinacms/cli not found, skipping')
  process.exit(0)
}

let code = fs.readFileSync(target, 'utf8')

const MARKER = '/* PATCHED: dedup-media-upload */'

if (code.includes(MARKER)) {
  console.log('patch-tina-media: already patched, skipping')
  process.exit(0)
}

// Find the line: file.pipe(fs5.createWriteStream(saveTo));
// Replace with dedup logic that checks for existing files and renames with -01, -02, etc.

const original = 'file.pipe(fs5.createWriteStream(saveTo));'

if (!code.includes(original)) {
  console.error('patch-tina-media: could not find upload write target — Tina version may have changed')
  process.exit(1)
}

const replacement = `${MARKER}
      // Dedup: if file exists, rename with -01, -02, etc.
      if (fs5.existsSync(saveTo)) {
        const ext = path6.extname(saveTo);
        const base = saveTo.slice(0, -ext.length);
        let n = 1;
        while (fs5.existsSync(base + '-' + String(n).padStart(2, '0') + ext)) n++;
        saveTo = base + '-' + String(n).padStart(2, '0') + ext;
      }
      file.pipe(fs5.createWriteStream(saveTo));`

code = code.replace(original, replacement)

fs.writeFileSync(target, code)
console.log('patch-tina-media: patched successfully — uploads will no longer overwrite existing files')
