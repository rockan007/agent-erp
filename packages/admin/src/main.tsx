import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { useStore } from './store';
import i18n, { getAntdLocale } from './i18n';
import './index.css';

// Initialize auth before first render
useStore.getState().initializeAuth();

// Set document lang attribute on startup
document.documentElement.lang = i18n.language;

const themeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 8,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f7fa',
    colorBorderSecondary: '#e8ecf1',
    fontFamily:
      "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    controlHeight: 36,
    lineHeight: 1.6,
    colorText: '#1a1f1c',
    colorTextSecondary: '#6b726e',
    colorFillAlter: '#f5f7fa',
    colorBgElevated: '#ffffff',
    boxShadow:
      '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
    boxShadowSecondary:
      '0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
  },
  components: {
    Layout: {
      siderBg: 'transparent',
      headerBg: 'transparent',
      bodyBg: '#f5f7fa',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(24,144,255,0.35)',
      darkItemHoverBg: 'rgba(255,255,255,0.04)',
      itemBorderRadius: 8,
      darkItemColor: 'rgba(255,255,255,0.65)',
      darkItemSelectedColor: '#ffffff',
      itemMarginBlock: 1,
      itemMarginInline: 8,
      subMenuItemBg: 'transparent',
    },
    Table: {
      headerBg: '#f5f7fa',
      borderColor: '#e8ecf1',
      headerBorderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      paddingContentHorizontal: 20,
      primaryShadow: '0 2px 8px rgba(24,144,255,0.25)',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
      activeBorderColor: '#1890ff',
      hoverBorderColor: '#40a9ff',
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: 14,
      paddingLG: 24,
    },
    Breadcrumb: {
      itemColor: '#6b726e',
      lastItemColor: '#1a1f1c',
      linkColor: '#6b726e',
      linkHoverColor: '#1890ff',
    },
    Tabs: {
      itemActiveColor: '#1890ff',
      itemHoverColor: '#40a9ff',
      inkBarColor: '#1890ff',
    },
  },
};

const Root = () => {
  const [locale, setLocale] = useState(getAntdLocale());

  i18n.on('languageChanged', () => {
    setLocale(getAntdLocale());
    document.documentElement.lang = i18n.language;
  });

  return (
    <ConfigProvider locale={locale} theme={themeConfig}>
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
