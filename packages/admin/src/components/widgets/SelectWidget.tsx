import React from 'react';
import { ViewField } from '../../store';

interface Props {
  field: ViewField;
  value: string;
  onChange: (value: string) => void;
}

function isTupleArray(v: unknown): v is [string, string][] {
  return Array.isArray(v) && v.every(
    (item) => Array.isArray(item) && item.length === 2 &&
      typeof item[0] === 'string' && typeof item[1] === 'string',
  );
}

export const SelectWidget: React.FC<Props> = ({ field, value, onChange }) => {
  const raw = field.options?.choices;
  const options: [string, string][] = isTupleArray(raw) ? raw : [];

  return (
    <select
      value={value ?? ''}
      required={field.required}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '6px 10px',
        border: '1px solid #ccc',
        borderRadius: 4,
        fontSize: 14,
      }}
    >
      <option value="">-- Select --</option>
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
};
