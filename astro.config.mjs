import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Required for canonical URLs, the sitemap, and absolute social-image URLs.
  // Social scrapers reject relative image paths, so without this every share
  // renders as a bare link. The apex 301s to www, so www is canonical.
  site: 'https://www.andrewgarman.com',
  integrations: [sitemap()],
  vite: {
    build: {
      // Astro inlines hoisted <script> chunks under this size (default 4096
      // bytes) as literal JS straight into the HTML instead of emitting them
      // as external /_astro/*.js files. That breaks a CSP script-src that
      // doesn't allow 'unsafe-inline' — forcing everything external lets the
      // site's CSP stay 'self'-only for scripts. No image is ES-module
      // imported anywhere in src/, so this only affects script bundling.
      assetsInlineLimit: 0,
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
});
