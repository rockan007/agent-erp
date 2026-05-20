import { test, expect } from '@playwright/test';

test.describe('Auth Flows', () => {
  test.describe('Registration', () => {
    test('shows registration page from login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Create account').click();
      await expect(page.locator('text=Create Account')).toBeVisible();
      await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
    });

    test('shows validation errors for empty form', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Create account').click();
      await page.locator('.erp-login-btn').click();
      await expect(page.getByText('Please enter your name')).toBeVisible();
      await expect(page.getByText('Please enter your email')).toBeVisible();
      await expect(page.getByText('Please enter a username')).toBeVisible();
    });

    test('can navigate back to login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Create account').click();
      await page.locator('text=Back to login').click();
      await expect(page.locator('.erp-login-title')).toHaveText('欢迎登录');
    });
  });

  test.describe('Forgot Password', () => {
    test('shows forgot password page from login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Forgot password?').click();
      await expect(page.locator('text=Reset Password')).toBeVisible();
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    });

    test('shows validation for empty email', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Forgot password?').click();
      await page.locator('.erp-login-btn').click();
      await expect(page.getByText('Please enter your email')).toBeVisible();
    });

    test('can navigate back to login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Forgot password?').click();
      await page.locator('text=Back to login').click();
      await expect(page.locator('.erp-login-title')).toHaveText('欢迎登录');
    });
  });
});
