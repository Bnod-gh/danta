import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalTreatmentPlans } from '../routes/patient-portal/treatment-plans/-patient-portal-treatment-plans';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', name: 'Root Canal', status: 'proposed', notes: 'Needs approval', approvedAt: null, createdAt: new Date().toISOString(), provider: { firstName: 'Jane', lastName: 'Smith' } },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalTreatmentPlans', () => {
  it('renders treatment plans list', () => {
    render(<PatientPortalTreatmentPlans />);
    expect(screen.getByText('My Treatment Plans')).toBeDefined();
    expect(screen.getByText('Root Canal')).toBeDefined();
  });
});
