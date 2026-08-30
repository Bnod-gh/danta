import { Outlet, Link } from '@tanstack/react-router';
import { Calendar, Stethoscope, FolderOpen, CreditCard, Receipt, MessageSquare, Bell, FileText } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/patient-portal', icon: Calendar },
  { title: 'Appointments', href: '/patient-portal/appointments', icon: Calendar },
  { title: 'Treatment Plans', href: '/patient-portal/treatment-plans', icon: Stethoscope },
  { title: 'Documents', href: '/patient-portal/documents', icon: FolderOpen },
  { title: 'Forms', href: '/patient-portal/forms', icon: FileText },
  { title: 'Billing', href: '/patient-portal/billing', icon: CreditCard },
  { title: 'Payments', href: '/patient-portal/payments', icon: Receipt },
  { title: 'Messages', href: '/patient-portal/messages', icon: MessageSquare },
  { title: 'Notifications', href: '/patient-portal/notifications', icon: Bell },
];

export function PatientPortalLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        <aside className="w-64 border-r bg-muted/40">
          <nav className="p-4 space-y-2">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Patient Portal</h2>
              <p className="text-xs text-muted-foreground">Welcome back</p>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm"
                activeProps={{ className: 'bg-muted font-medium' }}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t">
              <button
                onClick={() => {
                  localStorage.removeItem('patientAccessToken');
                  localStorage.removeItem('patientRefreshToken');
                  window.location.href = '/patient-portal/login';
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm text-red-600"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
