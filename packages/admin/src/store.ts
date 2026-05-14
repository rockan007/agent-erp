import { create } from 'zustand';
import type { MenuItem, ViewSpec, AppState } from './types';

export type { MenuItem, ViewSpec, ViewField, ViewLayout, ViewLayoutItem } from './types';

export const useStore = create<AppState>((set) => ({
  menuItems: [],
  activeMenuId: null,
  activeView: null,
  user: null,

  setMenuItems: (items) => set({ menuItems: items }),
  setActiveMenu: (id) => set({ activeMenuId: id }),
  setActiveView: (view) => set({ activeView: view }),
  setUser: (user) => set({ user }),
}));

declare global {
  interface Window { __STORE__?: typeof useStore; }
}
if (typeof window !== 'undefined') {
  window.__STORE__ = useStore;
}
