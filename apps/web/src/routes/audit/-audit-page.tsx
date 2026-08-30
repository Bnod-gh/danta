import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { apiGet } from '../../lib/api/request';
import { toast } from 'sonner';

type AuditLog = {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string | null;
  userId: string;
  details: string | null;
};

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'auth', label: 'Authentication' },
  { value: 'authorization', label: 'Authorization' },
  { value: 'patient', label: 'Patient' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'billing', label: 'Billing' },
];

export function AuditPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit', search, action, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (action) params.set('action', action);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await apiGet<{ logs: AuditLog[] }>(`/audit/search?${params.toString()}`);
      return response;
    },
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      await apiGet<Blob>(`/audit/export?${params.toString()}`);
      toast.success('Audit log exported');
    } catch {
      toast.error('Failed to export audit log');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">System activity logs</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load audit logs</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System activity logs</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
        >
          {ACTION_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                </TableRow>
              ))
            ) : data?.logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              data?.logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString('en-AU')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.userEmail || log.userId}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {log.details || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
