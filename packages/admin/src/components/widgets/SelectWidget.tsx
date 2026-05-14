import React from 'react';
import { ViewField } from '../../store';

interface Props {
  field: ViewField;
  value: string;
  onChange: (value: string) => void;
}

export const SelectWidget: React.FC<Props> = ({ field, value, onChange }) => {
  const options = (field.options?.choices as [string, string][]) ?? [];

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
