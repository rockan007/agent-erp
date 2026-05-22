import React from 'react';
import { Layout, Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  LogoutOutlined,
  ProfileOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';

const { Header } = Layout;

const langItems = [
  { key: 'zh_CN', label: '中文' },
  { key: 'en_US', label: 'English' },
];

export const AppHeader: React.FC = () => {
  const { i18n } = useTranslation();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const currentLangLabel =
    langItems.find((item) => item.key === i18n.language)?.label ?? 'English';

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
    <Header className="erp-header-brand flex items-center justify-between px-5 h-[52px] leading-[52px]">
      {/* Left: brand */}
      <div className="flex items-center gap-2.5">
        <div className="erp-brand-mark" style={{ width: 28, height: 28, fontSize: 13 }}>
          A
        </div>
        <span
          className="text-white font-bold text-[15px] tracking-[-0.01em]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Agent ERP
        </span>
      </div>

      {/* Right: lang + notification + user pill */}
      <div className="flex items-center gap-3">
        <Dropdown
          menu={{
            items: langItems,
            onClick: ({ key }) => i18n.changeLanguage(key),
          }}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<GlobalOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }} />}
            className="erp-header-lang-btn"
          >
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginLeft: 4 }}>
              {currentLangLabel}
            </span>
          </Button>
        </Dropdown>

        <Button
          type="text"
          icon={<BellOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }} />}
          className="erp-header-notify-btn"
        />
        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
          <Space className="erp-header-user-pill cursor-pointer">
            <div className="erp-header-user-avatar">
              {(user?.name ?? 'Guest').charAt(0).toUpperCase()}
            </div>
            <span className="erp-header-user-name">
              {user?.name ?? 'Guest'}
            </span>
            <span className="erp-header-user-arrow">▾</span>
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
};
