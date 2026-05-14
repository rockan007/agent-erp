import React from 'react';
import { MenuRenderer } from './components/MenuRenderer';
import { ViewRenderer } from './components/ViewRenderer';
import { useStore } from './store';

const App: React.FC = () => {
  const activeView = useStore((s) => s.activeView);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 240, borderRight: '1px solid #e0e0e0', overflow: 'auto' }}>
        <MenuRenderer />
      </aside>
      <main style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        {activeView ? (
          <ViewRenderer view={activeView} />
        ) : (
          <div>Select an item from the menu</div>
        )}
      </main>
    </div>
  );
};

export default App;
