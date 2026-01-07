import { useState, useEffect } from 'react';
import type { AppData, Booking } from '../types';
import { db } from '../utils/db';

export const useIndexedDB = () => {
  const [data, setData] = useState<AppData>({ rooms: [], assets: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const appData = await db.getAllData();
      setData(appData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addBooking = async (booking: Booking): Promise<void> => {
    try {
      await db.addBooking(booking);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add booking';
      setError(errorMessage);
      throw err;
    }
  };

  const updateBooking = async (booking: Booking): Promise<void> => {
    try {
      await db.updateBooking(booking);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteBooking = async (id: string): Promise<void> => {
    try {
      await db.deleteBooking(id);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete booking';
      setError(errorMessage);
      throw err;
    }
  };

  const exportData = async (): Promise<AppData> => {
    try {
      return await db.exportData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      throw err;
    }
  };

  const importData = async (importData: AppData): Promise<void> => {
    try {
      await db.importData(importData);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    addBooking,
    updateBooking,
    deleteBooking,
    exportData,
    importData,
    refreshData: loadData,
  };
};