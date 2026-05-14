import { readdirSync, existsSync, lstatSync } from 'fs';
import { join, resolve } from 'path';
import { getModuleRegistry, ModuleManifest, ModuleDefinition } from './module-registry';

export interface ScanOptions {
  modulesPath: string;
}

export async function scanModules(options: ScanOptions): Promise<string[]> {
  const registry = getModuleRegistry();
  const absPath = resolve(options.modulesPath);

  if (!existsSync(absPath)) {
    return [];
  }

  const entries = readdirSync(absPath);
  const loaded: string[] = [];

  for (const entry of entries) {
    const modulePath = join(absPath, entry);

    if (!lstatSync(modulePath).isDirectory()) continue;

    const manifestPath = join(modulePath, 'manifest.ts');
    const indexPath = join(modulePath, 'index.ts');

    if (!existsSync(manifestPath) || !existsSync(indexPath)) continue;

    const manifest = (await import(manifestPath)).default as ModuleManifest;
    const moduleExports = await import(indexPath);

    const moduleDef: ModuleDefinition = {
      manifest,
      models: moduleExports.models ?? [],
      controllers: moduleExports.controllers ?? [],
      dataFiles: moduleExports.data ?? [],
      installed: false,
    };

    registry.register(moduleDef);
    loaded.push(manifest.name);
  }

  return loaded;
}

export async function installModules(moduleNames: string[]): Promise<void> {
  const registry = getModuleRegistry();

  for (const name of moduleNames) {
    const mod = registry.get(name);
    if (!mod) throw new Error(`Module "${name}" not found`);

    const { getModelRegistry } = await import('@erp/domain');
    const modelRegistry = getModelRegistry();
    for (const modelClass of mod.models) {
      modelRegistry.register(modelClass);
    }

    mod.installed = true;
  }
}
