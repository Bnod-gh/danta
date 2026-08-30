import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';

type Message = {
  id: string;
  channel: string;
  status: string;
  subject: string | null;
  body: string;
  sentAt: string | null;
  createdAt: string;
};

export function PatientPortalMessages() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['patient-portal', 'messages'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<Message[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Messages</h1>
      </div>
      {!messages || messages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No messages found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {messages.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize">{m.channel}</td>
                  <td className="px-4 py-3">{m.subject || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium capitalize">{m.status}</span>
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
