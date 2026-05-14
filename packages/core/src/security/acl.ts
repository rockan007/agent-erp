export interface AclRule {
  model: string;
  group: string;
  permissions: {
    read: boolean;
    write: boolean;
    create: boolean;
    unlink: boolean;
  };
}

export class AclRegistry {
  private rules: AclRule[] = [];

  register(rules: AclRule[]): void {
    this.rules.push(...rules);
  }

  check(
    model: string,
    operation: 'read' | 'write' | 'create' | 'unlink',
    userGroups: string[],
  ): boolean {
    const applicableRules = this.rules.filter(
      (r) => r.model === model && userGroups.includes(r.group),
    );

    if (applicableRules.length === 0) return false;

    return applicableRules.some((r) => r.permissions[operation]);
  }

  getRules(model: string): AclRule[] {
    return this.rules.filter((r) => r.model === model);
  }

  clear(): void {
    this.rules = [];
  }
}

let _aclRegistry: AclRegistry | null = null;

export function getAclRegistry(): AclRegistry {
  if (!_aclRegistry) {
    _aclRegistry = new AclRegistry();
  }
  return _aclRegistry;
}
