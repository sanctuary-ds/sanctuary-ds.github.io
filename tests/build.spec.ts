import { expect, test } from '@playwright/test';

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

test('the page loads without console errors or failed requests', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => message.type() === 'error' && problems.push(message.text()));
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('response', (response) => response.status() >= 400 && problems.push(`${response.status()} ${response.url()}`));
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(problems).toEqual([]);
});
