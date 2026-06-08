import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('loads the app and switches between Gallery and About me', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab', { name: /^gallery$/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /about me/i })).toBeVisible();

    await page.getByRole('tab', { name: /about me/i }).click();
    await expect(page.getByRole('tab', { name: /about me/i })).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: /^gallery$/i }).click();
    await expect(page.getByRole('tab', { name: /^gallery$/i })).toHaveAttribute('aria-selected', 'true');
  });
});
