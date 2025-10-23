import type { Room, Asset } from '../types';
import './Catalog.css';

interface CatalogProps {
  rooms: Room[];
  assets: Asset[];
}

export const Catalog: React.FC<CatalogProps> = ({ rooms, assets }) => {
  return (
    <div className="catalog">
      <h2>📚 Каталог ресурсов</h2>
      
      <div className="catalog-section">
        <h3>🏢 Аудитории ({rooms.length})</h3>
        <div className="resources-grid">
          {rooms.map(room => (
            <div key={room.id} className="resource-card">
              <h4>{room.name}</h4>
              <p>Вместимость: <strong>{room.capacity} чел.</strong></p>
              {room.features.length > 0 && (
                <div className="features">
                  <span>Оснащение:</span>
                  <div className="features-list">
                    {room.features.map(feature => (
                      <span key={feature} className="feature-tag">{feature}</span>
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
                <span className={`status ${asset.status}`}>
                  {asset.status === 'available' ? '✅ Доступен' : '❌ Недоступен'}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};