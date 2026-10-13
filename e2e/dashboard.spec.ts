import { expect, test, Page } from '@playwright/test';

const id = 'tmx-1042';
const key = 'tmx-driver-insights.review-work.v1';
const nav = (page: Page) => page.getByRole('navigation', { name: 'Primary navigation' });

test('navigation fits saved-work counters without overlapping adjacent links', async ({ page }) => {
  for (const count of [0, 1, 12, 100]) {
    await page.goto('/dashboard');
    await page.evaluate(
      ({ storageKey, count }) => {
        localStorage.setItem(
          storageKey,
          JSON.stringify(
            Array.from({ length: count }, (_, index) => ({
              driverId: `navigation-test-${index}`,
              status: 'saved',
              note: '',
              createdAt: '2026-10-12',
              updatedAt: '2026-10-12',
            })),
          ),
        );
      },
      { storageKey: key, count },
    );
    await page.reload();
    await expect(nav(page).locator('.nav-link__badge')).toHaveCount(count ? 1 : 0);
    for (const width of [320, 360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const errors = await nav(page).evaluate((navigation) => {
        const links = Array.from(navigation.querySelectorAll('a'));
        const failures: string[] = [];
        for (const link of links) {
          const box = link.getBoundingClientRect();
          const content = document.createRange();
          content.selectNodeContents(link);
          for (const rect of Array.from(content.getClientRects())) {
            if (rect.left < box.left - 1 || rect.right > box.right + 1)
              failures.push(link.textContent ?? 'overflow');
          }
          for (const other of links) {
            if (other === link) continue;
            const adjacent = other.getBoundingClientRect();
            if (
              box.left < adjacent.right &&
              box.right > adjacent.left &&
              box.top < adjacent.bottom &&
              box.bottom > adjacent.top
            )
              failures.push('overlap');
          }
        }
        if (document.documentElement.scrollWidth > innerWidth) failures.push('page overflow');
        return failures;
      });
      expect(errors, `width=${width}, count=${count}`).toEqual([]);
    }
  }
  await nav(page)
    .getByRole('link', { name: /My work/ })
    .click();
  await expect(page).toHaveURL(/\/my-work$/);
});

async function openEditor(page: Page) {
  await page.goto('/drivers/' + id);
  await expect(page.getByRole('heading', { name: 'Avery Morgan' })).toBeVisible();
  return page.locator('app-review-editor');
}

test('save, reload, cancel edits and resume from My work', async ({ page }) => {
  const editor = await openEditor(page);
  await editor.getByLabel('Review note').fill('Call next Tuesday');
  await editor.getByRole('combobox', { name: 'Status', exact: true }).selectOption('follow-up');
  await editor.getByRole('button', { name: 'Save to My work' }).click();
  await expect(editor.getByRole('status')).toHaveText('All changes saved');
  await expect(page.locator('app-toast-center')).toContainText(
    'Your review is ready to continue in My work.',
  );
  await expect(editor).not.toContainText(/browser|demo|mock|prototype/i);
  await page.reload();
  await expect(editor.getByLabel('Review note')).toHaveValue('Call next Tuesday');
  await editor.getByLabel('Review note').fill('Discard me');
  await editor.getByRole('button', { name: 'Cancel changes' }).click();
  await expect(editor.getByLabel('Review note')).toHaveValue('Call next Tuesday');
  await nav(page)
    .getByRole('link', { name: /My work/ })
    .click();
  await expect(page.getByRole('cell', { name: 'Call next Tuesday' })).toBeVisible();
  await expect(page.locator('app-workspace')).not.toContainText(/browser|demo|mock|prototype/i);
  await page.getByRole('link', { name: 'Open →', exact: true }).click();
  await expect(editor.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue(
    'follow-up',
  );
});

test('failed persistence preserves the draft and never announces success', async ({ page }) => {
  const editor = await openEditor(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await editor.getByLabel('Review note').fill('Do not lose this');
  await editor.getByRole('button', { name: 'Save to My work' }).click();
  await expect(editor.getByRole('alert')).toContainText('Changes were not saved');
  await expect(editor.getByLabel('Review note')).toHaveValue('Do not lose this');
  await expect(page.getByText('Review saved', { exact: true })).toHaveCount(0);
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBeNull();
  await editor.getByRole('button', { name: 'Cancel changes' }).click();
});

test('warns before leaving a dirty review, supports staying and discarding', async ({ page }) => {
  const editor = await openEditor(page);
  await editor.getByLabel('Review note').fill('Unsaved note');
  page.once('dialog', (dialog) => dialog.dismiss());
  await nav(page).getByRole('link', { name: 'Drivers', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/drivers/' + id + '$'));
  await expect(editor.getByLabel('Review note')).toHaveValue('Unsaved note');
  page.once('dialog', (dialog) => dialog.accept());
  await nav(page).getByRole('link', { name: 'Drivers', exact: true }).click();
  await expect(page).toHaveURL(/\/drivers$/);
});

test('Overview metrics do not inherit driver-list filters', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.criteria-list .criterion-row')).toHaveCount(4);
  const distribution = await page.locator('.distribution-legend').textContent();
  await nav(page).getByRole('link', { name: 'Drivers', exact: true }).click();
  await page.getByRole('combobox', { name: 'Risk level', exact: true }).selectOption('high');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await nav(page).getByRole('link', { name: 'Overview' }).click();
  await expect(page.locator('.criteria-list .criterion-row')).toHaveCount(4);
  await expect(page.locator('.distribution-legend')).toHaveText(distribution ?? '');
  await expect(page.locator('tbody tr')).toHaveCount(4);
});

test('modal traps keyboard focus, restores it and supports successful retry', async ({ page }) => {
  await openEditor(page);
  await page.getByLabel('API response').selectOption('server-error');
  const trigger = nav(page).getByRole('link', { name: 'Drivers', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  for (let count = 0; count < 8; count++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByLabel('API response').selectOption('success');
  await page.getByRole('button', { name: 'Try again', exact: true }).first().click();
  await expect(page.locator('tbody tr')).toHaveCount(7);
  await expect(page.locator('app-error-panel')).toHaveCount(0);
});

for (const width of [320, 360, 390, 430, 768, 1440]) {
  test('no page overflow at ' + width + 'px; tables scroll internally', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(
      ({ storageKey, driverId }) => {
        localStorage.setItem(
          storageKey,
          JSON.stringify([
            {
              driverId,
              status: 'saved',
              note: 'Mobile regression',
              createdAt: '2026-10-12',
              updatedAt: '2026-10-12',
            },
          ]),
        );
      },
      { storageKey: key, driverId: id },
    );
    for (const route of [
      '/dashboard',
      '/drivers',
      '/fleet',
      '/reviews',
      '/my-work',
      '/drivers/' + id,
    ]) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('app-loading-block')).toHaveCount(0);
      const dimensions = await page.evaluate(() => ({
        viewport: innerWidth,
        client: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(dimensions.viewport, route).toBe(width);
      expect(dimensions.client, route).toBe(width);
      expect(dimensions.document, route).toBeLessThanOrEqual(width);
      if (width <= 430 && route === '/drivers') {
        const table = page.locator('.table-wrap');
        expect(
          await table.evaluate((element) => {
            element.scrollLeft = 80;
            return element.scrollWidth > element.clientWidth && element.scrollLeft > 0;
          }),
        ).toBe(true);
      }
      if (width === 390 && route === '/drivers/' + id) {
        await page.screenshot({
          path: 'test-results/detail-' + test.info().project.name + '.png',
          fullPage: true,
        });
      }
    }
  });
}
