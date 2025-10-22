// utils/booking.ts
export type Booking = {
  id: string;
  resourceType: 'room' | 'asset';
  resourceId: string;
  title: string;
  start: string; // ISO 8601 UTC
  end: string;   // ISO 8601 UTC
  notes?: string;
};

/**
 * Проверка, пересекается ли candidate с любым из existingBookings для одного ресурса.
 */
export function hasOverlap(candidate: Booking, existingBookings: Booking[]): boolean {
  const cs = Date.parse(candidate.start); // timestamp ms (UTC)
  const ce = Date.parse(candidate.end);
  if (isNaN(cs) || isNaN(ce) || cs >= ce) {
    throw new Error('Invalid candidate dates');
  }

  for (const b of existingBookings) {
    if (b.id === candidate.id) continue; // при редактировании игнорируем саму себя
    const bs = Date.parse(b.start);
    const be = Date.parse(b.end);
    if (isNaN(bs) || isNaN(be)) continue; // skip invalid
    // пересечение, если cs < be && ce > bs
    if (cs < be && ce > bs) {
      return true;
    }
  }
  return false;
}
