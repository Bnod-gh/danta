import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Plus, RotateCcw, Trash2, Key, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/api-keys/')({
  component: ApiKeysPage,
});

type ApiKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  env: string;
  version: number;
  scopes: string[];
  rateLimit: { max: number; windowMs: number } | null;
  ipAllowlist: string[] | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

const apiKeyFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  scopes: z.string().optional(),
  expiresAt: z.string().optional(),
  ipAllowlist: z.string().optional(),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRecord | null>(null);
  const [rotateTarget, setRotateTarget] = useState<ApiKeyRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ApiKeyFormValues, string>>>({});

  const form = useForm({
    defaultValues: {
      name: '',
      scopes: '',
      expiresAt: '',
      ipAllowlist: '',
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({});
      const parsed = apiKeyFormSchema.safeParse(value);
      if (!parsed.success) {
        const errors: Partial<Record<keyof ApiKeyFormValues, string>> = {};
        parsed.error.errors.forEach((err) => {
          const field = err.path[0] as keyof ApiKeyFormValues;
          if (!errors[field]) {
            errors[field] = err.message;
          }
        });
        setFieldErrors(errors);
        return;
      }

      const scopes = (parsed.data.scopes || '').split(',').map((s) => s.trim()).filter(Boolean);
      const ipAllowlist = (parsed.data.ipAllowlist || '').split(',').map((s) => s.trim()).filter(Boolean);

      createMutation.mutate({
        name: parsed.data.name,
        scopes,
        expiresAt: parsed.data.expiresAt || undefined,
        ipAllowlist,
      });
    },
  });

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/v1/api-keys');
      if (!res.ok) throw new Error('Failed to fetch API keys');
      return res.json() as Promise<ApiKeyRecord[]>;
    },
  });

  type CreateMutationInput = {
    name: string;
    scopes: string[];
    expiresAt?: string;
    ipAllowlist: string[];
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateMutationInput) => {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          scopes: data.scopes,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
          ipAllowlist: data.ipAllowlist,
        }),
      });
      if (!res.ok) throw new Error('Failed to create API key');
      return res.json() as Promise<ApiKeyRecord & { secret: string }>;
    },
    onSuccess: (data) => {
      setCreatedSecret(data.secret);
      setShowForm(false);
      form.reset();
      setFieldErrors({});
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/api-keys/${id}/rotate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to rotate API key');
      return res.json() as Promise<ApiKeyRecord & { secret: string }>;
    },
    onSuccess: (data) => {
      setCreatedSecret(data.secret);
      setRotateTarget(null);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to revoke API key');
      return res.json();
    },
    onSuccess: () => {
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const handleRotate = () => {
    if (rotateTarget) rotateMutation.mutate(rotateTarget.id);
  };

  const handleRevoke = () => {
    if (revokeTarget) revokeMutation.mutate({ id: revokeTarget.id });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCreateState = () => {
    setCreatedSecret(null);
    setShowForm(false);
    form.reset();
    setFieldErrors({});
  };

  const activeKeys = keys?.filter((k) => !k.revokedAt) || [];
  const revokedKeys = keys?.filter((k) => k.revokedAt) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage API keys for external integrations</p>
        </div>
        {!showForm && !createdSecret && (
          <button
            onClick={() => { resetCreateState(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New API Key
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">Create API Key</h3>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="name" children={(field) => (
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md text-sm',
                    (fieldErrors.name || field.state.meta.errors.length > 0) && 'border-red-500'
                  )}
                  placeholder="e.g. Production Integration"
                />
                {(fieldErrors.name || field.state.meta.errors.length > 0) && (
                  <p className="text-xs text-red-600 mt-1">{String(fieldErrors.name || field.state.meta.errors[0])}</p>
                )}
              </div>
            )} />
            <form.Field name="expiresAt" children={(field) => (
              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            )} />
            <div className="col-span-2">
              <form.Field name="scopes" children={(field) => (
                <div>
                  <label className="block text-sm font-medium mb-1">Scopes (comma-separated)</label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={cn(
                      'w-full px-3 py-2 border rounded-md text-sm',
                      (fieldErrors.scopes || field.state.meta.errors.length > 0) && 'border-red-500'
                    )}
                    placeholder="patients:read, appointments:read"
                  />
                  {(fieldErrors.scopes || field.state.meta.errors.length > 0) && (
                    <p className="text-xs text-red-600 mt-1">{String(fieldErrors.scopes || field.state.meta.errors[0])}</p>
                  )}
                </div>
              )} />
            </div>
            <div className="col-span-2">
              <form.Field name="ipAllowlist" children={(field) => (
                <div>
                  <label className="block text-sm font-medium mb-1">IP Allowlist (comma-separated CIDR, optional)</label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="10.0.0.0/8, 192.168.1.0/24"
                  />
                </div>
              )} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={resetCreateState} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      {createdSecret && (
        <div className="border rounded-lg p-4 space-y-3 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <Key className="w-5 h-5" />
            <h3 className="font-medium">API Key Created</h3>
          </div>
          <p className="text-sm text-yellow-700">
            <strong>This secret will not be shown again.</strong> Copy it now and store it securely.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white border rounded text-sm break-all">{createdSecret}</code>
            <button onClick={() => copyToClipboard(createdSecret)} className="p-2 border rounded hover:bg-white" title="Copy">
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={resetCreateState} className="px-4 py-2 border rounded-md text-sm">Done</button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {activeKeys.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Prefix</th>
                    <th className="text-left px-4 py-3 font-medium">Env</th>
                    <th className="text-left px-4 py-3 font-medium">Scopes</th>
                    <th className="text-left px-4 py-3 font-medium">Expires</th>
                    <th className="text-left px-4 py-3 font-medium">Last Used</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{key.name}</td>
                      <td className="px-4 py-3"><code className="text-xs bg-muted px-1 py-0.5 rounded">{key.keyPrefix}...</code></td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                          key.env === 'PROD' && "bg-red-100 text-red-800",
                          key.env === 'STAGING' && "bg-yellow-100 text-yellow-800",
                          key.env === 'DEV' && "bg-blue-100 text-blue-800"
                        )}>
                          {key.env}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{key.scopes?.join(', ') || '-'}</td>
                      <td className="px-4 py-3">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</td>
                      <td className="px-4 py-3">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setRotateTarget(key)} className="p-2 hover:bg-muted rounded text-xs" title="Rotate">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRevokeTarget(key)} className="p-2 hover:bg-muted rounded text-red-600" title="Revoke">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {revokedKeys.length > 0 && (
            <div className="border rounded-lg overflow-hidden opacity-60">
              <div className="px-4 py-3 bg-muted/40 font-medium text-sm">Revoked Keys</div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Prefix</th>
                    <th className="text-left px-4 py-3 font-medium">Env</th>
                    <th className="text-left px-4 py-3 font-medium">Scopes</th>
                    <th className="text-left px-4 py-3 font-medium">Created</th>
                    <th className="text-left px-4 py-3 font-medium">Revoked</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {revokedKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">{key.name}</td>
                      <td className="px-4 py-3"><code className="text-xs bg-muted px-1 py-0.5 rounded">{key.keyPrefix}...</code></td>
                      <td className="px-4 py-3">{key.env}</td>
                      <td className="px-4 py-3 text-xs">{key.scopes?.join(', ') || '-'}</td>
                      <td className="px-4 py-3">{new Date(key.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{key.revokedAt ? new Date(key.revokedAt).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-red-700">
                          <XCircle className="w-3 h-3" /> Revoked
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && keys?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No API keys found. Create one to get started.</div>
          )}
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-medium">Revoke API Key</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to revoke <strong>{revokeTarget.name}</strong> ({revokeTarget.keyPrefix}...)? 
              This action cannot be undone. Any applications using this key will immediately lose access.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRevokeTarget(null)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
              <button onClick={handleRevoke} disabled={revokeMutation.isPending} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50">
                {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rotateTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-medium">Rotate API Key</h3>
            <p className="text-sm text-muted-foreground">
              Rotate <strong>{rotateTarget.name}</strong> ({rotateTarget.keyPrefix}...)? A new key will be created and the old key will remain valid for 24 hours.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRotateTarget(null)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
              <button onClick={handleRotate} disabled={rotateMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
                {rotateMutation.isPending ? 'Rotating...' : 'Rotate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
