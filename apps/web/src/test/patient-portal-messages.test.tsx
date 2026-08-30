import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientPortalMessages } from '../routes/patient-portal/messages/-patient-portal-messages';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      { id: '1', channel: 'email', status: 'sent', subject: 'Hello', body: 'Test message', sentAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('PatientPortalMessages', () => {
  it('renders messages list', () => {
    render(<PatientPortalMessages />);
    expect(screen.getByText('My Messages')).toBeDefined();
    expect(screen.getByText('Hello')).toBeDefined();
  });
});
