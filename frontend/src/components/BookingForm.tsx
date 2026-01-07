import React, { useState } from 'react';
import type { Booking, Room, Asset } from '../types';
import { hasTimeConflict } from '../utils/dateUtils';
import './BookingForm.css';

interface BookingFormProps {
  booking?: Booking | null;
  rooms: Room[];
  assets: Asset[];
  existingBookings: Booking[];
  onSave: (booking: Booking) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  booking,
  rooms,
  assets,
  existingBookings,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: booking?.title || '',
    resourceType: booking?.resourceType || 'room',
    resourceId: booking?.resourceId || '',
    start: booking?.start ? booking.start.slice(0, 16) : '',
    end: booking?.end ? booking.end.slice(0, 16) : '',
    notes: booking?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableResources = formData.resourceType === 'room' ? rooms : assets;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Введите название бронирования';
    }

    if (!formData.resourceId) {
      newErrors.resourceId = 'Выберите ресурс';
    }

    if (!formData.start) {
      newErrors.start = 'Укажите время начала';
    }

    if (!formData.end) {
      newErrors.end = 'Укажите время окончания';
    }

    if (formData.start && formData.end && new Date(formData.start) >= new Date(formData.end)) {
      newErrors.end = 'Время окончания должно быть позже времени начала';
    }

    if (formData.resourceId && formData.start && formData.end) {
      const hasConflict = hasTimeConflict(
        existingBookings,
        formData.resourceId,
        formData.start,
        formData.end,
        booking?.id
      );

      if (hasConflict) {
        newErrors.time = 'Выбранное время пересекается с существующей бронью';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const bookingData: Booking = {
        id: booking?.id || `b-${Date.now()}`,
        resourceType: formData.resourceType as 'room' | 'asset',
        resourceId: formData.resourceId,
        title: formData.title,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        notes: formData.notes
      };

      onSave(bookingData);
    }
  };

  const selectedResource = availableResources.find(r => r.id === formData.resourceId);

  return (
    <div className="booking-form-container">
      <div className="form-header">
        <h2>{booking ? '✏️ Редактирование брони' : '➕ Создание новой брони'}</h2>
        <p>Заполните информацию о бронировании</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="title">Название бронирования *</label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Например: Семинар по программированию"
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label>Тип ресурса *</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="room"
                checked={formData.resourceType === 'room'}
                onChange={(e) => setFormData({ ...formData, resourceType: e.target.value as 'room', resourceId: '' })}
              />
              🏢 Аудитория
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="asset"
                checked={formData.resourceType === 'asset'}
                onChange={(e) => setFormData({ ...formData, resourceType: e.target.value as 'asset', resourceId: '' })}
              />
              🖥️ Оборудование
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="resourceId">Выберите ресурс *</label>
          <select
            id="resourceId"
            value={formData.resourceId}
            onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
            className={errors.resourceId ? 'error' : ''}
          >
            <option value="">Выберите {formData.resourceType === 'room' ? 'аудиторию' : 'оборудование'}</option>
            {availableResources.map(resource => (
              <option key={resource.id} value={resource.id}>
                {formData.resourceType === 'room' 
                  ? `${(resource as Room).name} (${(resource as Room).capacity} чел.)`
                  : `${(resource as Asset).name} - ${(resource as Asset).inventoryCode}`
                }
              </option>
            ))}
          </select>
          {errors.resourceId && <span className="error-text">{errors.resourceId}</span>}
        </div>

        {selectedResource && (
          <div className="resource-info">
            <h4>Информация о ресурсе:</h4>
            <div className="resource-details">
              {formData.resourceType === 'room' ? (
                <>
                  <div><strong>Название:</strong> {(selectedResource as Room).name}</div>
                  <div><strong>Вместимость:</strong> {(selectedResource as Room).capacity} человек</div>
                  {(selectedResource as Room).features.length > 0 && (
                    <div><strong>Оснащение:</strong> {(selectedResource as Room).features.join(', ')}</div>
                  )}
                </>
              ) : (
                <>
                  <div><strong>Название:</strong> {(selectedResource as Asset).name}</div>
                  <div><strong>Инвентарный номер:</strong> {(selectedResource as Asset).inventoryCode}</div>
                  <div><strong>Статус:</strong> {(selectedResource as Asset).status === 'available' ? 'Доступен' : 'Занят'}</div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start">Время начала *</label>
            <input
              type="datetime-local"
              id="start"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className={errors.start ? 'error' : ''}
            />
            {errors.start && <span className="error-text">{errors.start}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="end">Время окончания *</label>
            <input
              type="datetime-local"
              id="end"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              className={errors.end ? 'error' : ''}
            />
            {errors.end && <span className="error-text">{errors.end}</span>}
          </div>
        </div>

        {errors.time && (
          <div className="time-conflict-warning">
            ⚠️ {errors.time}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes">Дополнительные заметки</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Дополнительная информация о бронировании..."
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="btn-save">
            {booking ? 'Обновить бронь' : 'Создать бронь'}
          </button>
        </div>
      </form>
    </div>
  );
};