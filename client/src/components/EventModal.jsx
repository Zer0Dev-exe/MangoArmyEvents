import React, { useState, useEffect } from 'react';
import { X, User, Calendar as CalendarIcon, Clock, AlignLeft, Hash, Plus, Trash2, Mic, Pickaxe, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { getDiscordUser, createEvent, updateEvent } from '../services/api';
import './EventModal.css';

const EventModal = ({ isOpen, onClose, selectedDate, selectedEvent, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '12:00',
    category: 'discord'
  });
  const [organizers, setOrganizers] = useState([]);
  const [currentDiscordId, setCurrentDiscordId] = useState('');
  const [currentRole, setCurrentRole] = useState('Líder');
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedEvent) {
        setFormData({
          title: selectedEvent.title || '',
          description: selectedEvent.description || '',
          time: selectedEvent.time || '12:00',
          category: selectedEvent.category || 'discord'
        });
        setOrganizers(selectedEvent.organizers || []);
      } else {
        setFormData({
          title: '',
          description: '',
          time: '12:00',
          category: 'discord'
        });
        setOrganizers([]);
      }
      setCurrentDiscordId('');
      setCurrentRole('Líder');
      setError('');
    }
  }, [isOpen, selectedEvent]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddOrganizer = async () => {
    if (!currentDiscordId) {
      setError('Ingresa un ID de Discord');
      return;
    }

    setLoadingUser(true);
    setError('');

    try {
      const user = await getDiscordUser(currentDiscordId);
      if (user) {
        const newOrganizer = {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : null,
          role: currentRole
        };
        setOrganizers([...organizers, newOrganizer]);
        setCurrentDiscordId('');
        setCurrentRole('Líder');
      } else {
        setError('No se pudo encontrar el usuario.');
      }
    } catch (err) {
      setError('Error al buscar usuario.');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleRemoveOrganizer = (index) => {
    setOrganizers(organizers.filter((_, i) => i !== index));
  };

  // Obtener el usuario actual del localStorage
  const getCurrentUser = () => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const user = JSON.parse(saved);
      return {
        discordId: user.discordId,
        username: user.username,
        avatarUrl: user.avatarUrl
      };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const eventData = {
      ...formData,
      date: selectedDate,
      organizers: organizers
    };

    const currentUser = getCurrentUser();

    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventData, currentUser);
      } else {
        await createEvent(eventData, currentUser);
      }
      onEventCreated();
      onClose();
    } catch (error) {
      console.error("Failed to save event", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = () => {
    switch (formData.category) {
      case 'podcast': return <Mic size={16} />;
      case 'minecraft': return <Pickaxe size={16} />;
      case 'discord': return <MessageCircle size={16} />;
      default: return <MessageCircle size={16} />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{selectedEvent ? 'Editar Evento' : 'Crear Evento'}</h2>
          <button onClick={onClose} className="btn-ghost icon-btn"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <div className="form-group">
              <label><CalendarIcon size={16} /> Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Título del evento"
                required
              />
            </div>

            <div className="form-group">
              <label><AlignLeft size={16} /> Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detalles del evento..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label><Clock size={16} /> Hora</label>
              <div className="time-picker">
                <div className="time-unit">
                  <button
                    type="button"
                    className="time-btn"
                    onClick={() => {
                      const currentHour = parseInt(formData.time.split(':')[0]) || 0;
                      const newHour = (currentHour + 1) % 24;
                      const minutes = formData.time.split(':')[1] || '00';
                      setFormData({ ...formData, time: `${newHour.toString().padStart(2, '0')}:${minutes}` });
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="time-value">{formData.time.split(':')[0] || '12'}</span>
                  <button
                    type="button"
                    className="time-btn"
                    onClick={() => {
                      const currentHour = parseInt(formData.time.split(':')[0]) || 0;
                      const newHour = (currentHour - 1 + 24) % 24;
                      const minutes = formData.time.split(':')[1] || '00';
                      setFormData({ ...formData, time: `${newHour.toString().padStart(2, '0')}:${minutes}` });
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <span className="time-separator">:</span>
                <div className="time-unit">
                  <button
                    type="button"
                    className="time-btn"
                    onClick={() => {
                      const hours = formData.time.split(':')[0] || '12';
                      const currentMin = parseInt(formData.time.split(':')[1]) || 0;
                      const newMin = (currentMin + 15) % 60;
                      setFormData({ ...formData, time: `${hours}:${newMin.toString().padStart(2, '0')}` });
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="time-value">{formData.time.split(':')[1] || '00'}</span>
                  <button
                    type="button"
                    className="time-btn"
                    onClick={() => {
                      const hours = formData.time.split(':')[0] || '12';
                      const currentMin = parseInt(formData.time.split(':')[1]) || 0;
                      const newMin = (currentMin - 15 + 60) % 60;
                      setFormData({ ...formData, time: `${hours}:${newMin.toString().padStart(2, '0')}` });
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
              <span className="time-hint">🇪🇸 Hora en horario de España (se convertirá automáticamente)</span>
            </div>

            <div className="form-group">
              <label>{getCategoryIcon()} Categoría</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="category-select"
              >
                <option value="podcast">Podcast</option>
                <option value="minecraft">Minecraft</option>
                <option value="discord">Discord</option>
              </select>
            </div>

            <div className="form-group">
              <label><Hash size={16} /> Añadir Organizadores</label>
              <div className="organizer-input-group">
                <input
                  type="text"
                  value={currentDiscordId}
                  onChange={(e) => setCurrentDiscordId(e.target.value)}
                  placeholder="ID de Usuario de Discord"
                />
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="role-select"
                >
                  <option value="Líder">Líder</option>
                  <option value="Ayudante">Ayudante</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddOrganizer}
                  className="btn btn-primary"
                  disabled={loadingUser}
                >
                  {loadingUser ? '...' : <Plus size={16} />}
                </button>
              </div>
              {error && <p className="error-text">{error}</p>}
            </div>

            {organizers.length > 0 && (
              <div className="organizers-list">
                <label>Organizadores ({organizers.length})</label>
                {organizers.map((org, index) => (
                  <div key={index} className="organizer-item">
                    <div className="avatar">
                      {org.avatarUrl ? (
                        <img src={org.avatarUrl} alt={org.username} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="organizer-info">
                      <span className="username">{org.username}</span>
                      <span className="role-badge">{org.role}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOrganizer(index)}
                      className="remove-btn"
                      title="Eliminar organizador"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (selectedEvent ? 'Actualizando...' : 'Creando...') : (selectedEvent ? 'Actualizar Evento' : 'Crear Evento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
