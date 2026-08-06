type AvailabilityBlock = { startMinutes: number; endMinutes: number };
type BusyRange = { startMinutes: number; endMinutes: number };

/**
 * Genera los horarios de inicio disponibles (en minutos desde medianoche)
 * para un día dado, a partir de los bloques de disponibilidad, la duración
 * del servicio y las reservas ya existentes ese día.
 */
export function computeAvailableSlots(
  blocks: AvailabilityBlock[],
  durationMin: number,
  busy: BusyRange[],
  minMinutesFromNow: number | null
): number[] {
  const slots: number[] = [];

  for (const block of blocks) {
    for (
      let start = block.startMinutes;
      start + durationMin <= block.endMinutes;
      start += durationMin
    ) {
      const end = start + durationMin;

      if (minMinutesFromNow !== null && start < minMinutesFromNow) continue;

      const overlaps = busy.some(
        (b) => start < b.endMinutes && end > b.startMinutes
      );
      if (!overlaps) slots.push(start);
    }
  }

  return slots;
}
