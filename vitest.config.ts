import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Only job: teach vitest the "@/" alias that tsconfig and Next already know
// about, so test files can import the same way application code does.
// Everything else stays on vitest's defaults.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
