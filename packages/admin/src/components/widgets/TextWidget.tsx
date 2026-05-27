import React from 'react';
import { Input } from 'antd';
import { ViewField } from '../../store';

interface Props {
  field: ViewField;
  value?: string;
  onChange?: (value: string) => void;
}

export const TextWidget: React.FC<Props & { id?: string }> = ({ field, value, onChange, id }) => (
  <Input
    id={id}
    value={value ?? ''}
    readOnly={field.readonly}
    onChange={(e) => onChange?.(e.target.value)}
  />
);
