import React from 'react';
import { Layout, Button, Result } from 'antd';
import { MenuRenderer } from './components/MenuRenderer';
import { ViewRenderer } from './components/ViewRenderer';
import { useStore } from './store';

const { Sider, Content } = Layout;

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong rendering this view."
          extra={
            <Button type="primary" onClick={() => this.setState({ hasError: false })}>
              Retry
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const activeView = useStore((s) => s.activeView);

  return (
    <Layout className="h-screen">
      <Sider
        width={240}
        theme="light"
        className="overflow-auto border-r border-gray-200"
      >
        <MenuRenderer />
      </Sider>
      <Content className="overflow-auto bg-white">
        <div className="p-4">
          <ErrorBoundary>
            {activeView ? (
              <ViewRenderer view={activeView} />
            ) : (
              <Result
                status="info"
                title="Welcome to Agent ERP"
                subTitle="Select an item from the menu to get started."
              />
            )}
          </ErrorBoundary>
        </div>
      </Content>
    </Layout>
  );
};

export default App;
