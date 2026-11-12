import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      input: {
        atlas: fileURLToPath(new URL('./index.html', import.meta.url)),
        fieldGuide: fileURLToPath(new URL('./field-guide.html', import.meta.url)),
      },
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
