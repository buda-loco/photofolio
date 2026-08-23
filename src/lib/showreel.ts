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
  /** Dropbox share link. Empty until the links are generated. */
  dropboxUrl: string
}

export function getShowreelItems(): ShowreelItem[] {
  return showreelData as ShowreelItem[]
}

export function getShowreelCategories(items: ShowreelItem[]): string[] {
  return Array.from(new Set(items.map(i => i.category))).sort()
}
