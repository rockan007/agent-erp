import React from 'react';
import { ViewSpec, ViewLayout, ViewField } from '../store';
import { TextWidget } from './widgets/TextWidget';
import { SelectWidget } from './widgets/SelectWidget';

interface Props {
  view: ViewSpec;
}

function renderField(field: ViewField, value: unknown, onChange: (name: string, value: unknown) => void) {
  const widget = field.widget ?? 'text';

  switch (widget) {
    case 'text':
      return <TextWidget field={field} value={value as string} onChange={(v) => onChange(field.name, v)} />;
    case 'select':
      return <SelectWidget field={field} value={value as string} onChange={(v) => onChange(field.name, v)} />;
    default:
      return <TextWidget field={field} value={value as string} onChange={(v) => onChange(field.name, v)} />;
  }
}

function renderLayout(
  layout: ViewLayout | undefined,
  fields: ViewField[],
  values: Record<string, unknown>,
  onChange: (name: string, value: unknown) => void,
) {
  if (!layout) {
    return fields.map((f) => (
      <div key={f.name} style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
          {f.label ?? f.name}
          {f.required && <span style={{ color: 'red' }}> *</span>}
        </label>
        {renderField(f, values[f.name], onChange)}
      </div>
    ));
  }

  return layout.items.map((item, i) => (
    <fieldset key={i} style={{ marginBottom: 16, border: '1px solid #e0e0e0', padding: 12, borderRadius: 4 }}>
      {item.title && <legend style={{ fontWeight: 600 }}>{item.title}</legend>}
      {item.fields.map((fieldName) => {
        const fieldDef = fields.find((f) => f.name === fieldName);
        if (!fieldDef) return null;
        return (
          <div key={fieldName} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
              {fieldDef.label ?? fieldDef.name}
              {fieldDef.required && <span style={{ color: 'red' }}> *</span>}
            </label>
            {renderField(fieldDef, values[fieldName], onChange)}
          </div>
        );
      })}
    </fieldset>
  ));
}

export const FormRenderer: React.FC<Props> = ({ view }) => {
  const [values, setValues] = React.useState<Record<string, unknown>>({});

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Save logic via API
  };

  return (
    <div>
      <h2>{view.title}</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {renderLayout(view.layout, view.fields, values, handleChange)}
        <button type="submit" style={{ padding: '8px 24px', cursor: 'pointer' }}>
          Save
        </button>
      </form>
    </div>
  );
};
