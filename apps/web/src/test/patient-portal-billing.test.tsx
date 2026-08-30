import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalBilling } from '../routes/patient-portal/billing/-patient-portal-billing';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', invoiceNumber: 'INV-001', status: 'issued', total: 100, balance: 50, issueDate: new Date().toISOString(), dueDate: new Date().toISOString(), items: [] },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalBilling', () => {
  it('renders billing list', () => {
    render(<PatientPortalBilling />);
    expect(screen.getByText('My Billing')).toBeDefined();
    expect(screen.getByText('INV-001')).toBeDefined();
  });
});
