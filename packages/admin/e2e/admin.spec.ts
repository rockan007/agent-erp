import { test, expect } from '@playwright/test';

const MENU_ITEMS = [
  { id: 'contacts_root', name: 'Contacts', sequence: 10 },
  { id: 'partner_menu', name: 'Partners', sequence: 10, parentId: 'contacts_root', action: 'res.partner.tree' },
  { id: 'settings_root', name: 'Settings', sequence: 90 },
  { id: 'user_menu', name: 'Users', sequence: 10, parentId: 'settings_root', action: 'res.users.tree' },
];

const PARTNER_FORM = {
  id: 'res.partner.form',
  model: 'res.partner',
  type: 'form' as const,
  title: 'Partner Form',
  fields: [
    { name: 'name', label: 'Name', widget: 'text', required: true },
    { name: 'company_type', label: 'Type', widget: 'select', options: { choices: [['company', 'Company'], ['individual', 'Individual']] } },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'phone', label: 'Phone', widget: 'text' },
  ],
  layout: {
    type: 'tabs' as const,
    items: [
      { title: 'General', fields: ['name', 'company_type'] },
      { title: 'Contact', fields: ['email', 'phone'] },
    ],
  },
};

const PARTNER_TREE = {
  id: 'res.partner.tree',
  model: 'res.partner',
  type: 'tree' as const,
  title: 'Partners',
  fields: [
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email' },
    { name: 'phone', label: 'Phone' },
  ],
};

const PARTNER_SEARCH = {
  id: 'res.partner.search',
  model: 'res.partner',
  type: 'search' as const,
  title: 'Search Partners',
  fields: [
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email' },
  ],
};

// Helper: inject Zustand state in the browser
async function setState(page: any, state: Record<string, unknown>) {
  await page.evaluate((s: any) => {
    const store = (window as any).__STORE__;
    store.setState(s);
  }, state);
}

test.describe('Admin Shell', () => {
  test('renders welcome message on startup', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ant-result-info')).toBeVisible();
    await expect(page.locator('text=Welcome to Agent ERP')).toBeVisible();
  });

  test('renders antd Layout with Sider and Content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ant-layout')).toBeVisible();
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('shows Agent ERP branding in header and sidebar', async ({ page }) => {
    await page.goto('/');
    // Brand appears in header, sidebar brand area, and Welcome title
    const brandings = page.locator('text=Agent ERP');
    await expect(brandings.first()).toBeVisible();
  });
});

test.describe('Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, { menuItems: MENU_ITEMS });
  });

  test('renders menu items via antd Menu', async ({ page }) => {
    await expect(page.locator('.ant-menu')).toBeVisible();
  });

  test('renders root-level menu items (Contacts, Settings)', async ({ page }) => {
    await expect(page.locator('.ant-menu-submenu-title:has-text("Contacts")')).toBeVisible();
    await expect(page.locator('.ant-menu-submenu-title:has-text("Settings")')).toBeVisible();
  });

  test('clicking submenu expands child items', async ({ page }) => {
    await page.locator('.ant-menu-submenu-title:has-text("Contacts")').click();
    await expect(page.locator('.ant-menu-item:has-text("Partners")')).toBeVisible();
  });

  test('clicking a leaf menu item sets activeMenuId', async ({ page }) => {
    await page.locator('.ant-menu-submenu-title:has-text("Contacts")').click();
    await page.locator('.ant-menu-item:has-text("Partners")').click();

    const activeMenuId = await page.evaluate(() => (window as any).__STORE__.getState().activeMenuId);
    expect(activeMenuId).toBe('partner_menu');
  });
});

test.describe('Form View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeView: PARTNER_FORM,
    });
  });

  test('renders form title', async ({ page }) => {
    await expect(page.locator('text=Partner Form')).toBeVisible();
  });

  test('renders tabs layout', async ({ page }) => {
    await expect(page.locator('.ant-tabs')).toBeVisible();
    await expect(page.locator('.ant-tabs-tab:has-text("General")')).toBeVisible();
    await expect(page.locator('.ant-tabs-tab:has-text("Contact")')).toBeVisible();
  });

  test('renders text inputs for text widget fields', async ({ page }) => {
    await expect(page.locator('.ant-tabs-tab:has-text("General")')).toBeVisible();
    await page.locator('.ant-tabs-tab:has-text("General")').click();
    // Text widget fields render as antd Input
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).not.toHaveAttribute('readonly');
  });

  test('renders Save button', async ({ page }) => {
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('shows required field validation on empty submit', async ({ page }) => {
    await page.locator('button:has-text("Save")').click();
    await expect(page.locator('text=Name is required')).toBeVisible();
  });
});

