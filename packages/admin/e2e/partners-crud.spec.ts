import { test, expect } from '@playwright/test';

test.describe('Partner CRUD', () => {
  test('should create a partner and see it in the list', async ({ page }) => {
    // Phase 1: Login
    await page.goto('/');
    await page.fill('input[id="login"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*/);
    // Wait for menus to be fetched
    await page.waitForSelector('.ant-menu');

    // Phase 2: Navigate to Partners
    await page.getByRole('menuitem', { name: 'team Contacts' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: 'Partners' }).click();
    await page.waitForSelector('.erp-table');

    // Phase 3: Verify table renders without JSON parse error
    await expect(page.locator('.ant-table')).toBeVisible();

    // Phase 4: Navigate to create form
    await page.locator('button:has-text("New Partners")').click();
    await page.waitForSelector('#name', { timeout: 10000 });

    // Phase 5: Fill and submit the form
    await page.fill('#name', 'E2E Test Partner');
    await page.locator('.ant-select-selector').click();
    // Wait for dropdown to appear
    await page.waitForTimeout(300);
    await page.locator('.ant-select-item-option:has-text("Company")').click();

    await page.locator('.ant-tabs-tab:has-text("Contact")').click();
    await page.waitForSelector('#email');
    await page.fill('#email', 'e2e-test@example.com');
    await page.fill('#phone', '+86-10-1234-5678');

    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(2000);

    // Phase 6: Navigate back to list and verify record
    await page.goto('/');
    await page.waitForSelector('.ant-menu', { timeout: 10000 });
    await page.getByRole('menuitem', { name: 'team Contacts' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: 'Partners' }).click();
    await page.waitForSelector('.erp-table');

    await expect(page.locator('text=E2E Test Partner').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show breadcrumbs updating on form navigation', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[id="login"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*/);
    await page.waitForSelector('.ant-menu');

    // Navigate to Partners
    await page.getByRole('menuitem', { name: 'team Contacts' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: 'Partners' }).click();
    await page.waitForSelector('.erp-table');

    // Click "New Partners" to go to form
    await page.locator('button:has-text("New Partners")').click();
    await page.waitForSelector('#name', { timeout: 10000 });

    // Verify breadcrumbs include the form title "Partner"
    await expect(page.locator('.ant-breadcrumb:has-text("Partner")')).toBeVisible();

    // Verify Back button is visible
    await expect(page.locator('button:has-text("Back")')).toBeVisible();

    // Click Back to return to tree
    await page.locator('button:has-text("Back")').click();
    await page.waitForSelector('.erp-table');
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('should navigate via clickable breadcrumbs', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[id="login"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*/);
    await page.waitForSelector('.ant-menu');

    // Navigate to Partners
    await page.getByRole('menuitem', { name: 'team Contacts' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: 'Partners' }).click();
    await page.waitForSelector('.erp-table');

    // Go to form
    await page.locator('button:has-text("New Partners")').click();
    await page.waitForSelector('#name', { timeout: 10000 });

    // Click "Partners" breadcrumb to navigate back to tree
    await page.locator('.ant-breadcrumb a:has-text("Partners")').click();
    await page.waitForSelector('.erp-table');
    await expect(page.locator('.ant-table')).toBeVisible();
  });
});
