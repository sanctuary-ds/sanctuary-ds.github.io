import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// The guides publish code people will copy; the port script is run as the page
// shows it.

const palette = createRequire(import.meta.url)('@sanctuary-ds/tokens/palette');

test.describe('guides', () => {
  test('the port script in "Writing a port" runs and writes a theme per flavor from the palette', async ({ page }, testInfo) => {
    await page.goto('/docs/guides/writing-a-port');
    const script = await page.locator('pre code', { hasText: '// build.js' }).textContent();
    // The output folder is inside the project, so the script resolves the package as a reader's would.
    const dir = testInfo.outputPath();
    writeFileSync(join(dir, 'build.mjs'), script!);
    execFileSync(process.execPath, ['build.mjs'], { cwd: dir });
    for (const [id, flavor] of Object.entries<any>(palette.flavors)) {
      const theme = readFileSync(join(dir, 'themes', `sanctuary-${id}.conf`), 'utf8');
      expect(theme).toContain(`background ${flavor.colors.surface.hex}\n`);
      expect(theme).toContain(`cursor ${flavor.colors.accent.hex}\n`);
      expect(theme).toContain(`color15 ${flavor.colors['ansi-bright-white'].hex}\n`);
    }
  });
});
