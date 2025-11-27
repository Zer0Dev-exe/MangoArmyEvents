import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Mic, Pickaxe, MessageCircle } from 'lucide-react';
import { getEvents } from '../services/api';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const NextEventPopup = () => {
  const [nextEvent, setNextEvent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const events = await getEvents();
        const now = new Date();
        const today = startOfDay(now);

        // Find next event (today or future)
        const upcomingEvents = events
          .filter(e => {
            const eventDate = startOfDay(new Date(e.date));
            return isAfter(eventDate, today) || format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingEvents.length > 0) {
          setNextEvent(upcomingEvents[0]);
          // Only show popup if not dismissed in this session
          const dismissed = sessionStorage.getItem('nextEventDismissed');
          if (!dismissed) {
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch next event", error);
      }
    };

    fetchNextEvent();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('nextEventDismissed', 'true');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'podcast': return <Mic size={28} />;
      case 'minecraft': return <Pickaxe size={28} />;
      case 'discord': return <MessageCircle size={28} />;
      default: return <Calendar size={28} />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'podcast': return '#9333ea';
      case 'minecraft': return '#16a34a';
      case 'discord': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  if (!isOpen || !nextEvent) return null;

  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="popup-header" style={{
          '--category-color-1': getCategoryColor(nextEvent.category),
          '--category-color-2': `${getCategoryColor(nextEvent.category)}dd`
        }}>
          <div className="popup-icon">
            {getCategoryIcon(nextEvent.category)}
          </div>
          <h2>Próximo Evento</h2>
        </div>

        <div className="popup-body">
          <h3>{nextEvent.title}</h3>
          {nextEvent.description && (
            <p className="event-description">{nextEvent.description}</p>
          )}

          <div className="event-details">
            <div className="detail-item">
              <Calendar size={20} />
              <span>{format(new Date(nextEvent.date), 'PPPP', { locale: es })}</span>
            </div>
            <div className="detail-item">
              <Clock size={20} />
              <span>{nextEvent.time}</span>
            </div>
          </div>

          {nextEvent.organizers && nextEvent.organizers.length > 0 && (
            <div className="organizers-section">
              <h4><User size={18} /> Organizadores</h4>
              <div className="organizers-list">
                {nextEvent.organizers.map((org, idx) => (
                  <div key={idx} className="organizer-item">
                    {org.avatarUrl && (
                      <img src={org.avatarUrl} alt={org.username} className="organizer-avatar" />
                    )}
                    <div className="organizer-info">
                      <span className="organizer-name">{org.username}</span>
                      <span className="organizer-role">{org.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(12px);
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .popup-content {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
          border-radius: 24px;
          box-shadow: 
            0 25px 80px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          max-width: 550px;
          width: 90%;
          overflow: hidden;
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(40px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        .popup-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.6rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }
        .popup-close:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        .popup-header {
          padding: 2.5rem 2rem;
          background: linear-gradient(135deg, var(--category-color-1), var(--category-color-2));
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          position: relative;
          overflow: hidden;
        }
        .popup-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .popup-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
          animation: iconFloat 3s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .popup-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
        }
        .popup-body {
          padding: 2.5rem;
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, transparent 100%);
        }
        .popup-body h3 {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.25rem;
          line-height: 1.3;
        }
        .event-description {
          color: rgba(226, 232, 240, 0.9);
          line-height: 1.8;
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .event-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1.25rem;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: rgba(226, 232, 240, 0.95);
          font-size: 1rem;
          font-weight: 500;
        }
        .detail-item svg {
          color: #fbbf24;
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
        }
        .organizers-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid rgba(249, 115, 22, 0.2);
        }
        .organizers-section h4 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          font-weight: 700;
          background: linear-gradient(90deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .organizers-section h4 svg {
          color: #f97316;
          filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.5));
        }
        .organizers-list {
          display: grid;
          gap: 1rem;
        }
        .organizer-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(251, 191, 36, 0.05));
          border-radius: 16px;
          border: 1px solid rgba(249, 115, 22, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .organizer-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.1), transparent);
          transition: 0.6s;
        }
        .organizer-item:hover::before {
          left: 100%;
        }
        .organizer-item:hover {
          transform: translateX(4px);
          border-color: rgba(249, 115, 22, 0.4);
          box-shadow: 
            0 8px 24px rgba(249, 115, 22, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(251, 191, 36, 0.08));
        }
        .organizer-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 3px solid rgba(249, 115, 22, 0.4);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.3),
            0 0 0 4px rgba(249, 115, 22, 0.1);
          transition: all 0.3s ease;
        }
        .organizer-item:hover .organizer-avatar {
          border-color: rgba(249, 115, 22, 0.6);
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.4),
            0 0 0 4px rgba(249, 115, 22, 0.2),
            0 0 20px rgba(249, 115, 22, 0.3);
          transform: scale(1.05);
        }
        .organizer-info {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 1;
        }
        .organizer-name {
          font-weight: 700;
          color: rgba(248, 250, 252, 0.95);
          font-size: 1.05rem;
          letter-spacing: 0.3px;
        }
        .organizer-role {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(251, 191, 36, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .organizer-role::before {
          content: '★';
          color: #fbbf24;
          font-size: 0.9rem;
          animation: sparkle 2s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default NextEventPopup;
