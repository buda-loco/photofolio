import { defineConfig } from 'tinacms'

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
      {
        name: 'projects',
        label: 'Projects',
        path: 'src/content/projects',
        format: 'json',
        fields: [
          { name: 'title', label: 'Title', type: 'string', required: true },
          { name: 'slug', label: 'Slug', type: 'string', required: true },
          { name: 'year', label: 'Year', type: 'number' },
          { name: 'hidden', label: 'Hidden', type: 'boolean' },
        ],
      },
    ],
  },
})
