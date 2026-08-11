import { createFileRoute, Link } from '@tanstack/react-router';
import { FileText, TrendingUp, Users, Calendar, Stethoscope, Bell, UserCheck } from 'lucide-react';

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
});

const reportCards = [
  { title: 'Revenue', description: 'Revenue trends, by provider, by service', href: '/reports/revenue', icon: TrendingUp },
  { title: 'Production', description: 'Treatment production and outcomes', href: '/reports/production', icon: Stethoscope },
  { title: 'Collections', description: 'Outstanding balances and aging', href: '/reports/collections', icon: FileText },
  { title: 'Appointments', description: 'Appointment analytics and trends', href: '/reports/appointments', icon: Calendar },
  { title: 'Practitioners', description: 'Practitioner performance metrics', href: '/reports/practitioners', icon: UserCheck },
  { title: 'Recalls', description: 'Recall analytics and completion', href: '/reports/recalls', icon: Bell },
  { title: 'Patients', description: 'Patient demographics and growth', href: '/reports/patients', icon: Users },
];

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Practice analytics and insights</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((card) => (
          <Link key={card.href} to={card.href} className="border rounded-lg p-6 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
