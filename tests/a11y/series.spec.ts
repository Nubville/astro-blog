import { expect, test } from '@playwright/test';
import seriesData from '../../src/data/series.json' with { type: 'json' };

// Reads the controller file rather than hardcoding, so adding a part to a
// series doesn't mean editing this test too.
const parts = seriesData['root-meridian'].posts;
const urlOf = (slug: string) => `/posts/${slug}`;
const pagerLabel = 'Previous and next in the Root Meridian series';

test('a middle part links to the parts on either side of it', async ({ page }) => {
  await page.goto(urlOf(parts[2]));
  const pager = page.getByRole('navigation', { name: pagerLabel });
  await expect(pager.locator('a[rel="prev"]')).toHaveAttribute('href', urlOf(parts[1]));
  await expect(pager.locator('a[rel="next"]')).toHaveAttribute('href', urlOf(parts[3]));
});

test('the first part has no previous link', async ({ page }) => {
  await page.goto(urlOf(parts[0]));
  const pager = page.getByRole('navigation', { name: pagerLabel });
  await expect(pager.locator('a[rel="prev"]')).toHaveCount(0);
  await expect(pager.locator('a[rel="next"]')).toHaveAttribute('href', urlOf(parts[1]));
});

test('the last part has no next link', async ({ page }) => {
  await page.goto(urlOf(parts.at(-1)!));
  const pager = page.getByRole('navigation', { name: pagerLabel });
  await expect(pager.locator('a[rel="next"]')).toHaveCount(0);
  await expect(pager.locator('a[rel="prev"]')).toHaveAttribute('href', urlOf(parts.at(-2)!));
});

test('following next links reads the whole series in order', async ({ page }) => {
  await page.goto(urlOf(parts[0]));
  const pager = page.getByRole('navigation', { name: pagerLabel });
  for (const slug of parts.slice(1)) {
    await pager.locator('a[rel="next"]').click();
    await expect(page).toHaveURL(new RegExp(`${urlOf(slug)}/?$`));
  }
});

test('the contents list opens by keyboard and marks the current part', async ({ page }) => {
  await page.goto(urlOf(parts[2]));
  const contents = page.getByRole('navigation', { name: 'Root Meridian series', exact: true });
  await expect(contents.locator('summary')).toContainText(`Part 3 of ${parts.length}`);

  await contents.locator('summary').focus();
  await page.keyboard.press('Enter');

  await expect(contents.getByRole('listitem')).toHaveCount(parts.length);
  const current = contents.locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('href', urlOf(parts[2]));
});

test('a shared post follows each series separately', async ({ page }) => {
  const shared = 'post-06-discord-bot';
  const companion = seriesData['chroniclers-companion'].posts;
  const place = parts.indexOf(shared);
  await page.goto(urlOf(shared));

  const meridian = page.getByRole('navigation', { name: pagerLabel });
  await expect(meridian.locator('a[rel="prev"]')).toHaveAttribute('href', urlOf(parts[place - 1]));
  await expect(meridian.locator('a[rel="next"]')).toHaveAttribute('href', urlOf(parts[place + 1]));

  const chronicler = page.getByRole('navigation', {
    name: "Previous and next in the Chronicler's Companion series",
  });
  await expect(chronicler.locator('a[rel="prev"]')).toHaveCount(0);
  await expect(chronicler.locator('a[rel="next"]')).toHaveAttribute('href', urlOf(companion[1]));

  await expect(page.locator('.series-contents summary')).toHaveCount(2);
  await expect(page.locator('.series-contents summary').first()).toContainText(
    `Part ${place + 1} of ${parts.length}`
  );
  await expect(page.locator('.series-contents summary').last()).toContainText(
    `Part 1 of ${companion.length}`
  );
});

test('a post outside any series shows no series navigation', async ({ page }) => {
  await page.goto('/posts/post-10-design-tokens-deep-dive');
  await expect(page.locator('.series-contents, .series-pager')).toHaveCount(0);
});

test('a card says which part it is', async ({ page }) => {
  await page.goto('/blog');
  const card = page.locator('sketch-card', { has: page.locator(`a[href^="${urlOf(parts[2])}"]`) });
  await expect(card).toContainText(`Root Meridian, part 3 of ${parts.length}`);
});
