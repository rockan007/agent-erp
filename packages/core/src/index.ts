export const VERSION = '0.1.0';

export { ModuleRegistry, getModuleRegistry } from './module-registry';
export type { ModuleDefinition, ModuleManifest, ControllerClass, RouteDefinition, ModuleMenuItem, ModuleViewSpec } from './module-registry';
export { scanModules, installModules, discoverModules, runModuleSeeds } from './module-scanner';
export type { ScanOptions, ModuleLoader, ModulePathInfo } from './module-scanner';

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

export { hashPassword, verifyPassword, signToken, verifyToken, storeCode, verifyCode } from './auth';
export type { TokenPayload } from './auth';

export { getRequestLocale, tError } from './i18n';
