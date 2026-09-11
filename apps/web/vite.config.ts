import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1400,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
