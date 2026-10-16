import { createRequire } from 'node:module';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { docFiles } from './docs-content';

// An automated accessibility check: axe audits every page in every flavor
// against WCAG 2.2 A and AA. It catches what rules can (contrast, names, roles,
// structure), not everything a person would.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');
const pages = ['/', '/playground', '/roadmap', '/docs', ...docFiles.map((doc) => doc.path)];
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// The tone number on each playground swatch is white with mix-blend-mode:
// difference, which axe cannot compute, so it measures plain white on the
// pigment. The number is decorative (aria-hidden; the button's label names the
// tone) and only shows on hover, so it is left out of the audit.
const EXCLUDED = ['.tone > span'];

for (const flavor of Object.keys(palette.flavors)) {
  test.describe(`accessibility in ${flavor}`, () => {
    for (const path of pages) {
      test(`${path} has no violations`, async ({ page }) => {
        await page.goto(`${path}?flavor=${flavor}`);
        const { violations } = await new AxeBuilder({ page }).withTags(WCAG).exclude(EXCLUDED).analyze();
        expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`)).toEqual([]);
      });
    }

    // A state the page audits do not reach: the search dialog, open, with results.
    test('the search dialog with results has no violations', async ({ page }) => {
      await page.goto(`/docs?flavor=${flavor}`);
      await page.getByRole('button', { name: 'Search' }).click();
      await page.getByLabel('Search the site').fill('accent');
      await expect(page.locator('.search__result').first()).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG).include('dialog.search').analyze();
      expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  });
}
