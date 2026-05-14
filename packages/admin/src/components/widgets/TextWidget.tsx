import React from 'react';
import { Input } from 'antd';
import { ViewField } from '../../store';

interface Props {
  field: ViewField;
  value: string;
  onChange: (value: string) => void;
}

export const TextWidget: React.FC<Props> = ({ field, value, onChange }) => (
  <Input
    value={value ?? ''}
    readOnly={field.readonly}
    onChange={(e) => onChange(e.target.value)}
  />
);
