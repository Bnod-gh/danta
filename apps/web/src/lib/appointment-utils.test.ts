import { describe, expect, it } from 'vitest';
import { availableActions, groupAppointmentsByChair } from './appointment-utils';

const CHAIRS = [
  { id: 'c1', name: 'Chair 1', isActive: true },
  { id: 'c2', name: 'Chair 2', isActive: true },
  { id: 'c3', name: 'Storage Chair', isActive: false },
];

const appointment = (id: string, chairId: string, startTime: string) => ({ id, chairId, startTime, status: 'scheduled' });

describe('availableActions', () => {
  it('offers the full flow for scheduled appointments', () => {
    expect(availableActions('scheduled').map((a) => a.action)).toEqual(['confirm', 'check-in', 'start', 'no-show', 'cancel']);
  });

  it('narrows to completion for in-progress appointments', () => {
    expect(availableActions('in_progress').map((a) => a.action)).toEqual(['complete']);
  });

  it('offers nothing for terminal statuses', () => {
    expect(availableActions('completed')).toEqual([]);
    expect(availableActions('cancelled')).toEqual([]);
    expect(availableActions('no_show')).toEqual([]);
  });
});

describe('groupAppointmentsByChair', () => {
  it('creates ordered lanes per active chair and sorts by start time', () => {
    const { lanes, unassigned } = groupAppointmentsByChair(
      [
        appointment('a2', 'c1', '2026-08-23T10:00:00Z'),
        appointment('a1', 'c1', '2026-08-23T09:00:00Z'),
        appointment('a3', 'c2', '2026-08-23T08:00:00Z'),
      ],
      CHAIRS,
    );

    expect(lanes).toHaveLength(2);
    expect(lanes[0].chair.id).toBe('c1');
    expect(lanes[0].appointments.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(lanes[1].appointments.map((a) => a.id)).toEqual(['a3']);
    expect(unassigned).toEqual([]);
  });

  it('routes bookings on inactive/unknown chairs into the unassigned bucket', () => {
    const { lanes, unassigned } = groupAppointmentsByChair(
      [
        appointment('a1', 'c1', '2026-08-23T09:00:00Z'),
        appointment('a2', 'c3', '2026-08-23T09:30:00Z'),
        appointment('a3', 'unknown-chair', '2026-08-23T10:00:00Z'),
      ],
      CHAIRS,
    );

    expect(lanes.map((lane) => lane.chair.id)).toEqual(['c1', 'c2']);
    expect(lanes[0].appointments).toHaveLength(1);
    expect(unassigned.map((a) => a.id)).toEqual(['a2', 'a3']);
  });
});
