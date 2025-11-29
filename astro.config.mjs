import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  site: 'https://wrld.one',
  adapter: cloudflare({
    mode: 'directory',
    routes: {
      strategy: 'include',
      include: ['/*'],
    },
    // Enable image optimization at build time for prerendered pages
    imageService: 'compile',
  }),
  image: {
    // Use sharp for build-time image optimization
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'esbuild',
      // Optimize chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'motion': ['motion'],
          },
        },
      },
    },
    css: {
      devSourcemap: true,
    },
  },
  // Prefetch links for faster navigation
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
