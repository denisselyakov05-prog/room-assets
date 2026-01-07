import { useState, useMemo } from 'react';
import type { Room } from '../types';
import './RoomsList.css';

interface RoomsListProps {
  rooms: Room[];
}

type StatusFilter = 'all' | 'available' | 'in-use' | 'booked';
type EquipmentFilter = 'all' | 'projector' | 'computers' | 'wifi' | 'microphone' | 'whiteboard';

export const RoomsList: React.FC<RoomsListProps> = ({ rooms }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'capacity'>('name');

  // Функция для перевода оснащения на русский
  const translateFeature = (feature: string): string => {
    const featureMap: Record<string, string> = {
      'projector': 'Проектор',
      'whiteboard': 'Маркерная доска',
      'microphone': 'Микрофон',
      'wifi': 'Wi-Fi',
      'computers': 'Компьютеры',
      'board': 'Интерактивная доска',
      'audiosystem': 'Аудиосистема',
      'headphones': 'Наушники',
      'lighting': 'Осветительная система',
      'stage': 'Сцена',
      'printer': 'Принтер',
      'scanner': 'Сканер',
      'flipchart': 'Флипчарт',
      'videoconference': 'Система видеоконференцсвязи',
      'specialized': 'Специализированное оборудование',
      'fumehood': 'Вытяжной шкаф'
    };
    return featureMap[feature] || feature;
  };

  // Добавляем расширенные данные к комнатам
  const enhancedRooms = rooms.map(room => {
    const mockRoom = (room as any);
    return {
      ...room,
      code: mockRoom.code || room.id.replace('r-', ''),
      equipment: mockRoom.equipment || room.features.map(translateFeature),
      status: room.status || 'available'
    };
  });

  const getStatusText = (status: string): string => {
    const statusTexts: Record<string, string> = {
      'available': '✅ Доступно',
      'booked': '📅 Забронировано', 
      'in-use': '🔄 Используется'
    };
    return statusTexts[status] || '✅ Доступно';
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'available': '#38a169',
      'booked': '#d69e2e', 
      'in-use': '#3182ce'
    };
    return statusColors[status] || '#718096';
  };

  // Фильтрация и сортировка комнат
  const filteredRooms = useMemo(() => {
    let filtered = enhancedRooms.filter(room => {
      // Фильтр по статусу
      if (statusFilter !== 'all' && room.status !== statusFilter) {
        return false;
      }
      
      // Фильтр по оборудованию
      if (equipmentFilter !== 'all') {
        const hasEquipment = room.features.some(feature => 
          feature.toLowerCase().includes(equipmentFilter.toLowerCase())
        );
        if (!hasEquipment) return false;
      }
      
      // Поиск по названию
      if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Сортировка
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.capacity - a.capacity;
      }
    });

    return filtered;
  }, [enhancedRooms, statusFilter, equipmentFilter, searchTerm, sortBy]);

  return (
    <div className="rooms-list">
      <div className="rooms-header">
        <h2>🏢 Все аудитории</h2>
        <p className="rooms-subtitle">Найдено аудиторий: {filteredRooms.length}</p>
      </div>
      
      {/* Панель фильтров */}
      <div className="filters-panel">
        <div className="search-filter">
          <input
            type="text"
            placeholder="🔍 Поиск по названию аудитории..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label>Статус:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="available">✅ Доступно</option>
            <option value="in-use">🔄 Используется</option>
            <option value="booked">📅 Забронировано</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Оборудование:</label>
          <select 
            value={equipmentFilter} 
            onChange={(e) => setEquipmentFilter(e.target.value as EquipmentFilter)}
            className="filter-select"
          >
            <option value="all">Любое оборудование</option>
            <option value="projector">Проектор</option>
            <option value="computers">Компьютеры</option>
            <option value="wifi">Wi-Fi</option>
            <option value="microphone">Микрофон</option>
            <option value="whiteboard">Маркерная доска</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Сортировка:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'name' | 'capacity')}
            className="filter-select"
          >
            <option value="name">По названию</option>
            <option value="capacity">По вместимости</option>
          </select>
        </div>

        <button 
          onClick={() => {
            setStatusFilter('all');
            setEquipmentFilter('all');
            setSearchTerm('');
            setSortBy('name');
          }}
          className="reset-filters-btn"
        >
          🗑️ Сбросить
        </button>
      </div>

      {/* Сетка аудиторий */}
      <div className="rooms-grid">
        {filteredRooms.length === 0 ? (
          <div className="empty-state">
            <p>🎯 Аудитории не найдены</p>
            <p>Попробуйте изменить параметры фильтрации</p>
          </div>
        ) : (
          filteredRooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-header">
                <h3>{room.name}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(room.status) }}
                >
                  {getStatusText(room.status)}
                </span>
              </div>
              
              <div className="room-card-body">
                <div className="room-info">
                  <div className="info-item">
                    <span className="info-label">Номер:</span>
                    <span className="info-value">№{room.code}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Вместимость:</span>
                    <span className="info-value">{room.capacity} чел.</span>
                  </div>
                </div>

                {room.equipment.length > 0 && (
                  <div className="equipment-section">
                    <span className="equipment-label">Оснащение:</span>
                    <div className="equipment-tags">
                      {room.equipment.map((feature: string, index: number) => (
                        <span key={index} className="equipment-tag">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};