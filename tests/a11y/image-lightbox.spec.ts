import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The page scans in pages.spec.ts only ever see the dialog closed, so the
// open state and the APG keyboard behaviour need their own coverage.
const postWithFigures = '/posts/post-06-discord-bot';
const themes = ['paper', 'lamplight', 'horde', 'wayfinder'];

const openFirstFigure = async (page: Page) => {
  const trigger = page.locator('.post-body .lightbox-trigger').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog.lightbox')).toHaveJSProperty('open', true);
  return trigger;
};

test.beforeEach(async ({ page }) => {
  await page.goto(postWithFigures);
  await page.waitForFunction(() => customElements.get('image-lightbox') !== undefined);
});

test('each image is a button named with its alt text', async ({ page }) => {
  const trigger = page.locator('.post-body .lightbox-trigger').first();
  const alt = await trigger.locator('img').getAttribute('alt');
  await expect(trigger).toHaveAccessibleName(`View larger: ${alt}`);
});

test('opening moves focus to the close button and names the dialog', async ({ page }) => {
  await openFirstFigure(page);
  await expect(page.locator('dialog.lightbox')).toHaveAccessibleName('Enlarged image');
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
});

test('the enlarged image keeps its alt text and caption', async ({ page }) => {
  const trigger = await openFirstFigure(page);
  const figure = trigger.locator('xpath=ancestor::figure');
  const dialog = page.locator('dialog.lightbox');
  await expect(dialog.locator('img')).toHaveAttribute(
    'alt',
    (await trigger.locator('img').getAttribute('alt')) ?? ''
  );
  await expect(dialog.locator('.lightbox-caption')).toHaveText(
    (await figure.locator('figcaption').textContent()) ?? ''
  );
});

test('Escape closes and returns focus to the image that opened it', async ({ page }) => {
  const trigger = await openFirstFigure(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.lightbox')).toHaveJSProperty('open', false);
  await expect(trigger).toBeFocused();
});

test('the close button closes and returns focus', async ({ page }) => {
  const trigger = await openFirstFigure(page);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog.lightbox')).toHaveJSProperty('open', false);
  await expect(trigger).toBeFocused();
});

test('a backdrop click closes, but a click on the image does not', async ({ page }) => {
  await openFirstFigure(page);
  const dialog = page.locator('dialog.lightbox');
  await dialog.locator('.lightbox-pane img').click();
  await expect(dialog).toHaveJSProperty('open', true);
  await page.mouse.click(2, 2);
  await expect(dialog).toHaveJSProperty('open', false);
});

test('it is a true modal and Tab stays out of the page behind it', async ({ page }) => {
  await openFirstFigure(page);
  const dialog = page.locator('dialog.lightbox');
  expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const escaped = await page.evaluate(() => {
    const focused = document.activeElement;
    return Boolean(focused && focused !== document.body && !focused.closest('dialog.lightbox'));
  });
  expect(escaped).toBe(false);
});

test('actual size is a toggle, offered only when fitting shrank the image', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openFirstFigure(page);
  const zoom = page.getByRole('button', { name: 'Actual size' });
  await expect(zoom).toHaveAttribute('aria-pressed', 'false');
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-pressed', 'true');

  const pane = page.locator('dialog.lightbox .lightbox-pane');
  await expect(pane).toHaveAttribute('tabindex', '0');
  const overflows = await pane.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflows).toBe(true);
});

for (const theme of themes) {
  test(`open dialog (${theme} theme) has no accessibility violations`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('ag-theme', t), theme);
    await page.reload();
    await page.waitForFunction(() => customElements.get('image-lightbox') !== undefined);
    await openFirstFigure(page);

    const results = await new AxeBuilder({ page })
      .include('dialog.lightbox')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
