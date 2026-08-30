import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { Button } from '@danta/ui/button';
import { Label } from '@danta/ui/label';
import { Switch } from '@danta/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { apiGet, apiPut } from '../../lib/api/request';
import { toast } from 'sonner';

type Preferences = {
  email: boolean;
  sms: boolean;
  phone: boolean;
  reminders: boolean;
  marketing: boolean;
};

export function CommunicationPreferencesPage() {
  const { patientId } = useParams({ from: '/communication-preferences/$patientId' });
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    email: true,
    sms: true,
    phone: false,
    reminders: true,
    marketing: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['communication-preferences', patientId],
    queryFn: async () => {
      const response = await apiGet<Preferences>(`/communication-preferences/${patientId}`);
      return response;
    },
  });

  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiPut(`/communication-preferences/${patientId}`, preferences);
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Communication Preferences</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load preferences</p>
          <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Communication Preferences</h1>
        <p className="text-muted-foreground">Manage communication preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={preferences.email}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={preferences.sms}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, sms: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Phone calls</Label>
                  <p className="text-sm text-muted-foreground">Allow phone calls for reminders</p>
                </div>
                <Switch
                  checked={preferences.phone}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, phone: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Appointment reminders</Label>
                  <p className="text-sm text-muted-foreground">Send appointment reminders</p>
                </div>
                <Switch
                  checked={preferences.reminders}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, reminders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing communications</Label>
                  <p className="text-sm text-muted-foreground">Receive marketing and promotional messages</p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} loading={loading} disabled={loading}>Save Preferences</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
