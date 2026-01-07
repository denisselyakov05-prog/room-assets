import { useState, useMemo } from 'react';
import { useIndexedDB } from './hooks/useIndexedDB';
import { BookingList } from './components/BookingList';
import { BookingForm } from './components/BookingForm';
import type { Booking, Room, Asset } from './types';
import './App.css';
import { useEffect } from 'react';

type View = 'catalog' | 'bookings' | 'create-booking' | 'edit-booking' | 'inventory';
type StatusFilter = 'all' | 'available' | 'in-use' | 'booked';
type EquipmentFilter = 'all' | 'projector' | 'computers' | 'wifi' | 'microphone' | 'whiteboard';
type SortBy = 'name' | 'capacity';
type AssetTypeFilter = 'all' | 'projector' | 'computer' | 'furniture' | 'audio' | 'other';
type AssetStatusFilter = 'all' | 'available' | 'in-use' | 'maintenance';

const API_URL = import.meta.env.DEV ? '' : 'https://room-assets-r3dr.onrender.com'; // prod → Render


function App() {
  const [currentView, setCurrentView] = useState<View>('catalog');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { data, loading, addBooking, updateBooking, deleteBooking, exportData, importData } = useIndexedDB();

  // Состояния для фильтрации и сортировки аудиторий
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [capacityRange, setCapacityRange] = useState<[number, number]>([0, 100]);

  // Состояния для фильтрации и сортировки инвентаря
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetTypeFilter>('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState<AssetStatusFilter>('all');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [assetSortBy, setAssetSortBy] = useState<'name' | 'quantity'>('name');

  useEffect(() => {
    console.log('🔍 Начинаем тестовый запрос к /api/rooms...');
    
    fetch('${API_URL}/api/rooms')
      .then(response => {
        console.log('📡 Получен ответ, статус:', response.status);
        console.log('📡 Заголовки:', Object.fromEntries(response.headers.entries()));
        return response.json();
      })
      .then(data => {
        console.log('✅ Моки работают! Получены данные:', data);
      })
      .catch(error => {
        console.error('❌ Ошибка запроса:', error);
        console.error('❌ Подробности ошибки:', error.message);
      });
  }, []);

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
  const enhancedRooms = useMemo(() => {
    return data.rooms.map((room: Room) => {
      const mockRoom = (room as any);
      return {
        ...room,
        code: mockRoom.code || room.id.replace('r-', ''),
        equipment: mockRoom.equipment || room.features.map(translateFeature),
        status: room.status || 'available'
      };
    });
  }, [data.rooms]);

  // Получаем диапазон вместимости для слайдера
  const capacityRangeInfo = useMemo(() => {
    if (enhancedRooms.length === 0) return { min: 0, max: 100 };
    const capacities = enhancedRooms.map((room: Room) => room.capacity);
    return {
      min: Math.min(...capacities),
      max: Math.max(...capacities)
    };
  }, [enhancedRooms]);

  // Функции для статусов аудиторий
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

  // Функции для статусов инвентаря
  const getAssetStatusText = (status: string): string => {
    const statusTexts: Record<string, string> = {
      'available': '✅ Доступно',
      'in-use': '🔄 Используется',
      'maintenance': '🔧 На обслуживании'
    };
    return statusTexts[status] || '✅ Доступно';
  };

  const getAssetStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'available': '#38a169',
      'in-use': '#3182ce',
      'maintenance': '#e53e3e'
    };
    return statusColors[status] || '#718096';
  };

  // Основная функция фильтрации и сортировки аудиторий
  const filteredRooms = useMemo(() => {
    let filtered = enhancedRooms.filter((room: Room) => {
      // Фильтр по статусу
      if (statusFilter !== 'all' && room.status !== statusFilter) {
        return false;
      }
      
      // Фильтр по оборудованию
      if (equipmentFilter !== 'all') {
        const hasEquipment = room.features.some((feature: string) =>
        feature.toLowerCase().includes(equipmentFilter.toLowerCase()));
        if (!hasEquipment) return false;
      }
      
      // Поиск по названию
      if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Фильтр по вместимости
      if (room.capacity < capacityRange[0] || room.capacity > capacityRange[1]) {
        return false;
      }
      
      return true;
    });

    // Сортировка
    filtered.sort((a: Room, b: Room) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.capacity - a.capacity;
      }
    });

    return filtered;
  }, [enhancedRooms, statusFilter, equipmentFilter, searchTerm, sortBy, capacityRange]);

  // Функция фильтрации и сортировки инвентаря
  const filteredAssets = useMemo(() => {
    let filtered = data.assets.filter((asset: Asset) => {
      // Фильтр по типу
      if (assetTypeFilter !== 'all' && asset.type !== assetTypeFilter) {
        return false;
      }
      
      // Фильтр по статусу
      if (assetStatusFilter !== 'all' && asset.status !== assetStatusFilter) {
        return false;
      }
      
      // Поиск по названию
      if (assetSearchTerm && !asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Сортировка
    filtered.sort((a: Asset, b: Asset) => {
      if (assetSortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.quantity - a.quantity;
      }
    });

    return filtered;
  }, [data.assets, assetTypeFilter, assetStatusFilter, assetSearchTerm, assetSortBy]);

  // Статистика по фильтрам аудиторий
  const filterStats = useMemo(() => {
  const total = enhancedRooms.length;
  const available = enhancedRooms.filter((room: Room) => room.status === 'available').length;
  const inUse = enhancedRooms.filter((room: Room) => room.status === 'in-use').length;
  const booked = enhancedRooms.filter((room: Room) => room.status === 'booked').length;
  
  return { total, available, inUse, booked };
}, [enhancedRooms]);

  // Статистика по фильтрам инвентаря
  const assetFilterStats = useMemo(() => {
  const total = data.assets.length;
  const available = data.assets.filter((asset: Asset) => asset.status === 'available').length;
  const inUse = data.assets.filter((asset: Asset) => asset.status === 'in-use').length;
  const maintenance = data.assets.filter((asset: Asset) => asset.status === 'maintenance').length;
  
  return { total, available, inUse, maintenance };
}, [data.assets]);

  const handleCreateBooking = () => {
    setEditingBooking(null);
    setCurrentView('create-booking');
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setCurrentView('edit-booking');
  };

  const handleSaveBooking = async (booking: Booking) => {
    try {
      if (booking.id) {
        await updateBooking(booking);
      } else {
        await addBooking({ ...booking, id: `b-${Date.now()}` });
      }
      setCurrentView('bookings');
    } catch (error) {
      alert('Ошибка при сохранении брони');
    }
  };

  const handleExport = async () => {
    try {
      const exportDataResult = await exportData();
      const dataStr = JSON.stringify(exportDataResult, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'room-assets-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Ошибка при экспорте данных');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          importData(importedData);
          alert('Данные успешно импортированы!');
        } catch (error) {
          alert('Ошибка при импорте файла. Проверьте формат JSON.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  // Сброс всех фильтров аудиторий
  const resetAllFilters = () => {
    setStatusFilter('all');
    setEquipmentFilter('all');
    setSearchTerm('');
    setSortBy('name');
    setCapacityRange([capacityRangeInfo.min, capacityRangeInfo.max]);
  };

  // Сброс всех фильтров инвентаря
  const resetAssetFilters = () => {
    setAssetTypeFilter('all');
    setAssetStatusFilter('all');
    setAssetSearchTerm('');
    setAssetSortBy('name');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <h2>Загрузка данных...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%' 
        }}>
    <     h1>🏢 Room & Assets</h1>
    
          {/* Блок пользователя */}
    <     div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '20px'
          }}>
            <div style={{ fontSize: '1.2rem' }}>
              👤
            </div>
            <span style={{
              fontWeight: '600',
              fontSize: '0.9rem',
              color: 'black'
            }}>
              User
            </span>
          </div>

          <nav className="nav">
            <button 
              onClick={() => setCurrentView('catalog')}
              className={currentView === 'catalog' ? 'active' : ''}
            >
              📚 Аудитории
            </button>
            <button 
              onClick={() => setCurrentView('inventory')}
              className={currentView === 'inventory' ? 'active' : ''}
            >
              📦 Инвентарь
            </button>
            <button 
              onClick={() => setCurrentView('bookings')}
              className={currentView === 'bookings' ? 'active' : ''}
            >
              📅 Бронирования
            </button>
            <button onClick={handleCreateBooking}>➕ Создать бронь</button>
            <button onClick={handleExport}>📤 Экспорт</button>
            <label className="import-btn">
              📥 Импорт
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                style={{ display: 'none' }} 
              />
            </label>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {currentView === 'catalog' && (
          <div>
            {/* Панель управления фильтрами */}
            <div className="filters-controls" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '16px 24px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem' }}>
                  🏢 Все аудитории ({filteredRooms.length})
                </h2>
                
                {/* Статистика */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#38a169', fontWeight: '600' }}>
                    ✅ {filterStats.available} доступно
                  </span>
                  <span style={{ color: '#3182ce', fontWeight: '600' }}>
                    🔄 {filterStats.inUse} используется
                  </span>
                  <span style={{ color: '#d69e2e', fontWeight: '600' }}>
                    📅 {filterStats.booked} забронировано
                  </span>
                </div>
              </div>

              <button 
                onClick={resetAllFilters}
                style={{
                  padding: '8px 16px',
                  background: '#f7fafc',
                  color: '#e53e3e',
                  border: '1px solid #fed7d7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                🗑️ Сбросить всё
              </button>
            </div>

            {/* ОСНОВНАЯ ПАНЕЛЬ ФИЛЬТРОВ */}
            <div className="filters-panel" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
              padding: '24px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              {/* ПОИСК */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>🔍 Поиск:</label>
                <input
                  type="text"
                  placeholder="Поиск по названию аудитории..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                />
              </div>
              
              {/* ФИЛЬТР ПО СТАТУСУ */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>📊 Статус:</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                >
                  <option value="all">Все статусы</option>
                  <option value="available">✅ Доступно</option>
                  <option value="in-use">🔄 Используется</option>
                  <option value="booked">📅 Забронировано</option>
                </select>
              </div>

              {/* ФИЛЬТР ПО ОБОРУДОВАНИЮ */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>⚙️ Оборудование:</label>
                <select 
                  value={equipmentFilter} 
                  onChange={(e) => setEquipmentFilter(e.target.value as EquipmentFilter)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                >
                  <option value="all">Любое оборудование</option>
                  <option value="projector">🎥 Проектор</option>
                  <option value="computers">💻 Компьютеры</option>
                  <option value="wifi">📶 Wi-Fi</option>
                  <option value="microphone">🎤 Микрофон</option>
                  <option value="whiteboard">📝 Маркерная доска</option>
                </select>
              </div>

              {/* ФИЛЬТР ПО ВМЕСТИМОСТИ */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>
                  👥 Вместимость: {capacityRange[0]} - {capacityRange[1]} чел.
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#718096', minWidth: '30px' }}>{capacityRange[0]}</span>
                  <input
                    type="range"
                    min={capacityRangeInfo.min}
                    max={capacityRangeInfo.max}
                    value={capacityRange[0]}
                    onChange={(e) => setCapacityRange([parseInt(e.target.value), capacityRange[1]])}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="range"
                    min={capacityRangeInfo.min}
                    max={capacityRangeInfo.max}
                    value={capacityRange[1]}
                    onChange={(e) => setCapacityRange([capacityRange[0], parseInt(e.target.value)])}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#718096', minWidth: '30px' }}>{capacityRange[1]}</span>
                </div>
              </div>

              {/* СОРТИРОВКА */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>📈 Сортировка:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                >
                  <option value="name">📝 По названию (А-Я)</option>
                  <option value="capacity">👥 По вместимости (убыв.)</option>
                </select>
              </div>
            </div>

            {/* Быстрые фильтры */}
            <div className="quick-filters" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <button
                onClick={() => setStatusFilter('available')}
                style={{
                  padding: '8px 16px',
                  background: statusFilter === 'available' ? '#38a169' : '#f0fff4',
                  color: statusFilter === 'available' ? 'white' : '#38a169',
                  border: `1px solid ${statusFilter === 'available' ? '#38a169' : '#c6f6d5'}`,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✅ Только доступные
              </button>
              <button
                onClick={() => setEquipmentFilter('projector')}
                style={{
                  padding: '8px 16px',
                  background: equipmentFilter === 'projector' ? '#667eea' : '#f0f4ff',
                  color: equipmentFilter === 'projector' ? 'white' : '#667eea',
                  border: `1px solid ${equipmentFilter === 'projector' ? '#667eea' : '#c3dafe'}`,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🎥 С проектором
              </button>
              <button
                onClick={() => setEquipmentFilter('computers')}
                style={{
                  padding: '8px 16px',
                  background: equipmentFilter === 'computers' ? '#ed8936' : '#fffaf0',
                  color: equipmentFilter === 'computers' ? 'white' : '#ed8936',
                  border: `1px solid ${equipmentFilter === 'computers' ? '#ed8936' : '#feebc8'}`,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💻 Компьютерный класс
              </button>
              <button
                onClick={() => {
                  setSortBy('capacity');
                  setCapacityRange([capacityRangeInfo.max - 10, capacityRangeInfo.max]);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f0fff4',
                  color: '#38a169',
                  border: '1px solid #c6f6d5',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                👥 Большие аудитории
              </button>
            </div>

            {/* Список отфильтрованных аудиторий */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {filteredRooms.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: '#718096',
                  background: '#f8f9fa',
                  borderRadius: '16px',
                  border: '2px dashed #e2e8f0'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                  <p style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#4a5568', fontWeight: '600' }}>
                    Аудитории не найдены
                  </p>
                  <p style={{ marginBottom: '20px', color: '#718096' }}>
                    Попробуйте изменить параметры фильтрации или сбросить фильтры
                  </p>
                  <button 
                    onClick={resetAllFilters}
                    style={{
                      padding: '10px 20px',
                      background: '#3182ce',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Сбросить все фильтры
                  </button>
                </div>
              ) : (
                filteredRooms.map((room: Room) => (
                  <div key={room.id} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onDoubleClick={() => {
                    if (room.status === 'available') {
                      handleCreateBooking();
                    }
                  }}
                  >
                    {/* Индикатор статуса */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: getStatusColor(room.status)
                    }} />
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <h3 style={{ 
                          margin: 0, 
                          color: '#2d3748', 
                          fontSize: '1.3rem', 
                          fontWeight: '700',
                          marginBottom: '4px'
                        }}>
                          {room.name}
                        </h3>
                        <p style={{ 
                          margin: 0, 
                          color: '#718096', 
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          №{room.code}
                        </p>
                      </div>
                      <span 
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          backgroundColor: getStatusColor(room.status),
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {getStatusText(room.status)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                      }}>
                        <div style={{ 
                          background: '#f7fafc', 
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>
                            👥 Вместимость
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2d3748' }}>
                            {room.capacity} чел.
                          </div>
                        </div>
                        <div style={{ 
                          background: '#f7fafc', 
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>
                            ⚙️ Оборудование
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2d3748' }}>
                            {room.equipment?.length || 0}
                          </div>
                        </div>
                      </div>

                      {room.equipment && room.equipment.length > 0 && (
                        <div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#718096', 
                            fontWeight: '600', 
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            ⚙️ Оснащение:
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '6px'
                          }}>
                            {room.equipment.map((feature: string, index: number) => (
                              <span key={index} style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Кнопка быстрого действия */}
                    {room.status === 'available' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateBooking();
                        }}
                        style={{
                          width: '100%',
                          marginTop: '16px',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        📅 Забронировать
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentView === 'inventory' && (
          <div>
            {/* Панель управления фильтрами инвентаря */}
            <div className="filters-controls" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '16px 24px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem' }}>
                  📦 Весь инвентарь ({filteredAssets.length})
                </h2>
                
                {/* Статистика инвентаря */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#38a169', fontWeight: '600' }}>
                    ✅ {assetFilterStats.available} доступно
                  </span>
                  <span style={{ color: '#3182ce', fontWeight: '600' }}>
                    🔄 {assetFilterStats.inUse} используется
                  </span>
                  <span style={{ color: '#e53e3e', fontWeight: '600' }}>
                    🔧 {assetFilterStats.maintenance} на обслуживании
                  </span>
                </div>
              </div>

              <button 
                onClick={resetAssetFilters}
                style={{
                  padding: '8px 16px',
                  background: '#f7fafc',
                  color: '#e53e3e',
                  border: '1px solid #fed7d7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                🗑️ Сбросить всё
              </button>
            </div>

            {/* ПАНЕЛЬ ФИЛЬТРОВ ИНВЕНТАРЯ */}
            <div className="filters-panel" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
              padding: '24px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              {/* ПОИСК ИНВЕНТАРЯ */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>🔍 Поиск:</label>
                <input
                  type="text"
                  placeholder="Поиск по названию инвентаря..."
                  value={assetSearchTerm}
                  onChange={(e) => setAssetSearchTerm(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                />
              </div>
              
              {/* ФИЛЬТР ПО ТИПУ ИНВЕНТАРЯ */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>📋 Тип:</label>
                <select 
                  value={assetTypeFilter} 
                  onChange={(e) => setAssetTypeFilter(e.target.value as AssetTypeFilter)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                >
                  <option value="all">Все типы</option>
                  <option value="projector">🎥 Проекторы</option>
                  <option value="computer">💻 Компьютеры</option>
                  <option value="audio">🎵 Аудиооборудование</option>
                  <option value="furniture">🪑 Мебель</option>
                  <option value="other">📦 Другое</option>
                </select>
              </div>

              {/* ФИЛЬТР ПО СТАТУСУ ИНВЕНТАРЯ */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>📊 Статус:</label>
                <select 
                  value={assetStatusFilter} 
                  onChange={(e) => setAssetStatusFilter(e.target.value as AssetStatusFilter)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                >
                  <option value="all">Все статусы</option>
                  <option value="available">✅ Доступно</option>
                  <option value="in-use">🔄 Используется</option>
                  <option value="maintenance">🔧 На обслуживании</option>
                </select>
              </div>

              {/* СОРТИРОВКА ИНВЕНТАРЯ */}
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>📈 Сортировка:</label>
                <select 
                  value={assetSortBy} 
                  onChange={(e) => setAssetSortBy(e.target.value as 'name' | 'quantity')}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    width: '100%',
                    background: 'white'
                  }}
                >
                  <option value="name">📝 По названию (А-Я)</option>
                  <option value="quantity">📦 По количеству (убыв.)</option>
                </select>
              </div>
            </div>

            {/* Быстрые фильтры инвентаря */}
            <div className="quick-filters" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <button
                onClick={() => setAssetStatusFilter('available')}
                style={{
                  padding: '8px 16px',
                  background: assetStatusFilter === 'available' ? '#38a169' : '#f0fff4',
                  color: assetStatusFilter === 'available' ? 'white' : '#38a169',
                  border: `1px solid ${assetStatusFilter === 'available' ? '#38a169' : '#c6f6d5'}`,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✅ Только доступные
              </button>
              <button
                onClick={() => setAssetTypeFilter('projector')}
                style={{
                  padding: '8px 16px',
                  background: assetTypeFilter === 'projector' ? '#667eea' : '#f0f4ff',
                  color: assetTypeFilter === 'projector' ? 'white' : '#667eea',
                  border: `1px solid ${assetTypeFilter === 'projector' ? '#667eea' : '#c3dafe'}`,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🎥 Проекторы
              </button>
              <button
                onClick={() => setAssetTypeFilter('computer')}
                style={{
                  padding: '8px 16px',
                  background: assetTypeFilter === 'computer' ? '#ed8936' : '#fffaf0',
                  color: assetTypeFilter === 'computer' ? 'white' : '#ed8936',
                  border: `1px solid ${assetTypeFilter === 'computer' ? '#ed8936' : '#feebc8'}`,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💻 Компьютеры
              </button>
              <button
                onClick={() => setAssetSortBy('quantity')}
                style={{
                  padding: '8px 16px',
                  background: assetSortBy === 'quantity' ? '#9f7aea' : '#faf5ff',
                  color: assetSortBy === 'quantity' ? 'white' : '#9f7aea',
                  border: `1px solid ${assetSortBy === 'quantity' ? '#9f7aea' : '#e9d8fd'}`,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📦 По количеству
              </button>
            </div>

            {/* Список отфильтрованного инвентаря */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {filteredAssets.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: '#718096',
                  background: '#f8f9fa',
                  borderRadius: '16px',
                  border: '2px dashed #e2e8f0'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                  <p style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#4a5568', fontWeight: '600' }}>
                    Инвентарь не найден
                  </p>
                  <p style={{ marginBottom: '20px', color: '#718096' }}>
                    Попробуйте изменить параметры фильтрации или сбросить фильтры
                  </p>
                  <button 
                    onClick={resetAssetFilters}
                    style={{
                      padding: '10px 20px',
                      background: '#3182ce',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Сбросить все фильтры
                  </button>
                </div>
              ) : (
                filteredAssets.map((asset: Asset) => (
                  <div key={asset.id} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}>
                    {/* Индикатор статуса */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: getAssetStatusColor(asset.status)
                    }} />
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <h3 style={{ 
                          margin: 0, 
                          color: '#2d3748', 
                          fontSize: '1.2rem', 
                          fontWeight: '700',
                          marginBottom: '4px'
                        }}>
                          {asset.name}
                        </h3>
                        <p style={{ 
                          margin: 0, 
                          color: '#718096', 
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}>
                          📋 {asset.type}
                        </p>
                      </div>
                      <span 
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          backgroundColor: getAssetStatusColor(asset.status),
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {getAssetStatusText(asset.status)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                      }}>
                        <div style={{ 
                          background: '#f7fafc', 
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>
                            📦 Количество
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2d3748' }}>
                            {asset.quantity} шт.
                          </div>
                        </div>
                        <div style={{ 
                          background: '#f7fafc', 
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>
                            🏷️ Артикул
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#2d3748', wordBreak: 'break-all' }}>
                            {asset.id}
                          </div>
                        </div>
                      </div>

                      {asset.description && (
                        <div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#718096', 
                            fontWeight: '600', 
                            marginBottom: '6px'
                          }}>
                            📝 Описание:
                          </div>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.9rem', 
                            color: '#4a5568',
                            lineHeight: '1.4'
                          }}>
                            {asset.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentView === 'bookings' && (
          <BookingList
            bookings={data.bookings}
            onEdit={handleEditBooking}
            onDelete={deleteBooking}
          />
        )}
        {(currentView === 'create-booking' || currentView === 'edit-booking') && (
          <BookingForm
            booking={editingBooking}
            rooms={data.rooms}
            assets={data.assets}
            existingBookings={data.bookings}
            onSave={handleSaveBooking}
            onCancel={() => setCurrentView('bookings')}
          />
        )}
      </main>
    </div>
  );
}

export default App;