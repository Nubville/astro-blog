import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'home', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'about', path: '/about' },
  { name: 'tags', path: '/tags' },
];

// Keep in sync with THEMES in Header.astro. Scanning every theme, not just
// whatever's currently the default, is deliberate: a real contrast bug and
// a real dead-selector bug (Astro's scoped-style compiler silently drops
// [data-theme='x'] rules — see the :global() usage across components) both
// went unnoticed for multiple commits because this suite only ever
// exercised the default theme.
const themes = ['paper', 'lamplight', 'horde', 'wayfinder'];

for (const { name, path } of pages) {
  for (const theme of themes) {
    test(`${name} page (${theme} theme) has no accessibility violations`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem('ag-theme', t);
      }, theme);
      await page.goto(path);
      // Wait for the site's custom elements to upgrade before scanning —
      // <theme-switcher> lives in Header.astro, rendered on every page via
      // BaseLayout, so it's a reliable signal the page has hydrated.
      await page.waitForFunction(() => customElements.get('theme-switcher') !== undefined);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();

      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
}
