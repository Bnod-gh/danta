import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/messages/')({
  component: MessagesPage,
});

type Message = {
  id: string;
  patientId?: string;
  channel: string;
  status: string;
  subject?: string;
  body: string;
  recipient: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
};

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);

  useEffect(() => {
    fetch('/api/v1/patients')
      .then((res) => res.json())
      .then((data) => setPatients(data as PatientOption[]))
      .catch(() => {});
  }, []);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch('/api/v1/messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<Message[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { patientId?: string; channel: string; subject?: string; body: string; recipient: string }) => {
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setPatientId('');
    setChannel('email');
    setSubject('');
    setBody('');
    setRecipient('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      patientId: patientId || undefined,
      channel,
      subject: subject || undefined,
      body,
      recipient,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Send and track SMS/Email messages</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">New Message</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">Select patient (optional)</option>
                {patients?.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
                <option value="patient_portal">Patient Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" rows={4} required />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Send</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Recipient</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {messages?.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 capitalize">{m.channel.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{m.recipient}</td>
                  <td className="px-4 py-3">{m.subject || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', m.status === 'sent' || m.status === 'delivered' ? 'bg-green-100 text-green-800' : m.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
