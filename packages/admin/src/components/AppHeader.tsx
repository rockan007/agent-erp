import React from 'react';
import { Layout, Button, Breadcrumb, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useStore } from '../store';

const { Header } = Layout;

export const AppHeader: React.FC = () => {
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const breadcrumbs = useStore((s) => s.breadcrumbs);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const breadcrumbItems =
    breadcrumbs.length > 0
      ? breadcrumbs.map((b) => ({ title: b.name }))
      : [{ title: 'Home' }];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
    }
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <ProfileOutlined />, label: 'My Profile' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  return (
    <Header className="erp-header flex items-center justify-between px-4 h-12 leading-[48px]">
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={
            siderCollapsed ? (
              <MenuUnfoldOutlined className="text-[#6b726e]" />
            ) : (
              <MenuFoldOutlined className="text-[#6b726e]" />
            )
          }
          onClick={() => setSiderCollapsed(!siderCollapsed)}
        />
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
        <Space className="cursor-pointer hover:opacity-80 transition-opacity">
          <div className="erp-user-avatar">
            {(user?.name ?? 'Guest').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[#1a1f1c] hidden sm:inline">
            {user?.name ?? 'Guest'}
          </span>
        </Space>
      </Dropdown>
    </Header>
  );
};
