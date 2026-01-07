import { initialData } from '../utils/initData'

export const roomsPayload = {
  items: initialData.rooms.map(room => ({
    id: room.id,
    code: room.id.replace('r-', ''),
    name: room.name,
    capacity: room.capacity,
    equipment: room.features,
    status: "available"
  })),
  page: 1,
  total: initialData.rooms.length,
}