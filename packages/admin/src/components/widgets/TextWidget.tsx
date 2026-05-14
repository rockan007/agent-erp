import React from 'react';
import { ViewField } from '../../store';

interface Props {
  field: ViewField;
  value: string;
  onChange: (value: string) => void;
}

export const TextWidget: React.FC<Props> = ({ field, value, onChange }) => (
  <input
    type="text"
    value={value ?? ''}
    readOnly={field.readonly}
    required={field.required}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '6px 10px',
      border: '1px solid #ccc',
      borderRadius: 4,
      fontSize: 14,
    }}
  />
);
