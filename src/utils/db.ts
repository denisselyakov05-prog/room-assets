import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { AppData, Room, Asset, Booking } from '../types';
import { initialData } from './initData';

interface RoomAssetsDB extends DBSchema {
  rooms: {
    key: string;
    value: Room;
  };
  assets: {
    key: string;
    value: Asset;
  };
  bookings: {
    key: string;
    value: Booking;
  };
}

class DatabaseService {
  private db: IDBPDatabase<RoomAssetsDB> | null = null;

  async init(): Promise<IDBPDatabase<RoomAssetsDB>> {
    if (!this.db) {
      this.db = await openDB<RoomAssetsDB>('RoomAssetsDB', 1, {
        upgrade(db) {
          db.createObjectStore('rooms', { keyPath: 'id' });
          db.createObjectStore('assets', { keyPath: 'id' });
          db.createObjectStore('bookings', { keyPath: 'id' });
        },
      });

      // Автоматически заполняем начальными данными если база пустая
      const existingRooms = await this.db.getAll('rooms');
      if (existingRooms.length === 0) {
        await this.importData(initialData);
      }
    }
    return this.db;
  }

  async getAllData(): Promise<AppData> {
    const database = await this.init();
    
    const [rooms, assets, bookings] = await Promise.all([
      database.getAll('rooms'),
      database.getAll('assets'),
      database.getAll('bookings'),
    ]);

    return { rooms, assets, bookings };
  }

  async exportData(): Promise<AppData> {
    return this.getAllData();
  }

  async importData(data: AppData): Promise<void> {
    const database = await this.init();

    const tx = database.transaction(['rooms', 'assets', 'bookings'], 'readwrite');
    
    // Очищаем существующие данные
    await Promise.all([
      tx.objectStore('rooms').clear(),
      tx.objectStore('assets').clear(),
      tx.objectStore('bookings').clear(),
    ]);

    // Добавляем новые данные
    await Promise.all([
      ...data.rooms.map(room => tx.objectStore('rooms').add(room)),
      ...data.assets.map(asset => tx.objectStore('assets').add(asset)),
      ...data.bookings.map(booking => tx.objectStore('bookings').add(booking)),
    ]);

    await tx.done;
  }

  async addBooking(booking: Booking): Promise<void> {
    const database = await this.init();
    await database.add('bookings', booking);
  }

  async updateBooking(booking: Booking): Promise<void> {
    const database = await this.init();
    await database.put('bookings', booking);
  }

  async deleteBooking(id: string): Promise<void> {
    const database = await this.init();
    await database.delete('bookings', id);
  }
}

export const db = new DatabaseService();