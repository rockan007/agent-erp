import { describe, it, expect, beforeEach } from 'vitest';
import {
  ModuleRegistry,
  ModuleDefinition,
} from '../module-registry';

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  const makeModule = (
    name: string,
    depends: string[] = [],
  ): ModuleDefinition => ({
    manifest: { name, version: '1.0', depends },
    models: [],
    controllers: [],
    dataFiles: [],
    installed: false,
  });

  it('should register and retrieve modules', () => {
    const mod = makeModule('base');
    registry.register(mod);
    expect(registry.get('base')).toBe(mod);
  });

  it('should detect circular dependencies', () => {
    registry.register(makeModule('a', ['b']));
    registry.register(makeModule('b', ['a']));
    expect(() => registry.resolveDependencies()).toThrow(
      'Circular dependency',
    );
  });

  it('should resolve dependencies in topological order', () => {
    registry.register(makeModule('c', ['b']));
    registry.register(makeModule('b', ['a']));
    registry.register(makeModule('a', []));

    const order = registry.resolveDependencies();
    const idxA = order.indexOf('a');
    const idxB = order.indexOf('b');
    const idxC = order.indexOf('c');

    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);
  });

  it('should throw for missing dependency', () => {
    registry.register(makeModule('x', ['missing_module']));
    expect(() => registry.resolveDependencies()).toThrow('not found');
  });

  it('should throw for duplicate registration', () => {
    registry.register(makeModule('dup'));
    expect(() => registry.register(makeModule('dup'))).toThrow(
      'already registered',
    );
  });

  it('getAll should return all modules', () => {
    registry.register(makeModule('m1'));
    registry.register(makeModule('m2'));
    expect(registry.getAll().size).toBe(2);
  });

  it('getInstallOrder should return resolved order', () => {
    registry.register(makeModule('a'));
    registry.register(makeModule('b', ['a']));
    registry.resolveDependencies();
    expect(registry.getInstallOrder()).toHaveLength(2);
  });
});
