import { defineConfig } from 'tinacms'

export default defineConfig({
  clientId: process.env.TINA_PUBLIC_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  branch: process.env.GITHUB_BRANCH ?? 'main',
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
            slugify: (values: Record<string, unknown>) =>
              (values.slug as string | undefined) ?? 'untitled',
          },
        },
        fields: [
          { name: 'slug', label: 'Slug', type: 'string', required: true },
          { name: 'title', label: 'Title', type: 'string', required: true },
          { name: 'category', label: 'Category', type: 'string' },
          { name: 'year', label: 'Year', type: 'number' },
          { name: 'cover', label: 'Cover image', type: 'image' },
          {
            name: 'coverAspect',
            label: 'Cover aspect ratio',
            type: 'string',
            options: [
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
          {
            name: 'gridOffset',
            label: 'Grid column offset',
            type: 'number',
          },
          { name: 'hidden', label: 'Hidden from homepage', type: 'boolean' },
          { name: 'backgroundColor', label: 'Background colour', type: 'string' },
          {
            name: 'info',
            label: 'Project info',
            type: 'object',
            fields: [
              {
                name: 'about',
                label: 'About',
                type: 'string',
                ui: { component: 'textarea' },
              },
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
                      { value: '16/9', label: 'Landscape 16:9' },
                      { value: '3/2', label: 'Landscape 3:2' },
                      { value: '4/3', label: 'Landscape 4:3' },
                      { value: '1/1', label: 'Square' },
                      { value: '3/4', label: 'Portrait 3:4' },
                    ],
                  },
                  {
                    name: 'parallax',
                    label: 'Parallax strength',
                    type: 'number',
                  },
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
                      {
                        name: 'aspectRatio',
                        label: 'Aspect ratio (optional override)',
                        type: 'string',
                      },
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
                ],
              },
              {
                name: 'text',
                label: 'Text block',
                fields: [
                  { name: 'heading', label: 'Heading', type: 'string' },
                  {
                    name: 'body',
                    label: 'Body text',
                    type: 'string',
                    ui: { component: 'textarea' },
                  },
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
        fields: [
          { name: 'name', label: 'Name', type: 'string' },
          { name: 'title', label: 'Tagline', type: 'string' },
          {
            name: 'bio',
            label: 'Bio paragraphs',
            type: 'string',
            list: true,
            ui: { component: 'textarea' },
          },
          { name: 'portrait', label: 'Portrait photo', type: 'image' },
          { name: 'clients', label: 'Clients', type: 'string', list: true },
          { name: 'email', label: 'Email', type: 'string' },
          { name: 'instagram', label: 'Instagram URL', type: 'string' },
          { name: 'vimeo', label: 'Vimeo URL', type: 'string' },
        ],
      },

      // ── How I Work ───────────────────────────────────────────────
      {
        name: 'howIWork',
        label: 'How I Work',
        path: 'src/content',
        match: { include: 'how-i-work' },
        format: 'json',
        fields: [
          { name: 'title', label: 'Page title', type: 'string' },
          {
            name: 'intro',
            label: 'Intro text',
            type: 'string',
            ui: { component: 'textarea' },
          },
          {
            name: 'steps',
            label: 'Steps',
            type: 'object',
            list: true,
            fields: [
              { name: 'number', label: 'Number', type: 'string' },
              { name: 'title', label: 'Title', type: 'string' },
              {
                name: 'body',
                label: 'Body',
                type: 'string',
                ui: { component: 'textarea' },
              },
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

      // ── Design tokens ────────────────────────────────────────────
      {
        name: 'design',
        label: 'Design',
        path: 'src/content',
        match: { include: 'design' },
        format: 'json',
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
    ],
  },
})
