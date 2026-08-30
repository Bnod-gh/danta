import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalForms } from '../routes/patient-portal/forms/-patient-portal-forms';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', type: 'intake', status: 'pending', submittedAt: null, createdAt: new Date().toISOString() },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalForms', () => {
  it('renders forms list', () => {
    render(<PatientPortalForms />);
    expect(screen.getByText('My Forms')).toBeDefined();
    expect(screen.getByText('intake')).toBeDefined();
  });
});
