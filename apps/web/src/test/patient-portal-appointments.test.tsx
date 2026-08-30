import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalAppointments } from '../routes/patient-portal/appointments/-patient-portal-appointments';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), status: 'confirmed', notes: null, provider: { firstName: 'John', lastName: 'Doe' }, appointmentType: { name: 'Checkup', duration: 30 }, chair: { name: 'Chair 1' } },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalAppointments', () => {
  it('renders appointments list', () => {
    render(<PatientPortalAppointments />);
    expect(screen.getByText('My Appointments')).toBeDefined();
    expect(screen.getByText('Checkup')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('30 min')).toBeDefined();
  });
});
