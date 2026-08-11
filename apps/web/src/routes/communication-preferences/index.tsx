import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/communication-preferences/')({
  component: CommunicationPreferencesPage,
});

type CommunicationPreference = {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  smsEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  patientPortalEnabled: boolean;
  marketingConsent: boolean;
  reminderChannel: string;
  reminderLeadTime: number;
};

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export function CommunicationPreferencesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [patientPortalEnabled, setPatientPortalEnabled] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [reminderChannel, setReminderChannel] = useState('sms');
  const [reminderLeadTime, setReminderLeadTime] = useState('24');
  const [patients, setPatients] = useState<PatientOption[]>([]);

  useEffect(() => {
    fetch('/api/v1/patients')
      .then((res) => res.json())
      .then((data) => setPatients(data as PatientOption[]))
      .catch(() => {});
  }, []);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['communication-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/v1/communication-preferences');
      if (!res.ok) throw new Error('Failed to fetch communication preferences');
      return res.json() as Promise<CommunicationPreference[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { patientId: string; smsEnabled: boolean; emailEnabled: boolean; inAppEnabled: boolean; patientPortalEnabled: boolean; marketingConsent: boolean; reminderChannel: string; reminderLeadTime: number }) => {
      const res = await fetch('/api/v1/communication-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create preference');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-preferences'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { smsEnabled?: boolean; emailEnabled?: boolean; inAppEnabled?: boolean; patientPortalEnabled?: boolean; marketingConsent?: boolean; reminderChannel?: string; reminderLeadTime?: number } }) => {
      const res = await fetch(`/api/v1/communication-preferences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-preferences'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setPatientId('');
    setSmsEnabled(true);
    setEmailEnabled(true);
    setInAppEnabled(true);
    setPatientPortalEnabled(true);
    setMarketingConsent(false);
    setReminderChannel('sms');
    setReminderLeadTime('24');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (p: CommunicationPreference) => {
    setPatientId(p.patientId);
    setSmsEnabled(p.smsEnabled);
    setEmailEnabled(p.emailEnabled);
    setInAppEnabled(p.inAppEnabled);
    setPatientPortalEnabled(p.patientPortalEnabled);
    setMarketingConsent(p.marketingConsent);
    setReminderChannel(p.reminderChannel);
    setReminderLeadTime(String(p.reminderLeadTime));
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      patientId,
      smsEnabled,
      emailEnabled,
      inAppEnabled,
      patientPortalEnabled,
      marketingConsent,
      reminderChannel,
      reminderLeadTime: Number(reminderLeadTime),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication Preferences</h1>
          <p className="text-muted-foreground">Manage patient communication settings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Preference
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Preference</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select patient</option>
                {patients?.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reminder Channel</label>
              <select value={reminderChannel} onChange={(e) => setReminderChannel(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="in_app">In-App</option>
                <option value="patient_portal">Patient Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reminder Lead Time (hours)</label>
              <input type="number" value={reminderLeadTime} onChange={(e) => setReminderLeadTime(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="smsEnabled" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} className="rounded" />
              <label htmlFor="smsEnabled" className="text-sm font-medium">SMS Enabled</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="emailEnabled" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="rounded" />
              <label htmlFor="emailEnabled" className="text-sm font-medium">Email Enabled</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="marketingConsent" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="rounded" />
              <label htmlFor="marketingConsent" className="text-sm font-medium">Marketing Consent</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">{editingId ? 'Update' : 'Create'}</button>
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
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium">SMS</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Reminder</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {preferences?.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{p.patient.firstName} {p.patient.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', p.smsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {p.smsEnabled ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', p.emailEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {p.emailEnabled ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.reminderChannel.replace('_', ' ')} ({p.reminderLeadTime}h)</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(p)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
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
