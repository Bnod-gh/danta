import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Shield, Monitor, Key, FileText, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@danta/ui';
import { Card, CardContent } from '@danta/ui';
import { Skeleton } from '@danta/ui';
import { ErrorState } from '@danta/ui';
import { EmptyState } from '@danta/ui';
import { Badge } from '@danta/ui';
import { cn } from '@danta/ui';
import { Table, TableHeader, TableBody } from '@danta/ui';
import { apiGet, apiDelete } from '../../../lib/api/request';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';

type ActiveSession = {
  id: string;
  device: string;
  ipAddress: string | null;
  lastActiveAt: string | null;
  createdAt: string | null;
};

type AuditLogRecord = {
  id: string;
  action: string;
  resourceType: string | null;
  result: string;
  createdAt: string;
};

export function SecuritySettingsPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'api-keys' | 'audit'>('sessions');

  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions, error: sessionsError } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const sessions = await apiGet<Array<{ id: string; userAgent: string | null; ipAddress: string | null; createdAt: string; expiresAt: string }>>('/sessions');
      return {
        sessions: sessions.map((session) => ({
          id: session.id,
          device: session.userAgent ?? 'Unknown device',
          ipAddress: session.ipAddress,
          lastActiveAt: session.createdAt,
          createdAt: session.createdAt,
        })),
      };
    },
  });

  const { data: auditLogs, isLoading: auditLoading, error: auditError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => apiGet<{ data: AuditLogRecord[] }>('/audit'),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (id: string) => apiDelete(`/sessions/${id}`),
    onSuccess: () => {
      refetchSessions();
      toast.success('Session revoked');
    },
    onError: () => toast.error('Failed to revoke session'),
  });

  const sessions = sessionsData?.sessions ?? [];

  const sessionColumns: ColumnDef<ActiveSession>[] = [
    {
      accessorKey: 'device',
      header: 'Device',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span>{row.original.device || 'Unknown device'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => row.original.ipAddress || 'N/A',
    },
    {
      accessorKey: 'lastActiveAt',
      header: 'Last Active',
      cell: ({ row }) => (row.original.lastActiveAt ? new Date(row.original.lastActiveAt).toLocaleString() : 'N/A'),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : 'N/A'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => revokeSessionMutation.mutate(row.original.id)}
          disabled={revokeSessionMutation.isPending}
          title="Revoke session"
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const auditColumns: ColumnDef<AuditLogRecord>[] = [
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.action}</span>,
    },
    {
      accessorKey: 'resourceType',
      header: 'Resource',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.resourceType || 'system'}</span>
      ),
    },
    {
      accessorKey: 'result',
      header: 'Result',
      cell: ({ row }) => (
        <Badge variant={row.original.result === 'success' ? 'success' : 'destructive'} className="font-normal">
          {row.original.result}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'At',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ];

  const sessionsTable = useReactTable({
    data: sessions,
    columns: sessionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const auditTable = useReactTable({
    data: auditLogs?.data ?? [],
    columns: auditColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground">Manage sessions, API keys, and audit trail</p>
      </div>

      <div className="border-b">
        <div className="flex gap-4">
          {[
            { id: 'sessions', label: 'Active Sessions', icon: Monitor },
            { id: 'api-keys', label: 'API Keys', icon: Key },
            { id: 'audit', label: 'Audit Log', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors rounded-none',
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium">Active Sessions</h2>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchSessions()}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {sessionsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : sessionsError ? (
            <ErrorState
              title="Unable to load sessions"
              message="Please try again later."
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                {(sessionsTable.getRowModel().rows?.length ?? 0) === 0 ? (
                  <EmptyState
                    title="No active sessions"
                    description="All sessions will appear here."
                    icon={<Monitor className="w-8 h-8" />}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      {sessionsTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="text-left px-4 py-3 font-medium">
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {sessionsTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-muted/20">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">API Keys</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">API key management is available through the dedicated API keys page.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">Audit Log</h2>
          </div>
          {auditLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : auditError ? (
            <ErrorState
              title="Unable to load audit logs"
              message="Please try again later."
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                {(auditTable.getRowModel().rows?.length ?? 0) === 0 ? (
                  <EmptyState
                    title="No audit entries yet"
                    description="Audit log entries will appear here."
                    icon={<FileText className="w-8 h-8" />}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      {auditTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="text-left px-4 py-3 font-medium">
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {auditTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-muted/20">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
