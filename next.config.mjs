import path from 'path'
import { existsSync } from 'fs'
import { createRequire } from 'module'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Point the `@tina-client` alias at the real generated client when it exists
// (i.e. after `npm run cms` has been run), otherwise fall back to a null stub
// so `npm run dev` works on a fresh clone without the generated files.
const tinaClientPath = existsSync(path.resolve('./tina/__generated__/client.ts'))
  ? path.resolve('./tina/__generated__/client')
  : path.resolve('./src/lib/tinaClientStub')

/** @type {import('next').NextConfig} */
const config = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  webpack(cfg) {
    cfg.resolve.alias['@tina-client'] = tinaClientPath
    return cfg
  },
}

export default config
