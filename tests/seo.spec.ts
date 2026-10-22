import { expect, test } from '@playwright/test';
import { docFiles } from './docs-content';

// What search engines read: the Search Console verification file, robots.txt,
// the sitemap and one canonical URL per page.

const SITE = 'https://sanctuary-ds.github.io';
const PAGES = ['/', '/playground/', '/roadmap/', '/docs/', ...docFiles.map((doc) => `${doc.path}/`)];

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

// What LinkedIn, Slack and other link previews read: Open Graph and the Twitter card.
test.describe('link previews', () => {
  for (const path of PAGES) {
    test(`${path} describes itself for link previews`, async ({ page }) => {
      await page.goto(path);
      const meta = (key: string) => page.locator(`meta[property="${key}"], meta[name="${key}"]`);
      await expect(meta('og:title')).toHaveAttribute('content', await page.title());
      await expect(meta('og:description')).toHaveAttribute(
        'content',
        (await page.locator('meta[name="description"]').getAttribute('content'))!,
      );
      await expect(meta('og:url')).toHaveAttribute('content', `${SITE}${path}`);
      await expect(meta('og:type')).toHaveAttribute('content', 'website');
      await expect(meta('og:site_name')).toHaveAttribute('content', 'Sanctuary');
      await expect(meta('og:image')).toHaveAttribute('content', `${SITE}/og-image.png`);
      await expect(meta('og:image:alt')).toHaveAttribute('content', /rose window/);
      await expect(meta('twitter:card')).toHaveAttribute('content', 'summary_large_image');
    });
  }

  test('the social image is served as a 1200 × 630 PNG', async ({ request }) => {
    const response = await request.get('/og-image.png');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    const png = await response.body();
    // The IHDR chunk stores the width and height as big-endian integers at bytes 16 and 20.
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });
});

// Who made Sanctuary, said twice and kept in step: in the visible footer, and in
// schema.org JSON-LD that links the author to their profiles (sameAs), so search
// engines and AI agents can attribute the design system to the same person.
test.describe('authorship', () => {
  const AUTHOR = 'Anthony Portugal';
  const WEBSITE = 'https://anthonyportugal.github.io';
  const GITHUB = 'https://github.com/anthonyportugal';

  for (const path of PAGES) {
    test(`${path} credits its author in the footer and in structured data`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', AUTHOR);

      const credit = page.getByRole('contentinfo').getByRole('link', { name: AUTHOR });
      await expect(credit).toHaveAttribute('href', WEBSITE);
      await expect(credit).toHaveAttribute('rel', /\bauthor\b/);

      const scripts = page.locator('script[type="application/ld+json"]');
      await expect(scripts).toHaveCount(1);
      const { '@context': context, '@graph': graph } = JSON.parse((await scripts.textContent())!);
      expect(context).toBe('https://schema.org');
      const byType = (type: string) => graph.find((node: { '@type': string }) => node['@type'] === type);

      const person = byType('Person');
      expect(person).toMatchObject({ name: AUTHOR, url: WEBSITE });
      expect(person.sameAs).toEqual(expect.arrayContaining([WEBSITE, GITHUB]));

      const site = byType('WebSite');
      expect(site).toMatchObject({ name: 'Sanctuary', url: `${SITE}/`, author: { '@id': person['@id'] } });

      const work = byType('SoftwareSourceCode');
      expect(work).toMatchObject({
        name: 'Sanctuary',
        url: `${SITE}/`,
        codeRepository: 'https://github.com/sanctuary-ds/tokens',
        license: 'https://opensource.org/licenses/MIT',
        author: { '@id': person['@id'] },
        creator: { '@id': person['@id'] },
      });
    });
  }
});

// The brand rose, the organization's profile picture, as the site's icon.
test.describe('icons', () => {
  test('the page links its SVG favicon and its touch icon, and both are served', async ({ page, request }) => {
    await page.goto('/');
    for (const [rel, href, type] of [
      ['icon', '/favicon.svg', 'image/svg+xml'],
      ['apple-touch-icon', '/apple-touch-icon.png', 'image/png'],
    ]) {
      await expect(page.locator(`link[rel="${rel}"]`)).toHaveAttribute('href', href);
      const response = await request.get(href);
      expect(response.ok(), href).toBe(true);
      expect(response.headers()['content-type'], href).toContain(type);
    }
  });

  // Browsers and tools still ask for /favicon.ico on their own.
  test('a favicon.ico is served for clients that ask for it', async ({ request }) => {
    const response = await request.get('/favicon.ico');
    expect(response.ok()).toBe(true);
  });
});
