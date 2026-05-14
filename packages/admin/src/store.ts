import { create } from 'zustand';
import type { MenuItem, ViewSpec, AppState, BreadcrumbItem } from './types';

export type { MenuItem, ViewSpec, ViewField, ViewLayout, ViewLayoutItem, BreadcrumbItem } from './types';

export function computeBreadcrumbs(
  menuItems: MenuItem[],
  activeMenuId: string | null,
): BreadcrumbItem[] {
  if (!activeMenuId) return [];

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentId: string | undefined = activeMenuId;

  while (currentId) {
    const item = menuItems.find((m) => m.id === currentId);
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
  siderCollapsed: true,
  breadcrumbs: [],

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
}));

declare global {
  interface Window { __STORE__?: typeof useStore; }
}
if (typeof window !== 'undefined') {
  window.__STORE__ = useStore;
}
