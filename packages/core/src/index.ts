export const VERSION = '0.1.0';

export { ModuleRegistry, getModuleRegistry } from './module-registry';
export type { ModuleDefinition, ModuleManifest, ControllerClass, RouteDefinition } from './module-registry';
export { scanModules, installModules } from './module-scanner';
export type { ScanOptions } from './module-scanner';

export {
  AclRegistry, getAclRegistry,
  FieldSecurityRegistry, getFieldSecurityRegistry,
  RecordRuleRegistry, getRecordRuleRegistry,
} from './security';
export type { AclRule, FieldSecurityRule, RecordRule } from './security';
export { encryptField, decryptField, encryptRecord, decryptRecord } from './security';
export { maskValue, maskRecord } from './security';
export type { MaskPattern } from './security';
export { writeAudit, getAuditLog } from './security';
export type { AuditEntry } from './security';
