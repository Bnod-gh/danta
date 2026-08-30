import * as React from "react";

export interface PermissionGateProps {
  permission: string | string[];
  permissions?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean;
}

export function PermissionGate({ permission, permissions = [], fallback = null, children, requireAll = false }: PermissionGateProps) {
  const perms = Array.isArray(permission) ? permission : [permission];
  const allPermissions = [...permissions, ...perms];

  const hasAccess = requireAll
    ? perms.every((p) => allPermissions.includes(p))
    : perms.some((p) => allPermissions.includes(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function usePermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function usePermissions(permissions: string[], requiredPermissions: string[], requireAll = false): boolean {
  return requireAll
    ? requiredPermissions.every((p) => permissions.includes(p))
    : requiredPermissions.some((p) => permissions.includes(p));
}
