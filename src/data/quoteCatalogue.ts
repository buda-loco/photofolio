// Master catalogue for the self-serve quote wizard at /quote.
// Modelled on the PlaceWorks quote structure (phases of deliverables, hourly +
// fixed pricing) but broadened to cover ANY kind of design work. The client
// picks disciplines, toggles deliverables, and the wizard prices it live.

export interface CatalogItem {
  id: string;
  name: string;
  desc?: string;
  pricing: 'hourly' | 'fixed';
  rate?: number;   // hourly $/h
  hours?: number;  // hourly
  amount?: number; // fixed $
}

export interface Discipline {
  id: string;
  label: string;
  blurb: string;
  items: CatalogItem[];
}

export const CURRENCY = 'AUD';

// Rates by craft (baked per item for simplicity): design 100, build 140, motion 150.
export const DISCIPLINES: Discipline[] = [
  {
    id: 'brand',
    label: 'Brand identity',
    blurb: 'Logo, wordmark and the core visual identity.',
    items: [
      { id: 'discovery', name: 'Discovery & direction', desc: 'Workshop, references, creative direction.', pricing: 'hourly', rate: 100, hours: 10 },
      { id: 'logo', name: 'Logo / wordmark', desc: 'Core identity mark + lockups.', pricing: 'hourly', rate: 100, hours: 24 },
      { id: 'identity', name: 'Visual identity system', desc: 'Supporting marks, motifs, art direction.', pricing: 'hourly', rate: 100, hours: 18 },
    ],
  },
  {
    id: 'design-system',
    label: 'Design system',
    blurb: 'Layout, typography, colour and the rules that hold it together.',
    items: [
      { id: 'type', name: 'Typography system', pricing: 'hourly', rate: 100, hours: 10 },
      { id: 'colour', name: 'Colour & palette system', pricing: 'hourly', rate: 100, hours: 8 },
      { id: 'layout', name: 'Layout, grid & rules', desc: 'Adaptive / “form-own” layout system.', pricing: 'hourly', rate: 100, hours: 18 },
    ],
  },
  {
    id: 'web',
    label: 'Web & digital',
    blurb: 'Marketing sites, landing pages and digital interfaces.',
    items: [
      { id: 'web-design', name: 'Website / landing design', pricing: 'hourly', rate: 100, hours: 24 },
      { id: 'web-build', name: 'Frontend build', desc: 'Responsive, animated, production-ready.', pricing: 'hourly', rate: 140, hours: 40 },
      { id: 'cms', name: 'CMS integration', pricing: 'hourly', rate: 140, hours: 16 },
    ],
  },
  {
    id: 'product',
    label: 'Product / app UI',
    blurb: 'Product and app interface design.',
    items: [
      { id: 'product-ui', name: 'Product UI design', pricing: 'hourly', rate: 100, hours: 30 },
      { id: 'ui-kit', name: 'UI component kit', pricing: 'hourly', rate: 100, hours: 24 },
      { id: 'proto', name: 'Interactive prototype', pricing: 'hourly', rate: 100, hours: 16 },
    ],
  },
  {
    id: 'motion',
    label: 'Motion & video',
    blurb: 'Animation, micro-interactions and launch films.',
    items: [
      { id: 'motion-principles', name: 'Motion & interaction principles', pricing: 'hourly', rate: 150, hours: 12 },
      { id: 'micro', name: 'Micro-interactions & UI motion', pricing: 'hourly', rate: 150, hours: 14 },
      { id: 'film', name: 'Launch film / hero video', pricing: 'fixed', amount: 2400 },
    ],
  },
  {
    id: 'illustration',
    label: 'Illustration',
    blurb: 'Custom illustration and iconography.',
    items: [
      { id: 'illustration-set', name: 'Custom illustration set', pricing: 'hourly', rate: 100, hours: 16 },
      { id: 'icons', name: 'Icon set', pricing: 'hourly', rate: 100, hours: 10 },
    ],
  },
  {
    id: 'applications',
    label: 'Print & applications',
    blurb: 'Documents, presentations, signage and campaign assets.',
    items: [
      { id: 'documents', name: 'Document & report templates', pricing: 'hourly', rate: 100, hours: 10 },
      { id: 'presentations', name: 'Presentation system', pricing: 'hourly', rate: 100, hours: 8 },
      { id: 'signage', name: 'Signage / hoardings', pricing: 'hourly', rate: 100, hours: 10 },
      { id: 'social', name: 'Social & campaign kit', pricing: 'hourly', rate: 100, hours: 10 },
    ],
  },
  {
    id: 'guidelines',
    label: 'Guidelines & handover',
    blurb: 'Usage guidelines that keep the work consistent.',
    items: [
      { id: 'guidelines', name: 'Brand / design guidelines', pricing: 'fixed', amount: 1500 },
      { id: 'handover', name: 'Files & handover session', pricing: 'hourly', rate: 100, hours: 6 },
    ],
  },
];

export const itemCost = (it: CatalogItem): number =>
  it.pricing === 'fixed' ? Math.max(0, it.amount ?? 0) : Math.max(0, (it.hours ?? 0) * (it.rate ?? 0));

export const itemHours = (it: CatalogItem): number => (it.pricing === 'hourly' ? it.hours ?? 0 : 0);

export const ALL_ITEMS: Record<string, { item: CatalogItem; discipline: Discipline }> = Object.fromEntries(
  DISCIPLINES.flatMap((d) => d.items.map((item) => [item.id, { item, discipline: d }])),
);
