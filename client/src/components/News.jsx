import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ChevronDown, ChevronRight, Sun, Moon } from 'lucide-react';
import './Home.css';

const News = () => {
    const navigate = useNavigate();
    const [selectedVersion, setSelectedVersion] = useState('0.1.0');
    const [expandedVersions, setExpandedVersions] = useState({ '0.1.0': true });
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const versions = [
        {
            version: '0.1.0',
            date: '26 Nov 2025',
            features: [
                { icon: '🎉', title: 'Lanzamiento Inicial', desc: 'Primera versión del panel de eventos con todas las funcionalidades básicas' },
                { icon: '📅', title: 'Calendario Interactivo', desc: 'Visualiza y filtra eventos por categoría con un diseño moderno y responsivo' },
                { icon: '🔐', title: 'Sistema de Autenticación', desc: 'Login con Discord ID y gestión de roles (Admin, Staff, User)' },
                { icon: '✨', title: 'Detalles de Eventos', desc: 'Visualización completa de información de eventos con organizadores y descripciones' },
                { icon: '📝', title: 'Gestión de Eventos', desc: 'Crear, editar y eliminar eventos con múltiples organizadores' },
                { icon: '🎯', title: 'Filtros por Categoría', desc: 'Filtra eventos por Podcast, Minecraft o Discord' }
            ]
        }
    ];

    const toggleVersion = (version) => {
        setExpandedVersions(prev => ({
            ...prev,
            [version]: !prev[version]
        }));
    };

    const currentVersionData = versions.find(v => v.version === selectedVersion);

    return (
        <div className="home-layout">
            {/* Sidebar de versiones */}
            <div className="news-sidebar">
                <div className="news-sidebar-header">
                    <Sparkles size={24} className="sidebar-sparkle" />
                    <h3>Versiones</h3>
                </div>

                <div className="news-sidebar-content">
                    {versions.map((v) => (
                        <div key={v.version} className="version-group">
                            <button
                                className={`version-item ${selectedVersion === v.version ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedVersion(v.version);
                                    toggleVersion(v.version);
                                }}
                            >
                                {expandedVersions[v.version] ?
                                    <ChevronDown size={16} /> :
                                    <ChevronRight size={16} />
                                }
                                <span className="version-number">v{v.version}</span>
                            </button>
                            {expandedVersions[v.version] && (
                                <div className="version-details">
                                    <span className="version-date">{v.date}</span>
                                    <span className="version-features-count">{v.features.length} novedades</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Botón de tema flotante */}
            <button className="theme-toggle-floating" onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Contenido principal */}
            <div className="news-main-content">
                <button onClick={() => navigate('/')} className="back-btn">
                    <ArrowLeft size={18} />
                    Volver al Inicio
                </button>

                <div className="news-content-header">
                    <div className="news-version-badge-large">
                        <Sparkles size={20} />
                        <span>Versión {currentVersionData.version}</span>
                    </div>
                    <span className="news-date-large">{currentVersionData.date}</span>
                </div>

                <div className="news-features-grid">
                    {currentVersionData.features.map((feature, idx) => (
                        <div key={idx} className="news-feature-card">
                            <div className="feature-icon-large">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <style>{`
                    /* News Sidebar */
                    .news-sidebar {
                        width: 280px;
                        background: var(--bg-secondary);
                        border-right: 1px solid var(--border-color);
                        display: flex;
                        flex-direction: column;
                        flex-shrink: 0;
                    }
                    .news-sidebar-header {
                        padding: 1.5rem;
                        border-bottom: 1px solid var(--border-color);
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        background: linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(251, 191, 36, 0.03));
                    }
                    .sidebar-sparkle {
                        color: #fbbf24;
                        filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
                        animation: sparkle 2s ease-in-out infinite;
                    }
                    .news-sidebar-header h3 {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 700;
                        background: linear-gradient(90deg, #f97316, #fbbf24);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    .news-sidebar-content {
                        padding: 1rem;
                        overflow-y: auto;
                        flex: 1;
                    }
                    .version-group {
                        margin-bottom: 0.5rem;
                    }
                    .version-item {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.875rem 1rem;
                        background: transparent;
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        color: var(--text-primary);
                        font-weight: 600;
                        font-size: 0.95rem;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .version-item:hover {
                        background: var(--bg-tertiary);
                        border-color: rgba(249, 115, 22, 0.3);
                        transform: translateX(4px);
                    }
                    .version-item.active {
                        background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 191, 36, 0.1));
                        border-color: rgba(249, 115, 22, 0.4);
                        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
                    }
                    .version-item.active .version-number {
                        background: linear-gradient(90deg, #f97316, #fbbf24);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    .version-details {
                        padding: 0.75rem 1rem 0.5rem 2.75rem;
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                        animation: slideDown 0.3s ease-out;
                    }
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .version-date {
                        font-size: 0.8rem;
                        color: var(--text-secondary);
                    }
                    .version-features-count {
                        font-size: 0.75rem;
                        color: #f97316;
                        font-weight: 600;
                    }

                    /* News Main Content */
                    .news-main-content {
                        flex: 1;
                        padding: 2rem;
                        overflow-y: auto;
                        background: var(--bg-primary);
                    }
                    .back-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.75rem 1.5rem;
                        background: var(--bg-tertiary);
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        color: #f97316;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        margin-bottom: 2rem;
                    }
                    .back-btn:hover {
                        background: rgba(249, 115, 22, 0.1);
                        border-color: rgba(249, 115, 22, 0.4);
                        transform: translateX(-4px);
                        box-shadow: 0 4px 16px rgba(249, 115, 22, 0.2);
                    }
                    .news-content-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 2.5rem;
                        padding-bottom: 1.5rem;
                        border-bottom: 2px solid var(--border-color);
                    }
                    .news-version-badge-large {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 1rem 2rem;
                        background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.2));
                        border: 1px solid rgba(249, 115, 22, 0.4);
                        border-radius: 16px;
                        color: #f97316;
                        font-weight: 800;
                        font-size: 1.5rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        box-shadow: 0 8px 24px rgba(249, 115, 22, 0.2);
                    }
                    .news-version-badge-large svg {
                        animation: sparkle 2s ease-in-out infinite;
                    }
                    .news-date-large {
                        font-size: 1.1rem;
                        color: var(--text-secondary);
                        font-weight: 600;
                    }
                    .news-features-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                        max-width: 900px;
                    }
                    .news-feature-card {
                        background: var(--bg-secondary);
                        border-radius: 16px;
                        padding: 1.25rem 1.5rem;
                        border: 1px solid var(--border-color);
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        gap: 1.25rem;
                    }
                    .news-feature-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.1), transparent);
                        transition: 0.6s;
                    }
                    .news-feature-card:hover::before {
                        left: 100%;
                    }
                    .news-feature-card:hover {
                        transform: translateX(8px);
                        border-color: rgba(249, 115, 22, 0.4);
                        box-shadow: 0 8px 24px rgba(249, 115, 22, 0.2);
                    }
                    .feature-icon-large {
                        font-size: 2.5rem;
                        width: 60px;
                        height: 60px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 191, 36, 0.15));
                        border-radius: 14px;
                        flex-shrink: 0;
                        border: 1px solid rgba(249, 115, 22, 0.3);
                    }
                    .feature-title {
                        font-size: 1.15rem;
                        font-weight: 700;
                        background: linear-gradient(90deg, #f97316, #fbbf24);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin: 0 0 0.35rem;
                    }
                    .feature-description {
                        font-size: 0.9rem;
                        color: var(--text-secondary);
                        line-height: 1.5;
                        margin: 0;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default News;
