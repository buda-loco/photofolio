/**
 * Australian creative-lead job market, Aug–Sep 2026.
 *
 * Derived from the scrape at
 *   INTERNAL/02 BUDA/B-JOBHUNTING/Automated/ai-job-search/documents/
 *   market-analysis/data/seek-market-data.json      (generated 2026-09-01)
 *
 * Only the ~40 figures the page actually renders live here — the source JSON is
 * 253 kB and sits outside this repo. Every number below was checked against it
 * programmatically before being written down.
 *
 * ⚠️ TWO DENOMINATORS, and mixing them up is the easy mistake:
 *   RELEVANT (225) — every ad that survived title filtering. Use for location,
 *     salary, employer and work-arrangement counts.
 *   DETAILED (149) — the subset whose full description was retrieved. Use for
 *     tool and task counts; you cannot count a word in a body you never fetched.
 * `denom` on each dataset below says which one applies. The UI prints it.
 */

export const SCRAPED = 1032
export const RELEVANT = 225
export const DETAILED = 149
export const EMPLOYERS = 188

export const SOURCES = ['Seek', 'LinkedIn', 'Indeed'] as const

export const SEARCH_TERMS = [
  'creative director',
  'design lead',
  'design director',
  'head of design',
  'art director',
  'brand design director',
] as const

export interface FunnelStep {
  label: string
  sub: string
  n: number
}

export const FUNNEL: FunnelStep[] = [
  { label: 'Unique ads scraped', sub: 'Seek, LinkedIn, Indeed', n: SCRAPED },
  { label: 'Relevant after title filtering', sub: 'construction roles removed', n: RELEVANT },
  { label: 'Full description retrieved', sub: 'the tool + task sample', n: DETAILED },
  { label: 'Stating a salary', sub: 'annualised only', n: 121 },
]

/** [label, count] — count is out of `denom`. */
export type Row = [label: string, count: number]

/** [label, count, onCv] — onCv drives the hatched fill and the tick. */
export type CvRow = [label: string, count: number, onCv: boolean]

export const CITIES: Row[] = [
  ['Sydney', 84],
  ['Melbourne', 68],
  ['Brisbane', 42],
  ['Remote / Australia-wide', 15],
  ['Perth', 7],
  ['Adelaide', 4],
  ['Canberra', 2],
]

export const SALARY = {
  n: 121,
  median: 107500,
  p25: 87500,
  p75: 130000,
  min: 37483,
  max: 315000,
  /** p75 − p25 */
  iqr: 42500,
}

/** Cities with at least five ads stating a salary. */
export const SALARY_BY_CITY: { city: string; median: number; n: number }[] = [
  { city: 'Sydney', median: 116000, n: 47 },
  { city: 'Melbourne', median: 107500, n: 41 },
  // True median is $99,999.50 — rounded for display, noted on the page.
  { city: 'Brisbane', median: 100000, n: 25 },
]

/** Of the 196 ads that state an arrangement; a further 29 never say. */
export const ARRANGEMENTS: Row[] = [
  ['Hybrid', 93],
  ['On-site', 81],
  ['Remote', 22],
]
export const ARRANGEMENT_STATED = 196
export const ARRANGEMENT_UNSTATED = 29

export const TOOLS: CvRow[] = [
  ['Adobe Creative Suite', 53, true],
  ['Adobe Illustrator', 43, true],
  ['Adobe Photoshop', 42, true],
  ['Adobe InDesign', 40, true],
  ['Figma', 33, true],
  ['Canva', 21, false],
  ['Generative AI', 19, true],
  ['After Effects', 17, true],
  ['Premiere Pro', 16, true],
  ['HTML / CSS', 15, true],
  ['CapCut', 7, false],
  ['Microsoft Office', 7, false],
  ['Shopify', 6, false],
  ['WordPress', 5, true],
  ['Claude / Claude Code', 4, true],
]

export const TASKS: Row[] = [
  ['Cross-functional collaboration', 92],
  ['Concept development', 81],
  ['Campaign development', 81],
  ['Stakeholder management', 62],
  ['Vendor & production management', 58],
  ['Brand identity', 42],
  ['Retail / in-store design', 42],
  ['Social media content', 39],
  ['Team leadership', 31],
  ['Typography', 28],
  ['Packaging design', 27],
  ['Motion graphics', 26],
  ['Photography', 26],
  ['Video production', 25],
  ['UX/UI design', 21],
  ['Art direction / shoots', 21],
  ['Website & digital design', 18],
  ['AI workflow adoption', 14],
]

/** Employers posting more than one matching role. 168 of 188 posted exactly one. */
export const REPEAT_EMPLOYERS: Row[] = [
  ['Ethos', 11],
  ['Canva', 5],
  ['Commonwealth Bank', 4],
  ["Nando's Australia", 3],
  ['Hustle', 3],
  ['Askable', 3],
  ['Cheil Worldwide Australia', 2],
  ['Coadys Personnel', 2],
  ['Vuly Play', 2],
  ['Snackbrands Australia', 2],
  ['Flood Studio', 2],
  ['Hapana', 2],
  ['Bevilles', 2],
]
export const EMPLOYERS_ONCE = 168

/**
 * Benjamin's capability list (benjaminarnedo.com/cv) scored against the market.
 * Coverage is by *mentions*, not by distinct items, so a tool named in 53 ads
 * counts for more than one named in 4.
 */
export const CV_COVERAGE = {
  topToolsCovered: 9,
  topToolsOf: 10,
  toolMentions: { covered: 295, total: 362, pct: 81 },
  taskMentions: { covered: 705, total: 774, pct: 91 },
  gaps: ['Retail / in-store design', 'Packaging design'],
}

export const TAKEAWAYS: { title: string; body: string }[] = [
  {
    title: 'Brisbane is not a compromise',
    body: "42 of 225 roles are here, at a $100,000 median against Sydney's $116,000. A $16,000 gap is not what Sydney costs more to live in.",
  },
  {
    title: 'The remote window has closed',
    body: '11% fully remote. If remote is non-negotiable you are fishing in 22 ads, not 225 — and that changes how you apply, not whether you do.',
  },
  {
    title: 'Adobe fluency is still the entry ticket',
    body: 'Figma is in 22% of ads. Illustrator, Photoshop and InDesign each beat it. Lead with Adobe on a CV for this market, whatever you would rather be using.',
  },
  {
    title: 'They are buying judgement, not software',
    body: 'Collaboration, concepting and stakeholder work are the top four themes. Every tool in the list appears in fewer ads than the least popular of those.',
  },
  {
    title: 'AI is in the ads now, quietly',
    body: 'Generative AI is named in 13% and specific tools like Claude in 3%. Small, but a year ago it was absent. This is the line to watch.',
  },
]
