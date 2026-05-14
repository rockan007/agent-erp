import 'reflect-metadata';
import { FieldDefinition, FieldType } from './types';

interface FieldOptions {
  required?: boolean;
  readonly?: boolean;
  default?: unknown;
  comodel?: string;
  inverse_field?: string;
  selection?: [string, string][];
  encrypt?: boolean;
  mask?: 'phone' | 'email' | 'id_card';
}

function createField(type: FieldType) {
  return function (options: FieldOptions = {}) {
    return function (target: object, propertyKey: string): void {
      const existingFields: Record<string, FieldDefinition> =
        Reflect.getMetadata('fields', target) ?? {};

      existingFields[propertyKey] = {
        name: propertyKey,
        type,
        ...options,
      };

      Reflect.defineMetadata('fields', existingFields, target);
    };
  };
}

export const fields = {
  char: createField('char'),
  text: createField('text'),
  html: createField('html'),
  integer: createField('integer'),
  float: createField('float'),
  boolean: createField('boolean'),
  date: createField('date'),
  datetime: createField('datetime'),
  binary: createField('binary'),
  json: createField('json'),
  monetary: createField('monetary'),
  image: createField('image'),

  many2one(options: { comodel: string; required?: boolean }) {
    return function (target: object, propertyKey: string): void {
      const f: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      f[propertyKey] = { name: propertyKey, type: 'many2one', ...options };
      Reflect.defineMetadata('fields', f, target);
    };
  },

  one2many(options: { comodel: string; inverse_field: string }) {
    return function (target: object, propertyKey: string): void {
      const f: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      f[propertyKey] = { name: propertyKey, type: 'one2many', ...options };
      Reflect.defineMetadata('fields', f, target);
    };
  },

  many2many(options: { comodel: string; table?: string; column1?: string; column2?: string }) {
    return function (target: object, propertyKey: string): void {
      const f: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      f[propertyKey] = { name: propertyKey, type: 'many2many', ...options };
      Reflect.defineMetadata('fields', f, target);
    };
  },

  selection(opts: [string, string][], fieldOpts: { required?: boolean; default?: string } = {}) {
    return function (target: object, propertyKey: string): void {
      const f: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      f[propertyKey] = { name: propertyKey, type: 'selection', selection: opts, ...fieldOpts };
      Reflect.defineMetadata('fields', f, target);
    };
  },
};
