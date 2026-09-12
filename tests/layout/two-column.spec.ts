import { expect, test } from '@playwright/test';

/**
 * Two-column layout guard, for the tier introduced between the single-column
 * mobile shape and the 1400px three-column spread: hero left, everything
 * else stacked in a second column on the right.
 *
 * Tests at 1050px viewport rather than exactly 992px on purpose — the
 * container query lives on .content-col, which is always narrower than the
 * viewport by --margin-width (54px) plus whatever the browser's scrollbar
 * takes, so the query's own threshold (938px) only reliably resolves to
 * "two columns" a bit past 992px viewport width. See the comment on the
 * `@container content-col (min-width: 938px)` rule in paper.css.
 */
const paths = [
  { name: 'home', path: '/', hasTraits: true, hasTagNav: false },
  { name: 'blog', path: '/blog', hasTraits: false, hasTagNav: false },
  { name: 'about', path: '/about', hasTraits: false, hasTagNav: false },
  { name: 'tags', path: '/tags', hasTraits: false, hasTagNav: false },
  {
    name: 'post',
    path: '/posts/post-11-drupal-on-windows-wsl2',
    hasTraits: false,
    hasTagNav: true,
  },
];

test.use({ viewport: { width: 1050, height: 900 } });

for (const { name, path, hasTraits, hasTagNav } of paths) {
  test(`${name} lays out as two columns at 1050px`, async ({ page }) => {
    await page.goto(path);
    await page.waitForFunction(() => customElements.get('theme-switcher') !== undefined);

    const result = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      const hero = document.querySelector('.hero-section')!;
      const traits = document.querySelector('.traits-col');
      const tagNav = document.querySelector('.tag-nav');
      return {
        trackCount: getComputedStyle(main).gridTemplateColumns.split(' ').filter(Boolean).length,
        heroArea: getComputedStyle(hero).gridArea.split(' / ')[0],
        heroWidth: Math.round(hero.getBoundingClientRect().width),
        mainWidth: Math.round(main.getBoundingClientRect().width),
        traitsPresent: traits !== null,
        traitsVisible: traits ? getComputedStyle(traits).display !== 'none' : false,
        tagNavPresent: tagNav !== null,
        tagNavVisible: tagNav ? getComputedStyle(tagNav).display !== 'none' : false,
        docWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      };
    });

    // exactly two grid tracks — hero, then everything else
    expect(result.trackCount, `main grid tracks (got ${result.trackCount})`).toBe(2);
    expect(result.heroArea).toBe('hero');
    // hero shouldn't be the full-width single column it is on mobile
    expect(result.heroWidth).toBeLessThan(result.mainWidth * 0.6);

    // .traits-col only exists on the homepage, and must actually render
    // (not collapse to nothing the way an unmatched named grid area would)
    expect(result.traitsPresent, `${name} traits-col present`).toBe(hasTraits);
    if (hasTraits) {
      expect(result.traitsVisible, `${name} traits-col visible`).toBe(true);
    }

    // TagNav only renders on post pages now, not Home/Blog/About/Tags
    expect(result.tagNavPresent, `${name} tag-nav present`).toBe(hasTagNav);
    if (hasTagNav) {
      expect(result.tagNavVisible, `${name} tag-nav visible`).toBe(true);
    }

    // and nothing pushes the page sideways
    expect(result.docWidth, 'horizontal overflow').toBeLessThanOrEqual(result.viewport + 1);
  });
}
