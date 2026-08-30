import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowDownRight, ArrowUpRight, CalendarCheck2, Clock3, DollarSign, PhoneOff, ReceiptText, Target, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Button } from '@danta/ui/button';
import { Badge, badgeVariants } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import { cn } from '@danta/ui/utils';
import { apiGet } from '../../lib/api/request';
import { getLiveChairs } from '../../lib/api/chairs';
import { useAuth } from '../../lib/auth-context';
import { Link } from '@tanstack/react-router';
import type { ChairLiveStatus, DashboardKpi } from '@danta/schemas';
import type { RevenueReport } from '@danta/schemas';
import { formatCurrency } from '../../lib/format';
import { tenantPath } from '../../lib/tenant-routing';

type DayViewAppointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  scheduledPrice?: number | null;
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  provider: { id: string; firstName: string; lastName: string };
  chair: { id: string; name: string };
  appointmentType: { id: string; name: string; code?: string | null };
};

type DayViewResponse = { date: string; appointments: DayViewAppointment[] };

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-secondary text-secondary-foreground' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  checked_in: { label: 'Checked In', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  in_progress: { label: 'In Chair', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
  no_show: { label: 'No Show', className: 'bg-destructive/10 text-destructive' },
};

function TrendPct({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        up ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? '+' : ''}{value}% vs yesterday
    </span>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/** Compact 14-day revenue bars — hand-rolled SVG (no chart dependency). */
function MiniBars({
  data,
  formatValue,
}: {
  data: Array<{ date: string; value: number }>;
  formatValue: (value: number) => string;
}) {
  const height = 56;
  const width = 220;
  const gap = 4;
  const max = Math.max(...data.map((entry) => entry.value), 1);
  const barWidth = data.length > 0 ? (width - gap * (data.length - 1)) / data.length : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-14 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Revenue trend for the last ${data.length} days. Highest day ${formatValue(max)}.`}
    >
      {data.map((entry, index) => {
        const barHeight = Math.max(2, (entry.value / max) * (height - 8));
        const isLatest = index === data.length - 1;
        return (
          <g key={entry.date}>
            <title>{`${new Date(entry.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}: ${formatValue(entry.value)}`}</title>
            <rect
              x={index * (barWidth + gap)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx={2}
              className={isLatest ? 'fill-primary' : 'fill-primary/25'}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Donut ring for utilization percentage. */
function UtilizationRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" role="img" aria-label={`Chair utilization ${clamped}%`}>
        <circle cx={32} cy={32} r={radius} className="fill-none stroke-muted" strokeWidth={7} />
        <circle
          cx={32}
          cy={32}
          r={radius}
          className={cn('fill-none transition-all', clamped >= 80 ? 'stroke-emerald-500' : clamped >= 50 ? 'stroke-amber-500' : 'stroke-red-400')}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">{Math.round(clamped)}%</span>
    </div>
  );
}

export function DashboardIndex() {
  const { user } = useAuth();

  const kpiQuery = useQuery({
    queryKey: ['dashboard', user?.tenantId, user?.id, user?.locationId],
    queryFn: () => apiGet<DashboardKpi>('/reports/dashboard'),
  });

  const chairsQuery = useQuery({
    queryKey: ['chairs', 'live', user?.locationId],
    queryFn: getLiveChairs,
    refetchInterval: 30_000,
  });

  const scheduleQuery = useQuery({
    queryKey: ['appointments', 'day', user?.locationId],
    queryFn: () => {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return apiGet<DayViewResponse>('/appointments/schedule/day', { date });
    },
    refetchInterval: 60_000,
  });

  const revenueQuery = useQuery({
    queryKey: ['reports', 'revenue', '14d'],
    queryFn: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 13);
      const iso = (date: Date) => date.toISOString();
      return apiGet<RevenueReport>('/reports/revenue', { startDate: iso(start), endDate: iso(end) });
    },
  });

  const data = kpiQuery.data;
  const targetPct =
    data?.productionTarget && data.productionTarget > 0
      ? Math.min(100, Math.round((data.productionToday / data.productionTarget) * 100))
      : null;

  const dailySeries = (revenueQuery.data?.daily ?? []).map((entry) => ({ date: entry.date, value: entry.revenue }));
  const revenueTotal = revenueQuery.data?.totalRevenue ?? 0;

  return (
    <div className="space-y-6">
      {/* Header band */}
      <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Danta Practice Management Engine</p>
        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greetingForHour(new Date().getHours())}, {user?.firstName} {user?.lastName}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to={tenantPath(user?.tenantId, '/appointments')}>Book Appointment</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={tenantPath(user?.tenantId, '/patients')}>New Patient</Link>
            </Button>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          You have{' '}
          <span className="font-semibold text-foreground">{data?.todayAppointments ?? '—'} appointments</span> scheduled across{' '}
          <span className="font-semibold text-foreground">{data?.chairsActive ?? '—'} active operatories</span> today
          {data && data.noShowsToday === 0 ? ' — no-show free so far.' : '.'}
        </p>

        {data && (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric icon={Users} label="Patients today" value={String(data.todayPatients)} />
            <HeroMetric icon={Clock3} label="Avg appointment" value={`${data.averageDuration} min`} />
            <HeroMetric icon={PhoneOff} label="Recalls pending" value={String(data.activeRecalls)} href="/recalls" />
            <HeroMetric icon={ReceiptText} label="Outstanding" value={formatCurrency(data.outstandingBalance)} href="/invoices" />
          </dl>
        )}
        {!data && kpiQuery.isLoading && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        )}
      </section>

      {kpiQuery.error && (
        <Card className="border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-destructive" role="alert">Failed to load dashboard data. Please try again.</p>
              <Button variant="outline" size="sm" onClick={() => kpiQuery.refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiQuery.isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Production Today</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                    <Target aria-hidden="true" className="h-[18px] w-[18px] text-violet-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold tabular-nums">{formatCurrency(data.productionToday)}</p>
                {targetPct != null && data.productionTarget != null ? (
                  <div className="space-y-1.5">
                    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={targetPct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${targetPct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{targetPct}% of {formatCurrency(data.productionTarget)} daily target</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No daily target configured</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Collections Today</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                    <DollarSign aria-hidden="true" className="h-[18px] w-[18px] text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold tabular-nums">{formatCurrency(data.todayRevenue)}</p>
                {dailySeries.length > 1 ? (
                  <>
                    <TrendPct value={data.revenueTrendPct} />
                    <MiniBars data={dailySeries.slice(-7)} formatValue={formatCurrency} />
                  </>
                ) : (
                  <div className="pt-1"><TrendPct value={data.revenueTrendPct} /></div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Chair Utilization</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950">
                    <Users aria-hidden="true" className="h-[18px] w-[18px] text-sky-600" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UtilizationRing value={data.utilizationRate} />
                  <div className="min-w-0 space-y-1">
                    <span className={cn(badgeVariants(), data.utilizationRate >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : data.utilizationRate >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-muted text-muted-foreground')}>
                      {data.utilizationRate >= 80 ? 'Optimal' : data.utilizationRate >= 50 ? 'Moderate' : 'Low'}
                    </span>
                    <p className="text-xs text-muted-foreground">{data.chairsActive}/{data.totalChairs} chairs booked today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Confirmed Appointments</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                    <CalendarCheck2 aria-hidden="true" className="h-[18px] w-[18px] text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold tabular-nums">{data.confirmedAppointments}</p>
                  <Badge variant="secondary">{data.inProgressAppointments} in chair</Badge>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
                  {data.noShowsToday} no-show{data.noShowsToday === 1 ? '' : 's'} recorded today
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Revenue + live chairs */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-baseline justify-between text-base">
              <span>Revenue — last 14 days</span>
              <span className="text-lg font-semibold tabular-nums">{revenueQuery.data ? formatCurrency(revenueTotal) : ''}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueQuery.isLoading && <Skeleton className="h-36 w-full" />}
            {revenueQuery.error && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Revenue analytics are unavailable for your role.
              </p>
            )}
            {revenueQuery.data && dailySeries.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No payments recorded in this period.</p>
            )}
            {revenueQuery.data && dailySeries.length > 0 && (
              <>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <MiniBars data={dailySeries} formatValue={formatCurrency} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>{revenueQuery.data.totalPayments} payment{revenueQuery.data.totalPayments === 1 ? '' : 's'}</span>
                  <span>{revenueQuery.data.totalInvoices} invoice{revenueQuery.data.totalInvoices === 1 ? '' : 's'} issued</span>
                  <span>{formatCurrency(revenueQuery.data.outstandingBalance)} outstanding</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              Operatory Live Status
              <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                Live · 30s
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {chairsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : (chairsQuery.data?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No operatories configured yet.</p>
            ) : (
              chairsQuery.data!.map((chair) => <ChairRow key={chair.id} chair={chair} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            Today&apos;s Patient Schedule
            <Button asChild variant="ghost" size="sm">
              <Link to={tenantPath(user?.tenantId, '/schedule')}>Open schedule →</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (scheduleQuery.data?.appointments.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No appointments scheduled for today.</p>
          ) : (
            <ul className="divide-y">
              {scheduleQuery.data!.appointments.map((appointment) => {
                const badge = STATUS_BADGES[appointment.status] ?? STATUS_BADGES.scheduled;
                const time = new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <li key={appointment.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 transition-colors hover:bg-muted/40">
                    <span className="w-14 shrink-0 rounded-md bg-muted px-2 py-1 text-center font-mono text-xs font-semibold tabular-nums">{time}</span>
                    <div className="min-w-[140px] flex-1">
                      <Link
                        to={tenantPath(user?.tenantId, `/patients/${appointment.patient.id}`)}
                        className="text-sm font-medium hover:underline"
                      >
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">#{appointment.patient.patientNumber}</p>
                    </div>
                    <div className="min-w-[150px] flex-1">
                      <p className="truncate text-sm">{appointment.appointmentType.name}</p>
                      {appointment.appointmentType.code && (
                        <p className="font-mono text-xs text-muted-foreground">{appointment.appointmentType.code}</p>
                      )}
                    </div>
                    <span className="hidden w-32 truncate text-xs text-muted-foreground md:block">
                      Dr {appointment.provider.firstName} {appointment.provider.lastName}
                    </span>
                    <span className="w-20 text-right text-sm font-medium tabular-nums">
                      {appointment.scheduledPrice != null ? formatCurrency(Number(appointment.scheduledPrice)) : '—'}
                    </span>
                    <span className={cn('ml-auto shrink-0', badge.className, 'rounded-full px-2.5 py-0.5 text-xs font-medium')}>
                      {badge.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="ml-auto text-sm font-semibold tabular-nums">{value}</dd>
    </>
  );
  const base = 'flex items-center gap-2 rounded-lg border bg-background/70 px-3 py-2';
  return href ? (
    <Link to={tenantPath(undefined, href)} className={cn(base, 'transition-colors hover:bg-accent hover:text-accent-foreground')}>{content}</Link>
  ) : (
    <div className={base}>{content}</div>
  );
}

function ChairRow({ chair }: { chair: ChairLiveStatus }) {
  const current = chair.currentAppointment;
  const statusLabel = !chair.isActive ? 'Inactive' : current ? 'In Chair' : chair.nextAppointment ? 'Reserved' : 'Available';
  const statusClass = !chair.isActive
    ? 'bg-muted text-muted-foreground'
    : current
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : chair.nextAppointment
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
        : 'bg-secondary text-secondary-foreground';

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
        {chair.name.replace(/[^0-9]/g, '') || chair.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{chair.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {current
            ? `${current.patientName} · ${current.procedureName}`
            : chair.nextAppointment
              ? `Next ${new Date(chair.nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${chair.nextAppointment.patientName}`
              : chair.description ?? 'No bookings remaining today'}
        </p>
      </div>
      <span className={cn(statusClass, 'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium')}>{statusLabel}</span>
    </div>
  );
}
