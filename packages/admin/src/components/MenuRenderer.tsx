import React, { useState, useMemo } from 'react';
import { Menu, Dropdown } from 'antd';
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

/** Collapsed sidebar: icons + Dropdown for parent items */
const CollapsedMenu: React.FC<{
  tree: TreeNode[];
  activeMenuId: string | null;
  onSelect: (id: string) => void;
}> = ({ tree, activeMenuId, onSelect }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center py-2 gap-1">
      {tree.map((node) => {
        const icon = pickIcon(node.item.name);
        const isActive = activeMenuId === node.item.id
          || node.children.some((c) => c.item.id === activeMenuId);

        if (node.children.length > 0) {
          const menuItems: MenuProps['items'] = node.children.map((child) => ({
            key: child.item.id,
            icon: pickIcon(child.item.name),
            label: child.item.name,
          }));

          return (
            <Dropdown
              key={node.item.id}
              open={openDropdown === node.item.id}
              onOpenChange={(open) => {
                setOpenDropdown(open ? node.item.id : null);
              }}
              menu={{
                items: menuItems,
                onClick: ({ key }) => {
                  onSelect(key);
                  setOpenDropdown(null);
                },
              }}
              trigger={['click']}
              // @ts-expect-error rightTop is valid at runtime but not in antd's TS types
              placement="rightTop"
            >
              <button
                type="button"
                className={`erp-collapsed-menu-btn ${isActive ? 'erp-collapsed-menu-btn-active' : ''}`}
                title={node.item.name}
              >
                {icon}
              </button>
            </Dropdown>
          );
        }

        return (
          <button
            key={node.item.id}
            type="button"
            className={`erp-collapsed-menu-btn ${isActive ? 'erp-collapsed-menu-btn-active' : ''}`}
            title={node.item.name}
            onClick={() => onSelect(node.item.id)}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
};

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

  const parentMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const item of menuItems) {
      map.set(item.id, item.parentId);
    }
    return map;
  }, [menuItems]);

  const getAncestorKeys = (menuId: string | null): string[] => {
    if (!menuId) return [];
    const keys: string[] = [];
    let pid: string | undefined = parentMap.get(menuId);
    while (pid) {
      keys.unshift(pid);
      pid = parentMap.get(pid);
    }
    return keys;
  };

  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    activeMenuId ? getAncestorKeys(activeMenuId) : [],
  );

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys);
  };

  const handleSelect = (key: string) => {
    selectMenu(key);
    const clickedItem = menuItems.find((m) => m.id === key);
    setOpenKeys(clickedItem?.parentId ? [clickedItem.parentId] : []);
    onItemClick?.();
  };

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (parentKeys.has(key)) return;
    handleSelect(key);
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

  if (siderCollapsed) {
    return (
      <CollapsedMenu
        tree={tree}
        activeMenuId={activeMenuId}
        onSelect={handleSelect}
      />
    );
  }

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={activeMenuId ? [activeMenuId] : []}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      items={antdItems}
      onClick={onClick}
    />
  );
};
