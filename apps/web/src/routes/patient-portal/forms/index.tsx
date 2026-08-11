import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

export const Route = createFileRoute('/patient-portal/forms/')({
  component: PatientPortalForms,
});

type PatientForm = {
  id: string;
  type: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
};

export function PatientPortalForms() {
  const { data: forms, isLoading } = useQuery({
    queryKey: ['patient-portal', 'forms'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/forms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch forms');
      return res.json() as Promise<PatientForm[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Forms</h1>
      </div>
      {!forms || forms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No forms found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {forms.map((f) => (
                <tr key={f.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 capitalize">{f.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium capitalize">{f.status}</span>
                  </td>
                  <td className="px-4 py-3">{f.submittedAt ? new Date(f.submittedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
