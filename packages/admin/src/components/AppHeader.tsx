import React from 'react';
import { Layout, Button, Breadcrumb, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useStore } from '../store';

const { Header } = Layout;

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', icon: <ProfileOutlined />, label: 'My Profile' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
];

export const AppHeader: React.FC = () => {
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const breadcrumbs = useStore((s) => s.breadcrumbs);
  const user = useStore((s) => s.user);

  const breadcrumbItems = breadcrumbs.length > 0
    ? breadcrumbs.map((b) => ({ title: b.name }))
    : [{ title: 'Home' }];

  return (
    <Header className="flex items-center justify-between px-4 bg-white border-b border-gray-100 h-12 leading-[48px]">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setSiderCollapsed(!siderCollapsed)}
        />
        <span className="text-base font-bold text-gray-800">Agent ERP</span>
        <Breadcrumb items={breadcrumbItems} className="ml-2" />
      </div>

      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Space className="cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
            <UserOutlined className="text-white text-xs" />
          </div>
          <span className="text-sm text-gray-600">
            {user?.name ?? 'Guest'}
          </span>
        </Space>
      </Dropdown>
    </Header>
  );
};
