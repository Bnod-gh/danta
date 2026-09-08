import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Settings2, Save, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@danta/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui';
import { Input } from '@danta/ui';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui';
import { ErrorState } from '@danta/ui';
import { EmptyState } from '@danta/ui';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { apiGet, apiPut } from '../../../lib/api/request';
import type { Setting } from '@danta/schemas';

export function PracticeSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: practiceSettings, isLoading, error, refetch } = useQuery({
    queryKey: ['settings', 'practice'],
    queryFn: async () => apiGet<Setting[]>('/settings/practice'),
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
    if (practiceSettings) {
      setSettings(practiceSettings);
    }
  }, [practiceSettings]);

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
          <h1 className="text-2xl font-bold">Practice Settings</h1>
          <p className="text-muted-foreground">Configure practice operations</p>
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
          <h1 className="text-2xl font-bold">Practice Settings</h1>
          <p className="text-muted-foreground">Configure practice operations</p>
        </div>
        <ErrorState
          title="Unable to load practice settings"
          message="Please try again later."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practice Settings</h1>
        <p className="text-muted-foreground">Configure practice operations</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <CardTitle>Practice Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <EmptyState title="No practice settings configured" description="Practice settings will appear here once configured." />
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

      <DocumentTypesSettings />
    </div>
  );
}

interface DocumentType {
  id: string;
  name: string;
  icon?: string;
}

function DocumentTypesSettings() {
  const queryClient = useQueryClient();
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => apiGet<Setting[]>('/settings'),
  });

  useEffect(() => {
    const docSetting = settings?.find((s) => s.key === 'document_types');
    let types: DocumentType[] = [];
    if (docSetting?.value) {
      const v = docSetting.value;
      if (Array.isArray(v)) types = v as DocumentType[];
      else if (typeof v === 'string') try { types = JSON.parse(v) as DocumentType[]; } catch { }
    }
    setDocTypes(types);
  }, [settings]);

  const saveDocTypes = (types: DocumentType[]) => {
    updateMutation.mutate({
      key: 'document_types',
      value: types as unknown as Record<string, any>,
    });
  };

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      apiPut(`/settings/${encodeURIComponent(key)}`, { key, value } as Setting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Failed to save document types'),
  });

  const handleAdd = () => {
    setEditId(null);
    setEditName('');
    setDialogOpen(true);
  };

  const handleEdit = (type: DocumentType) => {
    setEditId(type.id);
    setEditName(type.name);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this document type?')) return;
    const updated = docTypes.filter((t) => t.id !== id);
    setDocTypes(updated);
    saveDocTypes(updated);
  };

  const handleSubmit = () => {
    if (!editName.trim()) return toast.error('Name is required');
    const type: DocumentType = {
      id: editId ?? crypto.randomUUID(),
      name: editName.trim(),
    };
    let updated: DocumentType[];
    if (editId) {
      updated = docTypes.map((t) => (t.id === editId ? type : t));
    } else {
      updated = [...docTypes, type];
    }
    setDocTypes(updated);
    saveDocTypes(updated);
    setDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Document Types</span>
            <Button size="sm" variant="outline" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add type
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom document types configured.</p>
          ) : (
            <div className="space-y-2">
              {docTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{type.name}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(type)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(type.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit document type' : 'Add document type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Consent Form, Referral, X-Ray..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
