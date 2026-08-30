import type { AppointmentStatus } from '@danta/schemas';

export interface StatusActionOption {
  action: 'confirm' | 'check-in' | 'start' | 'complete' | 'no-show' | 'cancel';
  label: string;
}/** Allowed next actions per appointment status; mirrors server-side transition guards. */
export function availableActions(status: AppointmentStatus | string): StatusActionOption[] {
  switch (status) {
    case 'scheduled':
      return [
        { action: 'confirm', label: 'Confirm' },
        { action: 'check-in', label: 'Check In' },
        { action: 'start', label: 'Start' },
        { action: 'no-show', label: 'No Show' },
        { action: 'cancel', label: 'Cancel' },
      ];
    case 'confirmed':
      return [
        { action: 'check-in', label: 'Check In' },
        { action: 'start', label: 'Start' },
        { action: 'complete', label: 'Complete' },
        { action: 'no-show', label: 'No Show' },
        { action: 'cancel', label: 'Cancel' },
      ];
    case 'checked_in':
      return [
        { action: 'start', label: 'Start' },
        { action: 'complete', label: 'Complete' },
      ];
    case 'in_progress':
      return [{ action: 'complete', label: 'Complete' }];
    default:
      return [];
  }
}

export interface ChairLike {
  id: string;
  name: string;
  isActive: boolean;
}

interface AppointmentLike {
  id: string;
  chairId: string;
  startTime: string | Date;
  status: string;
}

export interface ChairLane<T extends AppointmentLike = AppointmentLike> {
  chair: ChairLike;
  appointments: T[];
}

/**
 * Group appointments into one lane per active chair, ordered by start time.
 * Inactive chairs are omitted; appointments on unknown/inactive chairs fall
 * into an trailing unassigned bucket so nothing disappears.
 */
export function groupAppointmentsByChair<T extends AppointmentLike>(
  appointments: T[],
  chairs: ChairLike[],
): { lanes: Array<ChairLane<T>>; unassigned: T[] } {
  const activeChairs = chairs.filter((chair) => chair.isActive);
  const byChair = new Map<string, T[]>(activeChairs.map((chair) => [chair.id, []]));
  const unassigned: T[] = [];

  for (const appointment of [...appointments].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )) {
    const lane = byChair.get(appointment.chairId);
    if (lane) lane.push(appointment);
    else unassigned.push(appointment);
  }

  return {
    lanes: activeChairs.map((chair) => ({ chair, appointments: byChair.get(chair.id) ?? [] })),
    unassigned,
  };
}
