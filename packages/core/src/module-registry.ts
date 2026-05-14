import type { BaseModel } from '@erp/domain';

export interface ModuleManifest {
  name: string;
  version: string;
  depends: string[];
  auto_install?: boolean;
  application?: boolean;
}

export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;
  auth?: boolean;
}

export interface ControllerClass {
  new (): object;
  routes?: RouteDefinition[];
}

export interface ModuleDefinition {
  manifest: ModuleManifest;
  models: (typeof BaseModel)[];
  controllers: ControllerClass[];
  dataFiles: string[];
  installed: boolean;
}

export class ModuleRegistry {
  private modules = new Map<string, ModuleDefinition>();
  private installOrder: string[] = [];

  register(module: ModuleDefinition): void {
    if (this.modules.has(module.manifest.name)) {
      throw new Error(`Module "${module.manifest.name}" is already registered.`);
    }
    this.modules.set(module.manifest.name, module);
  }

  get(name: string): ModuleDefinition | undefined {
    return this.modules.get(name);
  }

  getAll(): Map<string, ModuleDefinition> {
    return new Map(this.modules);
  }

  resolveDependencies(): string[] {
    const resolved: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) throw new Error(`Circular dependency detected: ${name}`);
      visiting.add(name);

      const mod = this.modules.get(name);
      if (!mod) throw new Error(`Module "${name}" not found`);

      for (const dep of mod.manifest.depends) {
        visit(dep);
      }

      visiting.delete(name);
      visited.add(name);
      resolved.push(name);
    };

    for (const name of this.modules.keys()) {
      visit(name);
    }

    this.installOrder = resolved;
    return resolved;
  }

  getInstallOrder(): string[] {
    return [...this.installOrder];
  }

  getInstalledModules(): string[] {
    return this.installOrder.filter((name) => this.modules.get(name)?.installed);
  }
}

let _moduleRegistry: ModuleRegistry | null = null;

export function getModuleRegistry(): ModuleRegistry {
  if (!_moduleRegistry) {
    _moduleRegistry = new ModuleRegistry();
  }
  return _moduleRegistry;
}
