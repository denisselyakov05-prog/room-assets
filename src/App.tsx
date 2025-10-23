import { useState } from 'react';
import { useIndexedDB } from './hooks/useIndexedDB';
import { Catalog } from './components/Catalog';
import { BookingList } from './components/BookingList';
import { BookingForm } from './components/BookingForm';
import type { Booking } from './types';
import './App.css';

type View = 'catalog' | 'bookings' | 'create-booking' | 'edit-booking';

function App() {
  const [currentView, setCurrentView] = useState<View>('catalog');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { data, loading, addBooking, updateBooking, deleteBooking, exportData, importData } = useIndexedDB();

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
        <h1>🏢 Room & Assets</h1>
        <nav className="nav">
          <button onClick={() => setCurrentView('catalog')}>📚 Каталог</button>
          <button onClick={() => setCurrentView('bookings')}>📅 Бронирования</button>
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
      </header>

      <main className="main-content">
        {currentView === 'catalog' && <Catalog rooms={data.rooms} assets={data.assets} />}
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