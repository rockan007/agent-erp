import React from 'react';
import { ViewSpec } from '../store';

interface Props {
  view: ViewSpec;
}

export const SearchPanel: React.FC<Props> = ({ view }) => {
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  return (
    <div>
      <h2>Search: {view.model}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {view.fields.map((f) => (
          <div key={f.name}>
            <label style={{ display: 'block', fontSize: 13 }}>{f.label ?? f.name}</label>
            <input
              type="text"
              value={filters[f.name] ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, [f.name]: e.target.value }))}
              style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>
        ))}
      </div>
      <div>
        <button style={{ padding: '6px 16px', marginRight: 8 }}>Search</button>
        <button
          style={{ padding: '6px 16px', background: 'none', border: '1px solid #ccc' }}
          onClick={() => setFilters({})}
        >
          Clear
        </button>
      </div>
    </div>
  );
};
