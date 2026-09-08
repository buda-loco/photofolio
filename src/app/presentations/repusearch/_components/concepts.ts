/**
 * Repusearch pitch — all content lives here.
 *
 * Every image field is optional. Leave it undefined and the stage renders a
 * labelled placeholder at the right aspect ratio; drop a file into
 * /public/presentations/repusearch/cXX/ and set the path to swap it in.
 * No page code needs to change.
 */

export type Panel = {
  /** still image; square unless the panel is `wide` */
  src?: string
  /** looping muted video, played in place of the still */
  video?: string
  /** poster frame while the video loads */
  poster?: string
  /** a live component in place of the image; keys map in ConceptPage */
  live?: 'shadow-sundial' | 'threads-bed' | 'fingerprint-draw'
  /** take the full row and render at 21:9 instead of 1:1 */
  wide?: boolean
  title: string
  caption: string
}

export type Mockup = {
  /** 16:9 image */
  src?: string
  label: string
}

export type LogoTile = {
  /** 1:1 image */
  src?: string
  name: string
  /** marks our proposal in the comparison rows */
  ours?: boolean
}

export type Concept = {
  num: '01' | '02' | '03' | '04' | '05'
  slug: string
  name: string
  tagline: string
  /** index card blurb */
  desc: string
  /** pop in one by one, staggered */
  keywords: string[]
  /** the idea, two or three paragraphs */
  rationale: string[]
  /** how the mark is built — two or three panels */
  panels: Panel[]
  /** hero — logo white on black, full bleed */
  heroLogo?: string
  /** 1:1 squares */
  logoOnBlack?: string
  logoOnWhite?: string
  /** 1:1 — the mark at favicon / avatar size, on black then white */
  smallOnBlack?: string
  smallOnWhite?: string
  /** 16:9 */
  lockupA?: string
  lockupB?: string
  /** the brand world board, 1:1 */
  brandWorld?: string
  /** the four core applications */
  mockups: [Mockup, Mockup, Mockup, Mockup]
  /** anything beyond the core four, shown as an Extra */
  extras?: Mockup[]
  /** four competitors + ours (ours is injected from logoOnWhite) */
  competitors: LogoTile[]
  /** four sibling brands from the C8 Group + ours */
  siblings: LogoTile[]
  /** the closing image, 16:9, full bleed */
  bigMockup?: Mockup
}

const base = (n: string) => `/presentations/repusearch/c${n}`
const LOGO = '/presentations/repusearch/logos'
const MOCK = '/presentations/repusearch/mockups'

/* Competitor set from the brief. Same four for every concept; swap per
   concept if a direction argues against a different neighbour. */
const COMPETITORS: Concept['competitors'] = [
  { name: 'The Reputation Agency', src: `${LOGO}/comp-reputationagency.svg` },
  { name: 'CoFactor', src: `${LOGO}/comp-cofactor.svg` },
  { name: 'Reputation Edge', src: `${LOGO}/comp-reputationedge.svg` },
  { name: 'Meltwater', src: `${LOGO}/comp-meltwater.svg` },
]

/* C8 Group siblings. A.GR and Constellation are the natural neighbours
   (advisory, government); CRE8IVE is the parent; Fluro is the SEO sibling
   Repusearch must not be confused with. */
const SIBLINGS: Concept['siblings'] = [
  { name: 'CRE8IVE', src: `${LOGO}/sib-cre8ive.svg` },
  { name: 'Crewcible', src: `${LOGO}/sib-crewcible.svg` },
  { name: 'Constellation Strategic', src: `${LOGO}/sib-constellation.svg` },
  { name: 'PlaceWorks', src: `${LOGO}/sib-placeworks.svg` },
]

