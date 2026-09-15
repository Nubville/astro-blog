import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Required for canonical URLs, the sitemap, and absolute social-image URLs.
  // Social scrapers reject relative image paths, so without this every share
  // renders as a bare link. The apex 301s to www, so www is canonical.
  site: 'https://www.andrewgarman.com',
  // mdx() lets a post import and render a real Astro component (e.g.
  // CharacterStatBlock) inline in its body — plain .md can only embed raw
  // HTML. Every existing post stays .md; mdx is opt-in per file, for posts
  // that actually need a component. It inherits the `markdown` config below
  // (Shiki theme included) automatically, so code blocks render identically
  // in both.
  integrations: [mdx(), sitemap()],
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
      theme: 'github-dark-default',
      wrap: false,
    },
  },
});
