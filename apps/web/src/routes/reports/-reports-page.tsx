import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { Input } from '@danta/ui/input';
import { apiGet } from '../../lib/api/request';
import { toast } from 'sonner';
import type { DashboardKpi, RevenueReport, AppointmentAnalytics, PatientAnalytics } from '@danta/schemas';
import { cn } from '@danta/ui/utils';
import { formatCurrency } from '../../lib/format';
import { useAuth } from '../../lib/auth-context';

type ReportTab = 'overview' | 'revenue' | 'appointments' | 'patients';

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'patients', label: 'Patients' },
];

export function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'appointments' | 'patients'>('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['reports', 'dashboard', user?.tenantId, user?.id, user?.locationId],
    queryFn: async () => {
      const response = await apiGet<DashboardKpi>('/reports/dashboard');
      return response;
    },
    enabled: activeTab === 'overview',
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['reports', 'revenue', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await apiGet<RevenueReport>(`/reports/revenue?${params.toString()}`);
      return response;
    },
    enabled: activeTab === 'revenue',
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['reports', 'appointments', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await apiGet<AppointmentAnalytics>(`/reports/appointments?${params.toString()}`);
      return response;
    },
    enabled: activeTab === 'appointments',
  });

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['reports', 'patients', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await apiGet<PatientAnalytics>(`/reports/patients?${params.toString()}`);
      return response;
    },
    enabled: activeTab === 'patients',
  });

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const blob = await apiGet<Blob>(`/reports/export?${params.toString()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="report-start-date" className="sr-only">Start date</label>
            <Input
              id="report-start-date"
              name="startDate"
              aria-label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">to</span>
            <label htmlFor="report-end-date" className="sr-only">End date</label>
            <Input
              id="report-end-date"
              name="endDate"
              aria-label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download aria-hidden="true" className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="border-b">
        <div className="flex gap-4" role="tablist" aria-label="Report views">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`report-panel-${tab.key}`}
              tabIndex={activeTab === tab.key ? 0 : -1}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                event.preventDefault();
                const currentIndex = TABS.findIndex((item) => item.key === tab.key);
                const offset = event.key === 'ArrowRight' ? 1 : -1;
                const next = TABS[(currentIndex + offset + TABS.length) % TABS.length];
                setActiveTab(next.key);
                requestAnimationFrame(() => document.getElementById(`report-tab-${next.key}`)?.focus());
              }}
              id={`report-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div id="report-panel-overview" role="tabpanel" aria-labelledby="report-tab-overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <p className="text-2xl font-semibold">{dashboard?.todayAppointments ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                    <p className="text-2xl font-semibold">{formatCurrency(dashboard?.todayRevenue ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-2xl font-semibold">{formatCurrency(dashboard?.outstandingBalance ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Active Recalls</p>
                  <p className="text-2xl font-semibold">{dashboard?.activeRecalls ?? 0}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <Card id="report-panel-revenue" role="tabpanel" aria-labelledby="report-tab-revenue">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : revenue ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-semibold">{formatCurrency(revenue.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                    <p className="text-xl font-semibold">{revenue.totalInvoices}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-xl font-semibold">{formatCurrency(revenue.outstandingBalance)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No revenue data available</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'appointments' && (
        <Card id="report-panel-appointments" role="tabpanel" aria-labelledby="report-tab-appointments">
          <CardHeader>
            <CardTitle>Appointment Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : appointments ? (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{appointments.totalAppointments}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-semibold">{appointments.completed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No-Shows</p>
                  <p className="text-xl font-semibold">{appointments.noShows}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-xl font-semibold">{appointments.completionRate.toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No appointment data available</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'patients' && (
        <Card id="report-panel-patients" role="tabpanel" aria-labelledby="report-tab-patients">
          <CardHeader>
            <CardTitle>Patient Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : patients ? (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-xl font-semibold">{patients.totalPatients}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-xl font-semibold">{patients.activePatients}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-xl font-semibold">{patients.newPatientsThisMonth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retention Rate</p>
                  <p className="text-xl font-semibold">{patients.retention.retentionRate.toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No patient data available</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
