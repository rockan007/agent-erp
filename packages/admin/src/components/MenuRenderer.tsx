import React from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useStore, MenuItem } from '../store';

const ICON_MAP: Record<string, React.ReactNode> = {
  contacts: <TeamOutlined />,
  partners: <TeamOutlined />,
  settings: <SettingOutlined />,
  users: <UserOutlined />,
  default: <AppstoreOutlined />,
};

function pickIcon(name: string): React.ReactNode {
  const key = name.toLowerCase();
  return ICON_MAP[key] ?? ICON_MAP.default!;
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
        icon: node.item.icon ?? pickIcon(node.item.name),
        children: toAntdItems(node.children),
      };
    }
    return {
      key: node.item.id,
      label: node.item.name,
      icon: node.item.icon ?? pickIcon(node.item.name),
    };
  });
}

export const MenuRenderer: React.FC = () => {
  const menuItems = useStore((s) => s.menuItems);
  const activeMenuId = useStore((s) => s.activeMenuId);
  const setActiveMenu = useStore((s) => s.setActiveMenu);
  const tree = buildTree(menuItems);
  const antdItems = toAntdItems(tree);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    setActiveMenu(key);
  };

  return (
    <div>
      <div className="px-3 py-3 border-b border-gray-200">
        <span className="text-lg font-bold">Agent ERP</span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={activeMenuId ? [activeMenuId] : []}
        items={antdItems}
        onClick={onClick}
        className="border-r-0"
      />
    </div>
  );
};
