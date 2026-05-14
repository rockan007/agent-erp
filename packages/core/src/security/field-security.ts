export interface FieldSecurityRule {
  model: string;
  group: string;
  fields: {
    name: string;
    readable: boolean;
    writable: boolean;
  }[];
}

export class FieldSecurityRegistry {
  private rules: FieldSecurityRule[] = [];

  register(rules: FieldSecurityRule[]): void {
    this.rules.push(...rules);
  }

  getReadableFields(model: string, userGroups: string[]): Set<string> {
    const result = new Set<string>();
    for (const rule of this.rules) {
      if (rule.model === model && userGroups.includes(rule.group)) {
        for (const field of rule.fields) {
          if (field.readable) result.add(field.name);
        }
      }
    }
    return result;
  }

  getWritableFields(model: string, userGroups: string[]): Set<string> {
    const result = new Set<string>();
    for (const rule of this.rules) {
      if (rule.model === model && userGroups.includes(rule.group)) {
        for (const field of rule.fields) {
          if (field.writable) result.add(field.name);
        }
      }
    }
    return result;
  }

  filterReadable(
    model: string,
    data: Record<string, unknown>[],
    userGroups: string[],
  ): Record<string, unknown>[] {
    const allowed = this.getReadableFields(model, userGroups);
    if (allowed.size === 0) return data;
    return data.map((row) => {
      const filtered: Record<string, unknown> = {};
      for (const key of Object.keys(row)) {
        if (allowed.has(key)) filtered[key] = row[key];
      }
      return filtered;
    });
  }

  clear(): void {
    this.rules = [];
  }
}

let _fieldSecurityRegistry: FieldSecurityRegistry | null = null;

export function getFieldSecurityRegistry(): FieldSecurityRegistry {
  if (!_fieldSecurityRegistry) {
    _fieldSecurityRegistry = new FieldSecurityRegistry();
  }
  return _fieldSecurityRegistry;
}
