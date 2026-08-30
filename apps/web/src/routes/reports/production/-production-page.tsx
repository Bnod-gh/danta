import { useQuery } from '@tanstack/react-query';
import { Button } from '@danta/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { apiGet } from '../../../lib/api/request';
import type { ProductionReport } from '@danta/schemas';

export function ProductionPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'production'],
    queryFn: async () => {
      const response = await apiGet<ProductionReport>('/reports/production');
      return response;
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Production Report</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load production report</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Production Report</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Production</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${data.totalProduction.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Treatments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.totalTreatments}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">No production data available</p>
      )}
    </div>
  );
}
