import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { chapel } from '../src/data/chapels';
import { sections } from '../src/data/doc-sections';
import { docFiles } from './docs-content';

// The documentation: an index of every page by section, and each page with its
// title and the same index beside it.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

const ordered = sections.flatMap(({ id }) => docFiles.filter((doc) => doc.section === id).sort((a, b) => a.order - b.order));

test.describe('docs', () => {
  test('the Docs chapel leads to the documentation', async ({ page }) => {
    expect(chapel('docs').available).toBe(true);
    await page.goto(chapel('docs').href);
    await expect(page.locator('h1')).toHaveText('Documentation');
  });

  test('the overview lists every page, by section, in order', async ({ page }) => {
    await page.goto('/docs');
    const links = page.locator('.index a');
    expect(await links.allTextContents()).toEqual(ordered.map((doc) => doc.title));
    for (const [index, doc] of ordered.entries()) await expect(links.nth(index)).toHaveAttribute('href', doc.path);
  });

  for (const doc of docFiles) {
    test(`${doc.path} shows its title and marks itself in the index`, async ({ page }) => {
      await page.goto(doc.path);
      await expect(page.locator('h1')).toHaveText(doc.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', doc.description);
      const nav = page.getByRole('navigation', { name: 'Documentation' });
      expect(await nav.locator('li a').allTextContents()).toEqual(ordered.map((entry) => entry.title));
      await expect(nav.locator('[aria-current="page"]')).toHaveText(doc.title);
    });
  }

  // Code samples name tokens by hand; each must exist in the core.
  for (const doc of docFiles) {
    test(`every token in the code of ${doc.path} is defined by the stylesheet`, async ({ page }) => {
      await page.goto(doc.path);
      const code = (await page.locator('.prose code').allTextContents()).join('\n');
      // A name cut short by a pattern (--san-duration-*, --san-font-family-<role>) ends in a hyphen; it names a family, not a token.
      const tokens = [...new Set(code.match(/--san-[a-z0-9][a-z0-9-]*/g) ?? [])].filter((name) => !name.endsWith('-'));
      const missing = await page.evaluate(
        (names) => names.filter((name) => getComputedStyle(document.documentElement).getPropertyValue(name) === ''),
        tokens,
      );
      expect(missing).toEqual([]);
    });
  }

  // On a phone the page opens on its text; the index follows it.
  test('the index comes after the text in the document', async ({ page }) => {
    await page.goto(ordered[0].path);
    const order = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      const nav = document.querySelector('nav[aria-label="Documentation"]')!;
      return main.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    expect(order).toBeTruthy();
  });
});

test.describe('getting started', () => {
  // The install steps as the core's README gives them.
  test('shows the pnpm install, the CSS import and the CDN link', async ({ page }) => {
    await page.goto('/docs/getting-started');
    const code = await page.locator('pre code').allTextContents();
    expect(code).toContain('pnpm add @sanctuary-ds/tokens\n');
    expect(code).toContain("import '@sanctuary-ds/tokens/css';\n");
    expect(code).toContain('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sanctuary-ds/tokens@0.1/dist/css/sanctuary.css">\n');
  });

  // The table is written by hand; this keeps it in step with the core.
  test('lists every value of every attribute in the palette', async ({ page }) => {
    await page.goto('/docs/getting-started');
    const values = {
      'data-san-flavor': Object.keys(palette.flavors),
      'data-san-accent': Object.keys(palette.pigments),
      'data-san-glazing': Object.keys(palette.glazings),
      'data-san-window': Object.keys(palette.windowModes),
    };
    for (const [attribute, ids] of Object.entries(values)) {
      const row = page.locator('tr', { has: page.locator('td:first-child code', { hasText: attribute }) });
      expect((await row.locator('td:nth-child(2) code').allTextContents()).sort()).toEqual([...ids].sort());
    }
  });
});

test.describe('getting started glosses', () => {
  // A few words on what each glazing looks like, as the hand-written table had.
  test('each glazing says how it looks', async ({ page }) => {
    await page.goto('/docs/getting-started');
    const row = page.locator('tr', { has: page.locator('td:first-child code', { hasText: 'data-san-glazing' }) });
    await expect(row.locator('td:nth-child(2)')).toHaveText('pot-metal (solid, default), flashed (translucent, glowing), grisaille (line only)');
  });
});

test.describe('philosophy', () => {
  // The materials table names tokens by hand; each must exist in the core.
  test('every token in the materials table is defined by the stylesheet', async ({ page }) => {
    await page.goto('/docs/philosophy');
    const names = (await page.locator('table', { hasText: 'Material' }).locator('td:last-child code').allTextContents()).filter((name) => !name.endsWith('-'));
    expect(names.length).toBeGreaterThan(10);
    const missing = await page.evaluate(
      (tokens) => tokens.filter((token) => getComputedStyle(document.documentElement).getPropertyValue(`--san-${token}`) === ''),
      names,
    );
    expect(missing).toEqual([]);
  });
});
