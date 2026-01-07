import type { AppData } from '../types';

export const initialData: AppData = {
  rooms: [
    {
      id: "r-101",
      name: "Аудитория 101",
      capacity: 30,
      features: ["projector", "whiteboard"],
      status: "available" 
    },
    {
      id: "r-203", 
      name: "Аудитория 203",
      capacity: 20,
      features: [],
      status: "in-use"
    },
    {
      id: "r-301",
      name: "Конференц-зал", 
      capacity: 50,
      features: ["projector", "microphone", "wifi", "videoconference"],
      status: "booked" 
    },
    {
      id: "r-402",
      name: "Компьютерный класс",
      capacity: 25, 
      features: ["computers", "projector", "board", "wifi"],
      status: "in-use" 
    },
    {
      id: "r-105", 
      name: "Лингвистическая лаборатория",
      capacity: 20,
      features: ["audiosystem", "headphones", "microphones", "computers"],
      status: "available" 
    },
    {
      id: "r-205",
      name: "Актовый зал",
      capacity: 100,
      features: ["stage", "lighting", "projector"],
      status: "available" 
    },
    {
      id: "r-306",
      name: "Переговорная",
      capacity: 10,
      features: ["wifi", "whiteboard"],
      status: "in-use" 
    },
    {
      id: "r-108",
      name: "Научная лаборатория", 
      capacity: 15,
      features: ["specialized", "fumehood", "computers"],
      status: "available" 
    },
    {
      id: "r-207",
      name: "Библиотечный зал",
      capacity: 40,
      features: ["computers", "printer", "scanner", "wifi"],
      status: "booked" 
    },
    {
      id: "r-404",
      name: "Тренинг-центр",
      capacity: 30,
      features: ["projector", "board", "flipchart", "wifi"],
      status: "in-use" 
    }
  ],
  assets: [
    {
      id: 'a-1',
      name: 'Проектор Epson',
      type: 'projector',
      status: 'available',
      quantity: 5,
      description: 'Мультимедийный проектор высокой яркости',
      location: 'Склад А',
      specifications: {
        model: 'Epson EB-X41',
        lumens: 3600,
        resolution: 'XGA'
      }
    },
    {
      id: 'a-2',
      name: 'Ноутбук Dell',
      type: 'computer',
      status: 'available',
      quantity: 12,
      description: 'Бизнес-ноутбук для презентаций',
      location: 'ИТ отдел',
      specifications: {
        model: 'Dell Latitude 5420',
        processor: 'Intel Core i5',
        ram: '8GB'
      }
    },
    {
      id: 'a-3',
      name: 'Микрофон беспроводной',
      type: 'audio',
      status: 'in-use',
      quantity: 3,
      description: 'Радиомикрофон для конференций',
      location: 'Актовый зал',
      specifications: {
        frequency: 'UHF',
        range: '100m',
        battery: 'AA'
      }
    },
    {
      id: 'a-4',
      name: 'Стул офисный',
      type: 'furniture',
      status: 'available',
      quantity: 50,
      description: 'Эргономичный офисный стул',
      location: 'Склад мебели',
      specifications: {
        material: 'Ткань',
        adjustable: true,
        wheels: true
      }
    },
    {
      id: 'a-5',
      name: 'Интерактивная доска',
      type: 'other',
      status: 'maintenance',
      quantity: 2,
      description: 'Сенсорная интерактивная панель',
      location: 'Кабинет 301',
      specifications: {
        size: '86"',
        touch: 'multi-touch',
        resolution: '4K'
      }
    },
    {
      id: 'a-6',
      name: 'Акустическая система',
      type: 'audio',
      status: 'available',
      quantity: 4,
      description: 'Портативная колонка для мероприятий',
      location: 'Актовый зал',
      specifications: {
        power: '100W',
        connectivity: 'Bluetooth',
        battery: 'встроенная'
      }
    },
    {
      id: 'a-7',
      name: 'Маркерная доска',
      type: 'furniture',
      status: 'available',
      quantity: 8,
      description: 'Мобильная маркерная доска на колесах',
      location: 'Склад инвентаря',
      specifications: {
        size: '120x90cm',
        mobile: true,
        surface: 'магнитная'
      }
    }
  ],
  bookings: [
    {
      id: 'b-1',
      roomId: 'r-101',
      assetIds: ['a-1', 'a-2'],
      startTime: '2024-01-20T10:00:00',
      endTime: '2024-01-20T12:00:00',
      purpose: 'Совещание отдела разработки',
      bookedBy: 'Иван Петров',
      status: 'active'
    },
    {
      id: 'b-2',
      roomId: 'r-301',
      assetIds: ['a-1', 'a-3', 'a-6'],
      startTime: '2024-01-21T14:00:00',
      endTime: '2024-01-21T16:00:00',
      purpose: 'Презентация для клиентов',
      bookedBy: 'Мария Сидорова',
      status: 'active'
    },
    {
      id: 'b-3',
      roomId: 'r-205',
      assetIds: ['a-1', 'a-3', 'a-6', 'a-7'],
      startTime: '2024-01-19T09:00:00',
      endTime: '2024-01-19T11:00:00',
      purpose: 'Корпоративное обучение',
      bookedBy: 'Алексей Козлов',
      status: 'completed'
    },
    {
      id: 'b-4',
      roomId: 'r-105',
      assetIds: ['a-2'],
      startTime: '2024-01-22T13:00:00',
      endTime: '2024-01-22T15:00:00',
      purpose: 'Языковая практика',
      bookedBy: 'Ольга Новикова',
      status: 'active'
    }
  ]
};