import fs from 'fs'
import path from 'path'
import type { RichNode } from './richText'

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

export interface TextBlock {
  _template: 'text'
  heading?: string
  body?: RichNode
}

export type ContentBlock =
  | HeroBlock
  | GalleryBlock
  | VideoBlock
  | WidescreenVideoBlock
  | VerticalReelBlock
  | TextBlock

export interface Project {
  slug: string
  title: string
  category?: string
  year?: number
  cover?: string
  coverAspect?: string
  gridSize?: 'large' | 'medium' | 'small'
  gridOffset?: number
  hidden?: boolean
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
  vimeo?: string
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

export function getAllProjects(): Project[] {
  const projectsDir = path.join(CONTENT_DIR, 'projects')
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'))
  const projects = files.map(f => readJson<Project>(path.join(projectsDir, f)))
  return projects
    .filter(p => !p.hidden)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
}

export function getAllProjectsIncludingHidden(): Project[] {
  const projectsDir = path.join(CONTENT_DIR, 'projects')
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'))
  return files.map(f => readJson<Project>(path.join(projectsDir, f)))
}

export function getProject(slug: string): Project | null {
  const filePath = path.join(CONTENT_DIR, 'projects', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  return readJson<Project>(filePath)
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

export const readDesign = getDesign
