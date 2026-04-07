// Shared skills data — used by AboutClient (pills) and HomeHeroTagline (rotating cube)

export const SKILLS = [
  'Brand design', 'Advertising', 'Editorial', 'Packaging',
  'Apparel', 'Digital design', 'Web', 'Apps',
  'Motion graphics', 'Sound design', 'Cinematography',
  'Photography', '3D design', 'Event visuals',
] as const

// Single-noun identities derived from services across all projects.
// Used in the homepage hero 3D rotating cube.
export const HERO_NOUNS = [
  'Photographer',
  'Videographer',
  'Director',
  'Animator',
  'Designer',
  'Cinematographer',
  'Developer',
  'Strategist',
  'Editor',
  'Producer',
] as const
