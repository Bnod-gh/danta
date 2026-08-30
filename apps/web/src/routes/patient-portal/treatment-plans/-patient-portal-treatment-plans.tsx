import { useQuery } from '@tanstack/react-query';
import { Stethoscope } from 'lucide-react';

type TreatmentPlan = {
  id: string;
  name: string;
  status: string;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
  provider: { firstName: string; lastName: string };
};

export function PatientPortalTreatmentPlans() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['patient-portal', 'treatment-plans'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/treatment-plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch treatment plans');
      return res.json() as Promise<TreatmentPlan[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Stethoscope className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Treatment Plans</h1>
      </div>
      {!plans || plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No treatment plans found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">
                Provider: {plan.provider.firstName} {plan.provider.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: <span className="capitalize">{plan.status}</span>
              </p>
              {plan.notes && <p className="text-sm text-muted-foreground">{plan.notes}</p>}
              <p className="text-xs text-muted-foreground">
                Created: {new Date(plan.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
