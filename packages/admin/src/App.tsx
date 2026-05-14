import React from 'react';
import { Layout, Drawer, Grid } from 'antd';

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
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const easeOut = [0.4, 0, 0.2, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: easeOut },
  },
};

const statCards = [
  { label: '活跃用户', value: '1,248', change: '+12%', gradient: 'erp-stat-blue' },
  { label: '合作伙伴', value: '356', change: '+8%', gradient: 'erp-stat-green' },
  { label: '本月订单', value: '89', change: '+23%', gradient: 'erp-stat-gold' },
  { label: '营收 (K)', value: '¥482', change: '+18%', gradient: 'erp-stat-purple' },
];

const quickActions = [
  { label: '新建订单', primary: true },
  { label: '添加伙伴', primary: false },
  { label: '报表中心', primary: false },
  { label: '系统设置', primary: false },
  { label: '导入数据', primary: false },
];

const mockBars = [45, 70, 55, 85, 60, 90, 75, 95, 65, 80, 70, 88];

const mockActivities = [
  { color: '#1890ff', text: '张三 创建了新订单 #1024' },
  { color: '#52c41a', text: '李四 更新了合作伙伴信息' },
  { color: '#faad14', text: '王五 提交了月度报表' },
  { color: '#722ed1', text: '系统 完成了数据备份' },
];

const WelcomeScreen: React.FC = () => {
  const user = useStore((s) => s.user);
  const menuItems = useStore((s) => s.menuItems);
  const setActiveMenu = useStore((s) => s.setActiveMenu);

  const greeting = `早上好, ${user?.name ?? 'Guest'}`;

  return (
    <div className="erp-dashboard">
      <motion.div
        className="erp-dashboard-inner"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="erp-dashboard-greeting">
          <h1 className="erp-dashboard-greeting-text">{greeting}</h1>
          <p className="erp-dashboard-greeting-sub">以下是您的业务概览</p>
        </motion.div>

        {/* Stats cards */}
        <motion.div variants={itemVariants} className="erp-dashboard-stats">
          {statCards.map((card) => (
            <motion.div
              key={card.label}
              variants={cardVariants}
              className={`erp-stat-card ${card.gradient}`}
            >
              <div className="erp-stat-label">{card.label}</div>
              <div className="erp-stat-value">{card.value}</div>
              <div className="erp-stat-change">{card.change} vs 上月</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content row: chart + recent */}
        <motion.div variants={itemVariants} className="erp-dashboard-content">
          {/* Main chart */}
          <div className="erp-dashboard-chart">
            <div className="erp-card-header">月度趋势</div>
            <div className="erp-chart-bars">
              {mockBars.map((h, i) => (
                <div key={i} className="erp-chart-bar-col">
                  <div
                    className="erp-chart-bar"
                    style={{ height: `${h}%` }}
                  />
                  <span className="erp-chart-label">{i + 1}月</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="erp-dashboard-recent">
            <div className="erp-card-header">最近动态</div>
            <div className="erp-recent-list">
              {mockActivities.map((item, i) => (
                <div key={i} className="erp-recent-item">
                  <div
                    className="erp-recent-dot"
                    style={{ background: item.color }}
                  />
                  <span className="erp-recent-text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={itemVariants} className="erp-dashboard-actions">
          {quickActions.map((action) => (
            <button
              type="button"
              key={action.label}
              className={
                action.primary
                  ? 'erp-action-pill erp-action-pill-primary'
                  : 'erp-action-pill'
              }
            >
              {action.primary && <span className="erp-action-plus">+</span>}
              {action.label}
            </button>
          ))}
        </motion.div>

        {/* Module chips — keep existing behavior */}
        {menuItems.length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5">
            {menuItems
              .filter((m) => !m.parentId)
              .sort((a, b) => a.sequence - b.sequence)
              .slice(0, 6)
              .map((m) => (
                <button
                  type="button"
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


  return (
    <Layout className="h-screen">
      <AppHeader />

      <Layout>
        {/* Desktop sidebar */}
        {!isMobile && (
          <Sider
            width={220}
            collapsedWidth={64}
            collapsible
            collapsed={siderCollapsed}
            onCollapse={(v) => setSiderCollapsed(v)}
            theme="light"
            trigger={null}
            className="erp-sider-light"
          >
            {/* Sidebar top: section label + hamburger */}
            <div className="erp-sider-top">
              {!siderCollapsed && (
                <span className="erp-sider-section-label">导航菜单</span>
              )}
              <button
                type="button"
                className="erp-sider-collapse-btn"
                onClick={() => setSiderCollapsed(!siderCollapsed)}
              >
                <span className="erp-hamburger-line" />
                <span className="erp-hamburger-line" />
                <span className="erp-hamburger-line" />
              </button>
            </div>

            {sidebarContent}
          </Sider>
        )}

        {/* Mobile drawer */}
        {isMobile && (
          <Drawer
            open={!siderCollapsed}
            onClose={() => setSiderCollapsed(true)}
            placement="left"
            width={220}
            styles={{
              body: { padding: 0, background: '#fafbfc' },
              wrapper: { background: 'transparent' },
            }}
            closeIcon={null}
          >
            <div className="erp-sider-light flex flex-col h-full">
              <div className="erp-sider-top px-3">
                <span className="erp-sider-section-label">导航菜单</span>
                <button
                  type="button"
                  className="erp-sider-collapse-btn"
                  onClick={() => setSiderCollapsed(true)}
                >
                  <span className="erp-hamburger-line" />
                  <span className="erp-hamburger-line" />
                  <span className="erp-hamburger-line" />
                </button>
              </div>
              <div className="flex-1" style={{ overflow: 'hidden' }}>
                {sidebarContent}
              </div>
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
            <>
              <div className="erp-content-breadcrumb">
                <span className="erp-breadcrumb-home">Home</span>
              </div>
              <ErrorBoundary>
                <WelcomeScreen />
              </ErrorBoundary>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
