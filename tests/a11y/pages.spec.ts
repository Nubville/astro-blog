import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'home', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'about', path: '/about' },
  { name: 'tags', path: '/tags' },
];

for (const { name, path } of pages) {
  test(`${name} page has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for the site's custom elements to upgrade before scanning —
    // <theme-switcher> lives in Header.astro, rendered on every page via
    // BaseLayout, so it's a reliable signal the page has hydrated.
    await page.waitForFunction(() => customElements.get('theme-switcher') !== undefined);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
