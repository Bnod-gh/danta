import type { ProviderShift, FreeSlot, WorkingWindow } from '@danta/schemas';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Resolve effective working windows for one date from the weekly shift
 * template plus date-specific overrides (time off subtracts or blocks,
 * custom hours replace the template entirely).
 */
export function computeWorkingWindows(
  date: Date,
  shifts: Array<Pick<ProviderShift, 'dayOfWeek' | 'startTime' | 'endTime'>>,
  overrides: Array<{ date: Date | string; type: string; isFullDay: boolean; startTime: string | null; endTime: string | null }>,
): WorkingWindow[] {
  let windows: WorkingWindow[] = shifts
    .filter((shift) => shift.dayOfWeek === date.getDay())
    .map((shift) => ({ startMinutes: timeToMinutes(shift.startTime), endMinutes: timeToMinutes(shift.endTime) }))
    .filter((window) => window.endMinutes > window.startMinutes);

  for (const override of overrides.filter((entry) => isSameCalendarDay(new Date(entry.date), date))) {
    if (override.type === 'custom_hours') {
      if (!override.startTime || !override.endTime) continue;
      windows = [{ startMinutes: timeToMinutes(override.startTime), endMinutes: timeToMinutes(override.endTime) }];
      continue;
    }

    if (override.isFullDay || !override.startTime || !override.endTime) {
      return [];
    }

    const blockStart = timeToMinutes(override.startTime);
    const blockEnd = timeToMinutes(override.endTime);
    const next: WorkingWindow[] = [];
    for (const window of windows) {
      if (blockEnd <= window.startMinutes || blockStart >= window.endMinutes) {
        next.push(window);
        continue;
      }
      if (blockStart > window.startMinutes) {
        next.push({ startMinutes: window.startMinutes, endMinutes: Math.min(blockStart, window.endMinutes) });
      }
      if (blockEnd < window.endMinutes) {
        next.push({ startMinutes: Math.max(blockEnd, window.startMinutes), endMinutes: window.endMinutes });
      }
    }
    windows = next;
  }

  return windows;
}

/** Walk each working window in fixed steps and keep slots without busy overlap. */
export function findFreeSlots(
  windows: WorkingWindow[],
  busyIntervals: Array<{ start: Date; end: Date }>,
  date: Date,
  durationMin: number,
  stepMin: number,
): FreeSlot[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const busy = busyIntervals
    .map(({ start, end }) => ({ startMs: new Date(start).getTime(), endMs: new Date(end).getTime() }))
    .sort((a, b) => a.startMs - b.startMs);

  const slots: FreeSlot[] = [];
  const durationMs = durationMin * 60_000;
  const stepMs = stepMin * 60_000;

  for (const window of windows) {
    let cursor = dayStart + window.startMinutes * 60_000;
    const windowEnd = dayStart + window.endMinutes * 60_000;

    while (cursor + durationMs <= windowEnd) {
      const slotEnd = cursor + durationMs;
      const conflicts = busy.some(({ startMs, endMs }) => startMs < slotEnd && endMs > cursor);
      if (!conflicts) {
        slots.push({
          startTime: minutesToTime((cursor - dayStart) / 60_000),
          endTime: minutesToTime((slotEnd - dayStart) / 60_000),
        });
      }
      cursor += stepMs;
    }
  }

  return slots;
}
