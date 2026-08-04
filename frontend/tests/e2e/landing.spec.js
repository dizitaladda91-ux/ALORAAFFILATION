import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Grow your revenue with ALORA affiliate network/i })).toBeVisible();
});
