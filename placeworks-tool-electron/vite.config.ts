import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// The tool's React source is NOT copied into this app — it's imported
// straight from the photofolio site tree (one level up) via these aliases,
// so the web tool and the desktop app share a single source of truth. The
// tool folder has no Next.js imports (verified), which is what makes this
// possible.
const repoRoot = path.resolve(__dirname, '..')

export default defineConfig({
  // Relative asset paths: the packaged app loads dist/index.html over
  // file://, where root-absolute /assets/... URLs would break.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@tool': path.resolve(repoRoot, 'src/app/presentations/placeworks/_components/tool'),
      '@deck': path.resolve(repoRoot, 'src/app/presentations/placeworks'),
    },
  },
  server: {
    port: 5199,
    strictPort: true,
    fs: {
      // Dev server must be allowed to serve files from outside this app's
      // own root, since the tool source lives in the parent repo.
      allow: [repoRoot],
    },
  },
  build: {
    outDir: 'dist',
  },
})
