import { expect, test, type Page } from '@playwright/test';

// The theme switcher through its public interface: the lectern buttons, the
// attributes on <html>, the query string and the visitor's saved choice.

const KEY = 'sanctuary:theme';
const AXES = ['flavor', 'accent', 'glazing', 'window'] as const;

const theme = (page: Page) =>
  page.evaluate((axes) => axes.map((axis) => document.documentElement.getAttribute(`data-san-${axis}`)).join('/'), [...AXES]);

const stored = async (page: Page) => JSON.parse((await page.evaluate((key) => localStorage.getItem(key), KEY)) ?? 'null');

// Seeds the saved theme before the page's own scripts run, on the first load only.
const seed = (page: Page, value: string) =>
  page.addInitScript(
    ([key, saved]) => {
      if (sessionStorage.getItem('seeded')) return;
      localStorage.setItem(key, saved);
      sessionStorage.setItem('seeded', '1');
    },
    [KEY, value],
  );

test.describe('lectern controls', () => {
  for (const [name, viewport] of [
    ['phone', { width: 375, height: 812 }],
    ['tablet', { width: 820, height: 1180 }],
    ['desktop', { width: 1440, height: 900 }],
  ] as const) {
    test(`each axis sets its attribute and one pressed button (${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const toggle = page.locator('.lectern__toggle');
      if (await toggle.isVisible()) await toggle.click();

      for (const [axis, value] of [['flavor', 'lauds'], ['accent', 'ruby'], ['glazing', 'flashed'], ['window', 'harmonic']]) {
        await page.locator(`[data-set="${axis}:${value}"]`).click();
        await expect(page.locator('html')).toHaveAttribute(`data-san-${axis}`, value);
        await expect(page.locator(`[data-set^="${axis}:"][aria-pressed="true"]`)).toHaveCount(1);
        await expect(page.locator(`[data-set="${axis}:${value}"]`)).toHaveAttribute('aria-pressed', 'true');
      }
    });

    test(`the page never scrolls sideways (${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const toggle = page.locator('.lectern__toggle');
      if (await toggle.isVisible()) await toggle.click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('on phones the controls fold behind the Light button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const toggle = page.locator('.lectern__toggle');
    await expect(page.locator('#lectern-controls')).toBeHidden();
    await toggle.click();
    await expect(page.locator('#lectern-controls')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('changing the flavor retints the page once the light settles', async ({ page }) => {
    await page.goto('/');
    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.locator('[data-set="flavor:lauds"]').click();
    await expect(page.locator('html')).not.toHaveClass(/is-shifting/);
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(after).not.toBe(before);
  });
});

test.describe('restoring the theme', () => {
  test('a first visit shows the default theme', async ({ page }) => {
    await page.goto('/');
    expect(await theme(page)).toBe('compline/cobalt/pot-metal/mono');
  });

  test('a choice survives a reload and the buttons reflect it', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-set="flavor:lauds"]').click();
    await page.locator('[data-set="accent:ruby"]').click();
    await page.reload();
    expect(await theme(page)).toBe('lauds/ruby/pot-metal/mono');
    const pressed = await page.locator('[aria-pressed="true"]').evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.set).sort());
    expect(pressed).toEqual(['accent:ruby', 'flavor:lauds', 'glazing:pot-metal', 'window:mono']);
  });

  test('the saved theme is applied before the body exists, so nothing flashes', async ({ page }) => {
    await seed(page, JSON.stringify({ flavor: 'matins', accent: 'gilt', glazing: 'grisaille', window: 'harmonic' }));
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        (window as unknown as { flavorAtBody: string | null }).flavorAtBody = document.documentElement.getAttribute('data-san-flavor');
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    expect(await page.evaluate(() => (window as unknown as { flavorAtBody: string | null }).flavorAtBody)).toBe('matins');
  });

  test('a flavor without a saved accent brings its own accent', async ({ page }) => {
    await page.goto('/?flavor=vespers');
    expect(await theme(page)).toBe('vespers/amber/pot-metal/mono');
  });

  test('corrupt storage falls back to the defaults without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await seed(page, '{not json');
    await page.goto('/');
    expect(await theme(page)).toBe('compline/cobalt/pot-metal/mono');
    expect(errors).toEqual([]);
  });

  test('a saved value that is not an object is replaced, not merged into', async ({ page }) => {
    await seed(page, JSON.stringify(['junk']));
    await page.goto('/');
    await page.locator('[data-set="accent:ruby"]').click();
    expect(await stored(page)).toEqual({ accent: 'ruby' });
  });

  test('the light only moves when the visitor allows motion', async ({ browser }) => {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      const context = await browser.newContext({ reducedMotion });
      const page = await context.newPage();
      await page.goto('/');
      await page.locator('[data-set="flavor:lauds"]').click();
      const duration = await page.evaluate(() => getComputedStyle(document.body).transitionDuration);
      const moving = duration.split(',').some((value) => parseFloat(value) > 0);
      expect(moving, `${reducedMotion}: ${duration}`).toBe(reducedMotion === 'no-preference');
      await context.close();
    }
  });
});

test.describe('preview links', () => {
  const saved = JSON.stringify({ flavor: 'lauds', accent: 'ruby', glazing: 'pot-metal', window: 'mono' });

  test('a query string wins without replacing the saved choice', async ({ page }) => {
    await seed(page, saved);
    await page.goto('/?flavor=vespers&accent=viridian');
    expect(await theme(page)).toBe('vespers/viridian/pot-metal/mono');
    expect((await stored(page)).flavor).toBe('lauds');
  });

  test('invalid query values are ignored', async ({ page }) => {
    await seed(page, saved);
    await page.goto('/?flavor=nonsense&glazing=../../x');
    expect(await theme(page)).toBe('lauds/ruby/pot-metal/mono');
  });

  test('changing one axis on a preview saves only that axis', async ({ page }) => {
    await seed(page, saved);
    await page.goto('/?flavor=vespers');
    await page.locator('[data-set="accent:viridian"]').click();
    expect(await stored(page)).toMatchObject({ flavor: 'lauds', accent: 'viridian' });
  });

  test('a click on a preview survives a reload of that page', async ({ page }) => {
    await seed(page, saved);
    await page.goto('/?flavor=vespers');
    await page.locator('[data-set="flavor:compline"]').click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-san-flavor', 'compline');
  });

  test('clicking the value a preview already shows keeps it', async ({ page }) => {
    await seed(page, saved);
    await page.goto('/?flavor=vespers');
    await page.locator('[data-set="flavor:vespers"]').click();
    expect((await stored(page)).flavor).toBe('vespers');
    expect(new URL(page.url()).searchParams.has('flavor')).toBe(false);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-san-flavor', 'vespers');
  });

  test('the rest of the preview still applies after a click on another axis', async ({ page }) => {
    await seed(page, saved);
    await page.goto('/?flavor=vespers&glazing=flashed');
    await page.locator('[data-set="accent:gilt"]').click();
    await page.reload();
    expect(await theme(page)).toBe('vespers/gilt/flashed/mono');
  });
});

test.describe('accent across flavors', () => {
  test('the accent on screen stays when the flavor changes, also after a reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-set="flavor:vespers"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-san-accent', 'cobalt');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-san-accent', 'cobalt');
  });

  test('a preview accent is not saved when the visitor picks a flavor', async ({ page }) => {
    await page.goto('/?accent=viridian');
    await page.locator('[data-set="flavor:matins"]').click();
    const saved = await stored(page);
    expect(saved.flavor).toBe('matins');
    expect(saved).not.toHaveProperty('accent');
  });
});
