// Server-only. Constructs the Tina Cloud client directly from env vars +
// the committed generated `queries`.
//
// Why not import the generated client (tina/__generated__/client.ts)?
// That file is gitignored and only created by `tinacms build`. On Vercel the
// `@tina-client` build alias resolved to a null stub (the file wasn't present
// when Next bundled), so every query returned null and visual editing couldn't
// bind. Building the client here from env vars is deterministic and avoids the
// baked token + local cacheDir in the generated client.

import { createClient } from 'tinacms/dist/client'
import { queries } from '../../tina/__generated__/types'

// Re-export shared types/helpers so server pages can import from one place
export { type TinaQueryResult, buildTinaResult, buildTinaProps } from './tinaHelpers'

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  'main'

const clientId = process.env.TINA_PUBLIC_CLIENT_ID
const token = process.env.TINA_TOKEN

// Tina GraphQL content-API major version (matches tina/config.ts + generated client).
const TINA_API_VERSION = '2.2'

const tinaClient =
  clientId && token
    ? createClient({
        url: `https://content.tinajs.io/${TINA_API_VERSION}/content/${clientId}/github/${branch}`,
        token,
        queries,
      })
    : null

async function queryCollection<K extends string>(
  collection: K,
  relativePath: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = tinaClient as any
  if (!c?.queries) return null
  try {
    return await c.queries[collection]({ relativePath })
  } catch (e) {
    // Fall back to local JSON, but don't fail silently.
    console.error(`[tina] query ${collection}/${relativePath} failed:`, (e as Error)?.message)
    return null
  }
}

export function queryProject(slug: string) {
  return queryCollection('projects', `${slug}.json`)
}

export function queryAbout() {
  return queryCollection('about', 'about.json')
}

export function queryQuote(slug: string) {
  return queryCollection('quotes', `${slug}.json`)
}