test.describe('Table View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeView: PARTNER_TREE,
    });
  });

  test('renders table title', async ({ page }) => {
    await expect(page.locator('text=Partners')).toBeVisible();
  });

  test('renders antd Table with correct columns', async ({ page }) => {
    await expect(page.locator('.ant-table')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Name")')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Email")')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Phone")')).toBeVisible();
  });

  test('shows empty state when no records', async ({ page }) => {
    await expect(page.locator('text=No records found')).toBeVisible();
  });
});

test.describe('Search View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeView: PARTNER_SEARCH,
    });
  });

  test('renders search title via PageHeader', async ({ page }) => {
    await expect(page.locator('.ant-typography:has-text("Search Partners")')).toBeVisible();
  });

  test('renders inline form with search fields', async ({ page }) => {
    await expect(page.locator('.ant-form-inline')).toBeVisible();
  });

  test('renders Search and Clear buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();
  });

  test('Clear button resets form fields', async ({ page }) => {
    const nameField = page.locator('.ant-form-item').filter({ has: page.locator('.ant-form-item-label:has-text("Name"), label:has-text("Name")') }).locator('input');
    await nameField.fill('test');
    await page.locator('button:has-text("Clear")').click();

    const val = await nameField.inputValue();
    expect(val).toBe('');
  });
});

test.describe('Placeholder Views', () => {
  test('kanban view shows coming soon', async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeView: {
        id: 'kanban.test',
        model: 'res.partner',
        type: 'kanban',
        title: 'Kanban Test',
        fields: [],
      },
    });
    await expect(page.locator('text=Kanban View')).toBeVisible();
    await expect(page.locator('text=Coming soon')).toBeVisible();
  });

  test('calendar view shows coming soon', async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeView: {
        id: 'cal.test',
        model: 'res.partner',
        type: 'calendar',
        title: 'Calendar Test',
        fields: [],
      },
    });
    await expect(page.locator('text=Calendar View')).toBeVisible();
    await expect(page.locator('text=Coming soon')).toBeVisible();
  });

  test('unknown view type shows warning', async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeView: {
        id: 'bad.test',
        model: 'res.partner',
        type: 'unknown_type' as any,
        title: 'Bad View',
        fields: [],
      },
    });
    await expect(page.locator('text=Unknown View Type')).toBeVisible();
  });
});

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeMenuId: 'partner_menu',
      user: { id: 1, name: 'Admin', groups: ['admin'] },
    });
  });

  test('renders header with logo and collapse button', async ({ page }) => {
    await expect(page.locator('.ant-layout-header')).toBeVisible();
    await expect(page.locator('.ant-layout-header:has-text("Agent ERP")')).toBeVisible();
    await expect(page.locator('.ant-layout-header button')).toBeVisible();
  });

  test('shows breadcrumbs derived from active menu', async ({ page }) => {
    await page.waitForSelector('.ant-breadcrumb');
    await expect(page.locator('.ant-breadcrumb:has-text("Contacts")')).toBeVisible();
  });

  test('shows user name in header', async ({ page }) => {
    await expect(page.locator('.ant-layout-header:has-text("Admin")')).toBeVisible();
  });
});

test.describe('Collapsed Sider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, { menuItems: MENU_ITEMS });
  });

  test('clicking collapse button toggles sider', async ({ page }) => {
    await page.locator('.ant-layout-header button').first().click();
    const collapsed = await page.evaluate(() => (window as any).__STORE__.getState().siderCollapsed);
    expect(collapsed).toBe(true);
  });

  test('collapsed sider shows icons via ant-menu-inline-collapsed', async ({ page }) => {
    await setState(page, { siderCollapsed: true });
    await expect(page.locator('.ant-layout-sider.ant-layout-sider-collapsed')).toBeVisible();
  });
});

test.describe('Responsive', () => {
  test('drawer menu available on mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 480, height: 800 });
    await setState(page, { menuItems: MENU_ITEMS });
    // On mobile (< md), the sider becomes a Drawer. It starts closed (siderCollapsed=true).
    // The header button should open it.
    await page.locator('.ant-layout-header button').first().click();
    await expect(page.locator('.ant-drawer')).toBeVisible();
  });
});
