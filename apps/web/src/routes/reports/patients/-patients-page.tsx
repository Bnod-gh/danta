import { useQuery } from '@tanstack/react-query';
import { Button } from '@danta/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { apiGet } from '../../../lib/api/request';
import type { PatientAnalytics } from '@danta/schemas';

export function PatientsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'patients'],
    queryFn: async () => {
      const response = await apiGet<PatientAnalytics>('/reports/patients');
      return response;
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Patients Report</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load patients report</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Patients Report</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.totalPatients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.activePatients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.newPatientsThisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(data.retention.retentionRate * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">No patients data available</p>
      )}
    </div>
  );
}
