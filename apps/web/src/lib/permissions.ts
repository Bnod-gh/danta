export const NAV_PERMISSIONS = {
  dashboard: 'reports:read',
  schedule: 'schedule:read',
  patients: 'patient:read',
  appointments: 'schedule:read',
  billing: 'billing:read',
  reports: 'reports:read',
  'reports/revenue': 'reports:read',
  'reports/production': 'reports:read',
  'reports/collections': 'reports:read',
  'reports/appointments': 'reports:read',
  'reports/practitioners': 'reports:read',
  'reports/recalls': 'reports:read',
  'reports/patients': 'reports:read',
  clinical: 'clinical:read',
  imaging: 'imaging:read',
  communication: 'communication:read',
  practice: 'settings:manage',
  'api-keys': 'settings:manage',
  audit: 'audit:read',
} as const;

export type NavPermissionKey = keyof typeof NAV_PERMISSIONS;

export function hasPermission(permissions: string[], key: NavPermissionKey): boolean {
  const required = NAV_PERMISSIONS[key];
  if (!required) return true;
  return permissions.includes(required);
}