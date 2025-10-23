import type { Booking } from '../types';
import { formatLocalDate } from '../utils/dateUtils';
import './BookingList.css';

interface BookingListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

export const BookingList: React.FC<BookingListProps> = ({ bookings, onEdit, onDelete }) => {
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
                <h3>{booking.title}</h3>
                <span className={`resource-type ${booking.resourceType}`}>
                  {booking.resourceType === 'room' ? '🏢 Аудитория' : '🖥️ Инвентарь'}
                </span>
              </div>
              
              <div className="booking-details">
                <p><strong>ID ресурса:</strong> {booking.resourceId}</p>
                <p><strong>Начало:</strong> {formatLocalDate(booking.start)}</p>
                <p><strong>Окончание:</strong> {formatLocalDate(booking.end)}</p>
                {booking.notes && (
                  <p><strong>Заметки:</strong> {booking.notes}</p>
                )}
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