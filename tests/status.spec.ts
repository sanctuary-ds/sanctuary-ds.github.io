import { expect, test, type Locator } from '@playwright/test';

// A status is never conveyed by color alone (WCAG 1.4.1, and the core's
// contract in docs/ecosystem.md): every status carries its own shape, and its
// name is read as text, so it survives color blindness, grayscale and screen
// readers.

const STATUS_NAMES = { info: 'Information', success: 'Success', warning: 'Warning', danger: 'Error' };
const statuses = Object.keys(STATUS_NAMES) as (keyof typeof STATUS_NAMES)[];

// The shape of a status icon: its SVG markup, which holds no color of its own.
const shapeOf = async (owner: Locator) => {
  const icon = owner.locator('svg');
  await expect(icon).toHaveCount(1);
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  return icon.evaluate((svg) => svg.innerHTML.replace(/\s+/g, ' ').trim());
};

test.describe('status without color', () => {
  test('each status chip has its own shape and a name that says its status', async ({ page }) => {
    await page.goto('/playground');
    const shapes = new Set<string>();
    for (const status of statuses) {
      const chip = page.locator(`.chip--status[data-status="${status}"]`);
      await expect(chip).toHaveCount(1);
      shapes.add(await shapeOf(chip));
      // The status name is text a screen reader reads before the label.
      await expect(chip).toHaveText(new RegExp(`^${STATUS_NAMES[status]}: \\S+`));
    }
    expect(shapes.size).toBe(statuses.length);
  });

  test('each alert keeps its label and shows the same shape as its status chip', async ({ page }) => {
    await page.goto('/playground');
    for (const status of statuses) {
      const alert = page.locator(`.alert[data-status="${status}"]`);
      await expect(alert).toHaveCount(1);
      await expect(alert.locator('strong')).toHaveText(/^\S.*\.$/);
      expect(await shapeOf(alert)).toBe(await shapeOf(page.locator(`.chip--status[data-status="${status}"]`)));
    }
  });

  test('the urgent workspace carries a mark the other workspaces do not', async ({ page }) => {
    await page.goto('/');
    const marks = await page.locator('.desktop .ws').evaluateAll((spaces) =>
      spaces.map((space) => {
        const mark = getComputedStyle(space, '::after');
        const shown = mark.content !== 'none' && mark.content !== 'normal' && parseFloat(mark.width) > 0 && parseFloat(mark.height) > 0;
        return { urgent: space.classList.contains('ws--urgent'), shown };
      }),
    );
    expect(marks.filter(({ urgent }) => urgent)).toEqual([{ urgent: true, shown: true }]);
    expect(marks.filter(({ urgent }) => !urgent).every(({ shown }) => !shown)).toBe(true);
  });
});
