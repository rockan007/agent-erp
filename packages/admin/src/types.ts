export type AuthView = 'login' | 'register' | 'verify-registration' | 'forgot-password' | 'reset-password';

export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  sequence: number;
  parentId?: string;
  action?: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  menuId?: string;
  viewId?: string;
}

export interface ViewField {
  name: string;
  label?: string;
  widget?: string;
  readonly?: boolean;
  required?: boolean;
  options?: Record<string, unknown>;
}

export interface ViewLayoutItem {
  title?: string;
  fields: string[];
  widget?: string;
}

export interface ViewLayout {
  type: 'tabs' | 'grid' | 'inline';
  items: ViewLayoutItem[];
}

export interface ViewSpec {
  id: string;
  model: string;
  type: 'form' | 'tree' | 'search' | 'kanban' | 'calendar';
  title: string;
  fields: ViewField[];
  layout?: ViewLayout;
  editable?: boolean;
}

export interface AppState {
  menuItems: MenuItem[];
  activeMenuId: string | null;
  activeView: ViewSpec | null;
  user: { id: number; name: string; groups: string[] } | null;
  token: string | null;
  siderCollapsed: boolean;
  breadcrumbs: BreadcrumbItem[];
  viewsMap: Record<string, ViewSpec>;
  editRecordId: number | null;
  previousViewId: string | null;
  navigateToView: (viewId: string, recordId?: number) => void;

  setMenuItems: (items: MenuItem[]) => void;
  setActiveMenu: (id: string) => void;
  setActiveView: (view: ViewSpec | null) => void;
  setUser: (user: AppState['user']) => void;
  setSiderCollapsed: (collapsed: boolean) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  fetchMenus: () => Promise<void>;
  selectMenu: (id: string) => void;

  initializeAuth: () => void;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: { name: string; login: string; password: string; email: string }) => Promise<{ userId: number; message: string }>;
  verifyRegistration: (userId: number, code: string) => Promise<{ message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (userId: number, code: string, password: string) => Promise<{ message: string }>;
}
