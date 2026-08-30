/**
 * Pure matching logic for the cancellation→waitlist workflow:
 * when a slot frees up, find waiting entries whose preferences it satisfies.
 */
export interface FreeSlot {
  providerId?: string | null;
  chairId?: string | null;
  appointmentTypeId?: string | null;
  startTime: Date;
  endTime: Date;
}

export interface WaitlistEntryLike {
  id: string;
  patientId: string;
  status: string;
  providerId?: string | null;
  chairId?: string | null;
  appointmentTypeId?: string | null;
  preferredStartTime: Date;
  preferredEndTime: Date;
}

/**
 * An entry matches when it is still waiting, its hard preferences
 * (provider/chair/type, if set) agree with the freed slot, and the freed
 * slot fits entirely inside the entry's preferred window.
 */
export function findCompatibleEntries<T extends WaitlistEntryLike>(slot: FreeSlot, entries: T[]): T[] {
  return entries.filter((entry) => {
    if (entry.status !== 'waiting') return false;
    if (entry.providerId && slot.providerId && entry.providerId !== slot.providerId) return false;
    if (entry.chairId && slot.chairId && entry.chairId !== slot.chairId) return false;
    if (entry.appointmentTypeId && slot.appointmentTypeId && entry.appointmentTypeId !== slot.appointmentTypeId) return false;
    return (
      entry.preferredStartTime.getTime() <= slot.startTime.getTime() &&
      slot.endTime.getTime() <= entry.preferredEndTime.getTime()
    );
  });
}
