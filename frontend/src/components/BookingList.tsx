import type { Booking } from '../types';
import './BookingList.css';

interface BookingListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

export const BookingList: React.FC<BookingListProps> = ({ bookings, onEdit, onDelete }) => {
  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Функция для получения названия комнаты по ID
  const getRoomName = (roomId: string) => {
    // Здесь можно добавить логику для получения названия комнаты
    // Пока просто возвращаем ID
    return roomId;
  };

  return (
    <div className="booking-list">
      <h2>📅 Список бронирований</h2>
      
      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>🎯 Бронирований пока нет</p>
          <p>Создайте первую бронь, нажав кнопку "Создать бронь"</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.purpose}</h3>
                <span className={`status ${booking.status}`}>
                  {booking.status === 'active' ? '🟢 Активно' :
                   booking.status === 'cancelled' ? '🔴 Отменено' : '⚫ Завершено'}
                </span>
              </div>
              
              <div className="booking-details">
                <p><strong>🏢 Аудитория:</strong> {getRoomName(booking.roomId)}</p>
                <p><strong>👤 Забронировал:</strong> {booking.bookedBy}</p>
                <p><strong>🕐 Начало:</strong> {formatDate(booking.startTime)}</p>
                <p><strong>🕐 Окончание:</strong> {formatDate(booking.endTime)}</p>
                <p><strong>📦 Оборудование:</strong> {booking.assetIds.length} шт.</p>
              </div>
              
              <div className="booking-actions">
                <button 
                  className="btn-edit"
                  onClick={() => onEdit(booking)}
                >
                  ✏️ Редактировать
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => onDelete(booking.id)}
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};