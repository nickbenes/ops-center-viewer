import { test, expect } from '@playwright/test';

test('defaults to chronological (oldest-first) order', async ({ page }) => {
  await page.goto('/');
  const rowTimestamps = await page.locator('.turn-row .turn-dttm').allTextContents();
  expect(rowTimestamps[0]).toContain('09:00:00');
  expect(rowTimestamps[2]).toContain('09:00:12');
});

test('clicking a column header sorts by that column, toggling direction on repeat clicks', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Sort by Thread' }).click();
  let threads = await page.locator('.turn-row .thread-name').allTextContents();
  expect(threads).toEqual(['agent-a', 'agent-a', 'agent-b']);

  await page.getByRole('button', { name: 'Sort by Thread' }).click();
  threads = await page.locator('.turn-row .thread-name').allTextContents();
  expect(threads).toEqual(['agent-b', 'agent-a', 'agent-a']);
});

test('filters the turn list by column, case-insensitively, combined with AND semantics', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Job search team (happy path)' }).click();
  await expect(page.locator('.turn-row')).toHaveCount(8);

  await page.locator('.col-filter-input[data-col="thread_name"]').fill('TODO');
  await expect(page.locator('.turn-row')).toHaveCount(3);

  await page.locator('.col-filter-input[data-col="comm_channel"]').fill('shared_file');
  await expect(page.locator('.turn-row')).toHaveCount(1);
  await expect(page.locator('.turn-row .thread-name')).toHaveText('todo-agent');

  await page.locator('.col-filter-input[data-col="thread_name"]').fill('');
  await page.locator('.col-filter-input[data-col="comm_channel"]').fill('');
  await expect(page.locator('.turn-row')).toHaveCount(8);
});

test('arrow keys move the selection through the currently displayed rows', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.turn-row')).toHaveCount(3);

  await page.locator('body').click();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.turn-row.selected .turn-dttm')).toHaveText(/09:00:00/);

  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.turn-row.selected .turn-dttm')).toHaveText(/09:00:05/);

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.turn-row.selected .turn-dttm')).toHaveText(/09:00:12/);

  // Clamped at the last row.
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.turn-row.selected .turn-dttm')).toHaveText(/09:00:12/);

  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.turn-row.selected .turn-dttm')).toHaveText(/09:00:05/);

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.turn-row.selected .turn-dttm')).toHaveText(/09:00:00/);

  // Clamped at the first row.
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.turn-row.selected .turn-dttm')).toHaveText(/09:00:00/);
});

test('arrow keys do not steal focus while typing in a filter input', async ({ page }) => {
  await page.goto('/');
  const filterInput = page.locator('.col-filter-input[data-col="thread_name"]');
  await filterInput.click();
  await filterInput.type('agent-a');
  await page.keyboard.press('ArrowDown');

  await expect(page.locator('.turn-row.selected')).toHaveCount(0);
  await expect(filterInput).toHaveValue('agent-a');
});
