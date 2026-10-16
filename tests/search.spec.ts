import { expect, test } from '@playwright/test';

// Site search: the header button opens a dialog that queries the Pagefind index
// built with the site.

test.describe('search', () => {
  test('finds a page by its words, marks them, and announces the count', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Search the site')).toBeFocused();
    await dialog.getByLabel('Search the site').fill('procession');
    const results = dialog.locator('.search__result');
    await expect(results.first()).toBeVisible();
    expect(await results.evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).pathname))).toContain('/docs/foundations/motion/');
    await expect(results.first().locator('mark').first()).toHaveText(/procession/i);
    await expect(dialog.getByRole('status')).toHaveText(/^\d+ results?/);
  });

  test('says when nothing matches', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByLabel('Search the site').fill('zzzqqqxxx');
    await expect(page.getByRole('status')).toHaveText('No results for “zzzqqqxxx”.');
    await expect(page.locator('.search__result')).toHaveCount(0);
  });

  test('Enter opens the first result; Escape closes and returns focus to the button', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Search' });
    await button.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(button).toBeFocused();

    await button.click();
    await page.getByLabel('Search the site').fill('glazing');
    const first = page.locator('.search__result').first();
    await expect(first).toBeVisible();
    const target = new URL((await first.getAttribute('href'))!, page.url()).pathname;
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL((url) => url.pathname === target);
  });

  // Only the main content is indexed, so the header's words lead nowhere.
  test('indexes the main content of every page and nothing outside it', async ({ request }) => {
    for (const path of ['/', '/playground/', '/roadmap/', '/docs/', '/docs/tokens/']) {
      const html = await (await request.get(path)).text();
      expect(html.match(/data-pagefind-body/g), path).toHaveLength(1);
      expect(html.indexOf('data-pagefind-body'), path).toBeGreaterThan(html.indexOf('class="lectern'));
    }
  });
});
