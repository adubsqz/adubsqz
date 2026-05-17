import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('loads the app and switches between Program and Liner notes', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab', { name: /program/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /liner notes/i })).toBeVisible();

    await page.getByRole('tab', { name: /liner notes/i }).click();
    await expect(page.getByRole('tab', { name: /liner notes/i })).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: /program/i }).click();
    await expect(page.getByRole('tab', { name: /program/i })).toHaveAttribute('aria-selected', 'true');
  });
});
