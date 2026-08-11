import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Required for canonical URLs, the sitemap, and absolute social-image URLs.
  // Social scrapers reject relative image paths, so without this every share
  // renders as a bare link. The apex 301s to www, so www is canonical.
  site: 'https://www.andrewgarman.com',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
});
