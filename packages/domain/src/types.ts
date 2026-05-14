export type FieldType =
  | 'char' | 'text' | 'html' | 'integer' | 'float'
  | 'boolean' | 'date' | 'datetime' | 'binary' | 'selection'
  | 'many2one' | 'one2many' | 'many2many' | 'reference'
  | 'monetary' | 'image' | 'json';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  default?: unknown;
  comodel?: string;
  inverse_field?: string;
  selection?: [string, string][];
  encrypt?: boolean;
  mask?: 'phone' | 'email' | 'id_card';
  store?: boolean;
  compute?: (record: Record<string, unknown>) => unknown;
  depends?: string[];
}

export interface ModelDefinition {
  _name: string;
  _description: string;
  _inherit?: string;
  _inherits?: Record<string, string>;
  _table?: string;
  fields: Record<string, FieldDefinition>;
}

export interface RecordData {
  id?: number;
  [key: string]: unknown;
}
