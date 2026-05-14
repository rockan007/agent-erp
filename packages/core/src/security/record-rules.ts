import type { Domain } from '@erp/data';

export interface RecordRule {
  name: string;
  model: string;
  group: string;
  domain: Domain;
  perm: {
    read: boolean;
    write: boolean;
    create: boolean;
    unlink: boolean;
  };
}

export class RecordRuleRegistry {
  private rules: RecordRule[] = [];

  register(rules: RecordRule[]): void {
    this.rules.push(...rules);
  }

  getDomain(
    model: string,
    operation: 'read' | 'write' | 'create' | 'unlink',
    userGroups: string[],
    uid: number,
  ): Domain[] {
    const domains: Domain[] = [];
    for (const rule of this.rules) {
      if (
        rule.model === model &&
        userGroups.includes(rule.group) &&
        rule.perm[operation]
      ) {
        const resolved = rule.domain.map(
          ([field, op, val]) => {
            if (val === '$uid') return [field, op, uid] as Domain[number];
            return [field, op, val] as Domain[number];
          },
        ) as Domain;
        domains.push(resolved);
      }
    }
    return domains;
  }

  clear(): void {
    this.rules = [];
  }
}

let _recordRuleRegistry: RecordRuleRegistry | null = null;

export function getRecordRuleRegistry(): RecordRuleRegistry {
  if (!_recordRuleRegistry) {
    _recordRuleRegistry = new RecordRuleRegistry();
  }
  return _recordRuleRegistry;
}
