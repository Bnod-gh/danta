import { describe, expect, it } from 'vitest';
import { findCompatibleEntries, type FreeSlot } from './waitlist-match';

const hour = (h: number) => new Date(`2026-08-26T${String(h).padStart(2, '0')}:00:00Z`);

function entry(overrides: Partial<Parameters<typeof findCompatibleEntries>[1][number]> = {}) {
  return {
    id: 'e1',
    patientId: 'p1',
    status: 'waiting',
    providerId: undefined,
    chairId: undefined,
    appointmentTypeId: undefined,
    preferredStartTime: hour(9),
    preferredEndTime: hour(12),
    ...overrides,
  };
}

const slot: FreeSlot = { providerId: 'prov-1', chairId: 'chair-1', appointmentTypeId: 'type-1', startTime: hour(10), endTime: hour(11) };

describe('findCompatibleEntries', () => {
  it('matches an unconstrained waiting entry whose window contains the slot', () => {
    const matches = findCompatibleEntries(slot, [entry()]);
    expect(matches).toHaveLength(1);
  });

  it('skips entries whose preferred window does not contain the slot', () => {
    const matches = findCompatibleEntries(slot, [
      entry({ preferredStartTime: hour(8), preferredEndTime: hour(9) }),
      entry({ preferredStartTime: hour(12), preferredEndTime: hour(15) }),
      // window overlaps but does not contain the full slot
      entry({ preferredStartTime: hour(9), preferredEndTime: hour(10) }),
    ]);
    expect(matches).toHaveLength(0);
  });

  it('respects hard provider preference', () => {
    const matches = findCompatibleEntries(slot, [
      entry({ providerId: 'prov-1' }),
      entry({ providerId: 'prov-2', id: 'e2' }),
    ]);
    expect(matches.map((m) => m.id)).toEqual(['e1']);
  });

  it('respects chair and appointment type preferences', () => {
    const matches = findCompatibleEntries(slot, [
      entry({ chairId: 'chair-9', id: 'bad-chair' }),
      entry({ appointmentTypeId: 'type-9', id: 'bad-type' }),
      entry({ chairId: 'chair-1', appointmentTypeId: 'type-1', id: 'good' }),
    ]);
    expect(matches.map((m) => m.id)).toEqual(['good']);
  });

  it('never matches non-waiting entries', () => {
    const matches = findCompatibleEntries(slot, [
      entry({ status: 'booked' }),
      entry({ status: 'cancelled', id: 'e3' }),
    ]);
    expect(matches).toHaveLength(0);
  });
});
