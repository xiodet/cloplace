import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`          → the real site in dist/ (photos load from the brands' own servers)
// `npm run build:single`   → one self-contained HTML file
// `npm run build:preview`  → offline preview in dist-preview/: stable file names, and only the
//                            items whose photo is cached locally (remote images are blocked there)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : mode === 'preview' ? 'dist-preview' : 'dist',
    assetsInlineLimit: mode === 'preview' ? 0 : undefined,
    rollupOptions: mode === 'preview'
      ? { output: { entryFileNames: 'assets/app.js', chunkFileNames: 'assets/[name].js', assetFileNames: 'assets/[name][extname]' } }
      : {},
  },
}));
