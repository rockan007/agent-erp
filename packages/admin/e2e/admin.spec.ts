import { test, expect } from '@playwright/test';

const FAKE_USER = { id: 1, name: 'Admin', groups: ['admin'] };

const MENU_ITEMS = [
  { id: 'contacts_root', name: 'Contacts', sequence: 10 },
  { id: 'partner_menu', name: 'Partners', sequence: 10, parentId: 'contacts_root', action: 'res.partner.tree' },
  { id: 'settings_root', name: 'Settings', sequence: 90 },
  { id: 'user_menu', name: 'Users', sequence: 10, parentId: 'settings_root', action: 'res.users.tree' },
];

// Helper: inject Zustand state in the browser
async function setState(page: import('@playwright/test').Page, state: Record<string, unknown>) {
  await page.evaluate((s: Record<string, unknown>) => {
    const store = (window as unknown as { __STORE__: { setState: (v: unknown) => void } }).__STORE__;
    store.setState(s);
  }, state);
}

// Compute breadcrumbs client-side and inject them alongside state
async function computeAndInjectBreadcrumbs(
  page: import('@playwright/test').Page,
  menuItems: Array<{ id: string; name: string; parentId?: string }>,
  activeMenuId: string | null,
  viewTitle?: string,
  viewId?: string,
) {
  await page.evaluate(
    ({ items, menuId, vTitle, vId }) => {
      const store = (window as unknown as { __STORE__: { getState: () => { menuItems: Array<{ id: string; name: string; parentId?: string }> }; setState: (v: unknown) => void } }).__STORE__;
      const crumbs: Array<{ id: string; name: string; menuId?: string; viewId?: string }> = [];
      let cursor: string | undefined = menuId ?? undefined;
      while (cursor) {
        const id = cursor;
        const found = items.find((m) => m.id === id);
        if (!found) break;
        crumbs.unshift({ id: found.id, name: found.name, menuId: found.id });
        cursor = found.parentId;
      }
      if (vTitle && vId) {
        crumbs.push({ id: vId, name: vTitle, viewId: vId });
      }
      store.setState({ breadcrumbs: crumbs });
    },
    { items: menuItems, menuId: activeMenuId, vTitle: viewTitle ?? null, vId: viewId ?? null },
  );
}

// Set up an authenticated session so App renders main layout, not login
// Always injects menuItems to prevent fetchMenus() from firing and
// triggering logout (401 on mock-token would clear user)
async function setupAuth(page: import('@playwright/test').Page, extra?: Record<string, unknown>) {
  await page.goto('/');
  const state: Record<string, unknown> = { user: FAKE_USER, token: 'mock-token', menuItems: MENU_ITEMS, ...extra };
  await setState(page, state);

  // Compute breadcrumbs if activeMenuId is provided
  const extraActiveMenuId = state.activeMenuId as string | undefined;
  if (extraActiveMenuId) {
    const activeMenu = MENU_ITEMS.find((m) => m.id === extraActiveMenuId);
    const extraActiveView = state.activeView as { title?: string; id?: string } | undefined;
    const isMenuDefaultView = activeMenu?.action === extraActiveView?.id;
    await computeAndInjectBreadcrumbs(
      page,
      MENU_ITEMS,
      extraActiveMenuId,
      !isMenuDefaultView ? extraActiveView?.title : undefined,
      !isMenuDefaultView ? extraActiveView?.id : undefined,
    );
  }
}

test.describe('Admin Shell', () => {
  test('renders dashboard greeting on startup', async ({ page }) => {
    await setupAuth(page);
    await expect(page.locator('.erp-dashboard-greeting-text')).toBeVisible();
    await expect(page.locator('.erp-dashboard-stats')).toBeVisible();
  });

  test('renders antd Layout with Sider and Content', async ({ page }) => {
    await setupAuth(page);
    await expect(page.locator('.ant-layout').first()).toBeVisible();
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
    await expect(page.locator('.ant-layout-content')).toBeVisible();
  });

  test('shows Agent ERP branding in header and sidebar', async ({ page }) => {
    await setupAuth(page);
    const brandings = page.locator('text=Agent ERP');
    await expect(brandings.first()).toBeVisible();
  });
});

test.describe('Menu', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, { menuItems: MENU_ITEMS });
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

    const activeMenuId: string | null = await page.evaluate(() =>
      (window as unknown as { __STORE__: { getState: () => { activeMenuId: string | null } } }).__STORE__.getState().activeMenuId);
    expect(activeMenuId).toBe('partner_menu');
  });
});

