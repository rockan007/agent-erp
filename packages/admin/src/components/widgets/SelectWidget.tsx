import React from 'react';
import { Select } from 'antd';
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
  const choices: [string, string][] = isTupleArray(raw) ? raw : [];
  const options = choices.map(([val, label]) => ({ value: val, label }));

  return (
    <Select
      value={value || undefined}
      options={options}
      onChange={(v) => onChange(v)}
      placeholder="-- Select --"
      allowClear
      className="w-full"
    />
  );
};
