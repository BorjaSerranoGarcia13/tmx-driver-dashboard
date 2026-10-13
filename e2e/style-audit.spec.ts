import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Opt-in before/after comparison. Baselines live outside the repository, never in production.
const directory = process.env['TMX_STYLE_AUDIT_DIR'];
const mode = process.env['TMX_STYLE_AUDIT_MODE'];

for (const width of [320, 390, 1440]) {
  test(`style audit at ${width}px`, async ({ page }, info) => {
    test.skip(!directory, 'Set TMX_STYLE_AUDIT_DIR and record/compare mode to audit CSS changes.');
    expect(['record', 'compare']).toContain(mode);
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem(
        'tmx-driver-insights.review-work.v1',
        JSON.stringify([
          {
            driverId: 'tmx-1042',
            status: 'saved',
            note: 'Follow up next week',
            createdAt: '2026-10-12T10:00:00Z',
            updatedAt: '2026-10-12T10:00:00Z',
          },
        ]),
      );
    });
    async function capture(name: string) {
      await page.evaluate(() => document.fonts.ready);
      const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
      const path = join(directory!, `${info.project.name}-${width}-${name}.png`);
      if (mode === 'record') {
        await mkdir(directory!, { recursive: true });
        await writeFile(path, screenshot);
      } else {
        const baseline = await readFile(path);
        if (!screenshot.equals(baseline)) {
          await info.attach(name + '-before', { body: baseline, contentType: 'image/png' });
          await info.attach(name + '-after', { body: screenshot, contentType: 'image/png' });
        }
        expect(screenshot.equals(baseline), `Visual change: ${path}`).toBe(true);
      }
    }
    for (const route of [
      '/dashboard',
      '/drivers',
      '/fleet',
      '/reviews',
      '/my-work',
      '/drivers/tmx-1042',
      '/drivers/tmx-1219',
      '/drivers/tmx-1311',
    ]) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('app-loading-block')).toHaveCount(0);
      await capture(route.slice(1).replaceAll('/', '-'));
    }
    await page.goto('/my-work');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByRole('button', { name: 'Clear workspace' }).click();
    await expect(
      page.getByRole('heading', { name: 'Your review workspace is empty' }),
    ).toBeVisible();
    await page.locator('app-toast-center button.toast__dismiss').click();
    await capture('workspace-empty');
    await page.getByLabel('API response').selectOption('server-error');
    await page.getByRole('navigation').getByRole('link', { name: 'Drivers', exact: true }).click();
    await page.locator('tbody .driver-cell').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await capture('error-dialog');
  });
}
