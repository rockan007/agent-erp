import React from 'react';
import { useStore, MenuItem } from '../store';

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

  return roots.sort((a, b) => a.item.sequence - b.item.sequence);
}

const MenuNode: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
  const activeMenuId = useStore((s) => s.activeMenuId);
  const setActiveMenu = useStore((s) => s.setActiveMenu);
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = activeMenuId === node.item.id;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          } else {
            setActiveMenu(node.item.id);
          }
        }}
        style={{
          padding: `8px 12px 8px ${12 + level * 16}px`,
          cursor: 'pointer',
          backgroundColor: isActive ? '#e3f2fd' : 'transparent',
          fontWeight: isActive ? 600 : 400,
          userSelect: 'none',
        }}
      >
        {hasChildren && (expanded ? '▼ ' : '▶ ')}
        {node.item.name}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <MenuNode key={child.item.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const MenuRenderer: React.FC = () => {
  const menuItems = useStore((s) => s.menuItems);
  const tree = buildTree(menuItems);

  return (
    <nav>
      <div style={{ padding: '12px', fontWeight: 700, fontSize: 18, borderBottom: '1px solid #e0e0e0' }}>
        Agent ERP
      </div>
      {tree.map((node) => (
        <MenuNode key={node.item.id} node={node} level={0} />
      ))}
    </nav>
  );
};
