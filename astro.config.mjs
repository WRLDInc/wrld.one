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
  }),
  vite: {
    build: {
      cssMinify: true,
      minify: 'esbuild',
    },
    css: {
      devSourcemap: true,
    },
  },
});
