import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Clock, Plus, Edit, Trash2, LogIn, UserPlus, UserMinus } from 'lucide-react';
import { getLogs } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Logs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getLogs();
        const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(sorted);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      }
    };
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <Plus size={18} />;
      case 'update': return <Edit size={18} />;
      case 'delete': return <Trash2 size={18} />;
      case 'session': return <LogIn size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return '#16a34a';
      case 'update': return '#3b82f6';
      case 'delete': return '#ef4444';
      case 'session': return '#8b5cf6';
      default: return '#6366f1';
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'create': return 'Evento creado';
      case 'update': return 'Evento actualizado';
      case 'delete': return 'Evento eliminado';
      case 'session': return 'Inicio de sesión';
      default: return 'Acción';
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

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return null;

    return (
      <div className="changes-section">
        <h4>📝 Cambios realizados:</h4>
        <div className="changes-list">
          {changes.title && (
            <div className="change-item">
              <strong>Título:</strong>
              <span className="old-value">"{changes.title.old}"</span>
              <span className="arrow">→</span>
              <span className="new-value">"{changes.title.new}"</span>
            </div>
          )}
          {changes.description && (
            <div className="change-item">
              <strong>Descripción:</strong>
              <span className="old-value">"{changes.description.old}"</span>
              <span className="arrow">→</span>
              <span className="new-value">"{changes.description.new}"</span>
            </div>
          )}
          {changes.time && (
            <div className="change-item">
              <strong>Hora:</strong>
              <span className="old-value">{changes.time.old}</span>
              <span className="arrow">→</span>
              <span className="new-value">{changes.time.new}</span>
            </div>
          )}
          {changes.category && (
            <div className="change-item">
              <strong>Categoría:</strong>
              <span className="old-value">{changes.category.old}</span>
              <span className="arrow">→</span>
              <span className="new-value">{changes.category.new}</span>
            </div>
          )}
          {changes.date && (
            <div className="change-item">
              <strong>Fecha:</strong>
              <span className="old-value">{format(new Date(changes.date.old), 'PPP', { locale: es })}</span>
              <span className="arrow">→</span>
              <span className="new-value">{format(new Date(changes.date.new), 'PPP', { locale: es })}</span>
            </div>
          )}
          {changes.organizersAdded && changes.organizersAdded.length > 0 && (
            <div className="change-item organizer-change added">
              <div className="change-header">
                <UserPlus size={16} />
                <strong>Organizadores añadidos ({changes.organizersAdded.length}):</strong>
              </div>
              <div className="organizers-grid">
                {changes.organizersAdded.map((org, idx) => (
                  <div key={idx} className="organizer-card added-card">
                    {org.avatarUrl && (
                      <img src={org.avatarUrl} alt={org.username} className="org-avatar" />
                    )}
                    <div className="org-info">
                      <span className="org-username">{org.username}</span>
                      <span className="org-role">{org.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {changes.organizersRemoved && changes.organizersRemoved.length > 0 && (
            <div className="change-item organizer-change removed">
              <div className="change-header">
                <UserMinus size={16} />
                <strong>Organizadores eliminados ({changes.organizersRemoved.length}):</strong>
              </div>
              <div className="organizers-grid">
                {changes.organizersRemoved.map((org, idx) => (
                  <div key={idx} className="organizer-card removed-card">
                    {org.avatarUrl && (
                      <img src={org.avatarUrl} alt={org.username} className="org-avatar" />
                    )}
                    <div className="org-info">
                      <span className="org-username">{org.username}</span>
                      <span className="org-role">{org.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h1><FileText size={24} /> Registro de Actividad</h1>
        <p className="subtitle">Historial completo de todas las acciones realizadas</p>
      </div>

      <div className="logs-list">
        {logs.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No hay actividad registrada</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="log-item">
              <div
                className="log-icon"
                style={{
                  backgroundColor: `${getActionColor(log.action)}20`,
                  color: getActionColor(log.action)
                }}
              >
                {getActionIcon(log.action)}
              </div>
              <div className="log-content">
                <div className="log-main">
                  <div className="action-header">
                    <span className="action-badge" style={{
                      backgroundColor: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action)
                    }}>
                      {getActionText(log.action)}
                    </span>
                    {log.performedBy && (
                      <span className="performed-by">
                        {log.performedBy.avatarUrl && (
                          <img 
                            src={log.performedBy.avatarUrl} 
                            alt={log.performedBy.username} 
                            className="performer-avatar"
                          />
                        )}
                        <span className="performer-name">{log.performedBy.username}</span>
                      </span>
                    )}
                    <span className="timestamp">
                      {format(new Date(log.timestamp), 'PPp', { locale: es })}
                    </span>
                  </div>

                  {log.action === 'session' ? (
                    <div className="session-info">
                      <h3>Acceso a la aplicación</h3>
                      <p className="session-details">
                        IP: {log.event.ip || 'No disponible'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3>{log.event.title}</h3>
                      {log.event.category && (
                        <span className="category-badge" style={{
                          backgroundColor: `${getCategoryColor(log.event.category)}20`,
                          color: getCategoryColor(log.event.category)
                        }}>
                          {log.event.category}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {log.action !== 'session' && (
                  <>
                    {log.event.description && (
                      <p className="log-description">{log.event.description}</p>
                    )}

                    {log.changes && renderChanges(log.changes)}

                    <div className="log-meta">
                      <span><Calendar size={14} /> {format(new Date(log.event.date), 'PPP', { locale: es })}</span>
                      <span><Clock size={14} /> {log.event.time}</span>
                      {log.event.organizers && log.event.organizers.length > 0 && (
                        <span><User size={14} /> {log.event.organizers.length} organizador(es)</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .logs-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }
        .logs-header {
          margin-bottom: 2rem;
        }
        .logs-header h1 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .logs-header .subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
        }
        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }
        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        .log-item {
          display: flex;
          gap: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          transition: all 0.2s;
        }
        .log-item:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-lg);
        }
        .log-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .log-content {
          flex: 1;
        }
        .log-main {
          margin-bottom: 0.75rem;
        }
        .action-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }
        .action-badge {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .performed-by {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
        }
        .performer-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          object-fit: cover;
        }
        .performer-name {
          color: var(--text-primary);
          font-weight: 500;
        }
        .timestamp {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-style: italic;
          margin-left: auto;
        }
        .log-main h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .category-badge {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
        }
        .log-description {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .changes-section {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .changes-section h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }
        .changes-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .change-item {
          font-size: 0.875rem;
          color: var(--text-secondary);
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }
        .change-item strong {
          color: var(--text-primary);
          margin-right: 0.5rem;
        }
        .old-value {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          font-weight: 500;
        }
        .new-value {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          font-weight: 500;
        }
        .arrow {
          margin: 0 0.5rem;
          color: var(--text-secondary);
          font-weight: bold;
        }
        .organizer-change {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .change-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .organizers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        .organizer-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          border: 2px solid;
          transition: all 0.2s;
        }
        .added-card {
          background: rgba(34, 197, 94, 0.05);
          border-color: rgba(34, 197, 94, 0.3);
        }
        .added-card:hover {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
        }
        .removed-card {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .removed-card:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }
        .org-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
        }
        .org-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .org-username {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .org-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          width: fit-content;
        }
        .org-name {
          background: var(--bg-secondary);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          margin-left: 0.25rem;
        }
        .session-info {
          margin-top: 0.5rem;
        }
        .session-info h3 {
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .session-details {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .log-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .log-meta span {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
      `}</style>
    </div>
  );
};

export default Logs;
