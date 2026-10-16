import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { chapel } from '../src/data/chapels';
import { horizons, items, products } from '../src/data/roadmap';

// The public roadmap: what people can use today and what comes after, by
// horizon, with no dates.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

test.describe('roadmap', () => {
  test('the products are shown, each with its horizon', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page.locator('h1')).toHaveText('Roadmap');
    const cards = page.locator('.product');
    await expect(cards).toHaveCount(products.length);
    for (const [index, product] of products.entries()) {
      await expect(cards.nth(index).locator('h3')).toHaveText(product.name);
      await expect(cards.nth(index).locator('.chip')).toHaveText(horizons.find((horizon) => horizon.id === product.horizon)!.name);
    }
  });

  test('the horizons come in order, each with its items and their product', async ({ page }) => {
    await page.goto('/roadmap');
    const sections = page.locator('.horizon');
    expect(await sections.locator('h3').allTextContents()).toEqual(['Available', 'In progress', 'Next', 'Later', 'Exploring']);
    for (const [index, horizon] of horizons.entries()) {
      const entries = items.filter((item) => item.horizon === horizon.id);
      const rows = sections.nth(index).locator('li');
      await expect(rows).toHaveCount(entries.length);
      if (entries.length === 0) await expect(sections.nth(index).locator('.horizon__empty')).toHaveText('Nothing right now.');
      for (const [row, item] of entries.entries()) {
        await expect(rows.nth(row).locator('.item__text')).toHaveText(item.text);
        const tag = products.find((product) => product.id === item.product)?.name;
        await (tag ? expect(rows.nth(row).locator('.item__product')).toHaveText(tag) : expect(rows.nth(row).locator('.item__product')).toHaveCount(0));
      }
    }
  });

  test('the counts of the stylesheet come from the palette', async ({ page }) => {
    await page.goto('/roadmap');
    const flavors = Object.keys(palette.flavors).length;
    const accents = Object.keys(palette.pigments).length;
    const glazings = Object.keys(palette.glazings).length;
    await expect(page.locator('.horizon').first()).toContainText(`${flavors} flavors, ${accents} accents and ${glazings} glazings`);
  });

  // The core's rules for this page: unvalidated ports are never shown as
  // available, and nothing promises a date or a percentage.
  test('no port is available yet, and nothing carries a date or a percentage', () => {
    expect(items.filter((item) => item.horizon === 'available' && item.product === 'ports')).toEqual([]);
    for (const { text } of items) expect(text).not.toMatch(/\b20\d\d\b|%/);
  });

  test('every item names a known horizon and, if any, a known product', () => {
    const horizonIds = horizons.map(({ id }) => id);
    const productIds = products.map(({ id }) => id);
    for (const item of items) {
      expect(horizonIds).toContain(item.horizon);
      if (item.product) expect(productIds).toContain(item.product);
    }
  });

  test('the roadmap chapel is open', () => {
    expect(chapel('roadmap').available).toBe(true);
  });
});
