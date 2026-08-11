import { createRootRoute, Outlet, Link } from '@tanstack/react-router';

export const rootRoute = createRootRoute({
  component: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!token) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Danta</h1>
            <p className="text-muted-foreground mb-6">Please sign in to continue</p>
            <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
              Sign In
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex h-screen">
          <aside className="w-64 border-r bg-muted/40">
            <nav className="p-4 space-y-2">
              <Link to="/dashboard" className="block px-3 py-2 rounded-md hover:bg-muted">Dashboard</Link>
              <Link to="/calendar" className="block px-3 py-2 rounded-md hover:bg-muted">Calendar</Link>
              <Link to="/patients" className="block px-3 py-2 rounded-md hover:bg-muted">Patients</Link>
              <Link to="/appointments" className="block px-3 py-2 rounded-md hover:bg-muted">Appointments</Link>
              <Link to="/invoices" className="block px-3 py-2 rounded-md hover:bg-muted">Billing</Link>
              <div className="pt-2 mt-2 border-t">
                <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Reports</p>
                <Link to="/reports" className="block px-3 py-2 rounded-md hover:bg-muted">Overview</Link>
                <Link to="/reports/revenue" className="block px-3 py-2 rounded-md hover:bg-muted">Revenue</Link>
                <Link to="/reports/production" className="block px-3 py-2 rounded-md hover:bg-muted">Production</Link>
                <Link to="/reports/collections" className="block px-3 py-2 rounded-md hover:bg-muted">Collections</Link>
                <Link to="/reports/appointments" className="block px-3 py-2 rounded-md hover:bg-muted">Appointments</Link>
                <Link to="/reports/practitioners" className="block px-3 py-2 rounded-md hover:bg-muted">Practitioners</Link>
                <Link to="/reports/recalls" className="block px-3 py-2 rounded-md hover:bg-muted">Recalls</Link>
                <Link to="/reports/patients" className="block px-3 py-2 rounded-md hover:bg-muted">Patients</Link>
              </div>
            </nav>
          </aside>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    );
  },
});
