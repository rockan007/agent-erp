import { test, expect } from '@playwright/test';

test.describe('Group CRUD', () => {
  test('should create, edit, and delete a group', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[id="login"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*/);

    // Navigate to Groups
    await page.click('text=Settings');
    await page.click('text=Groups');
    await page.waitForSelector('.erp-table');

    // Create a new group
    await page.click('text=New Groups');
    await page.waitForSelector('.ant-table-expanded-row');
    await page.fill('.ant-table-expanded-row input[id="name"]', 'e2e-test-group');
    await page.fill('.ant-table-expanded-row input[id="description"]', 'E2E test description');
    await page.click('.ant-table-expanded-row button:has-text("Save")');

    // Verify the group appears in the list
    await page.waitForSelector('text=e2e-test-group');
    await expect(page.locator('text=e2e-test-group').first()).toBeVisible();

    // Edit the group — expand the row
    const groupRow = page.locator('tr', { has: page.locator('text=e2e-test-group') });
    await groupRow.locator('[aria-label="Expand row"]').click();
    await page.waitForSelector('.ant-table-expanded-row');

    // Update the name
    await page.fill('.ant-table-expanded-row input[id="name"]', 'e2e-test-group-edited');
    await page.click('.ant-table-expanded-row button:has-text("Save")');

    // Verify edited name appears
    await page.waitForSelector('text=e2e-test-group-edited');
    await expect(page.locator('text=e2e-test-group-edited').first()).toBeVisible();

    // Delete the group
    const editedRow = page.locator('tr', { has: page.locator('text=e2e-test-group-edited') });
    await editedRow.locator('[aria-label="delete"]').click();
    await page.click('button:has-text("Delete")');

    // Verify the group is removed
    await page.waitForTimeout(500);
    await expect(page.locator('text=e2e-test-group-edited')).toHaveCount(0);
  });
});
