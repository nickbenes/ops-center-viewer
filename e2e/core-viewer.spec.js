import { test, expect } from '@playwright/test';

test('loads the default demo, shows a reverse-chronological turn list, and opens the raw detail panel on row click', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('.turn-row')).toHaveCount(3);

  // Reverse-chronological: the 09:00:12 turn should render above the 09:00:00 turn.
  const rowTimestamps = await page.locator('.turn-row .turn-dttm').allTextContents();
  expect(rowTimestamps[0]).toContain('09:00:12');
  expect(rowTimestamps[2]).toContain('09:00:00');

  await expect(page.locator('.detail-empty')).toBeVisible();

  await page.locator('.turn-row').nth(1).click();

  await expect(page.locator('.detail-panel h2').first()).toHaveText('Raw session-log entry');
  await expect(page.locator('.detail-panel dt')).toHaveCount(7);
  await expect(page.locator('.detail-panel dd').nth(1)).toHaveText('agent-b');

  // Parsed comms table appears for a turn with a real comm_to.
  await expect(page.locator('.detail-comms-table')).toBeVisible();
  await expect(page.locator('.detail-comms-table td').first()).toHaveText('agent-a');
});
