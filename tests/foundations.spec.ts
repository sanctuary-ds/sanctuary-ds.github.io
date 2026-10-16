import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

// The foundations pages generate their tables from the core's palette; these
// tests read the palette on their own and compare.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

const firstColumn = (page: import('@playwright/test').Page, header: string) =>
  page.locator('table', { has: page.locator('thead th', { hasText: new RegExp(`^${header}$`) }) }).first().locator('tbody th code').allTextContents();

test.describe('foundations', () => {
  test('color lists every flavor, pigment, glazing and window of the palette', async ({ page }) => {
    await page.goto('/docs/foundations/color');
    expect(await firstColumn(page, 'Flavor')).toEqual(Object.keys(palette.flavors));
    expect(await firstColumn(page, 'Pigment')).toEqual(Object.keys(palette.pigments));
    expect(await firstColumn(page, 'Glazing')).toEqual(Object.keys(palette.glazings));
    const windows = page.locator('table', { has: page.locator('thead th', { hasText: /^Window$/ }) });
    expect(await windows.nth(0).locator('tbody th code').allTextContents()).toEqual(Object.keys(palette.windowModes));
    expect(await windows.nth(1).locator('tbody th code').allTextContents()).toEqual(Object.keys(palette.windows).map((id) => `window-${id}`));
  });

  // The tone each flavor plays for a role must give the role's color for every
  // pigment: glass-ruby-ink in Lauds is ruby at the tone the table names.
  test('the glass roles name the tone each flavor plays', async ({ page }) => {
    await page.goto('/docs/foundations/color');
    const table = page.locator('table', { has: page.locator('thead th', { hasText: /^Role$/ }) });
    const headers = await table.locator('thead th').allTextContents();
    const flavorIds = Object.keys(palette.flavors);
    expect(headers.slice(2)).toEqual(flavorIds.map((id) => palette.flavors[id].name));
    const rows = await table.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((cell) => cell.textContent!.trim())));
    expect(rows).toHaveLength(6);
    for (const [role, , ...tones] of rows) {
      const suffix = role === 'glass-<p>' ? '' : role;
      for (const [index, flavor] of flavorIds.entries()) {
        for (const [pigment, { tones: ramp }] of Object.entries<{ tones: Record<string, string> }>(palette.pigments)) {
          expect(palette.flavors[flavor].colors[`glass-${pigment}${suffix}`].hex, `glass-${pigment}${suffix} in ${flavor}`).toBe(ramp[tones[index]]);
        }
      }
    }
  });

  test('type lists every font role with its family', async ({ page }) => {
    await page.goto('/docs/foundations/type');
    const table = page.locator('table', { has: page.locator('thead th', { hasText: /^Family$/ }) });
    const rows = await table.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].slice(0, 2).map((cell) => cell.textContent!.trim())));
    expect(rows).toEqual(Object.entries(palette.fonts).map(([role, font]: [string, any]) => [role, font.family]));
  });
});
