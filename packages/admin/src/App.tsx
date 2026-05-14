import React from 'react';
import { Layout, Drawer, Grid } from 'antd';
import { AppHeader } from './components/AppHeader';
import { MenuRenderer } from './components/MenuRenderer';
import { ViewRenderer } from './components/ViewRenderer';
import { PageHeader } from './components/PageHeader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const App: React.FC = () => {
  const activeView = useStore((s) => s.activeView);
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const sidebarContent = (
    <MenuRenderer
      onItemClick={isMobile ? () => setSiderCollapsed(true) : undefined}
    />
  );

  return (
    <Layout className="h-screen">
      <AppHeader />

      <Layout>
        {/* Desktop: inline Sider */}
        {!isMobile && (
          <Sider
            width={240}
            collapsedWidth={64}
            collapsible
            collapsed={siderCollapsed}
            onCollapse={(v) => setSiderCollapsed(v)}
            theme="dark"
            trigger={null}
            breakpoint="lg"
            className="overflow-auto"
          >
            <div className="flex items-center justify-center h-12 border-b border-gray-700">
              <span className="text-white font-bold text-sm">
                {siderCollapsed ? 'AE' : 'Agent ERP'}
              </span>
            </div>
            {sidebarContent}
          </Sider>
        )}

        {/* Mobile: Drawer overlay */}
        {isMobile && (
          <Drawer
            open={!siderCollapsed}
            onClose={() => setSiderCollapsed(true)}
            placement="left"
            width={240}
            styles={{ body: { padding: 0, background: '#001529' } }}
            closeIcon={null}
          >
            <div className="flex items-center h-12 px-4 border-b border-gray-700">
              <span className="text-white font-bold text-sm">Agent ERP</span>
            </div>
            {sidebarContent}
          </Drawer>
        )}

        <Content className="overflow-auto bg-white">
          {activeView ? (
            <>
              <PageHeader view={activeView} />
              <div className="px-6 pb-6">
                <ErrorBoundary>
                  <ViewRenderer view={activeView} />
                </ErrorBoundary>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <ErrorBoundary>
                <ViewRenderer view={{
                  id: 'welcome',
                  model: '',
                  type: 'kanban',
                  title: 'Welcome',
                  fields: [],
                }} />
              </ErrorBoundary>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
