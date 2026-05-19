import { readdirSync, existsSync, lstatSync } from 'fs';
import { join, resolve } from 'path';
import { getModuleRegistry, ModuleManifest, ModuleDefinition } from './module-registry';

export interface ScanOptions {
  modulesPath: string;
}

export interface ModulePathInfo {
  name: string;
  absPath: string;
}

/**
 * Discover module directories. Returns list of { name, absPath }.
 * Does NOT import any files — caller must load manifest + index.
 */
export function discoverModules(options: ScanOptions): ModulePathInfo[] {
  const absPath = resolve(options.modulesPath);

  if (!existsSync(absPath)) {
    return [];
  }

  const entries = readdirSync(absPath);
  const result: ModulePathInfo[] = [];

  for (const entry of entries) {
    const modulePath = join(absPath, entry);

    if (!lstatSync(modulePath).isDirectory()) continue;

    const manifestPath = join(modulePath, 'manifest.ts');
    const indexPath = join(modulePath, 'index.ts');

    if (!existsSync(manifestPath) || !existsSync(indexPath)) continue;

    result.push({ name: entry, absPath: modulePath });
  }

  return result;
}

export interface ModuleLoader {
  loadManifest(modulePath: string): Promise<ModuleManifest>;
  loadIndex(modulePath: string): Promise<{
    models?: Record<string, unknown>[];
    controllers?: Record<string, unknown>[];
    data?: ((knex: Record<string, unknown>) => Promise<void>)[];
  }>;
}

/**
 * Scan and register modules using the provided loader.
 * The loader abstracts how .ts files are imported (native import, ssrLoadModule, etc.).
 */
export async function scanModules(options: ScanOptions, loader: ModuleLoader): Promise<string[]> {
  const registry = getModuleRegistry();
  const discovered = discoverModules(options);
  const loaded: string[] = [];

  for (const mod of discovered) {
    const manifest = await loader.loadManifest(mod.absPath);
    const moduleExports = await loader.loadIndex(mod.absPath);

    const moduleDef: ModuleDefinition = {
      manifest,
      models: (moduleExports.models ?? []) as unknown as ModuleDefinition['models'],
      controllers: (moduleExports.controllers ?? []) as unknown as ModuleDefinition['controllers'],
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

export async function runModuleSeeds(moduleNames: string[], knex: Record<string, unknown>): Promise<void> {
  const registry = getModuleRegistry();

  for (const name of moduleNames) {
    const mod = registry.get(name);
    if (!mod) continue;

    for (const seedFn of mod.dataFiles) {
      await seedFn(knex);
    }
  }
}
