import type { AppData } from '../types';

export const initialData: AppData = {
  rooms: [
    {
      id: "r-101",
      name: "Аудитория 101",
      capacity: 30,
      features: ["projector", "whiteboard"]
    },
    {
      id: "r-203",
      name: "Аудитория 203", 
      capacity: 20,
      features: []
    }
  ],
  assets: [
    {
      id: "a-proj-1",
      name: "Проектор Epson",
      inventoryCode: "PRJ-001",
      status: "available"
    }
  ],
  bookings: []
};