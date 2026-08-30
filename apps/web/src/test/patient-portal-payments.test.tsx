import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalPayments } from '../routes/patient-portal/payments/-patient-portal-payments';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', method: 'eftpos', amount: 50, currency: 'AUD', status: 'completed', reference: 'REF-001', receivedAt: new Date().toISOString() },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalPayments', () => {
  it('renders payments list', () => {
    render(<PatientPortalPayments />);
    expect(screen.getByText('My Payments')).toBeDefined();
    expect(screen.getByText('REF-001')).toBeDefined();
  });
});
