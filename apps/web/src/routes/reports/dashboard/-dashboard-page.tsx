import { useQuery } from '@tanstack/react-query';
import { Button } from '@danta/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { apiGet } from '../../../lib/api/request';
import type { DashboardKpi } from '@danta/schemas';
import { useAuth } from '../../../lib/auth-context';
import { formatCurrency } from '../../../lib/format';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'dashboard', user?.tenantId, user?.id, user?.locationId],
    queryFn: async () => {
      const response = await apiGet<DashboardKpi>('/reports/dashboard');
      return response;
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reports Dashboard</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load reports dashboard</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reports Dashboard</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.todayAppointments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(data.todayRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(data.outstandingBalance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Recalls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.activeRecalls}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">No reports data available</p>
      )}
    </div>
  );
}
