import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  FolderOutlined,
  DatabaseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useStore, MenuItem } from '../store';

const ICON_MAP: Record<string, React.ReactNode> = {
  contacts: <TeamOutlined />,
  partners: <TeamOutlined />,
  settings: <SettingOutlined />,
  users: <UserOutlined />,
  folders: <FolderOutlined />,
  database: <DatabaseOutlined />,
  reports: <BarChartOutlined />,
  default: <AppstoreOutlined />,
};

function pickIcon(name: string): React.ReactNode {
  const key = name.toLowerCase();
  for (const [pattern, icon] of Object.entries(ICON_MAP)) {
    if (key.includes(pattern)) return icon;
  }
  return ICON_MAP.default!;
}

interface TreeNode {
  item: MenuItem;
  children: TreeNode[];
}

function buildTree(items: MenuItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.item.sequence - b.item.sequence);
    for (const node of nodes) sortTree(node.children);
  };
  sortTree(roots);
  return roots;
}

function toAntdItems(nodes: TreeNode[]): MenuProps['items'] {
  return nodes.map((node) => {
    const hasChildren = node.children.length > 0;
    if (hasChildren) {
      return {
        key: node.item.id,
        label: node.item.name,
        icon: pickIcon(node.item.name),
        children: toAntdItems(node.children),
      };
    }
    return {
      key: node.item.id,
      label: node.item.name,
      icon: pickIcon(node.item.name),
    };
  });
}

interface Props {
  onItemClick?: () => void;
}

export const MenuRenderer: React.FC<Props> = ({ onItemClick }) => {
  const menuItems = useStore((s) => s.menuItems);
  const activeMenuId = useStore((s) => s.activeMenuId);
  const selectMenu = useStore((s) => s.selectMenu);
  const siderCollapsed = useStore((s) => s.siderCollapsed);

  const tree = buildTree(menuItems);
  const antdItems = toAntdItems(tree);

  const parentKeys = useMemo(() => {
    const set = new Set<string>();
    for (const item of menuItems) {
      if (item.parentId) set.add(item.parentId);
    }
    return set;
  }, [menuItems]);

  // Walk parent chain for a menu item (e.g. 'partner_menu' → ['contacts_root'])
  const getAncestorKeys = useCallback(
    (menuId: string | null): string[] => {
      if (!menuId) return [];
      const parentMap = new Map<string, string | undefined>();
      for (const item of menuItems) {
        parentMap.set(item.id, item.parentId);
      }
      const keys: string[] = [];
      let pid: string | undefined = parentMap.get(menuId);
      while (pid) {
        keys.unshift(pid);
        pid = parentMap.get(pid);
      }
      return keys;
    },
    [menuItems],
  );

  const [openKeys, setOpenKeys] = useState<string[]>(() => []);
  const [menuKey, setMenuKey] = useState(0);

  // When activeMenuId or menuItems change (e.g. after fetch), sync openKeys
  useEffect(() => {
    if (menuItems.length > 0 && activeMenuId) {
      setOpenKeys(getAncestorKeys(activeMenuId));
    }
  }, [menuItems, activeMenuId, getAncestorKeys]);

  // Keep refs for values the collapse effect uses but shouldn't react to
  const getAncestorKeysRef = useRef(getAncestorKeys);
  getAncestorKeysRef.current = getAncestorKeys;
  const activeMenuIdRef = useRef(activeMenuId);
  activeMenuIdRef.current = activeMenuId;

  // When sidebar collapses/expands, clear or restore openKeys + remount
  useEffect(() => {
    if (siderCollapsed) {
      setOpenKeys([]);
      setMenuKey((k) => k + 1);
    } else {
      setOpenKeys(getAncestorKeysRef.current(activeMenuIdRef.current));
    }
  }, [siderCollapsed]);

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys);
  };

  const onClick: MenuProps['onClick'] = ({ key }) => {
    // Parent item: let antd handle expand/collapse, no navigation
    if (parentKeys.has(key)) return;

    selectMenu(key);
    const clickedItem = menuItems.find((m) => m.id === key);
    setOpenKeys(clickedItem?.parentId ? [clickedItem.parentId] : []);
    if (siderCollapsed) {
      setMenuKey((k) => k + 1);
    }
    onItemClick?.();
  };

  if (menuItems.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        <AppstoreOutlined className="text-2xl mb-3 opacity-50" />
        <div className="text-xs font-medium">No modules loaded</div>
      </div>
    );
  }

  return (
    <Menu
      key={menuKey}
      theme="light"
      mode="inline"
      selectedKeys={activeMenuId ? [activeMenuId] : []}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      items={antdItems}
      onClick={onClick}
      motion={{
        motionName: 'ant-motion-collapse',
        motionAppear: false,
      }}
    />
  );
};
