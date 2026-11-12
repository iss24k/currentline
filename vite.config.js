import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // The optional Three.js renderer is a single 513 kB chunk (131 kB gzip).
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
