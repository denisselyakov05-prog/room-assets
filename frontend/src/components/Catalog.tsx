import type { Room, Asset } from '../types';
import './Catalog.css';

interface CatalogProps {
  rooms: Room[];
  assets: Asset[];
}

export const Catalog: React.FC<CatalogProps> = ({ rooms, assets }) => {
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

  // Добавляем расширенные данные к комнатам из моков
  const enhancedRooms = rooms.map(room => {
    // Если у комнаты есть дополнительные данные из моков
    const mockRoom = (room as any);
    return {
      ...room,
      code: mockRoom.code || room.id.replace('r-', ''),
      equipment: mockRoom.equipment || room.features.map(translateFeature),
      status: mockRoom.status || 'available'
    };
  });

  const getStatusText = (status: string): string => {
    const statusTexts: Record<string, string> = {
      'available': '✅ Доступна',
      'booked': '📅 Забронировано', 
      'in-use': '🔄 Используется'
    };
    return statusTexts[status] || '✅ Доступна';
  };

  return (
    <div className="catalog">
      <h2>📚 Каталог ресурсов</h2>
      
      <div className="catalog-section">
        <h3>🏢 Аудитории ({enhancedRooms.length})</h3>
        <div className="resources-grid">
          {enhancedRooms.map(room => (
            <div key={room.id} className="resource-card">
              <h4>{room.name} <span style={{fontSize: '0.9rem', color: '#667eea'}}>№{room.code}</span></h4>
              <p>Вместимость: <strong>{room.capacity} чел.</strong></p>
              {/* Убираем класс status, так как у нас только эмодзи */}
              <p>Статус: <strong>{getStatusText(room.status)}</strong></p>
              {room.equipment.length > 0 && (
                <div className="features">
                  <span>Оснащение:</span>
                  <div className="features-list">
                    {room.equipment.map((feature: string, index: number) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="catalog-section">
        <h3>🖥️ Инвентарь ({assets.length})</h3>
        <div className="resources-grid">
          {assets.map(asset => (
            <div key={asset.id} className="resource-card">
              <h4>{asset.name}</h4>
              <p>Инвентарный номер: <strong>{asset.inventoryCode}</strong></p>
              <p>Статус: 
                <span className={`status ${asset.status === 'available' ? 'available' : 'unavailable'}`}>
                  {asset.status === 'available' ? ' ✅ Доступен' : ' ❌ Недоступен'}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};