export const CONCEPTS: Concept[] = [
  {
    num: '01',
    slug: '01',
    name: 'Sundial',
    tagline: 'Every organisation casts one, and it follows them. Its shape depends on where the light is.',
    desc: 'Reputation is hard to picture. A shadow is not: everyone has one, it follows them, and what it looks like depends on the light.',
    // straight from the brief: Brand Personality (Vigilant, Strategic, Authoritative,
    // Trusted) and Brand Attributes (Insightful, Discreet)
    keywords: ['Vigilant', 'Insightful', 'Strategic', 'Discreet', 'Authoritative', 'Trusted'],
    rationale: [
      'Reputation is hard to visualise. One thing is certain: every organisation has one, and it follows them wherever they go. A shadow does the same. It is cast by the organisation itself, but its length, its direction and how much of it people notice depend entirely on where the light is.',
      'The brief describes that light. Stakeholders no longer form opinions from direct experience alone; they form them from search results, media coverage, executive profiles and AI-generated answers. Those touchpoints are the light source. They decide which side of an organisation is lit and how long the shadow behind it runs.',
      'Repusearch works with that light. It reads where it is coming from, shows the client what others see, and helps turn the bright side toward them. The mark says exactly that: a flat R, a light on it, and the shadow it casts. The lit face is what we want the world to see. Understanding the shadow is how we get there.',
    ],
    heroLogo: `${LOGO}/c01-wide.svg`,
    logoOnBlack: `${LOGO}/c01-on-black.svg`,
    logoOnWhite: `${LOGO}/c01-on-white.svg`,
    smallOnBlack: `${LOGO}/c01-on-black-small.svg`,
    smallOnWhite: `${LOGO}/c01-on-white-small.svg`,
    lockupA: `${LOGO}/c01-lockup-h.svg`,
    lockupB: `${LOGO}/c01-lockup-v.svg`,
    brandWorld: `${LOGO}/c01-brandworld.svg`,
    panels: [
      {
        live: 'shadow-sundial',
        title: 'One shape, many shadows',
        caption: 'Move the sun. The R never changes; what falls behind it does. Reputation behaves the same way.',
      },
      {
        src: `${base('01')}/monolith-high.jpg`,
        title: 'The light decides',
        caption: 'Search results, media and AI answers are the source. Most organisations are standing exactly where the two halves meet.',
      },
      {
        src: `${base('01')}/monolith-low.jpg`,
        title: 'The lit side',
        caption: 'Stakeholders see the face the light reaches. Reading the shadow is how you know which face that is.',
      },
    ],
    mockups: [
      { src: `${MOCK}/c01-cover.jpg`, label: 'Intelligence report — printed cover' },
      { src: `${MOCK}/c01-page.jpg`, label: 'Report page — risk register' },
      { src: `${MOCK}/c01-card.jpg`, label: 'Business card' },
      { src: `${MOCK}/c01-screen.jpg`, label: 'Monitoring dashboard' },
    ],
    competitors: COMPETITORS,
    siblings: SIBLINGS,
    bigMockup: { src: `${base('01')}/monolith-high.jpg`, label: 'The monolith at golden hour' },
  },
  {
    num: '02',
    slug: '02',
    name: 'Echo Chamber',
    tagline: 'One line, wound inward. An ear, a target and a labyrinth in the same mark.',
    desc: 'A single continuous line spirals into the centre of the R. Outside it is the noise. Inside is the person you are trying to reach.',
    // brief: Brand Attributes (Insightful, Sophisticated, Independent, Credible,
    // Discreet) and Brand Personality (Strategic)
    keywords: ['Insightful', 'Strategic', 'Independent', 'Sophisticated', 'Discreet', 'Credible'],
    rationale: [
      'The mark is one continuous line wound inward. Read it quickly and it is an ear, drawn as simply as an ear can be drawn. Everything outside the spiral is noise: the commentary, the coverage, the search results, the answers a machine gives when someone asks about you.',
      'Read it again and the concentric bands are a target. Reputation work is not broadcasting, it is reaching a specific set of people who matter, and getting to the centre is the whole job. The name carries the same idea: search as a bullseye.',
      'Read it a third time and it is a labyrinth. Getting to the middle takes a route, and the route is not obvious. That is the honest picture of this work, and it is the reason a client needs an adviser rather than a dashboard.',
    ],
    heroLogo: `${LOGO}/c02-wide.svg`,
    logoOnBlack: `${LOGO}/c02-on-black.svg`,
    logoOnWhite: `${LOGO}/c02-on-white.svg`,
    smallOnBlack: `${LOGO}/c02-on-black-small.svg`,
    smallOnWhite: `${LOGO}/c02-on-white-small.svg`,
    lockupA: `${LOGO}/c02-lockup-h.svg`,
    lockupB: `${LOGO}/c02-lockup-v.svg`,
    brandWorld: `${LOGO}/c02-brandworld.svg`,
    panels: [
      {
        src: `${base('02')}/portrait-ear.jpg`,
        title: 'The ear',
        caption: 'Drawn as simply as an ear can be drawn. Outside the spiral is everything being said.',
      },
      {
        src: `${base('02')}/labyrinth-top.jpg`,
        title: 'The route in',
        caption: 'Concentric bands read as a target. Reaching the centre is the job.',
      },
      {
        src: `${base('02')}/labyrinth-close.jpg`,
        title: 'The labyrinth',
        caption: 'The way in exists, but it is not obvious. That is why the work needs an adviser.',
      },
    ],
    mockups: [
      { src: `${MOCK}/c02-cover.jpg`, label: 'Intelligence report — printed cover' },
      { src: `${MOCK}/c02-page.jpg`, label: 'Report page — risk register' },
      { src: `${MOCK}/c02-card.jpg`, label: 'Business card' },
      { src: `${MOCK}/c02-screen.jpg`, label: 'Monitoring dashboard' },
    ],
    extras: [
      { src: `${MOCK}/c02-x1.jpg`, label: 'Business card — front, on stone' },
      { src: `${MOCK}/c02-x2.jpg`, label: 'Business card — reverse' },
    ],
    competitors: COMPETITORS,
    siblings: SIBLINGS,
    bigMockup: { src: `${base('02')}/labyrinth-top.jpg`, label: 'The labyrinth from above' },
  },
  {
    num: '03',
    slug: '03',
    name: 'Control',
    tagline: 'A chip that is not a chip. Seven bytes of binary that spell CONTROL.',
    desc: 'The mark reads as a microchip. It is actually binary, the language the web is written in, and it says one word.',
    // brief: Brand Personality (Intelligent, Strategic, Authoritative) and
    // Brand Attributes (Technology-enabled, Credible, Professional)
    keywords: ['Intelligent', 'Technology-enabled', 'Strategic', 'Authoritative', 'Credible', 'Professional'],
    rationale: [
      'The mark hides its joke in plain sight. It looks like a microchip, seven rows etched into a black square. It is actually binary, the language everything online is written in, and read as ASCII the seven bytes spell a single word: CONTROL.',
      'The wordmark carries the same idea one step further. The U in REPUSEARCH is drawn apart from the rest, and it is the letter the whole brand turns on. U is you. The client, the executive, the organisation whose name is being searched. Everything the technology does is in service of that one letter.',
      'This is the concept that answers the brief’s own tagline without overpromising. We do not manufacture reputation. We use the machinery that shapes it, search, media monitoring, AI answers, to hand the narrative back to the person it belongs to.',
    ],
    heroLogo: `${LOGO}/c03-wide.svg`,
    logoOnBlack: `${LOGO}/c03-on-black.svg`,
    logoOnWhite: `${LOGO}/c03-on-white.svg`,
    smallOnBlack: `${LOGO}/c03-on-black-small.svg`,
    smallOnWhite: `${LOGO}/c03-on-white-small.svg`,
    lockupA: `${LOGO}/c03-lockup-h.svg`,
    lockupB: `${LOGO}/c03-lockup-v.svg`,
    brandWorld: `${LOGO}/c03-brandworld.svg`,
    panels: [
      {
        src: `${base('03')}/chip.jpg`,
        title: 'The chip',
        caption: 'Seven bytes in gold and ceramic. A pin is a one, a ring is a zero. Read as ASCII they spell CONTROL.',
      },
      {
        wide: true,
        video: `${base('03')}/binary-ocean.mp4`,
        poster: `${base('03')}/binary-ocean-poster.jpg`,
        title: 'What the web is made of',
        caption: 'An ocean of ones and zeros. This is the material reputation is now built from, and the material we work in.',
      },
    ],
    mockups: [
      { src: `${MOCK}/c03-cover.jpg`, label: 'Intelligence report — printed cover' },
      { src: `${MOCK}/c03-page.jpg`, label: 'Report page — risk register' },
      { src: `${MOCK}/c03-card.jpg`, label: 'Business card' },
      { src: `${MOCK}/c03-screen.jpg`, label: 'Desktop' },
    ],
    extras: [
      { src: `${MOCK}/c03-x1.jpg`, label: 'Key findings — bound report' },
    ],
    competitors: COMPETITORS,
    siblings: SIBLINGS,
    bigMockup: { src: `${base('03')}/binary-ocean.jpg`, label: 'The binary ocean' },
  },
  {
    num: '04',
    slug: '04',
    name: 'Threads',
    tagline: 'The R is never drawn. It exists only as the deformation of the channels that carry information.',
    desc: 'A bed of parallel lines, each one a channel carrying information about you. Press on them and the letter appears. Turn them and it is gone.',
    // brief: Brand Personality (Vigilant, Strategic, Intelligent) and Brand
    // Attributes (Discreet, Technology-enabled, Independent)
    keywords: ['Discreet', 'Vigilant', 'Strategic', 'Technology-enabled', 'Intelligent', 'Independent'],
    rationale: [
      'Every organisation leaves a digital footprint, and it does not arrive as one thing. It arrives along channels: search results, news feeds, review platforms, social posts, the answers an AI gives. The lines in this mark are those channels, running in parallel, carrying information whether anyone is watching or not.',
      'The R is never drawn. It exists only where the channels are deflected. That is the whole argument for what Repusearch does: it does not invent a reputation, it works on the conduits that carry one, and the shape people see is the result of that pressure.',
      'There is a second reading built into the geometry. Turn the bed until you are looking along the threads and the letter vanishes completely. The channels are still there and still carrying the same information, but the influence on them is invisible. Discretion, drawn rather than claimed.',
    ],
    heroLogo: `${LOGO}/c04-wide.svg`,
    logoOnBlack: `${LOGO}/c04-on-black.svg`,
    logoOnWhite: `${LOGO}/c04-on-white.svg`,
    smallOnBlack: `${LOGO}/c04-on-black-small.svg`,
    smallOnWhite: `${LOGO}/c04-on-white-small.svg`,
    lockupA: `${LOGO}/c04-lockup-h.svg`,
    lockupB: `${LOGO}/c04-lockup-v.svg`,
    brandWorld: `${LOGO}/c04-brandworld.svg`,
    panels: [
      {
        live: 'threads-bed',
        title: 'Pressure on the channels',
        caption: 'The letter is only the deflection of the lines. Watch it press in and lift out, and orbit until it disappears.',
      },
      {
        src: `${base('04')}/lidar-crowd.jpg`,
        title: 'The footprint',
        caption: 'Everyone moving through the channels is described by them. Nobody is solid; each of us is the trace we leave.',
      },
      {
        src: `${base('04')}/lidar-face.jpg`,
        title: 'What others see',
        caption: 'A face read entirely off the lines. This is how an organisation is known now: not met, but scanned.',
      },
    ],
    mockups: [
      { src: `${MOCK}/c04-cover.jpg`, label: 'Intelligence report — printed cover' },
      { src: `${MOCK}/c04-page.jpg`, label: 'Report page — risk register' },
      { src: `${MOCK}/c04-card.jpg`, label: 'Business card' },
      { src: `${MOCK}/c04-screen.jpg`, label: 'Desktop' },
    ],
    competitors: COMPETITORS,
    siblings: SIBLINGS,
    bigMockup: { src: `${base('04')}/lidar-crowd.jpg`, label: 'The footprint' },
  },
  {
    num: '05',
    slug: '05',
    name: 'Fingerprint',
    tagline: 'Identity, access and terrain in one mark. Nobody else has yours, and nobody should navigate it alone.',
    desc: 'A footprint is what you leave behind. A fingerprint is what you are. It also unlocks things, and read another way it is a contour map of difficult ground.',
    // brief: Brand Personality (Strategic, Vigilant, Trusted) and Brand
    // Attributes (Credible, Insightful, Sophisticated)
    keywords: ['Trusted', 'Credible', 'Strategic', 'Insightful', 'Vigilant', 'Sophisticated'],
    rationale: [
      'The other directions deal in footprints, the marks left by what an organisation does and says. This one goes a step closer. A fingerprint is not a trace of behaviour, it is identity itself: unrepeatable, carried everywhere, impossible to swap for a better one. Reputation works the same way, which is why it is worth defending rather than decorating.',
      'The same shape carries a second meaning the audience already understands. A fingerprint is what opens things. Every phone, every secure door, every bank app has trained people to read it as the key to access and safety. For a firm whose clients worry about exposure, that association arrives free.',
      'Read it a third time and the ridges are contour lines. Public opinion has terrain: a plateau you can cross without thinking, a steep face that takes preparation, a cliff edge you should not have walked toward, and ground that is mined. Nobody reads a contour map for fun. They read it because they intend to cross the ground, and they would rather do it with someone who has crossed it before.',
    ],
    heroLogo: `${LOGO}/c05-wide.svg`,
    logoOnBlack: `${LOGO}/c05-on-black.svg`,
    logoOnWhite: `${LOGO}/c05-on-white.svg`,
    smallOnBlack: `${LOGO}/c05-on-black-small.svg`,
    smallOnWhite: `${LOGO}/c05-on-white-small.svg`,
    lockupA: `${LOGO}/c05-lockup-h.svg`,
    lockupB: `${LOGO}/c05-lockup-v.svg`,
    brandWorld: `${LOGO}/c05-brandworld.svg`,
    panels: [
      {
        live: 'fingerprint-draw',
        title: 'Identity',
        caption: 'Not what you leave behind. What you are. The mark drawn over the thing it describes.',
      },
      {
        src: `${base('05')}/access.jpg`,
        title: 'Access',
        caption: 'The mark that opens things. Already read as safety by everyone who owns a phone.',
      },
      {
        src: `${base('05')}/terrain.jpg`,
        title: 'Terrain',
        caption: 'The same ridges as contour lines. Public opinion has cliffs, and nobody should cross them unaccompanied.',
      },
    ],
    mockups: [
      { src: `${MOCK}/c05-cover.jpg`, label: 'Intelligence report — printed cover' },
      { src: `${MOCK}/c05-page.jpg`, label: 'Report page — risk register' },
      { src: `${MOCK}/c05-card.jpg`, label: 'Business card' },
      { src: `${MOCK}/c05-screen.jpg`, label: 'Desktop' },
    ],
    extras: [
      { src: `${MOCK}/c05-x1.jpg`, label: 'Report pages — loose on the table' },
    ],
    competitors: COMPETITORS,
    siblings: SIBLINGS,
    bigMockup: { src: `${base('05')}/terrain.jpg`, label: 'The terrain' },
  },
]

export const ASSET_BASE = base

export function conceptBySlug(slug: string) {
  return CONCEPTS.find((c) => c.slug === slug)
}

export function nextConcept(c: Concept) {
  const i = CONCEPTS.indexOf(c)
  return CONCEPTS[(i + 1) % CONCEPTS.length]
}
