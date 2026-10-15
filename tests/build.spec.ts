import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

// The page is built in English, and the core stylesheet it depends on is loaded:
// a renamed token after bumping the core pin fails here instead of silently.

test('the page declares English from the i18n config', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the core tokens the site reads are defined', async ({ page }) => {
  await page.goto('/');
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return ['--san-surface', '--san-text', '--san-type-body-md', '--san-type-body-md-tracking'].map((name) => [
      name,
      style.getPropertyValue(name).trim(),
    ]);
  });
  for (const [name, value] of tokens) expect(value, `${name} is defined`).not.toBe('');
});

test('the body is painted with the core surface and text', async ({ page }) => {
  await page.goto('/');
  const colours = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'var(--san-surface)';
    probe.style.color = 'var(--san-text)';
    document.body.append(probe);
    const expected = getComputedStyle(probe);
    const body = getComputedStyle(document.body);
    return { body: [body.backgroundColor, body.color], tokens: [expected.backgroundColor, expected.color] };
  });
  expect(colours.body).toEqual(colours.tokens);
});

test('the fonts are hosted by the site and used by the core tokens', async ({ page }) => {
  const thirdParty: string[] = [];
  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) thirdParty.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const fonts = await page.evaluate(() => {
    const loaded = [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replace(/"/g, ''));
    return { loaded, body: getComputedStyle(document.body).fontFamily };
  });

  expect(thirdParty, 'no requests to Google Fonts').toEqual([]);
  // Hosted families carry Astro's suffix ("Hanken Grotesk-4efb…"); the core's own
  // values name the bare family, so a missing bridge in global.css fails here.
  const hosted = (name: string) => new RegExp(`${name}-[0-9a-f]+`);
  // Every role the core publishes, whatever it is called, must reach its token.
  const roles = Object.entries(palette.fonts as Record<string, { family: string }>);
  expect(roles.length).toBeGreaterThan(0);
  for (const [role, { family }] of roles) {
    const token = `--san-font-family-${role}`;
    const value = await page.evaluate((t) => getComputedStyle(document.documentElement).getPropertyValue(t), token);
    expect(value, `${token} names the hosted ${family}`).toMatch(hosted(family));
  }
  const text = palette.fonts.text.family as string;
  expect(fonts.body).toMatch(hosted(text));
  expect(fonts.loaded.some((family) => family.startsWith(text)), 'the body font is loaded').toBe(true);
});

test('the page declares exactly the font faces the core publishes', async ({ page }) => {
  const expected = Object.values(palette.fonts as Record<string, { family: string; weights: number[]; styles: string[] }>)
    .flatMap(({ family, weights, styles }) => weights.flatMap((weight) => styles.map((style) => `${family} ${weight} ${style}`)))
    .sort();
  await page.goto('/');
  const declared = await page.evaluate(() =>
    [...document.fonts]
      // Astro suffixes the family and adds metric-matched fallback faces; keep the real ones.
      .filter((face) => !face.family.includes('fallback'))
      .map((face) => `${face.family.replace(/"/g, '').replace(/-[0-9a-f]+$/, '')} ${face.weight} ${face.style}`)
      .sort(),
  );
  expect(declared).toEqual(expected);
});

test('the page loads without console errors or failed requests', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => message.type() === 'error' && problems.push(message.text()));
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('response', (response) => response.status() >= 400 && problems.push(`${response.status()} ${response.url()}`));
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(problems).toEqual([]);
});
