export function tenantPath(tenantId: string | undefined, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const dashboardPath = normalizedPath === '/dashboard' || normalizedPath.startsWith('/dashboard/')
    ? normalizedPath
    : `/dashboard${normalizedPath}`;
  return tenantId ? `/${encodeURIComponent(tenantId)}${dashboardPath}` : dashboardPath;
}

export function isTenantPath(pathname: string, tenantId: string | undefined) {
  return Boolean(tenantId && (pathname === `/${tenantId}` || pathname.startsWith(`/${tenantId}/`)));
}
