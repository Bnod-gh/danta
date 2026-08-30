import { useQuery } from '@tanstack/react-query';
import { Button } from '@danta/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { apiGet } from '../../../lib/api/request';
import type { PractitionerAnalytics } from '@danta/schemas';

export function PractitionersPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'practitioners'],
    queryFn: async () => {
      const response = await apiGet<PractitionerAnalytics>('/reports/practitioners');
      return response;
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Practitioner Report</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load practitioner report</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Practitioner Report</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.providers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {data.providers.reduce((sum, p) => sum + p.appointments, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {data.providers.reduce((sum, p) => sum + p.completed, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${data.providers.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">No practitioner data available</p>
      )}
    </div>
  );
}
