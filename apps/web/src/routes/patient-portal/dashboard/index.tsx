import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/patient-portal/dashboard/')({
  component: PatientPortalDashboard,
});

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  provider: { firstName: string; lastName: string };
  appointmentType: { name: string };
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  balance: number;
  issueDate: string;
};

export function PatientPortalDashboard() {
  const { data: appointments } = useQuery({
    queryKey: ['patient-portal', 'appointments'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json() as Promise<Appointment[]>;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['patient-portal', 'invoices'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json() as Promise<Invoice[]>;
    },
  });

  const upcomingAppointments = appointments?.filter(a => new Date(a.startTime) > new Date()).slice(0, 5) || [];
  const recentInvoices = invoices?.slice(0, 5) || [];
  const outstandingBalance = invoices?.reduce((sum, i) => sum + i.balance, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your patient portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
          <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
          <p className="text-2xl font-bold">${outstandingBalance.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold">{invoices?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{a.appointmentType.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(a.startTime).toLocaleDateString()} with {a.provider.firstName} {a.provider.lastName}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">{a.status}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/patient-portal/appointments" className="text-sm text-primary hover:underline mt-4 inline-block">
            View all appointments
          </Link>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Recent Invoices</h2>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{i.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(i.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${i.total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Balance: ${i.balance.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/patient-portal/billing" className="text-sm text-primary hover:underline mt-4 inline-block">
            View all invoices
          </Link>
        </div>
      </div>
    </div>
  );
}
