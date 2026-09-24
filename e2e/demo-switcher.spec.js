import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('switches between bundled demos', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.turn-row')).toHaveCount(3);

  await page.getByRole('button', { name: 'Job search team (happy path)' }).click();
  await expect(page.locator('.turn-row')).toHaveCount(8);
  await expect(page.locator('.turn-row .thread-name').first()).toHaveText('orchestrator');

  await page.getByRole('button', { name: 'Job search team (sad path)' }).click();
  await expect(page.locator('.turn-row')).toHaveCount(8);
  await expect(page.locator('.turn-row .prompt-summary').first()).toContainText('no new listings');
});

test('loads an uploaded project-logs.csv through the same pipeline as the demos', async ({ page }) => {
  await page.goto('/');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'uploaded-project-logs.csv'));

  await expect(page.locator('.turn-row')).toHaveCount(1);
  await expect(page.locator('.upload-filename')).toHaveText('uploaded-project-logs.csv');
  await expect(page.locator('.demo-tab.active')).toHaveCount(0);

  await page.locator('.turn-row').first().click();
  await expect(page.locator('.detail-panel dd').first()).toHaveText('2026-09-19T08:00:00-04:00');
});
