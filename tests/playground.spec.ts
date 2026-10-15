import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { toRoman } from '../src/data/numerals';

// The playground through what a visitor sees: its index and its sections, each
// checked against the core palette.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

test.describe('playground', () => {
  test('the index lists every section on the page, in order, and nothing else', async ({ page }) => {
    await page.goto('/playground');
    await expect(page.locator('h1')).toHaveText('Playground');
    const links = page.locator('.index a');
    const sections = page.locator('main > section[id]');
    const ids = await sections.evaluateAll((els) => els.map((el) => el.id));
    expect(ids.length).toBeGreaterThan(0);
    await expect(links).toHaveCount(ids.length);
    for (const [index, id] of ids.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', `#${id}`);
      await expect(links.nth(index).locator('span')).toHaveText(toRoman(index + 1));
      await expect(sections.nth(index).locator('.inscription').first()).toHaveText(new RegExp(`^${toRoman(index + 1)} · `));
    }
  });

  test('the theme sections follow the palette and change the theme', async ({ page }) => {
    await page.goto('/playground');
    await expect(page.locator('#flavors .flavor')).toHaveCount(Object.keys(palette.flavors).length);
    await expect(page.locator('#glazing .glazing')).toHaveCount(Object.keys(palette.glazings).length);
    await expect(page.locator('#windows .window')).toHaveCount(Object.keys(palette.windowModes).length);
    await page.locator('#flavors [data-set="flavor:lauds"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-san-flavor', 'lauds');
    await expect(page.locator('.lectern [data-set="flavor:lauds"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('the named windows are the palette\'s, each with its own fixed gradient', async ({ page }) => {
    await page.goto('/playground');
    const windows = Object.entries(palette.windows as Record<string, { name: string; stops: string[]; note: string }>);
    const figures = page.locator('.named-window');
    await expect(figures).toHaveCount(windows.length);
    for (const [index, [id, window]] of windows.entries()) {
      const figure = figures.nth(index);
      await expect(figure.locator('b')).toHaveText(window.name);
      await expect(figure.locator('figcaption span')).toHaveText(window.stops.join(' · '));
      await expect(figure.locator('small')).toHaveText(window.note);
      const gradient = await figure.evaluate((el) => getComputedStyle(el).getPropertyValue('--san-window').trim());
      const named = await figure.evaluate((el, name) => getComputedStyle(el).getPropertyValue(`--san-window-${name}`).trim(), id);
      expect(gradient).toBe(named);
    }
  });

  test('the named windows line up, however long their notes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/playground');
    const tops = await page.locator('.named-window b').evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size);
    expect(tops).toBe(1);
  });

  for (const [name, viewport] of [['phone', { width: 375, height: 812 }], ['desktop', { width: 1440, height: 900 }]] as const) {
    test(`the page never scrolls sideways (${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/playground');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
