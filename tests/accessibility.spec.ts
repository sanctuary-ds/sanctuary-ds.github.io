import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

// The accessibility page computes its guarantees from the core; these tests
// recompute them on their own, from the palette and the stylesheet.

const require = createRequire(import.meta.url);
const palette = require('@sanctuary-ds/tokens/palette');
const stylesheet = readFileSync(require.resolve('@sanctuary-ds/tokens/css'), 'utf8');

// WCAG 2 contrast, written again here so the test does not trust the page's code.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test.describe('accessibility', () => {
  test('every pairing meets its minimum in every flavor, and the pair shown gives the ratio shown', async ({ page }) => {
    await page.goto('/docs/accessibility');
    const flavorIds = Object.keys(palette.flavors);
    const rows = await page.locator('table.contrast tbody tr').evaluateAll((trs) =>
      trs.map((tr) => ({
        minimum: tr.querySelector('td')!.textContent!,
        cells: [...tr.querySelectorAll('td')].slice(1).map((td) => [td.querySelector('.ratio')!.textContent!, td.querySelector('.pair')!.textContent!]),
      })),
    );
    expect(rows).toHaveLength(7);
    for (const { minimum, cells } of rows) {
      expect(cells).toHaveLength(flavorIds.length);
      for (const [index, [ratio, pair]] of cells.entries()) {
        const [fg, bg] = pair.split(' on ');
        const colors = palette.flavors[flavorIds[index]].colors;
        const actual = contrast(colors[fg].hex, colors[bg].hex);
        expect(ratio).toBe(`${(Math.floor(actual * 100) / 100).toFixed(2)}:1`);
        expect(actual).toBeGreaterThanOrEqual(parseFloat(minimum));
      }
    }
  });

  test('lists every token the stylesheet stops under reduced motion', async ({ page }) => {
    await page.goto('/docs/accessibility');
    const block = stylesheet.slice(stylesheet.indexOf('@media (prefers-reduced-motion: reduce)'));
    const expected = [...block.slice(0, block.indexOf('\n}')).matchAll(/(--san-[a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => `${name}: ${value}`);
    expect(expected.length).toBeGreaterThan(0);
    const listed = await page.locator('h2#reduced-motion ~ ul li').allTextContents();
    expect(listed).toEqual(expected);
  });
});
