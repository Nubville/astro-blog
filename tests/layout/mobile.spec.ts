import { expect, test } from '@playwright/test';

/**
 * Mobile layout guard.
 *
 * A regression this exists to catch: MarkdownPostLayout declared
 * `grid-area: posts` unconditionally, which was inert while main was
 * display:block below 1200px. Once main became a grid at every width, that
 * area name — with no matching grid-template-areas outside the 1400px
 * container query — made the browser invent implicit tracks, collapsing the
 * sidebar to 4px on phones. It shipped because the change was verified by
 * measuring *gaps between* children, never their widths.
 *
 * So: assert the shape of the layout, not just the spacing.
 */
const paths = [
  { name: 'home', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'about', path: '/about' },
  { name: 'tags', path: '/tags' },
  { name: 'post', path: '/posts/post-11-drupal-on-windows-wsl2' },
];

test.use({ viewport: { width: 390, height: 844 } });

for (const { name, path } of paths) {
  test(`${name} lays out as a single full-width column on mobile`, async ({ page }) => {
    await page.goto(path);
    await page.waitForFunction(() => customElements.get('theme-switcher') !== undefined);

    const result = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      const cols = getComputedStyle(main).gridTemplateColumns;
      const mainWidth = main.getBoundingClientRect().width;
      const kids = [...main.children]
        .filter((c) => getComputedStyle(c).display !== 'none')
        .map((c) => ({
          cls: (c.className || '').toString().slice(0, 30) || c.tagName,
          width: Math.round(c.getBoundingClientRect().width),
        }));
      // compare against the grid track, not main's border box — main carries
      // horizontal padding, so its border-box width is wider than the column
      // its children actually fill
      const trackWidth = Math.round(parseFloat(cols));
      return {
        trackCount: cols.split(' ').filter(Boolean).length,
        mainWidth: Math.round(mainWidth),
        trackWidth,
        kids,
        docWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      };
    });

    // one column — an unresolvable grid-area name silently creates extra tracks
    expect(result.trackCount, `main grid tracks (got ${result.trackCount})`).toBe(1);

    // every visible region actually fills that column, rather than collapsing
    for (const kid of result.kids) {
      expect(kid.width, `${kid.cls} width vs column ${result.trackWidth}`).toBeGreaterThanOrEqual(
        result.trackWidth - 2
      );
    }

    // and nothing pushes the page sideways
    expect(result.docWidth, 'horizontal overflow').toBeLessThanOrEqual(result.viewport + 1);
  });
}
