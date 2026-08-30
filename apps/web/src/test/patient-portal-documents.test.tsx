import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalDocuments } from '../routes/patient-portal/documents/-patient-portal-documents';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', name: 'Test Doc', mimeType: 'application/pdf', size: 1024, createdAt: new Date().toISOString() },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalDocuments', () => {
  it('renders documents list', () => {
    render(<PatientPortalDocuments />);
    expect(screen.getByText('My Documents')).toBeDefined();
    expect(screen.getByText('Test Doc')).toBeDefined();
  });
});
