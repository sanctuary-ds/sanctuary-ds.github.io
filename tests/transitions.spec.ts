import { expect, test, type Page } from '@playwright/test';

// Page transitions: moving between pages cross-fades the content while the
// lectern stays put, through the browser's cross-document view transitions.
// The new page learns whether one ran from its pagereveal event.

const record = (page: Page) =>
  page.addInitScript(() => {
    addEventListener('pagereveal', (event) => {
      (window as unknown as { transitioned: boolean }).transitioned = Boolean((event as Event & { viewTransition?: unknown }).viewTransition);
    });
  });

const navigate = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Docs' }).click();
  await expect(page).toHaveURL(/\/docs\/?$/);
  // The URL changes before the new page reveals itself; wait for its pagereveal.
  await page.waitForFunction(() => 'transitioned' in window);
  return page.evaluate(() => (window as unknown as { transitioned: boolean }).transitioned);
};

test.describe('page transitions', () => {
  test('a link to another page runs a view transition, with the lectern held in place', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await record(page);
    expect(await navigate(page)).toBe(true);
    await expect(page.locator('.lectern')).toHaveCSS('view-transition-name', 'lectern');
  });

  test('no transition runs when the visitor asks for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await record(page);
    expect(await navigate(page)).toBe(false);
    await expect(page.locator('.lectern')).toHaveCSS('view-transition-name', 'none');
  });
});
