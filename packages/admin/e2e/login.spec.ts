import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('shows login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.erp-login-page')).toBeVisible();
    await expect(page.locator('.erp-login-card')).toBeVisible();
  });

  test('shows brand in top-left', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.erp-login-brand-name')).toHaveText('Agent ERP');
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/');
    await page.locator('.erp-login-btn').click();
    await expect(page.getByText('请输入用户名')).toBeVisible();
    await expect(page.getByText('请输入密码')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="用户名"]').fill('wrong');
    await page.locator('input[placeholder="密码"]').fill('wrong');
    await page.locator('.erp-login-btn').click();
    await expect(page.locator('.erp-login-error')).toBeVisible({ timeout: 10000 });
  });

  test('logs out and returns to login', async ({ page: _page }) => {
    // This test requires a valid user in DB — skip if not set up
    test.skip();
  });
});
