export interface Asset {
  id: string;
  name: string;
  inventoryCode?: string;
  type: 'projector' | 'computer' | 'audio' | 'furniture' | 'other';
  status: 'available' | 'in-use' | 'maintenance';
  quantity: number;
  description?: string;
  location?: string;
  specifications?: Record<string, any>;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  status: 'available' | 'in-use' | 'booked';
  code?: string;
  equipment?: string[];
}

export interface Booking {
  id: string;
  title: string;
  resourceType: 'room' | 'asset';
  resourceId: string;
  start: string;
  end: string;
  notes?: string;
  bookedBy: string;
  status: 'active' | 'cancelled' | 'completed';

  // старые поля для совместимости с фронтом
  roomId?: string;
  assetIds?: string[];
  startTime?: string;
  endTime?: string;
  purpose?: string;
}


export interface AppData {
  rooms: Room[];
  assets: Asset[];
  bookings: Booking[];
}
