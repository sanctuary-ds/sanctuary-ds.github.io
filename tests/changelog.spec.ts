import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

// The changelog of the core, read at build time from the tag of the installed
// version: it opens on that version, lists every release newest first, and marks
// its breaking changes with a label and an icon, never by color alone.

const require = createRequire(import.meta.url);
const { version: installed } = require('@sanctuary-ds/tokens/package.json') as { version: string };

// Release versions only (x.y.z), compared part by part.
const parts = (version: string) => version.split('.').map(Number);
const compare = (a: string, b: string) => {
  const [x, y] = [parts(a), parts(b)];
  return x.map((part, index) => part - y[index]).find((difference) => difference !== 0) ?? 0;
};

test.describe('changelog', () => {
  test('opens on the installed version of the core', async ({ page }) => {
    await page.goto('/docs/changelog');
    await expect(page.locator('h1')).toHaveText('Changelog');
    await expect(page.locator('.release h2').first()).toHaveText(installed);
  });

  test('lists every release, newest first, down to the first one', async ({ page }) => {
    await page.goto('/docs/changelog');
    const versions = await page.locator('.release h2').allTextContents();
    for (const version of versions) expect(version, version).toMatch(/^\d+\.\d+\.\d+$/);
    for (const [index, version] of versions.slice(1).entries()) {
      expect(compare(versions[index], version), `${versions[index]} before ${version}`).toBeGreaterThan(0);
    }
    expect(versions[0]).toBe(installed);
    expect(versions.at(-1)).toBe('0.1.0');
    for (const version of versions) await expect(page.locator(`.release h2#v${version.replaceAll('.', '\\.')}`)).toHaveCount(1);
  });

  test('marks the breaking changes of 0.3.0 with a label and an icon', async ({ page }) => {
    await page.goto('/docs/changelog');
    const release = page.locator('.release', { has: page.locator('h2', { hasText: /^0\.3\.0$/ }) });
    const breaking = release.locator('.release__breaking');
    await expect(breaking).toHaveCount(1);
    await expect(breaking.locator('h3')).toHaveText('Breaking changes');
    await expect(breaking.locator('h3 svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(breaking.locator(':scope > ul > li').first()).toContainText('default accent of Vespers is ember');
    // An entry with its own list keeps it nested.
    await expect(breaking.locator(':scope > ul > li > ul > li').first()).toBeVisible();
    // Breaking changes come first in their release.
    await expect(release.locator('h3').first()).toHaveText('Breaking changes');
  });

  // release-please writes token names bare. Rendered as prose, "--" would turn
  // into a dash and "<size>" would vanish as an unknown tag.
  test('keeps custom property names exactly as written, as code', async ({ page }) => {
    await page.goto('/docs/changelog');
    const breaking = page.locator('.release', { has: page.locator('h2', { hasText: /^0\.3\.0$/ }) }).locator('.release__breaking');
    const names = await breaking.locator('code').allTextContents();
    expect(names).toContain('--san-breakpoint-<size>');
    expect(names).toContain('--_san-pigment-<pigment>-<tone>');
    await expect(breaking).not.toContainText('–san');
  });

  test('every docs page names the installed version and links to its entry', async ({ page }) => {
    for (const path of ['/docs', '/docs/tokens']) {
      await page.goto(path);
      const link = page.locator('.docs__version a');
      await expect(link).toHaveAttribute('href', `/docs/changelog#v${installed}`);
      await expect(page.locator('.docs__version')).toContainText(installed);
    }
  });
});
