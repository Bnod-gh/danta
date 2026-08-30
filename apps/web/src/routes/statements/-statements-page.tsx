import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Search, Send } from 'lucide-react';
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
import { apiGet, apiPost } from '../../lib/api/request';
import { toast } from 'sonner';

type Statement = {
  id: string;
  statementNumber: string;
  patientId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  sentAt: string | null;
};

export function StatementsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['statements', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await apiGet<{ statements: Statement[] }>(`/statements?${params.toString()}`);
      return response;
    },
  });

  const handleSend = async (id: string) => {
    try {
      await apiPost(`/statements/${id}/send`, {});
      toast.success('Statement sent');
    } catch {
      toast.error('Failed to send statement');
    }
  };

  const handleGenerate = async () => {
    try {
      await apiPost('/statements/generate', {});
      toast.success('Statement generated');
      refetch();
    } catch {
      toast.error('Failed to generate statement');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Statements</h1>
            <p className="text-muted-foreground">Manage statements</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load statements</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Statements</h1>
          <p className="text-muted-foreground">Manage statements</p>
        </div>
        <Button onClick={handleGenerate}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Statement
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search statements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Statement #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.statements?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No statements found
                </TableCell>
              </TableRow>
            ) : (
              data?.statements?.map((statement) => (
                <TableRow key={statement.id}>
                  <TableCell className="font-medium">{statement.statementNumber}</TableCell>
                  <TableCell className="text-muted-foreground">Patient {statement.patientId.slice(0, 8)}...</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(statement.periodStart).toLocaleDateString('en-AU')} - {new Date(statement.periodEnd).toLocaleDateString('en-AU')}
                  </TableCell>
                  <TableCell>${statement.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statement.sentAt ? 'default' : 'secondary'}>
                      {statement.sentAt ? 'Sent' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!statement.sentAt && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSend(statement.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
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
