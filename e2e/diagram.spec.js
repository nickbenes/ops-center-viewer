import { test, expect } from '@playwright/test';

test('renders the agent-comms diagram and highlights row -> diagram on selection', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#diagram-view svg')).toBeVisible();
  await expect(page.locator('#diagram-view .node')).toHaveCount(2);
  await expect(page.locator('#diagram-view path.flowchart-link')).toHaveCount(2);

  await expect(page.locator('#diagram-view .node.highlighted')).toHaveCount(0);
  await expect(page.locator('#diagram-view path.flowchart-link.highlighted')).toHaveCount(0);

  await page.locator('.turn-row').nth(1).click();

  await expect(page.locator('#diagram-view .node.highlighted')).toHaveCount(2);
  await expect(page.locator('#diagram-view path.flowchart-link.highlighted')).toHaveCount(1);

  // Deselecting the row clears the highlight.
  await page.locator('.turn-row').nth(1).click();
  await expect(page.locator('#diagram-view .node.highlighted')).toHaveCount(0);
  await expect(page.locator('#diagram-view path.flowchart-link.highlighted')).toHaveCount(0);
});

test('rebuilds the diagram when switching demos', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#diagram-view .node')).toHaveCount(2);

  await page.getByRole('button', { name: 'Job search team (happy path)' }).click();
  await expect(page.locator('#diagram-view .node')).toHaveCount(3);
});
