import { expect, test, type Page } from '@playwright/test';

// Page transitions: moving between pages cross-fades the content while the
// lectern stays put, through the browser's cross-document view transitions.
// The new page learns whether one ran from its pagereveal event.

const record = (page: Page) =>
  page.addInitScript(() => {
    addEventListener('pagereveal', (event) => {
      const transition = (event as Event & { viewTransition?: { ready: Promise<void> } }).viewTransition;
      (window as unknown as { transitioned: boolean }).transitioned = Boolean(transition);
      // The duration the page's cross-fade actually runs with, once it starts.
      transition?.ready.then(() => {
        const fade = document.getAnimations().find((animation) => (animation.effect as KeyframeEffect).pseudoElement === '::view-transition-group(root)');
        (window as unknown as { fadeMs: unknown }).fadeMs = fade?.effect?.getTiming().duration;
      });
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
    // Timed with the core's slow duration, not the browser's default.
    // The minifier may write the token in seconds (.36s), so convert by unit.
    const slow = await page.evaluate(() => {
      const value = getComputedStyle(document.documentElement).getPropertyValue('--san-duration-slow').trim();
      return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
    });
    expect(slow).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => (window as unknown as { fadeMs?: number }).fadeMs)).toBe(slow);
  });

  test('no transition runs when the visitor asks for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await record(page);
    expect(await navigate(page)).toBe(false);
    await expect(page.locator('.lectern')).toHaveCSS('view-transition-name', 'none');
  });
});
