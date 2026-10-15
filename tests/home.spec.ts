import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

// The home page through what a visitor sees: the facade, its rose window and
// its facts, which are counted from the core palette.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

test.describe('facade', () => {
  test('the facts are counted from the palette', async ({ page }) => {
    await page.goto('/');
    const pigments = Object.values(palette.pigments) as { tones: Record<string, string> }[];
    const modes = Object.values(palette.windowModes as Record<string, { name: string }>).map((mode) => mode.name.toLowerCase());
    const facts = await page.locator('.facade__facts > div').evaluateAll((items) =>
      items.map((item) => [item.querySelector('dt')!.textContent!.trim(), item.querySelector('dd')!.textContent!.trim()]),
    );
    expect(facts).toEqual([
      [String(Object.keys(palette.flavors).length), 'flavors, the hours'],
      [String(pigments.length), `pigments × ${Object.keys(pigments[0].tones).length} tones`],
      [String(Object.keys(palette.glazings).length), 'glazings'],
      [String(modes.length), `windows, ${modes.join(' or ')}`],
    ]);
  });

  test('the page has one heading naming the system', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Sanctuary');
  });

  test('the rose window is drawn at build time, with its cast below it', async ({ page }) => {
    await page.goto('/');
    const roses = page.locator('.facade__rose .rose');
    await expect(roses).toHaveCount(2);
    // 24 outer panes, 12 petals, 12 inner sectors, 12 jewels and the eye.
    await expect(page.locator('.rose:not(.rose--cast) .rose__pane')).toHaveCount(61);
    await expect(page.locator('.rose:not(.rose--cast) .rose__sun')).toHaveCount(1);
    // The cast is only the glass: no stone, lead or sun.
    await expect(page.locator('.rose--cast .rose__stone, .rose--cast .rose__sun')).toHaveCount(0);
    // Decorative only: hidden from assistive technology.
    for (const hidden of await roses.evaluateAll((els) => els.map((el) => el.getAttribute('aria-hidden')))) expect(hidden).toBe('true');
  });

  test('the beams and the cast light dark flavors and shade light ones', async ({ page }) => {
    for (const [flavor, { scheme }] of Object.entries(palette.flavors as Record<string, { scheme: string }>)) {
      await page.goto(`/?flavor=${flavor}`);
      const blend = await page.evaluate(() => [
        getComputedStyle(document.querySelector('.facade__beams')!).mixBlendMode,
        getComputedStyle(document.querySelector('.rose--cast')!).mixBlendMode,
      ]);
      const expected = scheme === 'light' ? 'multiply' : 'screen';
      expect(blend, flavor).toEqual([expected, expected]);
    }
  });

  test('the light is still for visitors who ask for less motion', async ({ browser }) => {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      const context = await browser.newContext({ reducedMotion });
      const page = await context.newPage();
      await page.goto('/');
      const animations = await page.evaluate(() => [
        getComputedStyle(document.querySelector('.facade__beams')!).animationName,
        getComputedStyle(document.querySelector('.rose__pane')!).animationName,
      ]);
      if (reducedMotion === 'reduce') expect(animations).toEqual(['none', 'none']);
      else for (const name of animations) expect(name).not.toBe('none');
      await context.close();
    }
  });
});
