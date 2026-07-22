// Master catalogue for the self-serve quote builder at /quote.
//
// Eight disciplines matching the services actually on offer. Every line item is
// parametrised: the client sets quantities and options, and the hours move with
// them — so the number at the end is a real quote, not a bracket.
//
// Hours × craft rate is the whole model. Fixed fees exist only for hard costs
// (gear packages, travel, licensing), never for labour.

import type {
  CatalogItem, Discipline, LicenceTier, PricingConfig, RateId, TravelZone, TurnaroundTier,
} from '@/lib/quotePricing';

export const CURRENCY = 'AUD';
export const CONTACT_EMAIL = 'hello@benjaminarnedo.com';

/** Display form, human-readable. */
export const CONTACT_PHONE = '+61 416 865 550';

/** wa.me wants digits only — no +, spaces or dashes. */
export const WHATSAPP_NUMBER = '61416865550';

/** A WhatsApp deep link, optionally with the message pre-filled. */
export const whatsappLink = (message?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
export const BUSINESS = {
  name: 'Benjamin Arnedo',
  role: 'Design · Photography · Motion',
  email: CONTACT_EMAIL,
  site: 'benjaminarnedo.com',
  location: 'Brisbane, Australia',
};

/** Hourly rates by craft. The only place rates are defined. */
export const RATES: Record<RateId, number> = {
  design: 100, // graphic design, branding, web design, consultancy
  post: 100,   // editing, grading, retouching
  shoot: 120,  // on-set / on-location time
  build: 140,  // frontend & WordPress build
  motion: 150, // motion graphics & animation
};

export const RATE_LABELS: Record<RateId, string> = {
  design: 'Design',
  post: 'Post-production',
  shoot: 'Shoot',
  build: 'Build',
  motion: 'Motion',
};

/* ───────────────────── Reusable param builders ───────────────────── */

const qty = (
  id: string, label: string, unit: string,
  o: { min: number; max: number; step?: number; default: number; hoursPer?: number; feePer?: number; help?: string },
) => ({ kind: 'qty' as const, id, label, unit, step: 1, ...o });

const crew = (id = 'crew') => ({
  kind: 'choice' as const,
  id,
  label: 'Crew',
  default: 'solo',
  help: 'More hands on the day means more cost, but a faster and more controlled shoot.',
  options: [
    { id: 'solo', label: 'Just me', desc: 'Solo operator.', hoursMult: 1 },
    { id: 'assist', label: '+ Assistant', desc: 'Second pair of hands for lighting and gear.', hoursMult: 1.4 },
    { id: 'full', label: 'Full crew', desc: 'Second operator plus assistant.', hoursMult: 1.85 },
  ],
});

/* ─────────────────────────── Catalogue ─────────────────────────── */

export const DISCIPLINES: Discipline[] = [
  {
    id: 'graphic-design',
    label: 'Graphic design',
    blurb: 'Editorial, collateral, campaign and print — all kinds of graphic design.',
    items: [
      {
        id: 'gd-editorial',
        name: 'Editorial & publication design',
        desc: 'Magazines, reports, books, catalogues.',
        rate: 'design',
        baseHours: 6,
        params: [
          qty('pages', 'Pages', 'page', { min: 4, max: 300, default: 24, hoursPer: 0.6 }),
          {
            kind: 'choice', id: 'scope', label: 'Scope', default: 'full',
            options: [
              { id: 'template', label: 'Master pages only', desc: 'I design the system, you flow the content.', hoursMult: 0.45 },
              { id: 'full', label: 'Full layout', desc: 'Every page laid out and typeset.', hoursMult: 1 },
              { id: 'full-art', label: 'Full layout + art direction', desc: 'Including image sourcing and commissioning.', hoursMult: 1.35 },
            ],
          },
        ],
      },
      {
        id: 'gd-collateral',
        name: 'Marketing & brand collateral',
        desc: 'Flyers, posters, brochures, stationery.',
        rate: 'design',
        params: [
          qty('pieces', 'Pieces', 'piece', { min: 1, max: 40, default: 3, hoursPer: 3.5 }),
          {
            kind: 'choice', id: 'complexity', label: 'Complexity', default: 'standard',
            options: [
              { id: 'simple', label: 'Templated', desc: 'Working inside an existing identity.', hoursMult: 0.6 },
              { id: 'standard', label: 'Standard', hoursMult: 1 },
              { id: 'bespoke', label: 'Bespoke', desc: 'Original concept per piece.', hoursMult: 1.7 },
            ],
          },
        ],
      },
      {
        id: 'gd-presentation',
        name: 'Presentation & deck design',
        rate: 'design',
        baseHours: 3,
        params: [
          qty('slides', 'Slides', 'slide', { min: 5, max: 120, default: 20, hoursPer: 0.5 }),
          {
            kind: 'choice', id: 'scope', label: 'Scope', default: 'full',
            options: [
              { id: 'template', label: 'Reusable template', desc: 'Master slides you populate yourself.', hoursMult: 0.55 },
              { id: 'full', label: 'Fully designed deck', hoursMult: 1 },
            ],
          },
        ],
      },
      {
        id: 'gd-social',
        name: 'Social & campaign assets',
        rate: 'design',
        params: [
          qty('assets', 'Assets', 'asset', { min: 1, max: 100, default: 10, hoursPer: 0.8 }),
          { kind: 'toggle', id: 'ratios', label: 'Adapted to every aspect ratio', desc: 'Feed, story, landscape versions of each asset.', hoursMult: 1.5 },
        ],
      },
      {
        id: 'gd-artwork',
        name: 'Print artwork & production',
        desc: 'Pre-flight, bleed, colour separation, printer liaison.',
        rate: 'design',
        params: [qty('artworks', 'Artworks', 'artwork', { min: 1, max: 50, default: 4, hoursPer: 1.5 })],
      },
    ],
  },

  {
    id: 'branding',
    label: 'Branding',
    blurb: 'Logos, identity systems and the manual that keeps them consistent.',
    items: [
      {
        id: 'br-discovery',
        name: 'Discovery & brand strategy',
        desc: 'Workshop, positioning, references, creative direction.',
        rate: 'design',
        baseHours: 8,
        params: [
          {
            kind: 'choice', id: 'depth', label: 'Depth', default: 'standard',
            options: [
              { id: 'light', label: 'Briefing call', desc: 'One session, written direction.', hoursMult: 0.4 },
              { id: 'standard', label: 'Workshop', desc: 'Half-day workshop plus strategy write-up.', hoursMult: 1 },
              { id: 'deep', label: 'Full strategy', desc: 'Research, audit, positioning and messaging.', hoursMult: 2.2 },
            ],
          },
        ],
      },
      {
        id: 'br-logo',
        name: 'Logo & wordmark',
        desc: 'Core mark, lockups and responsive variants.',
        rate: 'design',
        baseHours: 18,
        params: [
          {
            kind: 'choice', id: 'routes', label: 'Concept routes', default: '2',
            help: 'How many distinct directions I develop before we choose one.',
            options: [
              { id: '1', label: '1 route', desc: 'Focused — for a clear brief.', hoursMult: 0.7 },
              { id: '2', label: '2 routes', hoursMult: 1 },
              { id: '3', label: '3 routes', desc: 'Widest exploration.', hoursMult: 1.4 },
            ],
          },
          { kind: 'toggle', id: 'lockups', label: 'Full lockup set', desc: 'Horizontal, stacked, icon-only, mono and reversed.', hoursAdd: 6 },
        ],
      },
      {
        id: 'br-identity',
        name: 'Visual identity system',
        desc: 'Type, colour, graphic devices, art direction.',
        rate: 'design',
        baseHours: 14,
        params: [
          {
            kind: 'choice', id: 'scope', label: 'Scope', default: 'standard',
            options: [
              { id: 'core', label: 'Core', desc: 'Type and colour.', hoursMult: 0.6 },
              { id: 'standard', label: 'Standard', desc: 'Type, colour, graphic devices, imagery direction.', hoursMult: 1 },
              { id: 'expanded', label: 'Expanded', desc: 'Adds pattern, illustration and motion principles.', hoursMult: 1.6 },
            ],
          },
        ],
      },
      {
        id: 'br-manual',
        name: 'Brand identity manual',
        desc: 'The document that keeps everyone on-brand.',
        rate: 'design',
        baseHours: 6,
        params: [
          qty('pages', 'Pages', 'page', { min: 8, max: 160, default: 32, hoursPer: 0.8 }),
          {
            kind: 'choice', id: 'depth', label: 'Depth', default: 'standard',
            options: [
              { id: 'essential', label: 'Essentials', desc: 'Logo, colour, type, do/don’t.', hoursMult: 0.6 },
              { id: 'standard', label: 'Standard manual', hoursMult: 1 },
              { id: 'full', label: 'Full brand book', desc: 'Strategy, voice, applications, templates.', hoursMult: 1.6 },
            ],
          },
        ],
      },
      {
        id: 'br-applications',
        name: 'Identity applications',
        desc: 'The identity rolled out across real touchpoints.',
        rate: 'design',
        params: [qty('applications', 'Applications', 'application', { min: 1, max: 40, default: 6, hoursPer: 2.5 })],
      },
    ],
  },

  {
    id: 'photography',
    label: 'Photography',
    blurb: 'Shoot and edit — commercial, product, portrait, event, architectural.',
    items: [
      {
        id: 'ph-preprod',
        name: 'Pre-production & planning',
        desc: 'Brief, shot list, location scout, scheduling.',
        rate: 'design',
        baseHours: 3,
        params: [
          {
            kind: 'choice', id: 'scale', label: 'Scale', default: 'standard',
            options: [
              { id: 'light', label: 'Simple', desc: 'Brief and shot list.', hoursMult: 0.5 },
              { id: 'standard', label: 'Standard', hoursMult: 1 },
              { id: 'complex', label: 'Complex', desc: 'Casting, locations, permits, styling.', hoursMult: 2.4 },
            ],
          },
        ],
      },
      {
        id: 'ph-shoot',
        name: 'Shoot',
        desc: 'Time on location or in studio.',
        rate: 'shoot',
        licensable: true,
        onLocation: true,
        params: [
          qty('hours', 'Time on the day', 'hour', { min: 1, max: 12, default: 4, hoursPer: 1 }),
          crew(),
          { kind: 'toggle', id: 'lighting', label: 'Lighting & grip package', desc: 'Strobes, modifiers, stands.', feeAdd: 250 },
          { kind: 'toggle', id: 'studio', label: 'Studio hire', desc: 'Estimated — confirmed once we pick a space.', feeAdd: 450 },
        ],
      },
      {
        id: 'ph-edit',
        name: 'Selection, edit & retouch',
        rate: 'post',
        licensable: true,
        params: [
          qty('images', 'Final images', 'image', { min: 1, max: 400, default: 20, hoursPer: 0.3 }),
          {
            kind: 'choice', id: 'retouch', label: 'Retouch level', default: 'standard',
            options: [
              { id: 'standard', label: 'Standard', desc: 'Colour, crop, clean-up.', hoursMult: 1 },
              { id: 'advanced', label: 'Advanced', desc: 'Skin, product and detail retouching.', hoursMult: 1.9 },
              { id: 'composite', label: 'Composite', desc: 'Multi-frame builds and heavy manipulation.', hoursMult: 3.2 },
            ],
          },
        ],
      },
      {
        id: 'ph-delivery',
        name: 'Delivery & gallery',
        desc: 'Export sets, web/print versions, online gallery.',
        rate: 'post',
        baseHours: 1.5,
      },
    ],
  },

  {
    id: 'videography',
    label: 'Videography',
    blurb: 'Shoot, shoot + edit, or edit alone. Brand films, ads, docs, social.',
    items: [
      {
        id: 'vd-preprod',
        name: 'Concept, treatment & planning',
        rate: 'design',
        baseHours: 6,
        params: [
          {
            kind: 'choice', id: 'scale', label: 'Scale', default: 'standard',
            options: [
              { id: 'light', label: 'Simple', desc: 'Brief, shot list, schedule.', hoursMult: 0.5 },
              { id: 'standard', label: 'Standard', desc: 'Treatment, storyboard, schedule.', hoursMult: 1 },
              { id: 'complex', label: 'Complex', desc: 'Scripting, casting, locations, permits.', hoursMult: 2.5 },
            ],
          },
        ],
      },
      {
        id: 'vd-shoot',
        name: 'Shoot',
        desc: 'Camera time on location or in studio.',
        rate: 'shoot',
        licensable: true,
        onLocation: true,
        params: [
          qty('hours', 'Time on the day', 'hour', { min: 2, max: 14, default: 8, hoursPer: 1 }),
          crew(),
          { kind: 'toggle', id: 'lighting', label: 'Lighting & grip package', feeAdd: 350 },
          { kind: 'toggle', id: 'audio', label: 'Professional audio kit', desc: 'Radio mics, boom, recorder.', feeAdd: 150 },
          { kind: 'toggle', id: 'gimbal', label: 'Gimbal / movement kit', feeAdd: 120 },
          { kind: 'toggle', id: 'interviews', label: 'Interview setup', desc: 'Two-camera interview lighting and sound.', hoursAdd: 2, feeAdd: 100 },
        ],
      },
      {
        id: 'vd-edit',
        name: 'Edit',
        desc: 'Assembly, story, pacing, music, delivery master.',
        rate: 'post',
        licensable: true,
        params: [
          qty('minutes', 'Finished runtime', 'minute', { min: 1, max: 60, default: 2, hoursPer: 5 }),
          {
            kind: 'choice', id: 'complexity', label: 'Edit complexity', default: 'standard',
            options: [
              { id: 'simple', label: 'Simple', desc: 'Single camera, minimal footage.', hoursMult: 0.7 },
              { id: 'standard', label: 'Standard', hoursMult: 1 },
              { id: 'complex', label: 'Complex', desc: 'Multi-cam, heavy rushes, layered story.', hoursMult: 1.7 },
            ],
          },
        ],
      },
      {
        id: 'vd-cutdowns',
        name: 'Cutdowns & versions',
        desc: 'Social edits, alternate ratios, subtitled versions.',
        rate: 'post',
        params: [
          qty('versions', 'Versions', 'version', { min: 1, max: 30, default: 3, hoursPer: 1.5 }),
          { kind: 'toggle', id: 'subs', label: 'Burnt-in subtitles & captions', hoursAdd: 1.5 },
        ],
      },
    ],
  },

  {
    id: 'post',
    label: 'Post-production',
    blurb: 'Edit, colour grade, sound and retouch — on footage you already have.',
    items: [
      {
        id: 'po-edit',
        name: 'Edit from supplied footage',
        rate: 'post',
        params: [
          qty('minutes', 'Finished runtime', 'minute', { min: 1, max: 60, default: 3, hoursPer: 5 }),
          {
            kind: 'choice', id: 'rushes', label: 'How much footage?', default: 'medium',
            help: 'Sorting and reviewing rushes is often the longest part of an edit.',
            options: [
              { id: 'light', label: 'Under an hour', hoursMult: 0.8 },
              { id: 'medium', label: '1–5 hours', hoursMult: 1 },
              { id: 'heavy', label: '5+ hours', hoursMult: 1.5 },
            ],
          },
        ],
      },
      {
        id: 'po-colour',
        name: 'Colour grade',
        rate: 'post',
        params: [
          qty('minutes', 'Runtime graded', 'minute', { min: 1, max: 60, default: 3, hoursPer: 1.5 }),
          {
            kind: 'choice', id: 'depth', label: 'Grade', default: 'creative',
            options: [
              { id: 'correct', label: 'Correction', desc: 'Balance, match, clean.', hoursMult: 0.65 },
              { id: 'creative', label: 'Creative grade', desc: 'A deliberate look.', hoursMult: 1 },
              { id: 'lookdev', label: 'Full look development', desc: 'Custom look built and applied shot by shot.', hoursMult: 1.7 },
            ],
          },
        ],
      },
      {
        id: 'po-sound',
        name: 'Sound design & mix',
        rate: 'post',
        params: [qty('minutes', 'Runtime mixed', 'minute', { min: 1, max: 60, default: 3, hoursPer: 1.2 })],
      },
      {
        id: 'po-retouch',
        name: 'Image retouching',
        desc: 'On images you supply.',
        rate: 'post',
        params: [
          qty('images', 'Images', 'image', { min: 1, max: 300, default: 10, hoursPer: 0.5 }),
          {
            kind: 'choice', id: 'level', label: 'Level', default: 'standard',
            options: [
              { id: 'standard', label: 'Standard', hoursMult: 1 },
              { id: 'advanced', label: 'Advanced', hoursMult: 1.9 },
              { id: 'composite', label: 'Composite', hoursMult: 3.2 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'motion',
    label: 'Animated graphics',
    blurb: 'Motion graphics — animating your design, or designing and animating it.',
    items: [
      {
        id: 'mo-animation',
        name: 'Animated graphics',
        rate: 'motion',
        params: [
          qty('seconds', 'Finished animation', 'second', { min: 5, max: 600, default: 30, hoursPer: 0.35 }),
          {
            kind: 'choice', id: 'source', label: 'Whose design?', default: 'supplied',
            help: 'Animating a finished design is faster than designing the frames first.',
            options: [
              { id: 'supplied', label: 'You supply the design', desc: 'Layered, production-ready artwork.', hoursMult: 1 },
              { id: 'supplied-prep', label: 'You supply it, I prep it', desc: 'Artwork needs rebuilding for animation.', hoursMult: 1.35 },
              { id: 'mine', label: 'I design it too', desc: 'I design the frames, then animate them.', hoursMult: 1.9 },
            ],
          },
          {
            kind: 'choice', id: 'complexity', label: 'Complexity', default: 'standard',
            options: [
              { id: 'simple', label: 'Simple', desc: 'Transitions and type in motion.', hoursMult: 0.65 },
              { id: 'standard', label: 'Standard', hoursMult: 1 },
              { id: 'complex', label: 'Complex', desc: 'Character, 3D or intricate systems.', hoursMult: 1.9 },
            ],
          },
          { kind: 'toggle', id: 'sound', label: 'Sound design', hoursAdd: 3 },
        ],
      },
      {
        id: 'mo-titles',
        name: 'Titles, lower thirds & endplates',
        desc: 'Reusable animated templates.',
        rate: 'motion',
        params: [qty('elements', 'Elements', 'element', { min: 1, max: 30, default: 4, hoursPer: 1.5 })],
      },
      {
        id: 'mo-sting',
        name: 'Animated logo / sting',
        rate: 'motion',
        baseHours: 8,
        params: [
          {
            kind: 'choice', id: 'complexity', label: 'Complexity', default: 'standard',
            options: [
              { id: 'simple', label: 'Simple reveal', hoursMult: 0.6 },
              { id: 'standard', label: 'Standard', hoursMult: 1 },
              { id: 'complex', label: 'Complex / 3D', hoursMult: 2.1 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'web',
    label: 'Web design',
    blurb: 'Static sites, custom builds, WordPress and UI/UX consultancy.',
    items: [
      {
        id: 'we-design',
        name: 'Website design',
        desc: 'The design itself, before any build.',
        rate: 'design',
        baseHours: 6,
        params: [
          qty('pages', 'Pages / templates', 'page', { min: 1, max: 60, default: 5, hoursPer: 5 }),
          {
            kind: 'choice', id: 'fidelity', label: 'Fidelity', default: 'full',
            options: [
              { id: 'wire', label: 'Wireframes', desc: 'Structure and hierarchy only.', hoursMult: 0.45 },
              { id: 'full', label: 'Full visual design', hoursMult: 1 },
              { id: 'proto', label: 'Design + prototype', desc: 'Clickable, with motion specified.', hoursMult: 1.35 },
            ],
          },
          { kind: 'toggle', id: 'mobile', label: 'Mobile designed separately', desc: 'Not just a reflow — a considered mobile layout.', hoursMult: 1.4 },
        ],
      },
      {
        id: 'we-static',
        name: 'Static website build',
        desc: 'Fast, hand-built, no CMS.',
        rate: 'build',
        params: [qty('pages', 'Pages', 'page', { min: 1, max: 40, default: 5, hoursPer: 3.5 })],
      },
      {
        id: 'we-custom',
        name: 'Custom website build',
        desc: 'Bespoke frontend — animated, responsive, production-ready.',
        rate: 'build',
        baseHours: 8,
        params: [
          qty('templates', 'Templates', 'template', { min: 1, max: 40, default: 6, hoursPer: 8 }),
          { kind: 'toggle', id: 'cms', label: 'CMS integration', desc: 'So you can edit content yourself.', hoursAdd: 16 },
          { kind: 'toggle', id: 'motion', label: 'Advanced motion & interaction', hoursMult: 1.35 },
        ],
      },
      {
        id: 'we-wordpress',
        name: 'WordPress build',
        rate: 'build',
        baseHours: 6,
        params: [
          qty('templates', 'Templates', 'template', { min: 1, max: 40, default: 6, hoursPer: 5 }),
          {
            kind: 'choice', id: 'approach', label: 'Approach', default: 'theme',
            options: [
              { id: 'existing', label: 'Existing theme', desc: 'Configured and styled.', hoursMult: 0.6 },
              { id: 'theme', label: 'Customised theme', hoursMult: 1 },
              { id: 'custom', label: 'Custom theme', desc: 'Built from scratch to the design.', hoursMult: 1.8 },
            ],
          },
          { kind: 'toggle', id: 'woo', label: 'WooCommerce', hoursAdd: 14 },
        ],
      },
      {
        id: 'we-uxui',
        name: 'UI/UX consultancy',
        desc: 'Audit, advice, and direction on an existing product.',
        rate: 'design',
        params: [qty('hours', 'Time', 'hour', { min: 2, max: 80, default: 8, hoursPer: 1 })],
      },
    ],
  },

  {
    id: 'consultancy',
    label: 'Design consultancy',
    blurb: 'Branding, design and signage advice — without a full project.',
    items: [
      {
        id: 'co-session',
        name: 'Consultancy sessions',
        desc: 'Working sessions on whatever you need solved.',
        rate: 'design',
        params: [qty('hours', 'Time', 'hour', { min: 1, max: 80, default: 6, hoursPer: 1 })],
      },
      {
        id: 'co-audit',
        name: 'Brand & design audit',
        desc: 'A documented review with recommendations.',
        rate: 'design',
        baseHours: 8,
        params: [
          {
            kind: 'choice', id: 'scope', label: 'Scope', default: 'standard',
            options: [
              { id: 'light', label: 'Focused', desc: 'One area — identity, or web, or print.', hoursMult: 0.5 },
              { id: 'standard', label: 'Standard', hoursMult: 1 },
              { id: 'deep', label: 'Everything', desc: 'Every touchpoint, plus a roadmap.', hoursMult: 2 },
            ],
          },
        ],
      },
      {
        id: 'co-signage',
        name: 'Signage & wayfinding',
        desc: 'Design and specification for fabrication.',
        rate: 'design',
        params: [
          qty('signs', 'Sign types', 'sign type', { min: 1, max: 40, default: 4, hoursPer: 2.5 }),
          { kind: 'toggle', id: 'specs', label: 'Fabrication specs & drawings', desc: 'Ready to hand to a fabricator.', hoursAdd: 6 },
        ],
      },
      {
        id: 'co-artdirection',
        name: 'Art direction',
        desc: 'Directing a shoot or campaign you’re producing.',
        rate: 'design',
        onLocation: true,
        params: [qty('days', 'Days', 'day', { min: 1, max: 20, default: 2, hoursPer: 8 })],
      },
    ],
  },

  {
    id: 'event-visuals',
    label: 'Event visuals',
    blurb: 'Screen content and live visuals — corporate, bands and events.',
    items: [
      {
        id: 'ev-content',
        name: 'Screen content package',
        desc: 'Loops, stings, holding slides, lower thirds.',
        rate: 'motion',
        params: [
          qty('assets', 'Assets', 'asset', { min: 1, max: 60, default: 6, hoursPer: 3 }),
          { kind: 'toggle', id: 'custom-res', label: 'Non-standard screen resolution', desc: 'LED walls, ultrawide, multi-screen.', hoursMult: 1.4 },
        ],
      },
      {
        id: 'ev-band',
        name: 'Band / artist visual set',
        desc: 'A synced visual set for live performance.',
        rate: 'motion',
        params: [
          qty('tracks', 'Tracks', 'track', { min: 1, max: 40, default: 6, hoursPer: 4 }),
          { kind: 'toggle', id: 'reactive', label: 'Audio-reactive / live-triggered', hoursMult: 1.5 },
        ],
      },
      {
        id: 'ev-stage',
        name: 'Stage & screen design',
        rate: 'design',
        baseHours: 8,
        params: [
          {
            kind: 'choice', id: 'scale', label: 'Scale', default: 'standard',
            options: [
              { id: 'small', label: 'Single screen', hoursMult: 0.6 },
              { id: 'standard', label: 'Standard stage', hoursMult: 1 },
              { id: 'large', label: 'Large / multi-screen', hoursMult: 1.9 },
            ],
          },
        ],
      },
      {
        id: 'ev-live',
        name: 'On-site operation',
        desc: 'Running the visuals live on the day.',
        rate: 'shoot',
        onLocation: true,
        params: [
          qty('hours', 'Time on site', 'hour', { min: 2, max: 16, default: 6, hoursPer: 1 }),
          { kind: 'toggle', id: 'rehearsal', label: 'Rehearsal / tech day', hoursAdd: 6 },
          { kind: 'toggle', id: 'kit', label: 'Playback kit & laptop', feeAdd: 300 },
        ],
      },
    ],
  },
];

/* ─────────────────── Project-level modifiers ─────────────────── */

export const TURNAROUND: TurnaroundTier[] = [
  { id: 'standard', label: 'Standard', desc: 'An agreed schedule that suits the work.', mult: 1 },
  { id: 'tight', label: 'Tight — 2 weeks', desc: 'Prioritised over other work.', mult: 1.2 },
  { id: 'rush', label: 'Rush — 1 week', desc: 'Bumps everything else in the queue.', mult: 1.4 },
  { id: 'urgent', label: 'Next-day / weekend', desc: 'Evenings and weekends to hit it.', mult: 1.75 },
];

export const TRAVEL: TravelZone[] = [
  { id: 'local', label: 'Brisbane & Gold Coast', desc: 'No travel charge.', hours: 0, expenses: 0 },
  { id: 'seqld', label: 'South-East QLD', desc: 'Within about two hours’ drive.', hours: 3, expenses: 80 },
  { id: 'regional', label: 'Regional Queensland', desc: 'Travel time plus vehicle and accommodation.', hours: 8, expenses: 450 },
  { id: 'interstate', label: 'Interstate', desc: 'Flights and accommodation estimated.', hours: 6, expenses: 900 },
  { id: 'international', label: 'International', desc: 'Costed once we know the destination.', hours: 12, expenses: 0, poa: true },
];

export const LICENCES: LicenceTier[] = [
  { id: 'organic', label: 'Internal & organic social', desc: 'Your own channels, website and socials. No paid media.', fee: 0 },
  { id: 'twelve', label: '12 months, single market', desc: 'Paid media in one market for a year.', fee: 600 },
  { id: 'national', label: 'National campaign, 12 months', desc: 'Paid media nationally for a year.', fee: 1800 },
  { id: 'buyout', label: 'Full buyout', desc: 'Unlimited use, in perpetuity, worldwide.', fee: 0, poa: true },
];

export const PRICING: PricingConfig = {
  rates: RATES,
  turnaround: TURNAROUND,
  travel: TRAVEL,
  licences: LICENCES,
  revisionsIncluded: 2,
  revisionHours: 4,
  revisionRate: 'design',
  depositPercent: 0.5,
  sourceFiles: { percent: 0.2, min: 250 },
};

export const QUOTE_VALID_DAYS = 30;

/** Flat index of every item, for lookups by id. */
export const ALL_ITEMS: Record<string, { item: CatalogItem; discipline: Discipline }> = Object.fromEntries(
  DISCIPLINES.flatMap((d) => d.items.map((item) => [item.id, { item, discipline: d }])),
);
