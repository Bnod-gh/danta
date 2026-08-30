import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalNotifications } from '../routes/patient-portal/notifications/-patient-portal-notifications';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', type: 'appointment', title: 'Reminder', message: 'You have an appointment', read: false, createdAt: new Date().toISOString() },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalNotifications', () => {
  it('renders notifications list', () => {
    render(<PatientPortalNotifications />);
    expect(screen.getByText('My Notifications')).toBeDefined();
    expect(screen.getByText('Reminder')).toBeDefined();
  });
});
