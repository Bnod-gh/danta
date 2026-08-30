import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2, MoreVertical, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@danta/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui';
import { Input } from '@danta/ui';
import { Label } from '@danta/ui';
import { Textarea } from '@danta/ui';
import { Checkbox } from '@danta/ui';
import { Badge } from '@danta/ui';
import { Skeleton } from '@danta/ui';
import { ErrorState } from '@danta/ui';
import { EmptyState } from '@danta/ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@danta/ui';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@danta/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api/request';
import type { ImagingIntegration, CreateImagingIntegration, UpdateImagingIntegration } from '@danta/schemas';

export function ImagingIntegrationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [config, setConfig] = useState('{}');

  const { data: integrations, isLoading, error, refetch } = useQuery({
    queryKey: ['imaging-integrations'],
    queryFn: async () => apiGet<ImagingIntegration[]>('/imaging-integrations'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateImagingIntegration) =>
      apiPost<ImagingIntegration>('/imaging-integrations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-integrations'] });
      toast.success('Imaging integration created');
      resetForm();
    },
    onError: () => toast.error('Failed to create imaging integration'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateImagingIntegration }) =>
      apiPut<ImagingIntegration>(`/imaging-integrations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-integrations'] });
      toast.success('Imaging integration updated');
      resetForm();
    },
    onError: () => toast.error('Failed to update imaging integration'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiDelete(`/imaging-integrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-integrations'] });
      toast.success('Imaging integration deleted');
    },
    onError: () => toast.error('Failed to delete imaging integration'),
  });

  const resetForm = () => {
    setName('');
    setProvider('');
    setIsActive(true);
    setConfig('{}');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (integration: ImagingIntegration) => {
    setName(integration.name);
    setProvider(integration.provider);
    setIsActive(integration.isActive);
    setConfig(JSON.stringify(integration.config || {}, null, 2));
    setEditingId(integration.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedConfig: Record<string, unknown> = {};
    try {
      parsedConfig = JSON.parse(config);
    } catch {
      toast.error('Invalid JSON config');
      return;
    }
    const data: UpdateImagingIntegration = {
      name,
      provider,
      isActive,
      config: parsedConfig,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data as CreateImagingIntegration);
    }
  };

  const filteredIntegrations = integrations?.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imaging Integrations</h1>
          <p className="text-muted-foreground">Manage imaging providers and storage</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Integration
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'New'} Imaging Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} required />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="config">Config (JSON)</Label>
                  <Textarea id="config" value={config} onChange={(e) => setConfig(e.target.value)} rows={4} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Unable to load imaging integrations"
              message="Please try again later."
              onRetry={() => refetch()}
            />
          ) : filteredIntegrations && filteredIntegrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntegrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell>{integration.name}</TableCell>
                    <TableCell>{integration.provider}</TableCell>
                    <TableCell>
                      <Badge variant={integration.isActive ? 'success' : 'secondary'}>
                        {integration.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(integration)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteMutation.mutate(integration.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No imaging integrations" description="Set up imaging providers and storage integrations." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
