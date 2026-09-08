import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { Badge } from '@danta/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { getClinicalTimeline, type ClinicalTimelineEventVM } from '../../lib/api/patient-clinical';

const FILTERS: Array<{ key: string; label: string; types?: string[] }> = [
  { key: 'all', label: 'All' },
  { key: 'clinical', label: 'Clinical', types: ['finding', 'clinical_note', 'treatment_completed'] },
  { key: 'appointments', label: 'Appointments', types: ['appointment', 'appointment_status'] },
  { key: 'planning', label: 'Plans & estimates', types: ['treatment_plan', 'estimate', 'estimate_approval'] },
  { key: 'billing', label: 'Billing', types: ['invoice', 'payment', 'refund'] },
  { key: 'communication', label: 'Comms & docs', types: ['communication', 'recall', 'document'] },
];

const TYPE_BADGE: Record<string, string> = {
  appointment: 'scheduled',
  appointment_status: 'destructive',
  clinical_note: 'secondary',
  finding: 'outline',
  treatment_completed: 'default',
  treatment_plan: 'secondary',
  estimate: 'outline',
  estimate_approval: 'default',
  invoice: 'outline',
  payment: 'default',
  refund: 'destructive',
  recall: 'outline',
  communication: 'secondary',
  document: 'secondary',
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function PatientTimelinePanel({ patientId }: { patientId: string }) {
  const [filterKey, setFilterKey] = useState('all');
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];

  const { data, isLoading } = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: () => getClinicalTimeline(patientId, { take: 100 }),
    enabled: Boolean(patientId),
  });

  const events = useMemo<ClinicalTimelineEventVM[]>(() => {
    const list = data?.events ?? [];
    if (!filter.types) return list;
    return list.filter((event: ClinicalTimelineEventVM) => filter.types?.includes(event.type));
  }, [data, filter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Clinical timeline</CardTitle>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter timeline events">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilterKey(option.key)}
              aria-pressed={filterKey === option.key}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                filterKey === option.key ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded yet for this view.</p>
        ) : (
          <ol className="relative space-y-4 border-l pl-5">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span aria-hidden className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-border" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={(TYPE_BADGE[event.type] ?? 'outline') as never}>{event.type.replaceAll('_', ' ')}</Badge>
                  <span className="text-xs text-muted-foreground">{formatEventDate(event.occurredAt)}</span>
                </div>
                <p className="mt-0.5 text-sm">{event.title}</p>
                {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
