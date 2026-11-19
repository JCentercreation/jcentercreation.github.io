import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// jcentercreation.github.io is a GitHub *user* site, served from the domain root.
// Override with VITE_BASE (e.g. "/garage/") for a project-site or preview deploy.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    // The 3D engine is a lazy chunk (see App.tsx); it is large by nature.
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
  },
});
