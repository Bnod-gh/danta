import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@danta/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui';
import { Input } from '@danta/ui';
import { Label } from '@danta/ui';
import { Skeleton } from '@danta/ui';
import { ErrorState } from '@danta/ui';
import { EmptyState } from '@danta/ui';
import { apiGet, apiPut } from '../../../lib/api/request';
import type { Setting } from '@danta/schemas';

export function OrganisationSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: orgSettings, isLoading, error, refetch } = useQuery({
    queryKey: ['settings', 'organisation'],
    queryFn: async () => apiGet<Setting[]>('/settings/organisation'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      apiPut(`/settings/${encodeURIComponent(key)}`, { key, value } as Setting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsSaving(false);
      toast.success('Setting saved');
    },
    onError: () => {
      setIsSaving(false);
      toast.error('Failed to save setting');
    },
  });

  useEffect(() => {
    if (orgSettings) {
      setSettings(orgSettings);
    }
  }, [orgSettings]);

  const handleSave = (key: string, value: Record<string, unknown>) => {
    setIsSaving(true);
    updateMutation.mutate({ key, value });
  };

  const getSettingValue = (key: string): string => {
    const setting = settings.find((s) => s.key === key);
    if (!setting) return '';
    if (typeof setting.value === 'string') return setting.value;
    if (typeof setting.value === 'object' && setting.value !== null) {
      if ('content' in setting.value) return (setting.value as Record<string, unknown>).content as string;
      if ('name' in setting.value) return (setting.value as Record<string, unknown>).name as string;
    }
    return JSON.stringify(setting.value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organisation Settings</h1>
          <p className="text-muted-foreground">Manage organisation details and branding</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organisation Settings</h1>
          <p className="text-muted-foreground">Manage organisation details and branding</p>
        </div>
        <ErrorState
          title="Unable to load organisation settings"
          message="Please try again later."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organisation Settings</h1>
        <p className="text-muted-foreground">Manage organisation details and branding</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle>Organisation Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <EmptyState title="No organisation settings configured" description="Organisation settings will appear here once configured." />
          ) : (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.key} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={setting.key}>{setting.key}</Label>
                    <Input
                      id={setting.key}
                      value={getSettingValue(setting.key)}
                      onChange={(e) => {
                        const newSettings = settings.map((s) =>
                          s.key === setting.key ? { ...s, value: { content: e.target.value } as Record<string, any> } : s
                        );
                        setSettings(newSettings);
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => handleSave(setting.key, { value: getSettingValue(setting.key) })}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
