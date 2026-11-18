import { expect, test } from '@playwright/test';

/**
 * Phone-width guard for a post under review.
 *
 * Run with POST=/posts/post-NN-slug. Without it this file is skipped, so the
 * normal suite is unchanged. It exists because a post's own content (a table
 * holding a long hostname, a wide image) can widen the whole page, and that
 * was only ever found by eyeballing a screenshot.
 */
const post = process.env.POST;

test.skip(!post, 'set POST=/posts/post-NN-slug to check a new post');

for (const width of [375, 600]) {
  test(`${post} fits a ${width}px viewport without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(post!);
    await page.waitForFunction(() => customElements.get('theme-switcher') !== undefined);

    const result = await page.evaluate(() => {
      const right = (el: Element) => Math.round(el.getBoundingClientRect().right);
      const limit = window.innerWidth + 1;
      return {
        docWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        wideImages: [...document.images].filter((i) => right(i) > limit).map((i) => i.src),
        wideTables: [...document.querySelectorAll('table')]
          .filter((t) => right(t) > limit)
          .map((t) => t.textContent?.slice(0, 40) ?? 'table'),
        // Code may be wide, but only if the block itself scrolls.
        unscrollableCode: [...document.querySelectorAll('pre')]
          .filter(
            (p) => p.scrollWidth > p.clientWidth && getComputedStyle(p).overflowX === 'visible'
          )
          .map((p) => p.textContent?.slice(0, 40) ?? 'pre'),
      };
    });

    expect(result.docWidth, 'page is wider than the viewport').toBeLessThanOrEqual(
      result.viewport + 1
    );
    expect(result.wideImages, 'images past the right edge').toEqual([]);
    expect(result.wideTables, 'tables past the right edge').toEqual([]);
    expect(result.unscrollableCode, 'code blocks that overflow without scrolling').toEqual([]);
  });
}
