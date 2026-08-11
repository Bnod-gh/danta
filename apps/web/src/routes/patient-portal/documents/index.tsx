import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';

export const Route = createFileRoute('/patient-portal/documents/')({
  component: PatientPortalDocuments,
});

type Document = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export function PatientPortalDocuments() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['patient-portal', 'documents'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json() as Promise<Document[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Documents</h1>
      </div>
      {!documents || documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No documents found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((d) => (
                <tr key={d.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3">{d.mimeType}</td>
                  <td className="px-4 py-3">{(d.size / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
