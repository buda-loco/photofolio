import path from 'path'
import { existsSync } from 'fs'
import { createRequire } from 'module'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Point the `@tina-client` alias at the real generated client when it exists
// (i.e. after `npm run cms` has been run), otherwise fall back to a null stub
// so `npm run dev` works on a fresh clone without the generated files.
const hasGeneratedClient = existsSync(path.resolve('./tina/__generated__/client.ts'))

// Absolute path (with no extension) for the webpack bundler.
const tinaClientPath = hasGeneratedClient
  ? path.resolve('./tina/__generated__/client')
  : path.resolve('./src/lib/tinaClientStub')

// Root-relative path (with extension) for Turbopack, which ignores the
// webpack() config below. `next dev --turbo` and `next build` (Turbopack is
// the default builder as of Next 15.5) both rely on this alias.
const tinaClientTurbo = hasGeneratedClient
  ? './tina/__generated__/client.ts'
  : './src/lib/tinaClientStub.ts'

/** @type {import('next').NextConfig} */
const config = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    resolveAlias: {
      '@tina-client': tinaClientTurbo,
    },
  },
  webpack(cfg) {
    cfg.resolve.alias['@tina-client'] = tinaClientPath
    return cfg
  },
}

export default config
