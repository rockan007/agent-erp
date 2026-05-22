import { create } from 'zustand';
import type { MenuItem, AppState, BreadcrumbItem } from './types';

export type { MenuItem, ViewSpec, ViewField, ViewLayout, ViewLayoutItem, BreadcrumbItem } from './types';

export function computeBreadcrumbs(
  menuItems: MenuItem[],
  activeMenuId: string | null,
): BreadcrumbItem[] {
  if (!activeMenuId) return [];

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentId: string | undefined = activeMenuId;

  while (currentId) {
    const id = currentId;
    const item = menuItems.find((m) => m.id === id);
    if (!item) break;
    breadcrumbs.unshift({ id: item.id, name: item.name });
    currentId = item.parentId;
  }

  return breadcrumbs;
}

export const useStore = create<AppState>((set, get) => ({
  menuItems: [],
  activeMenuId: null,
  activeView: null,
  user: null,
  token: null,
  siderCollapsed: true,
  breadcrumbs: [],
  authView: 'login',
  viewsMap: {},

  setMenuItems: (items) => {
    const { activeMenuId } = get();
    set({ menuItems: items, breadcrumbs: computeBreadcrumbs(items, activeMenuId) });
  },
  setActiveMenu: (id) => {
    const { menuItems } = get();
    set({ activeMenuId: id, breadcrumbs: computeBreadcrumbs(menuItems, id) });
  },
  setActiveView: (view) => set({ activeView: view }),
  setUser: (user) => set({ user }),
  setSiderCollapsed: (collapsed) => set({ siderCollapsed: collapsed }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setAuthView: (view) => set({ authView: view }),

  fetchMenus: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/menus', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          get().logout();
        }
        return;
      }
      const data = await res.json();
      set({ menuItems: data.menus, viewsMap: data.views });
    } catch {
      // Server unavailable — user stays on dashboard
    }
  },

  selectMenu: (id) => {
    const { menuItems, viewsMap } = get();
    const menu = menuItems.find((m) => m.id === id);
    const view = menu?.action ? viewsMap[menu.action] ?? null : null;
    set({
      activeMenuId: id,
      activeView: view,
      breadcrumbs: computeBreadcrumbs(menuItems, id),
    });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('erp_token');
    const userJson = localStorage.getItem('erp_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ token, user });
      } catch {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
      }
    }
  },

  login: async (login: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('erp_token', data.token);
    localStorage.setItem('erp_user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    set({ token: null, user: null, activeView: null, menuItems: [], viewsMap: {} });
  },

  register: async (data) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Registration failed');
    return json;
  },

  verifyRegistration: async (userId, code) => {
    const res = await fetch('/api/auth/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Verification failed');
    return json;
  },

  forgotPassword: async (email) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Request failed');
    return json;
  },

  resetPassword: async (userId, code, password) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Reset failed');
    return json;
  },
}));

declare global {
  interface Window { __STORE__?: typeof useStore; }
}
if (typeof window !== 'undefined') {
  window.__STORE__ = useStore;
}
