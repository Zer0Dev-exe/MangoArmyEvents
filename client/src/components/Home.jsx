import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ChevronLeft, ChevronRight, LogIn, UserPlus, Calendar, Users, Mic, Pickaxe, MessageCircle, Sparkles, Sun, Moon } from 'lucide-react';
import { getEvents } from '../services/api';
import './Home.css';

const SERVER_ID = '617702007188488205';

const Home = () => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [serverIcon, setServerIcon] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [hoveredDay, setHoveredDay] = useState(null);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const categories = [
        { id: 'all', name: 'Todos', icon: <Calendar size={16} />, color: '#6366f1' },
        { id: 'podcast', name: 'Podcast', icon: <Mic size={16} />, color: '#9333ea' },
        { id: 'minecraft', name: 'Minecraft', icon: <Pickaxe size={16} />, color: '#16a34a' },
        { id: 'discord', name: 'Discord', icon: <MessageCircle size={16} />, color: '#3b82f6' }
    ];

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await getEvents();
                setEvents(data);
            } catch (error) {
                console.error("Failed to fetch events", error);
            }
        };
        fetchEvents();

        // Cargar icono del servidor
        const iconUrl = `https://cdn.discordapp.com/icons/${SERVER_ID}/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=128`;
        setServerIcon(iconUrl);
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'podcast': return <Mic size={14} />;
            case 'minecraft': return <Pickaxe size={14} />;
            case 'discord': return <MessageCircle size={14} />;
            default: return <Calendar size={14} />;
        }
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
        let endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        // Asegurar que siempre se muestren 6 semanas (42 días) para consistencia visual
        let dayInterval = eachDayOfInterval({ start: startDate, end: endDate });
        while (dayInterval.length < 42) {
            endDate = new Date(endDate);
            endDate.setDate(endDate.getDate() + 7);
            dayInterval = eachDayOfInterval({ start: startDate, end: endDate });
        }
        // Limitar a exactamente 42 días
        dayInterval = dayInterval.slice(0, 42);

        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        return (
            <div className="home-calendar">
                <div className="calendar-nav">
                    <button onClick={prevMonth} className="nav-arrow">
                        <ChevronLeft size={20} />
                    </button>
                    <h2>{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
                    <button onClick={nextMonth} className="nav-arrow">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="calendar-days-header">
                    {days.map(day => (
                        <div key={day} className="day-header">{day}</div>
                    ))}
                </div>

                <div className="calendar-days">
                    {dayInterval.map((day) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const allDayEvents = events
                            .filter(e => isSameDay(new Date(e.date), day))
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
                                key={day.toString()}
                                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${filteredDayEvents.length > 0 ? 'has-events' : ''}`}
                                onMouseEnter={() => filteredDayEvents.length > 0 && setHoveredDay(dayKey)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                <span className="day-number">{format(day, 'd')}</span>
                                {filteredDayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`event-dot event-${event.category}`}
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        {getCategoryIcon(event.category)}
                                        <span className="event-text">{event.title}</span>
                                    </div>
                                ))}

                                {/* Tooltip al hacer hover */}
                                {hoveredDay === dayKey && filteredDayEvents.length > 0 && (
                                    <div className="day-tooltip">
                                        <div className="tooltip-date">
                                            {format(day, "EEEE d 'de' MMMM", { locale: es })}
                                        </div>
                                        <div className="tooltip-events">
                                            {filteredDayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`tooltip-event event-${event.category}`}
                                                    onClick={() => setSelectedEvent(event)}
                                                >
                                                    <div className="tooltip-event-header">
                                                        {getCategoryIcon(event.category)}
                                                        <span className="tooltip-event-category">{event.category}</span>
                                                        <span className="tooltip-event-time">{event.time}</span>
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
            </div>
        );
    };

    return (
        <div className="home-layout">
            {/* Sidebar izquierdo */}
            <aside className="home-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        {serverIcon && (
                            <img src={serverIcon} alt="Mango Army" className="sidebar-logo-img" />
                        )}
                    </div>
                    <div className="sidebar-title">
                        <h1>Mango Army</h1>
                        <span className="sidebar-subtitle">Eventos</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Filtros</span>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`nav-item ${categoryFilter === cat.id ? 'active' : ''}`}
                                onClick={() => setCategoryFilter(cat.id)}
                                style={{ '--filter-color': cat.color }}
                            >
                                {cat.icon}
                                <span>{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="footer-extras">
                        <div className="version-container">
                            <span className="version-label">VERSION</span>
                            <span className="version-number">0.1.0</span>
                        </div>
                        <button
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            className="news-btn"
                            onClick={() => navigate('/novedades')}
                            title="Ver Novedades"
                        >
                            <Sparkles size={18} />
                        </button>
                    </div>
                    <button onClick={() => navigate('/login')} className="sidebar-btn btn-login">
                        <LogIn size={18} />
                        <span>Iniciar Sesión</span>
                    </button>
                    <button onClick={() => navigate('/solicitar-staff')} className="sidebar-btn btn-register">
                        <UserPlus size={18} />
                        <span>Solicitar Acceso</span>
                    </button>
                </div>
            </aside>

            {/* Contenido principal - Calendario */}
            <main className="home-main">
                {renderCalendar()}

                {selectedEvent && (
                    <div className="event-preview-overlay" onClick={() => setSelectedEvent(null)}>
                        <div className="event-preview" onClick={(e) => e.stopPropagation()}>
                            <div className={`event-preview-header event-${selectedEvent.category}`}>
                                {getCategoryIcon(selectedEvent.category)}
                                <span>{selectedEvent.category}</span>
                            </div>
                            <h3>{selectedEvent.title}</h3>
                            <p className="event-time">🕐 {selectedEvent.time}</p>
                            <p className="event-date">📅 {format(new Date(selectedEvent.date), "d 'de' MMMM, yyyy", { locale: es })}</p>
                            {selectedEvent.description && (
                                <p className="event-description">{selectedEvent.description}</p>
                            )}
                            {selectedEvent.organizers && selectedEvent.organizers.length > 0 && (
                                <div className="event-organizers">
                                    <span><Users size={16} /> Organizadores:</span>
                                    <div className="organizers-list">
                                        {selectedEvent.organizers.map((org, idx) => (
                                            <div key={idx} className="organizer">
                                                {org.avatarUrl && <img src={org.avatarUrl} alt={org.username} />}
                                                <span>{org.username}</span>
                                                <span className="role">({org.role})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => setSelectedEvent(null)} className="btn-close">
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
export default Home;
