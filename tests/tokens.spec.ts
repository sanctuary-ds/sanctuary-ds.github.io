import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

// The token reference: generated from the DTCG files, it must list every custom
// property the stylesheet defines, with the values the core resolves.

const require = createRequire(import.meta.url);
const palette = require('@sanctuary-ds/tokens/palette');
const stylesheet = readFileSync(require.resolve('@sanctuary-ds/tokens/css'), 'utf8');
const defined = [...new Set(stylesheet.match(/--san-[a-z0-9-]+(?=:)/g))];

test.describe('token reference', () => {
  test('lists every custom property of the stylesheet exactly once', async ({ page }) => {
    await page.goto('/docs/tokens');
    const listed = await page.locator('.tokens th[scope="row"] code').allTextContents();
    expect([...listed].sort()).toEqual([...defined].sort());
  });

  // Checked against the palette, which the core resolves on its own. An alias
  // is followed to the color it names: another token in the same flavor, or a
  // tone of a pigment ramp.
  test('shows each flavor its own color, as the palette resolves it', async ({ page }) => {
    await page.goto('/docs/tokens');
    const flavorIds = Object.keys(palette.flavors);
    const headers = await page.locator('section:has(> #stone) thead th').allTextContents();
    expect(headers.slice(1)).toEqual(flavorIds.map((id) => palette.flavors[id].name));
    const text = (color: { hex: string; alpha?: number }) => (color.alpha === undefined ? color.hex : `${color.hex} at ${Math.round(color.alpha * 100)}%`);
    // An alias is shown as the name it reads, without the --san- prefix.
    const resolve = (cell: string, id: string): string | undefined => {
      if (cell.startsWith('#')) return cell;
      const tone = cell.match(/^pigment-([a-z]+)-(\d+)$/);
      if (tone) return palette.pigments[tone[1]].tones[tone[2]];
      const color = palette.flavors[id].colors[cell];
      return color && text(color);
    };
    const rows = await page.locator('.tokens tbody tr').evaluateAll((trs) =>
      trs.map((tr) => [tr.querySelector('th code')!.textContent!, [...tr.querySelectorAll('td code')].map((code) => code.textContent!)] as const),
    );
    let checked = 0;
    for (const [name, cells] of rows) {
      if (cells.length !== flavorIds.length) continue;
      for (const [index, id] of flavorIds.entries()) {
        const color = palette.flavors[id].colors[name.replace('--san-', '')];
        if (!color) continue;
        expect(resolve(cells[index], id), `${name} in ${id}`).toBe(text(color));
        checked += 1;
      }
    }
    expect(checked).toBe(flavorIds.length * Object.keys(palette.flavors[flavorIds[0]].colors).length);
  });

  test('shows the values the stylesheet computes for the foundations', async ({ page }) => {
    await page.goto('/docs/tokens');
    for (const name of ['--san-space-4', '--san-radius-md', '--san-duration-procession', '--san-font-weight-semibold']) {
      const shown = await page.locator('.tokens tr', { has: page.locator(`th code`, { hasText: new RegExp(`^${name}$`) }) }).locator('td code').textContent();
      const declared = stylesheet.match(new RegExp(`${name}:\\s*([^;]+);`))![1].trim();
      expect(shown, name).toBe(declared);
    }
  });
});
