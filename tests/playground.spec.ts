import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { toRoman } from '../src/data/numerals';

// The playground through what a visitor sees: its index and its sections, each
// checked against the core palette.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

test.describe('playground', () => {
  test('the index lists every section on the page, in order, and nothing else', async ({ page }) => {
    await page.goto('/playground');
    await expect(page.locator('h1')).toHaveText('Playground');
    const links = page.locator('.index a');
    const sections = page.locator('main > section[id]');
    const ids = await sections.evaluateAll((els) => els.map((el) => el.id));
    expect(ids.length).toBeGreaterThan(0);
    await expect(links).toHaveCount(ids.length);
    for (const [index, id] of ids.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', `#${id}`);
      await expect(links.nth(index).locator('span')).toHaveText(toRoman(index + 1));
      await expect(sections.nth(index).locator('.inscription').first()).toHaveText(new RegExp(`^${toRoman(index + 1)} · `));
    }
  });

  test('the theme sections follow the palette and change the theme', async ({ page }) => {
    await page.goto('/playground');
    await expect(page.locator('#flavors .flavor')).toHaveCount(Object.keys(palette.flavors).length);
    await expect(page.locator('#glazing .glazing')).toHaveCount(Object.keys(palette.glazings).length);
    await expect(page.locator('#windows .window')).toHaveCount(Object.keys(palette.windowModes).length);
    await page.locator('#flavors [data-set="flavor:lauds"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-san-flavor', 'lauds');
    await expect(page.locator('.lectern [data-set="flavor:lauds"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('the named windows are the palette\'s, each with its own fixed gradient', async ({ page }) => {
    await page.goto('/playground');
    const windows = Object.entries(palette.windows as Record<string, { name: string; stops: string[]; note: string }>);
    const figures = page.locator('.named-window');
    await expect(figures).toHaveCount(windows.length);
    for (const [index, [id, window]] of windows.entries()) {
      const figure = figures.nth(index);
      await expect(figure.locator('b')).toHaveText(window.name);
      await expect(figure.locator('figcaption span')).toHaveText(window.stops.join(' · '));
      await expect(figure.locator('small')).toHaveText(window.note);
      const gradient = await figure.evaluate((el) => getComputedStyle(el).getPropertyValue('--san-window').trim());
      const named = await figure.evaluate((el, name) => getComputedStyle(el).getPropertyValue(`--san-window-${name}`).trim(), id);
      expect(gradient).toBe(named);
    }
  });

  test('the named windows line up, however long their notes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/playground');
    const tops = await page.locator('.named-window b').evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size);
    expect(tops).toBe(1);
  });

  test('every pigment ramp follows the palette, and its name sets the accent', async ({ page }) => {
    await page.goto('/playground');
    const pigments = Object.entries(palette.pigments as Record<string, { tones: Record<string, string> }>);
    const ramps = page.locator('#pigments .ramp');
    await expect(ramps).toHaveCount(pigments.length);
    for (const [index, [id, pigment]] of pigments.entries()) {
      const tones = ramps.nth(index).locator('.tone');
      expect(await tones.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.copy))).toEqual(Object.values(pigment.tones));
      await expect(ramps.nth(index).locator('.ramp__name')).toHaveAttribute('data-set', `accent:${id}`);
    }
    await page.locator('#pigments [data-set="accent:verdure"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-san-accent', 'verdure');
  });

  test('in every flavor, each ramp marks the one tone that flavor uses as its glass', async ({ page }) => {
    await page.goto('/playground');
    for (const [flavor, { colors }] of Object.entries(palette.flavors as Record<string, { colors: Record<string, { hex: string }> }>)) {
      await page.locator(`.lectern [data-set="flavor:${flavor}"]`).click();
      for (const id of Object.keys(palette.pigments)) {
        const marked = await page
          .locator(`#pigments .ramp[data-pigment="${id}"] .tone`)
          .evaluateAll((els) => els.filter((el) => getComputedStyle(el).outlineStyle !== 'none').map((el) => (el as HTMLElement).dataset.copy));
        expect(marked, `${flavor} ${id}`).toEqual([colors[`glass-${id}`].hex]);
      }
    }
  });

  test('the roles show the current flavor\'s hex, and their swatch is that colour', async ({ page }) => {
    await page.goto('/playground');
    const roles = page.locator('#pigments .role');
    expect(await roles.count()).toBeGreaterThan(0);
    for (const [flavor, { colors }] of Object.entries(palette.flavors as Record<string, { colors: Record<string, { hex: string }> }>)) {
      await page.locator(`.lectern [data-set="flavor:${flavor}"]`).click();
      for (const role of await roles.all()) {
        const name = await role.locator('b').textContent();
        await expect(role.locator('code:visible')).toHaveText(colors[name!].hex);
        // The core writes colours in OKLCH; a canvas turns any of them into sRGB
        // bytes, compared with the hex allowing one step of rounding per channel.
        // Polled, because the theme change is animated.
        await expect
          .poll(
            () =>
              role.locator('i').evaluate((el, hex) => {
                const context = document.createElement('canvas').getContext('2d')!;
                context.fillStyle = getComputedStyle(el).backgroundColor;
                context.fillRect(0, 0, 1, 1);
                const shown = context.getImageData(0, 0, 1, 1).data;
                return Math.max(...[0, 1, 2].map((i) => Math.abs(shown[i] - parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16))));
              }, colors[name!].hex),
            { message: `${flavor} ${name}` },
          )
          .toBeLessThanOrEqual(1);
      }
    }
  });

  test('a tone or a role copies its hex and says so', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/playground');
    const toast = page.getByRole('status');
    const tone = page.locator('#pigments .tone').first();
    const hex = (await tone.getAttribute('data-copy'))!;
    await tone.click();
    await expect(toast).toHaveText(`Copied ${hex}`);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(hex);

    await page.locator('.lectern [data-set="flavor:lauds"]').click();
    const role = page.locator('#pigments .role').first();
    const name = (await role.locator('b').textContent())!;
    const roleHex = palette.flavors.lauds.colors[name].hex;
    await role.click();
    await expect(toast).toHaveText(`Copied ${roleHex}`);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(roleHex);
  });

  test('the component panels are all there, and a disabled button cannot be pressed', async ({ page }) => {
    await page.goto('/playground');
    for (const title of ['Buttons', 'Chips', 'Form', 'Navigation', 'Progress', 'Status']) {
      await expect(page.locator('#components .panel__title', { hasText: title })).toHaveCount(1);
    }
    await expect(page.locator('#components .card')).toHaveCount(1);
    await expect(page.locator('#components .dialog')).toHaveCount(1);
    await expect(page.locator('#components button', { hasText: 'Disabled' })).toBeDisabled();
    await expect(page.getByRole('progressbar', { name: 'Glazing the north transept' })).toHaveAttribute('aria-valuenow', '64');
  });

  test('the tabs follow the ARIA tabs pattern, by mouse and by keyboard', async ({ page }) => {
    await page.goto('/playground');
    const tabs = page.locator('#components [role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(1);
    // Exactly one tab is selected and reachable with Tab; only its panel shows.
    const expectSelected = async (index: number) => {
      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        const panel = page.locator(`#${await tab.getAttribute('aria-controls')}`);
        await expect(tab).toHaveAttribute('aria-selected', String(i === index));
        await expect(tab).toHaveAttribute('tabindex', i === index ? '0' : '-1');
        await expect(panel).toHaveAttribute('role', 'tabpanel');
        await (i === index ? expect(panel).toBeVisible() : expect(panel).toBeHidden());
      }
    };
    await expectSelected(0);
    await tabs.nth(2).click();
    await expectSelected(2);
    await page.keyboard.press('ArrowRight');
    await expectSelected(3);
    await expect(tabs.nth(3)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expectSelected(0);
    await page.keyboard.press('ArrowLeft');
    await expectSelected(count - 1);
    await page.keyboard.press('Home');
    await expectSelected(0);
    await page.keyboard.press('End');
    await expectSelected(count - 1);
  });

  test('the light section shows every Lumen level on its own elevation, and the casts', async ({ page }) => {
    await page.goto('/playground');
    const levels = page.locator('#light .lumen--levels .tile');
    await expect(levels).toHaveCount(6);
    for (let level = 0; level < 6; level++) {
      const tile = levels.nth(level);
      await expect(tile.locator('b')).toHaveText(`Lumen ${level}`);
      const [shadow, token] = await tile.evaluate((el, n) => {
        const probe = document.createElement('i');
        probe.style.boxShadow = `var(--san-elevation-${n})`;
        el.parentElement!.append(probe);
        const expected = getComputedStyle(probe).boxShadow;
        probe.remove();
        return [getComputedStyle(el).boxShadow, expected];
      }, level);
      expect(shadow, `Lumen ${level}`).toBe(token);
    }
    expect(await page.locator('#light .lumen--cast .tile b').allTextContents()).toEqual(['cast-sm', 'cast-md', 'cast-lg', 'halo']);
  });

  for (const [name, viewport] of [['phone', { width: 375, height: 812 }], ['desktop', { width: 1440, height: 900 }]] as const) {
    test(`the page never scrolls sideways (${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/playground');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
