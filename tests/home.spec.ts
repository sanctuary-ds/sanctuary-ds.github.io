import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { ROADMAP_HREF, chapels } from '../src/data/chapels';

// The home page through what a visitor sees: the facade, its rose window and
// its facts, which are counted from the core palette.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

test.describe('facade', () => {
  test('the facts are counted from the palette', async ({ page }) => {
    await page.goto('/');
    const pigments = Object.values(palette.pigments) as { tones: Record<string, string> }[];
    const modes = Object.values(palette.windowModes as Record<string, { name: string }>).map((mode) => mode.name.toLowerCase());
    const facts = await page.locator('.facade__facts > div').evaluateAll((items) =>
      items.map((item) => [item.querySelector('dt')!.textContent!.trim(), item.querySelector('dd')!.textContent!.trim()]),
    );
    expect(facts).toEqual([
      [String(Object.keys(palette.flavors).length), 'flavors, the hours'],
      [String(pigments.length), `pigments × ${Object.keys(pigments[0].tones).length} tones`],
      [String(Object.keys(palette.glazings).length), 'glazings'],
      [String(modes.length), `windows, ${modes.join(' or ')}`],
    ]);
  });

  test('the page has one heading naming the system', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Sanctuary');
  });

  test('the rose window is drawn at build time, with its cast below it', async ({ page }) => {
    await page.goto('/');
    const roses = page.locator('.facade__rose .rose');
    await expect(roses).toHaveCount(2);
    // 24 outer panes, 12 petals, 12 inner sectors, 12 jewels and the eye.
    await expect(page.locator('.rose:not(.rose--cast) .rose__pane')).toHaveCount(61);
    await expect(page.locator('.rose:not(.rose--cast) .rose__sun')).toHaveCount(1);
    // The cast is only the glass: no stone, lead or sun.
    await expect(page.locator('.rose--cast .rose__stone, .rose--cast .rose__sun')).toHaveCount(0);
    // Decorative only: hidden from assistive technology.
    for (const hidden of await roses.evaluateAll((els) => els.map((el) => el.getAttribute('aria-hidden')))) expect(hidden).toBe('true');
  });

  test('the beams and the cast light dark flavors and shade light ones', async ({ page }) => {
    for (const [flavor, { scheme }] of Object.entries(palette.flavors as Record<string, { scheme: string }>)) {
      await page.goto(`/?flavor=${flavor}`);
      const blend = await page.evaluate(() => [
        getComputedStyle(document.querySelector('.facade__beams')!).mixBlendMode,
        getComputedStyle(document.querySelector('.rose--cast')!).mixBlendMode,
      ]);
      const expected = scheme === 'light' ? 'multiply' : 'screen';
      expect(blend, flavor).toEqual([expected, expected]);
    }
  });

  test('the light is still for visitors who ask for less motion', async ({ browser }) => {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      const context = await browser.newContext({ reducedMotion });
      const page = await context.newPage();
      await page.goto('/');
      const animations = await page.evaluate(() => [
        getComputedStyle(document.querySelector('.facade__beams')!).animationName,
        getComputedStyle(document.querySelector('.rose__pane')!).animationName,
      ]);
      if (reducedMotion === 'reduce') expect(animations).toEqual(['none', 'none']);
      else for (const name of animations) expect(name).not.toBe('none');
      await context.close();
    }
  });
});

test.describe('chapels', () => {
  test('the gallery shows every chapel of the list, numbered, in order', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.chapel');
    await expect(cards).toHaveCount(chapels.length);
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    for (const [index, chapel] of chapels.entries()) {
      const card = cards.nth(index);
      await expect(card.locator('.inscription')).toHaveText(`${numerals[index]} · ${chapel.name}`);
      await expect(card.locator('h3')).toHaveText(chapel.title);
      if (chapel.accent) await expect(card).toHaveAttribute('data-san-accent', chapel.accent);
      else await expect(card).not.toHaveAttribute('data-san-accent');
    }
  });

  test('an available chapel is one link; a planned one points to the roadmap', async ({ page }) => {
    await page.goto('/');
    for (const [index, chapel] of chapels.entries()) {
      const card = page.locator('.chapel').nth(index);
      if (chapel.available) {
        await expect(card.locator('a')).toHaveCount(1);
        await expect(card.locator('.chapel__link')).toHaveAttribute('href', chapel.href);
      } else {
        await expect(card.locator('.chapel__link')).toHaveCount(0);
        await expect(card.locator('.chip')).toHaveText('Planned');
        await expect(card.getByRole('link')).toHaveAttribute('href', ROADMAP_HREF);
        await expect(card.getByRole('link')).toHaveText('On the roadmap');
      }
    }
  });

  test('the header lists the same chapels, planned ones as disabled text', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('.lectern__nav > *');
    await expect(items).toHaveCount(chapels.length);
    for (const [index, chapel] of chapels.entries()) {
      const item = items.nth(index);
      await expect(item).toHaveText(chapel.name);
      if (chapel.available) await expect(item).toHaveAttribute('href', chapel.href);
      else {
        await expect(item).toHaveAttribute('aria-disabled', 'true');
        expect(await item.evaluate((el) => el.tagName)).not.toBe('A');
      }
    }
  });

  test('the facade leads to the chapels', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('.facade').getByRole('link', { name: 'Visit the chapels' });
    await expect(link).toHaveAttribute('href', '#chapels');
    await expect(page.locator('#chapels')).toHaveCount(1);
  });
});
