import { createRootRoute, Outlet, Link, useLocation, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { ThemeProvider } from '../lib/theme-provider';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '../components/error-boundary';
import { AppShell } from '../components/layout/AppShell';
import { isTenantPath, tenantPath } from '../lib/tenant-routing';
import { PUBLIC_ROUTES } from '../lib/public-routes';

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const { loading, user } = useAuth();
  const location = useLocation();
  const router = useRouter();

  const currentPath = location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/'),
  );

  const shouldScopeTenantPath = Boolean(user && !isPublicRoute && !isTenantPath(currentPath, user.tenantId));

  useEffect(() => {
    if (shouldScopeTenantPath && user) {
      const requestedDashboardPath = currentPath.match(/\/dashboard(?:\/|$).*/)?.[0];
      const canonicalPath = requestedDashboardPath
        ? `/${user.tenantId}${requestedDashboardPath}`
        : tenantPath(user.tenantId, currentPath);
      window.location.replace(`${canonicalPath}${window.location.search}${window.location.hash}`);
    }
  }, [currentPath, shouldScopeTenantPath, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <ThemeProvider><Outlet /></ThemeProvider>;
  }

  if (!user) {
    router.navigate({ to: '/login' });
    return null;
  }

  if (shouldScopeTenantPath) return null;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
