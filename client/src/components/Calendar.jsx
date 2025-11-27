import React, { useState, useEffect, useRef } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Filter, ChevronDown, Mic, Pickaxe, MessageCircle, Calendar as CalendarIcon, Download, Loader, Globe } from 'lucide-react';
import { getEvents, deleteEvent } from '../services/api';
import EventModal from './EventModal';

const Calendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [hoveredDay, setHoveredDay] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const calendarRef = useRef(null);

    const categories = [
        { id: 'all', name: 'Todos', icon: <CalendarIcon size={16} />, color: '#6366f1' },
        { id: 'podcast', name: 'Podcast', icon: <Mic size={16} />, color: '#9333ea' },
        { id: 'minecraft', name: 'Minecraft', icon: <Pickaxe size={16} />, color: '#16a34a' },
        { id: 'discord', name: 'Discord', icon: <MessageCircle size={16} />, color: '#3b82f6' }
    ];

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'podcast': return <Mic size={14} />;
            case 'minecraft': return <Pickaxe size={14} />;
            case 'discord': return <MessageCircle size={14} />;
            default: return <CalendarIcon size={14} />;
        }
    };

    // Zona horaria del servidor (España)
    const SERVER_TIMEZONE = 'Europe/Madrid';
    
    // Obtener zona horaria del usuario
    const getUserTimezone = () => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    };

    // Convertir hora del servidor (España) a hora local del usuario
    const convertToLocalTime = (time, eventDate) => {
        if (!time) return '';
        
        const userTimezone = getUserTimezone();
        
        // Si el usuario está en España, no hace falta convertir
        if (userTimezone === SERVER_TIMEZONE) {
            return time;
        }
        
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const eventDay = new Date(eventDate);
            
            // Crear un string de fecha-hora en formato ISO para España
            const year = eventDay.getFullYear();
            const month = String(eventDay.getMonth() + 1).padStart(2, '0');
            const day = String(eventDay.getDate()).padStart(2, '0');
            const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            
            // Crear fecha interpretándola como hora de España
            // Usamos el offset de España para esa fecha específica
            const spainFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: SERVER_TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            // Crear una fecha UTC y luego convertirla
            const dateInSpain = new Date(`${year}-${month}-${day}T${timeStr}`);
            
            // Obtener el offset de España para esa fecha
            const spainDate = new Date(dateInSpain.toLocaleString('en-US', { timeZone: SERVER_TIMEZONE }));
            const utcDate = new Date(dateInSpain.toLocaleString('en-US', { timeZone: 'UTC' }));
            const spainOffset = (spainDate.getTime() - utcDate.getTime()) / 60000; // en minutos
            
            // Calcular la hora UTC del evento
            const eventUTC = new Date(dateInSpain.getTime() - spainOffset * 60000);
            
            // Convertir a la zona horaria del usuario
            const localTimeStr = eventUTC.toLocaleTimeString('es-ES', {
                timeZone: userTimezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            return localTimeStr;
        } catch (error) {
            console.error('Error converting time:', error);
            return time;
        }
    };

    // Obtener información de zona horaria
    const getTimezoneInfo = () => {
        const userTimezone = getUserTimezone();
        const now = new Date();
        
        // Offset UTC
        const utcOffset = -now.getTimezoneOffset() / 60;
        const utcSign = utcOffset >= 0 ? '+' : '';
        const utcStr = `UTC${utcSign}${utcOffset}`;
        
        // GMT format
        const gmtStr = `GMT${utcSign}${utcOffset}`;
        
        // Abreviatura corta (CET, EST, PST, etc.)
        const shortFormatter = new Intl.DateTimeFormat('en', {
            timeZone: userTimezone,
            timeZoneName: 'short'
        });
        const shortParts = shortFormatter.formatToParts(now);
        const shortName = shortParts.find(p => p.type === 'timeZoneName')?.value || '';
        
        // Nombre largo (Central European Time, etc.)
        const longFormatter = new Intl.DateTimeFormat('es', {
            timeZone: userTimezone,
            timeZoneName: 'long'
        });
        const longParts = longFormatter.formatToParts(now);
        const longName = longParts.find(p => p.type === 'timeZoneName')?.value || userTimezone;
        
        // Calcular diferencia con España
        const spainTime = new Date(now.toLocaleString('en-US', { timeZone: SERVER_TIMEZONE }));
        const localTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const diffHours = Math.round((localTime.getTime() - spainTime.getTime()) / (1000 * 60 * 60));
        
        // Ciudad/Región (Europe/Madrid -> Madrid)
        const city = userTimezone.split('/').pop().replace(/_/g, ' ');
        
        return {
            utc: utcStr,
            gmt: gmtStr,
            short: shortName,
            long: longName,
            city: city,
            diffWithSpain: diffHours,
            isSpain: userTimezone === SERVER_TIMEZONE
        };
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

    const fetchEvents = async () => {
        try {
            const data = await getEvents();
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const handleDeleteEvent = async (eventId, e) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
            try {
                await deleteEvent(eventId, getCurrentUser());
                fetchEvents();
            } catch (error) {
                console.error("Failed to delete event", error);
            }
        }
    };

    const handleEventClick = (event, e) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setSelectedDate(new Date(event.date));
        setIsModalOpen(true);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const exportCalendarImage = async () => {
        if (!calendarRef.current || isExporting) return;
        
        setIsExporting(true);
        
        try {
            // Importar html2canvas dinámicamente
            const html2canvas = (await import('html2canvas')).default;
            
            // Crear un contenedor temporal para la exportación
            const exportContainer = document.createElement('div');
            exportContainer.className = 'export-container';
            exportContainer.innerHTML = `
                <div class="export-wrapper">
                    <div class="export-header">
                        <img src="https://cdn.discordapp.com/icons/617702007188488205/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=128" class="export-logo" />
                        <div class="export-title-section">
                            <h1 class="export-title">Mango Army Eventos</h1>
                            <h2 class="export-month">${format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
                        </div>
                    </div>
                    <div class="export-calendar-wrapper"></div>
                    <div class="export-footer">
                        <div class="export-legend">
                            <span class="legend-item podcast"><span class="legend-dot"></span>Podcast</span>
                            <span class="legend-item minecraft"><span class="legend-dot"></span>Minecraft</span>
                            <span class="legend-item discord"><span class="legend-dot"></span>Discord</span>
                        </div>
                        <p class="export-watermark">discord.gg/mangoarmy</p>
                    </div>
                </div>
            `;
            
            // Estilos para la exportación
            const style = document.createElement('style');
            style.textContent = `
                .export-container {
                    position: fixed;
                    top: -9999px;
                    left: -9999px;
                    width: 1600px;
                    padding: 50px;
                    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .export-wrapper {
                    background: linear-gradient(145deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.95));
                    border-radius: 28px;
                    padding: 40px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }
                .export-header {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    margin-bottom: 32px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .export-logo {
                    width: 90px;
                    height: 90px;
                    border-radius: 20px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }
                .export-title-section {
                    display: flex;
                    flex-direction: column;
                }
                .export-title {
                    font-size: 42px;
                    font-weight: 800;
                    margin: 0;
                    color: #fbbf24;
                    text-shadow: 0 2px 10px rgba(251, 191, 36, 0.3);
                    letter-spacing: -0.5px;
                }
                .export-month {
                    font-size: 22px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 6px 0 0 0;
                    text-transform: capitalize;
                }
                .export-calendar-wrapper {
                    border-radius: 16px;
                    overflow: hidden;
                }
                .export-calendar-wrapper .day-cell {
                    min-height: 130px !important;
                    padding: 10px !important;
                }
                .export-calendar-wrapper .event-pill {
                    padding: 10px 14px !important;
                    font-size: 15px !important;
                    border-radius: 10px !important;
                    margin-bottom: 8px !important;
                }
                .export-calendar-wrapper .event-time {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                }
                .export-calendar-wrapper .event-title {
                    font-size: 16px !important;
                    font-weight: 600 !important;
                }
                .export-calendar-wrapper .event-avatar {
                    width: 28px !important;
                    height: 28px !important;
                }
                .export-calendar-wrapper .day-number {
                    font-size: 20px !important;
                    font-weight: 600 !important;
                }
                .export-calendar-wrapper .day-name {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    padding: 16px 0 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                }
                .export-calendar-wrapper .days-row {
                    background: rgba(255, 255, 255, 0.05) !important;
                }
                .export-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 28px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                .export-legend {
                    display: flex;
                    gap: 28px;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 500;
                }
                .legend-dot {
                    width: 16px;
                    height: 16px;
                    border-radius: 5px;
                }
                .legend-item.podcast .legend-dot { background: linear-gradient(135deg, #9333ea, #a855f7); }
                .legend-item.minecraft .legend-dot { background: linear-gradient(135deg, #16a34a, #22c55e); }
                .legend-item.discord .legend-dot { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
                .export-watermark {
                    font-size: 18px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0;
                    font-weight: 500;
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(exportContainer);
            
            // Clonar el calendario y ponerlo en el wrapper
            const calendarClone = calendarRef.current.cloneNode(true);
            calendarClone.style.height = 'auto';
            calendarClone.style.maxHeight = 'none';
            calendarClone.style.background = 'transparent';
            calendarClone.style.border = 'none';
            calendarClone.style.boxShadow = 'none';
            
            // Remover tooltips, botones de delete, filtros y el header completo del clon
            calendarClone.querySelectorAll('.day-tooltip, .delete-btn, .filter-dropdown, .calendar-header').forEach(el => el.remove());
            
            exportContainer.querySelector('.export-calendar-wrapper').appendChild(calendarClone);
            
            // Generar la imagen
            const canvas = await html2canvas(exportContainer, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });
            
            // Descargar la imagen
            const link = document.createElement('a');
            const monthName = format(currentMonth, 'MMMM-yyyy', { locale: es });
            link.download = `calendario-mango-army-${monthName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Limpiar
            document.body.removeChild(exportContainer);
            document.head.removeChild(style);
            
        } catch (error) {
            console.error('Error exportando calendario:', error);
            alert('Error al exportar el calendario. Asegúrate de tener conexión a internet.');
        } finally {
            setIsExporting(false);
        }
    };

    const onDateClick = (day) => {
        setSelectedDate(day);
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    const renderHeader = () => {
        const currentCategory = categories.find(c => c.id === categoryFilter);
        const tzInfo = getTimezoneInfo();
        
        return (
            <div className="calendar-header">
                <div className="header-left">
                    <h1 className="month-title">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h1>
                    
                    {/* Indicadores de zona horaria */}
                    <div className="timezone-badges" title={tzInfo.long}>
                        <span className="tz-badge tz-city">
                            <Globe size={14} />
                            {tzInfo.city}
                        </span>
                        <span className="tz-badge tz-utc">
                            {tzInfo.utc}
                        </span>
                        <span className="tz-badge tz-gmt">
                            {tzInfo.gmt}
                        </span>
                        <span className="tz-badge tz-short">
                            {tzInfo.short}
                        </span>
                        {!tzInfo.isSpain && (
                            <span className="tz-badge tz-spain">
                                🇪🇸 {tzInfo.diffWithSpain > 0 ? '+' : ''}{tzInfo.diffWithSpain}h
                            </span>
                        )}
                    </div>
                    
                    {/* Filtro desplegable */}
                    <div className="filter-dropdown">
                        <button 
                            className="filter-toggle"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            style={{ '--filter-color': currentCategory?.color }}
                        >
                            <Filter size={16} />
                            <span>{currentCategory?.name}</span>
                            <ChevronDown size={16} className={`chevron ${isFilterOpen ? 'open' : ''}`} />
                        </button>
                        
                        {isFilterOpen && (
                            <div className="filter-menu">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`filter-option ${categoryFilter === cat.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setCategoryFilter(cat.id);
                                            setIsFilterOpen(false);
                                        }}
                                        style={{ '--option-color': cat.color }}
                                    >
                                        {cat.icon}
                                        <span>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="header-right">
                    <button 
                        onClick={exportCalendarImage} 
                        className="btn-export"
                        disabled={isExporting}
                        title="Exportar calendario como imagen"
                    >
                        {isExporting ? <Loader size={18} className="spin" /> : <Download size={18} />}
                        <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
                    </button>
                    <button onClick={prevMonth} className="btn-ghost icon-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextMonth} className="btn-ghost icon-btn">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        return (
            <div className="days-row">
                {days.map(day => (
                    <div className="day-name" key={day}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
        let endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const dateFormat = "d";

        // Obtener todos los días del rango
        let dayInterval = eachDayOfInterval({
            start: startDate,
            end: endDate
        });
        
        // Calcular cuántas filas necesitamos
        const numWeeks = Math.ceil(dayInterval.length / 7);

        return (
            <div className="calendar-grid" style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}>
                {dayInterval.map((dayItem) => {
                    const isCurrentMonth = isSameMonth(dayItem, monthStart);
                    const dayKey = format(dayItem, 'yyyy-MM-dd');
                    const allDayEvents = events
                        .filter(e => isSameDay(new Date(e.date), dayItem))
                        .sort((a, b) => {
                            const timeA = a.time ? a.time.replace(':', '') : '0000';
                            const timeB = b.time ? b.time.replace(':', '') : '0000';
                            return parseInt(timeA) - parseInt(timeB);
                        });
                    const filteredDayEvents = categoryFilter === 'all' 
                        ? allDayEvents 
                        : allDayEvents.filter(e => e.category === categoryFilter);

                    return (
                        <div
                            className={`day-cell ${!isCurrentMonth ? 'disabled' : ''} ${filteredDayEvents.length > 0 ? 'has-events' : ''}`}
                            key={dayItem.toString()}
                            onClick={() => onDateClick(dayItem)}
                            onMouseEnter={() => filteredDayEvents.length > 0 && setHoveredDay(dayKey)}
                            onMouseLeave={() => setHoveredDay(null)}
                        >
                            <span className="day-number">{format(dayItem, dateFormat)}</span>
                            <div className="events-list">
                                {filteredDayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`event-pill event-${event.category || 'discord'}`}
                                        onClick={(e) => handleEventClick(event, e)}
                                    >
                                        <div className="event-time">{convertToLocalTime(event.time, event.date)}</div>
                                        <div className="event-title">{event.title}</div>
                                        {event.organizers && event.organizers.length > 0 && (
                                            <div className="organizers-avatars">
                                                {event.organizers.slice(0, 3).map((org, idx) => (
                                                    org.avatarUrl && (
                                                        <img
                                                            key={idx}
                                                            src={org.avatarUrl}
                                                            className="event-avatar"
                                                            alt={org.username}
                                                            title={`${org.username} (${org.role})`}
                                                        />
                                                    )
                                                ))}
                                                {event.organizers.length > 3 && (
                                                    <span className="more-count" title={`+${event.organizers.length - 3} más`}>
                                                        +{event.organizers.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => handleDeleteEvent(event.id, e)}
                                            title="Eliminar evento"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Tooltip al hacer hover */}
                            {hoveredDay === dayKey && filteredDayEvents.length > 0 && (
                                <div className="day-tooltip">
                                    <div className="tooltip-date">
                                        {format(dayItem, "EEEE d 'de' MMMM", { locale: es })}
                                    </div>
                                    <div className="tooltip-events">
                                        {filteredDayEvents.map(event => (
                                            <div 
                                                key={event.id} 
                                                className={`tooltip-event event-${event.category}`}
                                                onClick={(e) => handleEventClick(event, e)}
                                            >
                                                <div className="tooltip-event-header">
                                                    {getCategoryIcon(event.category)}
                                                    <span className="tooltip-event-category">{event.category}</span>
                                                    <span className="tooltip-event-time">{convertToLocalTime(event.time, event.date)}</span>
                                                </div>
                                                <div className="tooltip-event-title">{event.title}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="calendar-container" ref={calendarRef}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <EventModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                selectedDate={selectedDate}
                selectedEvent={selectedEvent}
                onEventCreated={fetchEvents}
            />

            <style>{`
        .calendar-container {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          overflow: visible;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: calc(100vh - 120px);
          max-height: calc(100vh - 120px);
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-shrink: 0;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        /* Timezone Badges */
        .timezone-badges {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          cursor: help;
        }
        .tz-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .tz-badge.tz-city {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        .tz-badge.tz-utc {
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #818cf8;
        }
        .tz-badge.tz-gmt {
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(14, 165, 233, 0.3);
          color: #0ea5e9;
        }
        .tz-badge.tz-short {
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.3);
          color: #ec4899;
        }
        .tz-badge.tz-spain {
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }
        
        .header-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
        }
        
        /* Export Button */
        .btn-export {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }
        .btn-export:hover:not(:disabled) {
          background: linear-gradient(135deg, #d97706, #b45309);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }
        .btn-export:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-export .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Filter Dropdown */
        .filter-dropdown {
          position: relative;
        }
        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-toggle:hover {
          border-color: var(--filter-color, var(--accent-primary));
          color: var(--text-primary);
        }
        .filter-toggle .chevron {
          transition: transform 0.2s;
        }
        .filter-toggle .chevron.open {
          transform: rotate(180deg);
        }
        .filter-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          min-width: 150px;
          z-index: 1000;
          overflow: hidden;
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .filter-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        .filter-option:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .filter-option.active {
          background: var(--option-color, var(--accent-primary));
          color: white;
        }
        
        .btn-ghost.icon-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-ghost.icon-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }
        .month-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: capitalize;
        }
        .days-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 0.5rem;
          flex-shrink: 0;
        }
        .day-name {
          text-align: center;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 0.875rem;
          letter-spacing: 0.05em;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--border-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: visible;
          width: 100%;
          flex: 1;
          min-height: 0;
        }
        .day-cell {
          background: var(--bg-secondary);
          padding: 0.25rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow: hidden;
          position: relative;
          min-height: 0;
        }
        .day-cell.has-events:hover {
          background: var(--bg-tertiary);
          z-index: 10;
        }
        .day-cell.disabled {
          background: var(--bg-primary);
          color: var(--text-secondary);
          opacity: 0.4;
        }
        .day-number {
          font-weight: 600;
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1;
        }
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow: hidden;
          flex: 1;
          min-height: 0;
        }
        .event-pill {
          color: white;
          padding: 0.15rem 0.35rem;
          border-radius: var(--radius-sm);
          font-size: 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          flex-shrink: 0;
        }
        .event-podcast {
          background: linear-gradient(135deg, #9333ea, #a855f7);
        }
        .event-minecraft {
          background: linear-gradient(135deg, #16a34a, #22c55e);
        }
        .event-discord {
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
        }
        .event-pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .event-pill:hover .delete-btn {
          opacity: 1;
        }
        .event-time {
          font-weight: 700;
          white-space: nowrap;
          font-size: 0.55rem;
        }
        .event-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          font-size: 0.6rem;
        }
        .organizers-avatars {
          display: flex;
          align-items: center;
          gap: 0.1rem;
        }
        .event-avatar {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .more-count {
          font-size: 0.6rem;
          font-weight: 600;
          background: rgba(255,255,255,0.2);
          padding: 0.1rem 0.3rem;
          border-radius: var(--radius-sm);
        }
        .delete-btn {
          background: rgba(239, 68, 68, 0.9);
          border: none;
          color: white;
          padding: 0.15rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s;
          margin-left: auto;
        }
        .delete-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }
        
        /* Day Tooltip */
        .day-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          min-width: 250px;
          max-width: 300px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          animation: tooltipFadeIn 0.2s ease-out;
          pointer-events: auto;
        }
        .day-tooltip::before {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid var(--border-color);
        }
        .day-tooltip::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid var(--bg-secondary);
        }
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .tooltip-date {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: capitalize;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .tooltip-events {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .tooltip-event {
          padding: 0.6rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tooltip-event:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }
        .tooltip-event.event-podcast {
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(168, 85, 247, 0.2));
          border: 1px solid rgba(147, 51, 234, 0.3);
        }
        .tooltip-event.event-minecraft {
          background: linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(34, 197, 94, 0.2));
          border: 1px solid rgba(22, 163, 74, 0.3);
        }
        .tooltip-event.event-discord {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.2));
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .tooltip-event-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.3rem;
        }
        .tooltip-event-category {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .tooltip-event-time {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .tooltip-event-title {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
        }
      `}</style>
        </div>
    );
};

export default Calendar;
