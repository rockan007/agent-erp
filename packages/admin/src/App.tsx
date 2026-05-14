import React from 'react';
import { Layout, Drawer, Grid } from 'antd';
import {
  AppstoreOutlined,
  ProfileOutlined,
  SearchOutlined,
  TableOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AppHeader } from './components/AppHeader';
import { MenuRenderer } from './components/MenuRenderer';
import { ViewRenderer } from './components/ViewRenderer';
import { PageHeader } from './components/PageHeader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store';
import LoginPage from './components/LoginPage';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

/* ── Staggered animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const easeOut = [0.4, 0, 0.2, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

const quickActions = [
  { icon: <ProfileOutlined />, label: 'Browse Records', desc: 'View and manage your data' },
  { icon: <SearchOutlined />, label: 'Search', desc: 'Find records across modules' },
  { icon: <TableOutlined />, label: 'Reports', desc: 'View analytics and reports' },
];

const WelcomeScreen: React.FC = () => {
  const menuItems = useStore((s) => s.menuItems);
  const setActiveMenu = useStore((s) => s.setActiveMenu);

  return (
    <div className="erp-welcome">
      {/* Decorative elements */}
      <div
        className="erp-decorative-ring"
        style={{ top: '12%', left: '8%', transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="erp-decorative-dot"
        style={{ top: '18%', right: '14%' }}
      />
      <div
        className="erp-decorative-dot"
        style={{ bottom: '22%', left: '10%', width: '4px', height: '4px' }}
      />

      <motion.div
        className="text-center max-w-2xl mx-auto px-8 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-10">
          <div className="erp-welcome-icon">
            <AppstoreOutlined className="text-[32px] text-white" />
          </div>
        </motion.div>

        {/* Overline */}
        <motion.div variants={itemVariants} className="mb-4">
          <span className="erp-welcome-overline">Welcome to</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="erp-welcome-heading text-5xl sm:text-6xl md:text-7xl mb-7"
        >
          Agent ERP
        </motion.h1>

        {/* Decorative line */}
        <motion.div variants={itemVariants} className="flex justify-center mb-7">
          <div className="erp-welcome-line" />
        </motion.div>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg text-[#6b726e] mb-14 leading-relaxed max-w-md mx-auto"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Your intelligent business management platform. Select a module from the
          sidebar to get started.
        </motion.p>

        {/* Quick action cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14"
        >
          {quickActions.map((action, i) => (
            <div key={i} className="erp-welcome-card text-center">
              <div className="erp-welcome-card-icon text-2xl text-[#1b6b4a] mb-3">
                {action.icon}
              </div>
              <div className="font-semibold text-sm text-[#1a1f1c] mb-1">
                {action.label}
              </div>
              <div
                className="text-xs text-[#6b726e]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {action.desc}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Module chips */}
        {menuItems.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-2.5"
          >
            {menuItems
              .filter((m) => !m.parentId)
              .sort((a, b) => a.sequence - b.sequence)
              .slice(0, 6)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMenu(m.id)}
                  className="erp-module-chip"
                >
                  {m.name}
                </button>
              ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

const App: React.FC = () => {
  const activeView = useStore((s) => s.activeView);
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const user = useStore((s) => s.user);
  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  if (!user) return <LoginPage />;

  const sidebarContent = (
    <MenuRenderer
      onItemClick={isMobile ? () => setSiderCollapsed(true) : undefined}
    />
  );

  /* ── User presence panel (shared between desktop + mobile) ── */
  const userPresence = (
    <div className="erp-sider-user">
      <div className="erp-sider-user-avatar">
        {(user?.name ?? 'Guest').charAt(0).toUpperCase()}
      </div>
      <div className="erp-sider-user-info">
        <div className="erp-sider-user-name">{user?.name ?? 'Guest'}</div>
        <div className="erp-sider-user-status">
          <span className="erp-sider-user-dot" />
          online
        </div>
      </div>
      <SettingOutlined
        className="text-xs"
        style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
      />
    </div>
  );

  return (
    <Layout className="h-screen">
      <AppHeader />

      <Layout>
        {/* Desktop sidebar */}
        {!isMobile && (
          <Sider
            width={240}
            collapsedWidth={64}
            collapsible
            collapsed={siderCollapsed}
            onCollapse={(v) => setSiderCollapsed(v)}
            theme="dark"
            trigger={null}
            className="erp-sider"
          >
            {/* Brand */}
            <div className="erp-sider-brand flex items-center justify-center h-12">
              {siderCollapsed ? (
                <div
                  className="erp-brand-mark"
                  style={{ width: 30, height: 30, fontSize: 14 }}
                >
                  A
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div
                    className="erp-brand-mark"
                    style={{ width: 24, height: 24, fontSize: 12 }}
                  >
                    A
                  </div>
                  <span
                    className="text-white font-bold text-sm tracking-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Agent ERP
                  </span>
                </div>
              )}
            </div>

            {sidebarContent}

            {/* User presence */}
            {!siderCollapsed && userPresence}
          </Sider>
        )}

        {/* Mobile drawer */}
        {isMobile && (
          <Drawer
            open={!siderCollapsed}
            onClose={() => setSiderCollapsed(true)}
            placement="left"
            width={240}
            styles={{
              body: { padding: 0, background: 'transparent' },
              wrapper: { background: 'transparent' },
            }}
            closeIcon={null}
          >
            <div
              className="erp-sider flex flex-col h-full"
              style={{
                background:
                  'linear-gradient(170deg, var(--color-sidebar-from) 0%, var(--color-sidebar-to) 100%)',
              }}
            >
              <div className="erp-sider-brand flex items-center h-12 px-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="erp-brand-mark"
                    style={{ width: 24, height: 24, fontSize: 12 }}
                  >
                    A
                  </div>
                  <span
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Agent ERP
                  </span>
                </div>
              </div>
              <div className="flex-1" style={{ overflow: 'hidden' }}>
                {sidebarContent}
              </div>
              {userPresence}
            </div>
          </Drawer>
        )}

        {/* Content */}
        <Content className="erp-content" style={{ overflow: 'auto' }}>
          {activeView ? (
            <div className="erp-animate-in">
              <PageHeader view={activeView} />
              <div className="px-6 py-6">
                <ErrorBoundary>
                  <ViewRenderer view={activeView} />
                </ErrorBoundary>
              </div>
            </div>
          ) : (
            <ErrorBoundary>
              <WelcomeScreen />
            </ErrorBoundary>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
