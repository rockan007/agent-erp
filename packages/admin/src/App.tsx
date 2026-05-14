import React from 'react';
import { MenuRenderer } from './components/MenuRenderer';
import { ViewRenderer } from './components/ViewRenderer';
import { useStore } from './store';

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
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p>Something went wrong rendering this view.</p>
          <button
            style={{ padding: '6px 16px', cursor: 'pointer' }}
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const activeView = useStore((s) => s.activeView);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 240, borderRight: '1px solid #e0e0e0', overflow: 'auto' }}>
        <MenuRenderer />
      </aside>
      <main style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        <ErrorBoundary>
          {activeView ? (
            <ViewRenderer view={activeView} />
          ) : (
            <div>Select an item from the menu</div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
