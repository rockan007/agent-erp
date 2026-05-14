export const VERSION = '0.1.0';

export {
  ModuleRegistry,
  getModuleRegistry,
} from './module-registry';
export type {
  ModuleManifest,
  RouteDefinition,
  ControllerClass,
  ModuleDefinition,
} from './module-registry';
export { scanModules, installModules } from './module-scanner';
export type { ScanOptions } from './module-scanner';

export {
  AclRegistry,
  getAclRegistry,
} from './security';
export type {
  AclRule,
  FieldSecurityRegistry as FieldSecurity,
  FieldSecurityRule,
  RecordRuleRegistry as RecordRules,
  RecordRule,
  MaskPattern,
  AuditEntry,
} from './security';
export {
  getFieldSecurityRegistry,
  getRecordRuleRegistry,
  encryptField,
  decryptField,
  encryptRecord,
  decryptRecord,
  maskValue,
  maskRecord,
  writeAudit,
  getAuditLog,
} from './security';
