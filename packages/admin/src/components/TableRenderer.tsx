import React from 'react';
import { ViewSpec } from '../store';

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

interface Props {
  view: ViewSpec;
}

export const TableRenderer: React.FC<Props> = ({ view }) => {
  const [records] = React.useState<Record<string, unknown>[]>([]);

  return (
    <div>
      <h2>{view.title}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {view.fields.map((f) => (
              <th key={f.name} style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #e0e0e0' }}>
                {f.label ?? f.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={view.fields.length} style={{ padding: 16, textAlign: 'center', color: '#999' }}>
                No records found
              </td>
            </tr>
          ) : (
            records.map((record, i) => (
              <tr key={i}>
                {view.fields.map((f) => (
                  <td key={f.name} style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                    {formatCell(record[f.name])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
