// Server-only — imports the generated Tina client which uses Node APIs.
// Client components must import from tinaHelpers.ts instead.

// @ts-ignore — `@tina-client` alias resolved in next.config.mjs (turbopack.resolveAlias + webpack).
import tinaClient from '@tina-client'

// Re-export shared types/helpers so server pages can import from one place
export { type TinaQueryResult, buildTinaResult, buildTinaProps } from './tinaHelpers'

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
    // Don't fail the page — fall back to local JSON — but don't fail silently.
    console.error(`[tina] query ${collection}/${relativePath} failed:`, (e as Error)?.message)
    return null
  }
}

// TEMP diagnostic — remove after debugging Tina binding on Vercel.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function __tinaDiag(): Promise<Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = tinaClient as any
  const info: Record<string, unknown> = {
    clientNull: !c,
    hasQueries: !!c?.queries,
    clientKeys: c ? Object.keys(c).slice(0, 12) : null,
    hasToken: c ? !!c.apiUrl || !!c.url : null,
  }
  try {
    const r = await c.queries.quotes({ relativePath: 'placeworks.json' })
    info.queryOk = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info.deliverables = (r as any)?.data?.quotes?.deliverables?.length ?? null
  } catch (e) {
    info.queryOk = false
    info.error = (e as Error)?.message
    info.stack = (e as Error)?.stack?.split('\n').slice(0, 4).join(' | ')
  }
  return info
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
