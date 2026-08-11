import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/patients/')({
  component: PatientsPage,
});

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await fetch(`/api/v1/patients?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json() as Promise<{ patients: Array<{
        id: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        phone?: string;
        email?: string;
        status: string;
      }>; total: number }>;
    },
  });

  const patients = data?.patients || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">Manage patient records</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
          <Plus className="w-4 h-4" />
          New Patient
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deceased">Deceased</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No patients found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">DOB</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <a href={`/patients/${patient.id}`} className="text-primary hover:underline">
                      {patient.firstName} {patient.lastName}
                    </a>
                  </td>
                  <td className="px-4 py-3">{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{patient.phone || '-'}</td>
                  <td className="px-4 py-3">{patient.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                      patient.status === 'active' && "bg-green-100 text-green-800",
                      patient.status === 'inactive' && "bg-gray-100 text-gray-800",
                      patient.status === 'deceased' && "bg-red-100 text-red-800"
                    )}>
                      {patient.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
