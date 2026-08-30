import { useQuery } from '@tanstack/react-query';
import { Button } from '@danta/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { apiGet } from '../../../lib/api/request';
import type { RecallAnalytics } from '@danta/schemas';

export function RecallsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'recalls'],
    queryFn: async () => {
      const response = await apiGet<RecallAnalytics>('/reports/recalls');
      return response;
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Recalls Report</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load recalls report</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Recalls Report</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Recalls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.totalRecalls}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Due</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.due}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.overdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(data.completionRate * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">No recalls data available</p>
      )}
    </div>
  );
}
