// Server-only — imports the generated Tina client which uses Node APIs.
// Client components must import from tinaHelpers.ts instead.

// @ts-ignore — alias resolved by next.config.mjs webpack config.
import tinaClient from '@tina-client'

// Re-export shared types/helpers so server pages can import from one place
export { type TinaQueryResult, buildTinaResult, buildTinaProps } from './tinaHelpers'

async function queryCollection<K extends string>(
  collection: K,
  relativePath: string,
) {
  if (!tinaClient) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (tinaClient as any).queries[collection]({ relativePath })
  } catch {
    return null
  }
}

export function queryProject(slug: string) {
  return queryCollection('projects', `${slug}.json`)
}

export function queryAbout() {
  return queryCollection('about', 'about.json')
}
