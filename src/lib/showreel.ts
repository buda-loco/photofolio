import showreelData from '@/content/showreel.json'

export interface ShowreelItem {
  id: string
  title: string
  category: string
  preview: string
  poster: string
  width: number
  height: number
  aspect: string
  orientation: 'landscape' | 'vertical' | 'square'
  duration: number
  /**
   * ISO date the video entered the archive, stamped once by the pipeline and
   * preserved after. The videos carry no date of their own, so this is the
   * only thing that can order them by recency.
   */
  added: string
  /** Hand-set: pins this video to the homepage strip. */
  homepage?: boolean
  /** Dropbox share link. Empty until the links are generated. */
  dropboxUrl: string
}

export function getShowreelItems(): ShowreelItem[] {
  return showreelData as ShowreelItem[]
}

export function getShowreelCategories(items: ShowreelItem[]): string[] {
  return Array.from(new Set(items.map(i => i.category))).sort()
}

/**
 * The videos for the homepage strip. Hand-pinned ones win, in the order they
 * appear in showreel.json; otherwise it falls back to the most recently added,
 * so the section stays populated and current on its own after an upload.
 *
 * Same shape as the projects rule on the homepage: an explicit flag decides,
 * with recency as the fallback.
 */
export function getHomepageVideos(items: ShowreelItem[], count = 3): ShowreelItem[] {
  const pinned = items.filter(i => i.homepage)
  if (pinned.length) return pinned.slice(0, count)
  return [...items]
    .sort((a, b) => (a.added < b.added ? 1 : a.added > b.added ? -1 : 0))
    .slice(0, count)
}
