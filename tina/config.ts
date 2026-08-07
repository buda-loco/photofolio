/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'tinacms'
import servicesData from '../src/content/services.json'
const services: string[] = servicesData.items

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  'main'

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      // ── Projects ────────────────────────────────────────────────
      {
        name: 'projects',
        label: 'Projects',
        path: 'src/content/projects',
        format: 'json',
        ui: {
          filename: {
            slugify: (values: any) =>
              (values.slug || 'untitled')
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, ''),
          },
          // router maps each document to its page URL — enables the visual
          // editing tab and live sidebar in the Tina admin
          router: ({ document }: { document: any }) =>
            `/work/${document._sys.filename}`,
        },
        fields: [
          { name: 'slug', label: 'Slug (use hyphens, no spaces)', type: 'string', required: true },
          { name: 'title', label: 'Title', type: 'string', required: true },
          { name: 'category', label: 'Category', type: 'string' },
          { name: 'year', label: 'Year', type: 'number' },
          { name: 'cover', label: 'Cover image', type: 'image' },
          {
            name: 'coverAspect',
            label: 'Cover aspect ratio',
            type: 'string',
            options: [
              { value: '21/9', label: 'Ultrawide 21:9' },
              { value: '16/9', label: 'Landscape 16:9' },
              { value: '3/2', label: 'Landscape 3:2' },
              { value: '4/3', label: 'Landscape 4:3' },
              { value: '1/1', label: 'Square' },
              { value: '3/4', label: 'Portrait 3:4' },
              { value: '2/3', label: 'Portrait 2:3' },
            ],
          },
          {
            name: 'gridSize',
            label: 'Grid size',
            type: 'string',
            options: [
              { value: 'large', label: 'Large' },
              { value: 'medium', label: 'Medium' },
              { value: 'small', label: 'Small' },
            ],
          },
          { name: 'gridOffset', label: 'Grid column offset', type: 'number' },
          { name: 'featured', label: 'Feature in homepage', type: 'boolean' },
          { name: 'backgroundColor', label: 'Background colour', type: 'string' },
          { name: 'backgroundColorSecondary', label: 'Background colour (secondary)', type: 'string' },
          { name: 'textColor', label: 'Text colour', type: 'string' },
          { name: 'primaryColor', label: 'Primary colour (button/link text)', type: 'string' },
          { name: 'secondaryColor', label: 'Secondary colour (button/link bg, video bg, logo)', type: 'string' },
          { name: 'invertColors', label: 'Invert primary/secondary', type: 'boolean' },
          {
            name: 'services',
            label: 'Services',
            type: 'string',
            list: true,
            options: services.map((s: string) => ({ value: s, label: s })),
          },
          { name: 'ctaLabel', label: 'CTA button label (e.g. Visit Website)', type: 'string' },
          { name: 'ctaUrl', label: 'CTA button URL', type: 'string' },
          {
            name: 'info',
            label: 'Project info',
            type: 'object',
            fields: [
              { name: 'about', label: 'About', type: 'rich-text', parser: { type: 'slatejson' } },
              { name: 'date', label: 'Date', type: 'string' },
              { name: 'place', label: 'Place', type: 'string' },
              { name: 'client', label: 'Client', type: 'string' },
            ],
          },
          {
            name: 'blocks',
            label: 'Content blocks',
            type: 'object',
            list: true,
            templates: [
              {
                name: 'hero',
                label: 'Hero image',
                fields: [
                  { name: 'src', label: 'Image', type: 'image' },
                  { name: 'alt', label: 'Alt text', type: 'string' },
                  {
                    name: 'aspectRatio',
                    label: 'Aspect ratio',
                    type: 'string',
                    options: [
                      { value: '21/9', label: 'Ultrawide 21:9' },
                      { value: '16/9', label: 'Landscape 16:9' },
                      { value: '3/2', label: 'Landscape 3:2' },
                      { value: '4/3', label: 'Landscape 4:3' },
                      { value: '1/1', label: 'Square' },
                      { value: '3/4', label: 'Portrait 3:4' },
                    ],
                  },
                  { name: 'parallax', label: 'Parallax strength', type: 'number' },
                  { name: 'caption', label: 'Caption', type: 'string' },
                ],
              },
              {
                name: 'gallery',
                label: 'Gallery',
                fields: [
                  {
                    name: 'columns',
                    label: 'Columns',
                    type: 'string',
                    options: [
                      { value: '1', label: '1 column' },
                      { value: '2', label: '2 columns' },
                      { value: '3', label: '3 columns' },
                    ],
                  },
                  {
                    name: 'images',
                    label: 'Images',
                    type: 'object',
                    list: true,
                    fields: [
                      { name: 'src', label: 'Image', type: 'image' },
                      { name: 'alt', label: 'Alt text', type: 'string' },
                      { name: 'aspectRatio', label: 'Aspect ratio (optional override)', type: 'string' },
                    ],
                  },
                ],
              },
              {
                name: 'video',
                label: 'Video',
                fields: [
                  {
                    name: 'provider',
                    label: 'Provider',
                    type: 'string',
                    options: [
                      { value: 'dropbox', label: 'Dropbox' },
                      { value: 'vimeo', label: 'Vimeo' },
                      { value: 'youtube', label: 'YouTube' },
                    ],
                  },
                  { name: 'src', label: 'Dropbox URL', type: 'string' },
                  { name: 'id', label: 'Vimeo / YouTube ID', type: 'string' },
                  { name: 'poster', label: 'Poster image', type: 'image' },
                  { name: 'caption', label: 'Caption', type: 'string' },
                  { name: 'autoplay', label: 'Autoplay', type: 'boolean' },
                  { name: 'muted', label: 'Muted', type: 'boolean' },
                  { name: 'loop', label: 'Loop', type: 'boolean' },
                ],
              },
              {
                name: 'widescreen_video',
                label: 'Widescreen video',
                fields: [
                  { name: 'url', label: 'Dropbox URL', type: 'string' },
                  { name: 'poster', label: 'Poster image', type: 'image' },
                  { name: 'autoplay', label: 'Autoplay', type: 'boolean' },
                  { name: 'muted', label: 'Muted', type: 'boolean' },
                  { name: 'loop', label: 'Loop', type: 'boolean' },
                  {
                    name: 'aspectRatio',
                    label: 'Aspect ratio',
                    type: 'string',
                    options: [
                      { value: '16/9', label: 'Landscape 16:9' },
                      { value: '21/9', label: 'Ultrawide 21:9' },
                      { value: '3/2', label: 'Landscape 3:2' },
                      { value: '4/3', label: 'Landscape 4:3' },
                    ],
                  },
                  { name: 'caption', label: 'Caption', type: 'string' },
                ],
              },
              {
                name: 'vertical_reel',
                label: 'Vertical reel',
                fields: [
                  {
                    name: 'video',
                    label: 'Video',
                    type: 'object',
                    fields: [
                      { name: 'url', label: 'Dropbox URL', type: 'string' },
                      { name: 'poster', label: 'Poster image', type: 'image' },
                      { name: 'autoplay', label: 'Autoplay', type: 'boolean' },
                      { name: 'muted', label: 'Muted', type: 'boolean' },
                      { name: 'loop', label: 'Loop', type: 'boolean' },
                    ],
                  },
                  {
                    name: 'images',
                    label: 'Images (max 2)',
                    type: 'object',
                    list: true,
                    fields: [
                      { name: 'src', label: 'Image', type: 'image' },
                      { name: 'alt', label: 'Alt text', type: 'string' },
                    ],
                  },
                  { name: 'caption', label: 'Caption', type: 'string' },
                ],
              },
              {
                name: 'vertical_grid',
                label: 'Vertical grid (4-up)',
                fields: [
                  {
                    name: 'items',
                    label: 'Items (up to 4)',
                    type: 'object',
                    list: true,
                    fields: [
                      {
                        name: 'type',
                        label: 'Type',
                        type: 'string',
                        options: [
                          { value: 'image', label: 'Image' },
                          { value: 'video', label: 'Video' },
                        ],
                      },
                      { name: 'src', label: 'Image', type: 'image' },
                      { name: 'alt', label: 'Alt text', type: 'string' },
                      { name: 'videoUrl', label: 'Dropbox video URL', type: 'string' },
                      { name: 'poster', label: 'Video poster image', type: 'image' },
                      { name: 'autoplay', label: 'Autoplay video', type: 'boolean' },
                      { name: 'muted', label: 'Muted', type: 'boolean' },
                      { name: 'loop', label: 'Loop', type: 'boolean' },
                    ],
                  },
                  { name: 'caption', label: 'Caption', type: 'string' },
                ],
              },
              {
                name: 'text',
                label: 'Text block',
                fields: [
                  { name: 'heading', label: 'Heading', type: 'string' },
                  { name: 'body', label: 'Body text', type: 'rich-text', parser: { type: 'slatejson' } },
                ],
              },
            ],
          },
        ],
      },

      // ── About ────────────────────────────────────────────────────
      {
        name: 'about',
        label: 'About',
        path: 'src/content',
        match: { include: 'about' },
        format: 'json',
        ui: {
          router: () => '/about',
        },
        fields: [
          { name: 'name', label: 'Name', type: 'string' },
          { name: 'title', label: 'Tagline', type: 'string' },
          { name: 'bio', label: 'Bio', type: 'rich-text', parser: { type: 'slatejson' } },
          { name: 'portrait', label: 'Portrait photo', type: 'image' },
          { name: 'clients', label: 'Clients', type: 'string', list: true },
          { name: 'email', label: 'Email', type: 'string' },
          { name: 'instagram', label: 'Instagram URL', type: 'string' },
          { name: 'vimeo', label: 'Vimeo URL', type: 'string' },
          { name: 'linkedin', label: 'LinkedIn URL', type: 'string' },
          { name: 'seek', label: 'SEEK profile URL', type: 'string' },
        ],
      },

      // ── How I Work ───────────────────────────────────────────────
      {
        name: 'howIWork',
        label: 'How I Work',
        path: 'src/content',
        match: { include: 'how-i-work' },
        format: 'json',
        ui: {
          router: () => '/how-i-work',
        },
        fields: [
          { name: 'title', label: 'Page title', type: 'string' },
          { name: 'intro', label: 'Intro text', type: 'rich-text', parser: { type: 'slatejson' } },
          {
            name: 'steps',
            label: 'Steps',
            type: 'object',
            list: true,
            fields: [
              { name: 'number', label: 'Number', type: 'string' },
              { name: 'title', label: 'Title', type: 'string' },
              { name: 'body', label: 'Body', type: 'rich-text', parser: { type: 'slatejson' } },
            ],
          },
          {
            name: 'cta',
            label: 'Call to action',
            type: 'object',
            fields: [
              { name: 'text', label: 'Text', type: 'string' },
              { name: 'link', label: 'Link', type: 'string' },
              { name: 'label', label: 'Button label', type: 'string' },
            ],
          },
        ],
      },

      // ── Services ───────────────────────────────────────────────
      {
        name: 'services',
        label: 'Services',
        path: 'src/content',
        match: { include: 'services' },
        format: 'json',
        fields: [
          {
            name: 'items',
            label: 'Services',
            type: 'string',
            list: true,
            description: 'Add or remove services here. Restart the CMS to see new options in project forms.',
          },
        ],
      },

      // ── Design tokens ────────────────────────────────────────────
      {
        name: 'design',
        label: 'Design',
        path: 'src/content',
        match: { include: 'design' },
        format: 'json',
        ui: {
          // @ts-ignore
          previewUrl: () => ({ url: 'http://localhost:3000' }),
        } as any,
        fields: [
          {
            name: 'colors',
            label: 'Colors',
            type: 'object',
            fields: [
              { name: 'background', label: 'Background', type: 'string' },
              { name: 'text', label: 'Text', type: 'string' },
              { name: 'textMuted', label: 'Muted text', type: 'string' },
              { name: 'textBright', label: 'Bright text', type: 'string' },
              { name: 'border', label: 'Border', type: 'string' },
              { name: 'labelColor', label: 'Label colour', type: 'string' },
            ],
          },
          {
            name: 'typography',
            label: 'Typography',
            type: 'object',
            fields: [
              { name: 'sans', label: 'Sans font stack', type: 'string' },
              { name: 'display', label: 'Display font stack', type: 'string' },
              {
                name: 'headings',
                label: 'Headings',
                type: 'object',
                fields: [
                  { name: 'weight', label: 'Weight', type: 'string' },
                  { name: 'letterSpacing', label: 'Letter spacing', type: 'string' },
                  { name: 'lineHeight', label: 'Line height', type: 'string' },
                ],
              },
              {
                name: 'labels',
                label: 'Labels',
                type: 'object',
                fields: [
                  { name: 'size', label: 'Size', type: 'string' },
                  { name: 'letterSpacing', label: 'Letter spacing', type: 'string' },
                ],
              },
              {
                name: 'body',
                label: 'Body',
                type: 'object',
                fields: [
                  { name: 'size', label: 'Size', type: 'string' },
                  { name: 'lineHeight', label: 'Line height', type: 'string' },
                ],
              },
            ],
          },
          {
            name: 'textBlock',
            label: 'Text block',
            type: 'object',
            fields: [
              { name: 'headingSize', label: 'Heading size', type: 'string' },
              { name: 'headingWeight', label: 'Heading weight', type: 'string' },
              { name: 'headingLetterSpacing', label: 'Heading letter spacing', type: 'string' },
              { name: 'headingLineHeight', label: 'Heading line height', type: 'string' },
              { name: 'bodySize', label: 'Body size', type: 'string' },
              { name: 'bodyLineHeight', label: 'Body line height', type: 'string' },
              { name: 'maxWidth', label: 'Max width', type: 'string' },
              { name: 'gap', label: 'Gap', type: 'string' },
            ],
          },
          {
            name: 'buttons',
            label: 'Buttons',
            type: 'object',
            fields: [
              { name: 'fontSize', label: 'Font size', type: 'string' },
              { name: 'letterSpacing', label: 'Letter spacing', type: 'string' },
              { name: 'paddingV', label: 'Vertical padding', type: 'string' },
              { name: 'paddingH', label: 'Horizontal padding', type: 'string' },
            ],
          },
        ],
      },

      // ── Quotes (client quote builder) ───────────────────────────
      {
        name: 'quotes',
        label: 'Quotes',
        path: 'src/content/quotes',
        format: 'json',
        ui: {
          filename: {
            slugify: (values: any) =>
              (values.slug || 'untitled')
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, ''),
          },
          router: ({ document }: { document: any }) => `/quote/${document._sys.filename}`,
        },
        fields: [
          { name: 'slug', label: 'Slug (use hyphens, no spaces)', type: 'string', required: true },
          { name: 'client', label: 'Client name', type: 'string', required: true },
          { name: 'currency', label: 'Currency code (e.g. AUD)', type: 'string' },
          { name: 'eyebrow', label: 'Eyebrow (optional — defaults to “{Client} · Quote builder”)', type: 'string' },
          { name: 'title', label: 'Page title', type: 'string' },
          { name: 'lead', label: 'Intro paragraph', type: 'string', ui: { component: 'textarea' } },
          { name: 'contactEmail', label: 'Contact email (CTA)', type: 'string' },
          {
            name: 'budget',
            label: 'Budget slider',
            type: 'object',
            fields: [
              { name: 'min', label: 'Minimum', type: 'number' },
              { name: 'max', label: 'Maximum', type: 'number' },
              { name: 'step', label: 'Step', type: 'number' },
              { name: 'default', label: 'Default value', type: 'number' },
            ],
          },
          {
            name: 'workTypes',
            label: 'Types of work (hourly rates)',
            type: 'object',
            list: true,
            ui: { itemProps: (i: any) => ({ label: i?.label ? `${i.label} — $${i.rate ?? '?'}/h` : 'Work type' }) },
            fields: [
              { name: 'id', label: 'ID (referenced by hourly jobs)', type: 'string', required: true },
              { name: 'label', label: 'Label', type: 'string' },
              { name: 'rate', label: 'Rate ($/hour)', type: 'number' },
            ],
          },
          {
            name: 'focusOptions',
            label: 'Focus options (spend spare budget on)',
            type: 'object',
            list: true,
            ui: { itemProps: (i: any) => ({ label: i?.label || 'Focus' }) },
            fields: [
              { name: 'id', label: 'ID', type: 'string' },
              { name: 'label', label: 'Label', type: 'string' },
              { name: 'category', label: 'Work-type ID to prioritise (blank = balanced)', type: 'string' },
            ],
          },
          {
            name: 'phases',
            label: 'Phases (grouped deliverables)',
            type: 'object',
            list: true,
            ui: { itemProps: (i: any) => ({ label: i?.label ? `${i?.tier === 'extra' ? '✨ ' : ''}${i.label}` : 'Phase' }) },
            fields: [
              { name: 'id', label: 'ID', type: 'string', required: true },
              { name: 'label', label: 'Label', type: 'string' },
              {
                name: 'tier',
                label: 'Tier',
                type: 'string',
                options: [
                  { value: 'core', label: 'Core (the brief — funded first)' },
                  { value: 'extra', label: 'Extra (nice to have)' },
                ],
              },
              {
                name: 'deliverables',
                label: 'Deliverables',
                type: 'object',
                list: true,
                templates: [
                  {
                    name: 'hourly',
                    label: 'Job — by hours',
                    ui: { itemProps: (i: any) => ({ label: i?.name ? `⏱ ${i.name}` : 'Hourly job' }) },
                    fields: [
                      { name: 'id', label: 'ID', type: 'string', required: true },
                      { name: 'name', label: 'Name', type: 'string' },
                      { name: 'category', label: 'Work-type ID (must match a Type of work above)', type: 'string' },
                      { name: 'hours', label: 'Hours', type: 'number' },
                    ],
                  },
                  {
                    name: 'fixed',
                    label: 'Job — fixed price',
                    ui: { itemProps: (i: any) => ({ label: i?.name ? `$ ${i.name}` : 'Fixed-price job' }) },
                    fields: [
                      { name: 'id', label: 'ID', type: 'string', required: true },
                      { name: 'name', label: 'Name', type: 'string' },
                      { name: 'amount', label: 'Fixed price ($)', type: 'number' },
                      { name: 'estHours', label: 'Estimated hours (optional, display only)', type: 'number' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: 'discounts',
            label: 'Volume discounts (hours bundles)',
            type: 'object',
            list: true,
            ui: { itemProps: (i: any) => ({ label: i?.minHours != null && i?.percent != null ? `${i.minHours}h+ → ${i.percent}% off` : 'Discount tier' }) },
            fields: [
              { name: 'minHours', label: 'From total hours (≥)', type: 'number' },
              { name: 'percent', label: 'Discount % (off hourly work)', type: 'number' },
            ],
          },
          { name: 'promoCode', label: 'Promo code (blank = bundles open; set = locked until entered)', type: 'string' },
        ],
      },
    ],
  },
})