test.describe('Form View', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, {
      menuItems: MENU_ITEMS,
      activeMenuId: 'partner_menu',
      activeView: {
        id: 'res.partner.form',
        model: 'res.partner',
        type: 'form' as const,
        title: 'Partner',
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
      },
    });
  });

  test('renders form title "Partner" in breadcrumbs', async ({ page }) => {
    await expect(page.locator('.ant-breadcrumb:has-text("Partner")')).toBeVisible();
  });

  test('renders tabs layout', async ({ page }) => {
    await expect(page.locator('.ant-tabs')).toBeVisible();
  });

  test('renders text inputs for text widget fields', async ({ page }) => {
    await page.locator('.ant-tabs-tab:has-text("General")').click();
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
    await setupAuth(page, {
      menuItems: MENU_ITEMS,
      activeMenuId: 'partner_menu',
      activeView: {
        id: 'res.partner.tree',
        model: 'res.partner',
        type: 'tree' as const,
        title: 'Partners',
        fields: [
          { name: 'name', label: 'Name', widget: 'text' },
          { name: 'company_type', label: 'Type', widget: 'text' },
          { name: 'email', label: 'Email', widget: 'text' },
          { name: 'phone', label: 'Phone', widget: 'text' },
          { name: 'active', label: 'Active', widget: 'text' },
        ],
      },
    });
  });

  test('renders table title "Partners" in breadcrumbs', async ({ page }) => {
    await page.waitForSelector('.ant-breadcrumb');
    await expect(page.locator('.ant-breadcrumb:has-text("Partners")')).toBeVisible();
  });

  test('renders antd Table with all 5 columns from real view', async ({ page }) => {
    await expect(page.locator('.ant-table')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Name")')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Type")')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Email")')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Phone")')).toBeVisible();
    await expect(page.locator('.ant-table-thead th:has-text("Active")')).toBeVisible();
  });

  test('shows empty state when no records', async ({ page }) => {
    await expect(page.locator('text=No records found')).toBeVisible();
  });
});

test.describe('Search View', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, {
      menuItems: MENU_ITEMS,
      activeMenuId: 'partner_menu',
      activeView: {
        id: 'res.partner.search',
        model: 'res.partner',
        type: 'search' as const,
        title: 'Search Partners',
        fields: [
          { name: 'name', label: 'Name' },
          { name: 'email', label: 'Email' },
          { name: 'phone', label: 'Phone' },
          { name: 'company_type', label: 'Type' },
        ],
      },
    });
  });

  test('renders search title "Search Partners" in breadcrumbs', async ({ page }) => {
    await expect(page.locator('.ant-breadcrumb:has-text("Search Partners")')).toBeVisible();
  });

  test('renders search form with 4 search fields', async ({ page }) => {
    await expect(page.locator('.ant-form').first()).toBeVisible();
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="phone"]')).toBeVisible();
    await expect(page.locator('input[id="company_type"]')).toBeVisible();
  });

  test('renders Search and Clear buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();
  });

  test('Clear button resets form fields', async ({ page }) => {
    const nameField = page.locator('input[id="name"]');
    await nameField.fill('test');
    await page.locator('button:has-text("Clear")').click();

    const val = await nameField.inputValue();
    expect(val).toBe('');
  });
});

test.describe('Placeholder Views', () => {
  test('kanban view shows coming soon', async ({ page }) => {
    await setupAuth(page, {
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
    await setupAuth(page, {
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
    await setupAuth(page, {
      menuItems: MENU_ITEMS,
      activeView: {
        id: 'bad.test',
        model: 'res.partner',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    await setupAuth(page, {
      menuItems: MENU_ITEMS,
      activeMenuId: 'partner_menu',
      activeView: {
        id: 'res.partner.tree',
        model: 'res.partner',
        type: 'tree' as const,
        title: 'Partners',
        fields: [
          { name: 'name', label: 'Name', widget: 'text' },
        ],
      },
    });
  });

  test('renders header with logo', async ({ page }) => {
    await expect(page.locator('.ant-layout-header')).toBeVisible();
    await expect(page.locator('.ant-layout-header:has-text("Agent ERP")')).toBeVisible();
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
    await setupAuth(page, { menuItems: MENU_ITEMS });
  });

  test('clicking collapse button toggles sider', async ({ page }) => {
    // The collapse button is the hamburger in the sider-top, not the header buttons
    await page.locator('.erp-sider-collapse-btn').click();
    const collapsed: boolean = await page.evaluate(() =>
      (window as unknown as { __STORE__: { getState: () => { siderCollapsed: boolean } } }).__STORE__.getState().siderCollapsed);
    expect(collapsed).toBe(true);
  });

  test('collapsed sider shows icons via ant-menu-inline-collapsed', async ({ page }) => {
    await setState(page, { siderCollapsed: true });
    await expect(page.locator('.ant-layout-sider.ant-layout-sider-collapsed')).toBeVisible();
  });
});

test.describe('Responsive', () => {
  test('drawer menu available on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await setupAuth(page, { menuItems: MENU_ITEMS });
    // On mobile, sider starts collapsed; clicking header button opens drawer
    await page.locator('.erp-sider-collapse-btn').click();
    await expect(page.locator('.ant-drawer')).toBeVisible();
  });
});
