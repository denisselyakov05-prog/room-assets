import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Booking } from '../types';

export const formatLocalDate = (isoString: string): string => {
  return format(parseISO(isoString), 'dd.MM.yyyy HH:mm', { locale: ru });
};

export const toUTCString = (date: Date): string => {
  return date.toISOString();
};

export const hasTimeConflict = (
  bookings: Booking[],
  resourceId: string,
  start: string,
  end: string,
  excludeBookingId?: string
): boolean => {
  const newStart = parseISO(start);
  const newEnd = parseISO(end);

  return bookings.some(booking => {
    if (booking.id === excludeBookingId) return false;
    if (booking.resourceId !== resourceId) return false;

    const existingStart = parseISO(booking.start);
    const existingEnd = parseISO(booking.end);

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
};