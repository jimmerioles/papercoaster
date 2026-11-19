import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/papercoaster/' : '/',
  build: {
    // three.js is the bulk of the bundle. 144 kB gzip is the cost of the 3D scene.
    chunkSizeWarningLimit: 650,
  },
}));
