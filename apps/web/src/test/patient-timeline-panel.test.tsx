import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { PatientTimelinePanel } from '../components/patients/PatientTimelinePanel';

afterEach(cleanup);

const queryState: Record<string, unknown> = {};

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => ({
    data: queryKey[0] === 'patient-timeline' ? queryState.data : undefined,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../lib/api/patient-clinical', () => ({
  getClinicalTimeline: vi.fn(),
}));

describe('PatientTimelinePanel', () => {
  it('renders timeline events with type badges', () => {
    queryState.data = {
      events: [
        { id: 'a', type: 'invoice', occurredAt: '2026-08-20T09:00:00Z', title: 'Invoice INV-000001' },
        { id: 'b', type: 'finding', occurredAt: '2026-08-24T09:00:00Z', title: 'Tooth 16 — Caries (planned)' },
      ],
      total: 2,
    };

    render(<PatientTimelinePanel patientId="p1" />);

    expect(screen.getByText('Tooth 16 — Caries (planned)').textContent).toBeTruthy();
    expect(screen.getByText('Invoice INV-000001').textContent).toBeTruthy();
  });

  it('filters events via group chips and shows an empty state', async () => {
    queryState.data = {
      events: [{ id: 'a', type: 'invoice', occurredAt: '2026-08-20T09:00:00Z', title: 'Invoice INV-000001' }],
      total: 1,
    };

    render(<PatientTimelinePanel patientId="p1" />);

    expect(screen.getByText('Invoice INV-000001')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Clinical' }));

    expect(await screen.findByText('No activity recorded yet for this view.')).toBeTruthy();
    expect(screen.queryByText('Invoice INV-000001')).toBeNull();
  });
});
