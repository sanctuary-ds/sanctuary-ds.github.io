import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { chapel, chapels } from '../src/data/chapels';
import { toRoman } from '../src/data/numerals';

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
    for (const [index, chapel] of chapels.entries()) {
      const card = cards.nth(index);
      await expect(card.locator('.inscription')).toHaveText(`${toRoman(index + 1)} · ${chapel.name}`);
      await expect(card.locator('h3')).toHaveText(chapel.title);
      if (chapel.accent) await expect(card).toHaveAttribute('data-san-accent', chapel.accent);
      else await expect(card).not.toHaveAttribute('data-san-accent');
    }
  });

  test('an available chapel is one link; a planned one points to the roadmap', async ({ page }) => {
    await page.goto('/');
    for (const [index, entry] of chapels.entries()) {
      const card = page.locator('.chapel').nth(index);
      if (entry.available) {
        await expect(card.locator('a')).toHaveCount(1);
        await expect(card.locator('.chapel__link')).toHaveAttribute('href', entry.href);
      } else {
        await expect(card.locator('.chapel__link')).toHaveCount(0);
        await expect(card.locator('.chip')).toHaveText('Planned');
        await expect(card.getByRole('link')).toHaveAttribute('href', chapel('roadmap').href);
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

test.describe('nave', () => {
  test('four numbered steps, led to from the facade', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.facade').getByRole('link', { name: 'Enter the nave' })).toHaveAttribute('href', '#nave');
    const steps = page.locator('#nave .step');
    await expect(steps).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await expect(steps.nth(index).locator('.inscription').first()).toHaveText(new RegExp(`^${toRoman(index + 1)} · `));
    }
  });

  test('no step links to the playground before it exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.step__more')).toHaveCount(chapel('playground').available ? 4 : 0);
  });

  // Link checkers do not follow fragments, so check that each step's section is
  // really on the playground page.
  test('every step links to a section that exists on the playground', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('.step__more').evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
    expect(hrefs).toHaveLength(4);
    await page.goto(chapel('playground').href);
    for (const href of hrefs) {
      const [path, id] = href.split('#');
      expect(path).toBe(chapel('playground').href);
      await expect(page.locator(`main > section#${id}`), href).toHaveCount(1);
    }
  });

  test('chapels are looked up by id, and an unknown id fails loudly', () => {
    expect(chapel('playground').name).toBe('Playground');
    expect(() => chapel('nowhere')).toThrow('No chapel "nowhere"');
  });

  test('each flavor card shows its hour and themes the page when picked', async ({ page }) => {
    await page.goto('/');
    const flavors = Object.entries(palette.flavors as Record<string, { name: string; hour: string; blurb: string }>);
    const cards = page.locator('.flavors .flavor');
    await expect(cards).toHaveCount(flavors.length);
    for (const [index, [id, flavor]] of flavors.entries()) {
      const card = cards.nth(index);
      await expect(card).toHaveAttribute('data-san-flavor', id);
      await expect(card.locator('.inscription')).toHaveText(flavor.hour);
      await expect(card.locator('.flavor__name')).toHaveText(flavor.name);
      await expect(card.locator('.flavor__blurb')).toHaveText(flavor.blurb);
    }
    const [lastId] = flavors.at(-1)!;
    await cards.last().click();
    await expect(page.locator('html')).toHaveAttribute('data-san-flavor', lastId);
    await expect(cards.last()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`.lectern [data-set="flavor:${lastId}"]`)).toHaveAttribute('aria-pressed', 'true');
  });

  test('on a desktop the flavor cards sit two by two, with no orphan', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const tops = await page.locator('.flavors .flavor').evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().top)));
    const rows = new Map<number, number>();
    for (const top of tops) rows.set(top, (rows.get(top) ?? 0) + 1);
    expect([...rows.values()]).toEqual([2, 2]);
  });

  test('each glazing has its own stage and a button that applies it', async ({ page }) => {
    await page.goto('/');
    const glazings = Object.entries(palette.glazings as Record<string, { name: string; note: string }>);
    const items = page.locator('.glazings .glazing');
    await expect(items).toHaveCount(glazings.length);
    for (const [index, [id, glazing]] of glazings.entries()) {
      const item = items.nth(index);
      await expect(item).toHaveAttribute('data-san-glazing', id);
      await expect(item.locator('p')).toHaveText(glazing.note);
      await expect(item.locator('.glazing__stage')).toHaveAttribute('aria-hidden', 'true');
    }
    const [lastId, last] = glazings.at(-1)!;
    await page.getByRole('button', { name: `Use ${last.name}` }).click();
    await expect(page.locator('html')).toHaveAttribute('data-san-glazing', lastId);
  });

  test('each window mode previews itself and can be picked', async ({ page }) => {
    await page.goto('/');
    const modes = Object.entries(palette.windowModes as Record<string, { name: string; source: string; note: string }>);
    const buttons = page.locator('.windows .window');
    await expect(buttons).toHaveCount(modes.length);
    for (const [index, [id, mode]] of modes.entries()) {
      const button = buttons.nth(index);
      await expect(button).toHaveAttribute('data-san-window', id);
      await expect(button.locator('b')).toHaveText(mode.name);
      await expect(button.locator('.window__source')).toHaveText(mode.source);
      await expect(button.locator('small')).toHaveText(mode.note);
    }
    const [lastId] = modes.at(-1)!;
    await buttons.last().click();
    await expect(page.locator('html')).toHaveAttribute('data-san-window', lastId);
  });

  test('on a phone the desktop bar keeps everything inside it', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const fits = await page.locator('.desktop .bar').evaluate((bar) => {
      const box = bar.getBoundingClientRect();
      return [...bar.querySelectorAll('*')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .every((el) => {
          const r = el.getBoundingClientRect();
          return r.left >= box.left - 1 && r.right <= box.right + 1;
        });
    });
    expect(fits).toBe(true);
  });

  test('the desktop clock names the current flavor and follows it', async ({ page }) => {
    await page.goto('/');
    const clock = page.locator('[data-clock]');
    await expect(clock).toHaveText(palette.flavors[palette.defaultFlavor].name);
    await page.locator('.lectern [data-set="flavor:lauds"]').click();
    await expect(clock).toHaveText(palette.flavors.lauds.name);
    await expect(page.locator('.desktop')).toHaveAttribute('aria-hidden', 'true');
  });
});
