import fs from 'fs'
import path from 'path'
import type { RichNode } from './richText'
import { normalizeQuote, type QuoteConfig } from './quote'

export type { RichNode } from './richText'

// ── Type Definitions ─────────────────────────────────────────────

export interface ProjectInfo {
  about?: RichNode
  date?: string
  place?: string
  client?: string
}

export interface HeroBlock {
  _template: 'hero'
  src: string
  alt?: string
  aspectRatio?: string
  parallax?: number
  caption?: string
}

export interface GalleryImage {
  src: string
  alt?: string
  aspectRatio?: string
}

export interface GalleryBlock {
  _template: 'gallery'
  columns?: string
  images: GalleryImage[]
}

export interface VideoBlock {
  _template: 'video'
  provider?: string
  src?: string
  id?: string
  poster?: string
  caption?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
}

export interface WidescreenVideoBlock {
  _template: 'widescreen_video'
  url?: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  aspectRatio?: string
  caption?: string
}

export interface VerticalReelVideo {
  url: string
  poster?: string
  loop?: boolean
  muted?: boolean
  autoplay?: boolean
}

export interface VerticalReelBlock {
  _template: 'vertical_reel'
  video: VerticalReelVideo
  images?: GalleryImage[]
  caption?: string
}

export interface VerticalGridItem {
  type: 'image' | 'video'
  src?: string
  alt?: string
  videoUrl?: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
}

export interface VerticalGridBlock {
  _template: 'vertical_grid'
  items?: VerticalGridItem[]
  caption?: string
}

export interface TextBlock {
  _template: 'text'
  heading?: string
  body?: RichNode
}

// Tina GraphQL client adds __typename (e.g. "ProjectsBlocksWidescreen_video")
// instead of _template. Both are supported in Block.tsx.
export type ContentBlock =
  | (HeroBlock & { __typename?: string })
  | (GalleryBlock & { __typename?: string })
  | (VideoBlock & { __typename?: string })
  | (WidescreenVideoBlock & { __typename?: string })
  | (VerticalReelBlock & { __typename?: string })
  | (VerticalGridBlock & { __typename?: string })
  | (TextBlock & { __typename?: string })

export interface Project {
  slug: string
  title: string
  category?: string
  year?: number
  cover?: string
  coverAspect?: string
  gridSize?: 'large' | 'medium' | 'small'
  gridOffset?: number
  /** Service filters this project should headline. The /work bento grid gives its big
   *  slot to whatever sits at index 0, so naming a service here hoists this project to
   *  the front of that filter. Does not affect the All view. */
  heroFor?: string[]
  featured?: boolean
  ctaLabel?: string
  ctaUrl?: string
  backgroundColor?: string
  backgroundColorSecondary?: string
  textColor?: string
  primaryColor?: string
  secondaryColor?: string
  invertColors?: boolean
  services?: string[]
  info?: ProjectInfo
  blocks?: ContentBlock[]
}

export interface About {
  name: string
  title?: string
  bio?: RichNode
  portrait?: string
  clients: string[]
  email: string
  instagram?: string
  showreel?: string
}

export interface HowIWorkStep {
  number: string
  title: string
  body?: RichNode
}

export interface HowIWorkCta {
  text: string
  link: string
  label: string
}

export interface HowIWork {
  title: string
  intro?: RichNode
  steps: HowIWorkStep[]
  cta?: HowIWorkCta
}

export interface DesignColors {
  background: string
  text: string
  textMuted: string
  textBright: string
  border: string
  labelColor: string
  labelColorSecondary?: string
}

export interface DesignTypographyHeadings {
  weight: string
  letterSpacing: string
  lineHeight: string
}

export interface DesignTypographyLabels {
  size: string
  letterSpacing: string
}

export interface DesignTypographyBody {
  size: string
  lineHeight: string
}

export interface DesignTypography {
  sans: string
  display: string
  headings: DesignTypographyHeadings
  labels: DesignTypographyLabels
  body: DesignTypographyBody
}

export interface DesignTextBlock {
  headingSize: string
  headingWeight: string
  headingLetterSpacing: string
  headingLineHeight: string
  bodySize: string
  bodyLineHeight: string
  maxWidth: string
  gap: string
}

export interface DesignButtons {
  fontSize: string
  letterSpacing: string
  paddingV: string
  paddingH: string
}

export interface DesignData {
  colors: DesignColors
  typography: DesignTypography
  textBlock: DesignTextBlock
  buttons: DesignButtons
}

// ── Content directory path ───────────────────────────────────────
const CONTENT_DIR = path.join(process.cwd(), 'src', 'content')

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

// ── Public API ───────────────────────────────────────────────────

let _projectsCache: Project[] | null = null

export function getAllProjects(): Project[] {
  if (_projectsCache) return _projectsCache
  const projectsDir = path.join(CONTENT_DIR, 'projects')
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'))
  const projects = files.map(f => readJson<Project>(path.join(projectsDir, f)))
  // `featured` means one thing only: show on the homepage. It used to double as a
  // site-wide hide here (`featured !== false`), which turned the CMS checkbox into a
  // trap — unticking "Feature in homepage" to take a project off the homepage would
  // silently drop it from /work as well. No project ever used it that way. If a project
  // needs hiding outright, add an explicit field rather than overloading this one.
  _projectsCache = projects.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  return _projectsCache
}

export function getAllProjectsIncludingHidden(): Project[] {
  const projectsDir = path.join(CONTENT_DIR, 'projects')
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'))
  return files.map(f => readJson<Project>(path.join(projectsDir, f)))
}

export function getProject(slug: string): Project | null {
  try {
    return readJson<Project>(path.join(CONTENT_DIR, 'projects', `${slug}.json`))
  } catch {
    return null
  }
}

export function getAbout(): About {
  return readJson<About>(path.join(CONTENT_DIR, 'about.json'))
}

export function getHowIWork(): HowIWork {
  return readJson<HowIWork>(path.join(CONTENT_DIR, 'how-i-work.json'))
}

export function getDesign(): DesignData {
  return readJson<DesignData>(path.join(CONTENT_DIR, 'design.json'))
}

// ── Quotes (client quote builder) ────────────────────────────────
const QUOTES_DIR = path.join(CONTENT_DIR, 'quotes')

export function getQuoteSlugs(): string[] {
  try {
    return fs.readdirSync(QUOTES_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''))
  } catch {
    return []
  }
}

export function getQuote(slug: string): QuoteConfig | null {
  try {
    const raw = readJson<unknown>(path.join(QUOTES_DIR, `${slug}.json`))
    return normalizeQuote(raw, slug)
  } catch {
    // Missing slug is normal (→ notFound). Malformed JSON throws here too;
    // surface it so an authoring mistake isn't silent.
    if (fs.existsSync(path.join(QUOTES_DIR, `${slug}.json`))) {
      console.warn(`[quote:${slug}] failed to parse quote JSON`)
    }
    return null
  }
}

export function getAllQuotes(): QuoteConfig[] {
  return getQuoteSlugs()
    .map(getQuote)
    .filter((q): q is QuoteConfig => q !== null)
}
