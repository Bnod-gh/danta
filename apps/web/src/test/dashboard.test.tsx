import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DashboardIndex } from '../routes/dashboard/-dashboard-index';

afterEach(cleanup);

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const scope = queryKey[0];
    if (scope === 'chairs') {
      return {
        data: [
          { id: 'c1', name: 'Chair 1', description: 'Hygiene & Prophy', isActive: true, currentAppointment: null, nextAppointment: null },
          {
            id: 'c2',
            name: 'Chair 2',
            description: 'General Restorative',
            isActive: true,
            currentAppointment: {
              appointmentId: 'a1',
              patientId: 'p1',
              patientName: 'Emily Watson',
              patientNumber: 'PAT-0001',
              providerName: 'Sarah Jenkins',
              procedureName: 'Crown Preparation',
              procedureCode: 'D2740',
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              status: 'in_progress',
              scheduledPrice: 1250,
            },
            nextAppointment: null,
          },
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    if (scope === 'appointments') {
      return {
        data: {
          date: '2026-08-22',
          appointments: [
            {
              id: 'a1',
              startTime: new Date('2026-08-22T02:00:00Z').toISOString(),
              endTime: new Date('2026-08-22T02:45:00Z').toISOString(),
              status: 'in_progress',
              scheduledPrice: 1250,
              patient: { id: 'p1', firstName: 'Emily', lastName: 'Watson', patientNumber: 'PAT-0001' },
              provider: { id: 'pr1', firstName: 'Sarah', lastName: 'Jenkins' },
              chair: { id: 'c2', name: 'Chair 2' },
              appointmentType: { id: 't2', name: 'Crown Preparation', code: 'D2740' },
            },
          ],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    return {
      data: {
        todayAppointments: 3,
        todayPatients: 1,
        todayRevenue: 1250,
        yesterdayRevenue: 1000,
        revenueTrendPct: 25,
        outstandingBalance: 500,
        activeRecalls: 2,
        noShowsToday: 0,
        averageDuration: 30,
        confirmedAppointments: 1,
        inProgressAppointments: 1,
        totalChairs: 4,
        chairsActive: 2,
        utilizationRate: 50,
        productionToday: 1515,
        productionTarget: 4500,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

vi.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', tenantId: 'tenant-1', locationId: 'location-1', firstName: 'Alex', lastName: 'Reed', role: 'dentist' },
    practice: { id: 'practice-1', name: 'Acme Dental' },
    location: { id: 'location-1', name: 'North Adelaide', timezone: 'Australia/Adelaide' },
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

describe('DashboardIndex', () => {
  it('renders the greeting hero with production target progress', () => {
    render(<DashboardIndex />);

    expect(screen.getByText(/Good (Morning|Afternoon|Evening), Alex Reed/)).toBeDefined();
    expect(screen.getByText('Production Today')).toBeDefined();
    expect(screen.getByText('$1,515.00')).toBeDefined();
    expect(screen.getByText(/34% of \$4,500\.00 daily target/)).toBeDefined();
  });

  it('renders live operatory chair statuses', () => {
    render(<DashboardIndex />);

    expect(screen.getByText('Operatory Live Status')).toBeDefined();
    expect(screen.getByText('Emily Watson · Crown Preparation')).toBeDefined();
    expect(screen.getByText('Chair 2')).toBeDefined();
    expect(screen.getAllByText('In Chair').length).toBe(2);
    expect(screen.getByText('Available')).toBeDefined();
  });

  it("renders today's schedule with CDT codes and prices", () => {
    render(<DashboardIndex />);

    expect(screen.getByText("Today's Patient Schedule")).toBeDefined();
    expect(screen.getByText('Crown Preparation')).toBeDefined();
    expect(screen.getByText('D2740')).toBeDefined();
    expect(screen.getAllByText('$1,250.00').length).toBeGreaterThan(0);
  });
});
