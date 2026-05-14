import 'reflect-metadata';

interface ComputeConfig {
  depends: string[];
  store?: boolean;
}

export const api = {
  compute(config: ComputeConfig) {
    return function (_target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
      const computes: Record<string, ComputeConfig> =
        Reflect.getMetadata('computes', _target) ?? {};
      computes[propertyKey] = config;
      Reflect.defineMetadata('computes', computes, _target);
    };
  },

  depends(dependencies: string[]) {
    return function (_target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
      const deps: Record<string, string[]> =
        Reflect.getMetadata('depends', _target) ?? {};
      deps[propertyKey] = dependencies;
      Reflect.defineMetadata('depends', deps, _target);
    };
  },

  constrains(config: { message?: string } = {}) {
    return function (_target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
      const constraints: Record<string, { message?: string }> =
        Reflect.getMetadata('constraints', _target) ?? {};
      constraints[propertyKey] = config;
      Reflect.defineMetadata('constraints', constraints, _target);
    };
  },

  onchange(fieldNames: string[]) {
    return function (_target: object, propertyKey: string, _descriptor: PropertyDescriptor): void {
      const onchanges: Record<string, string[]> =
        Reflect.getMetadata('onchanges', _target) ?? {};
      onchanges[propertyKey] = fieldNames;
      Reflect.defineMetadata('onchanges', onchanges, _target);
    };
  },
};
