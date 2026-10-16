import { expect, test } from '@playwright/test';

// What search engines read: the Search Console verification file, robots.txt,
// the sitemap and one canonical URL per page.

const SITE = 'https://sanctuary-ds.github.io';
const PAGES = ['/', '/playground/', '/roadmap/'];

test.describe('search engines', () => {
  // Google checks this file again from time to time; it must stay byte for byte.
  test('the Search Console verification file is served unchanged', async ({ request }) => {
    const response = await request.get('/googled6db163f7db10820.html');
    expect(response.ok()).toBe(true);
    expect(await response.text()).toBe('google-site-verification: googled6db163f7db10820.html');
  });

  test('robots.txt allows crawling and points to the sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  });

  test('the sitemap lists every page, and nothing else', async ({ request }) => {
    const index = await (await request.get('/sitemap-index.xml')).text();
    const [, first] = index.match(/<loc>([^<]+)<\/loc>/)!;
    const sitemap = await (await request.get(new URL(first).pathname)).text();
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url).sort();
    expect(urls).toEqual(PAGES.map((path) => `${SITE}${path}`).sort());
  });

  // Theme previews (?flavor=lauds) are the same page, not new ones.
  for (const path of PAGES) {
    test(`${path} names its canonical URL, without the theme query`, async ({ page }) => {
      await page.goto(`${path}?flavor=lauds&accent=ruby`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${path}`);
    });
  }
});
