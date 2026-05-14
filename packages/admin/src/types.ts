export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  sequence: number;
  parentId?: string;
  action?: string;
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
}

export interface AppState {
  menuItems: MenuItem[];
  activeMenuId: string | null;
  activeView: ViewSpec | null;
  user: { id: number; name: string; groups: string[] } | null;

  setMenuItems: (items: MenuItem[]) => void;
  setActiveMenu: (id: string) => void;
  setActiveView: (view: ViewSpec | null) => void;
  setUser: (user: AppState['user']) => void;
}
