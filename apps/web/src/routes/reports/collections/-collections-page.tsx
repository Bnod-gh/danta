import { useQuery } from '@tanstack/react-query';
import { Button } from '@danta/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { apiGet } from '../../../lib/api/request';
import type { CollectionsReport } from '@danta/schemas';

export function CollectionsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'collections'],
    queryFn: async () => {
      const response = await apiGet<CollectionsReport>('/reports/collections');
      return response;
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Collections Report</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load collections report</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Collections Report</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${data.totalBilled.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${data.totalCollected.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${data.totalOutstanding.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(data.collectionRate * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">No collections data available</p>
      )}
    </div>
  );
}
