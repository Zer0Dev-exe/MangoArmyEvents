import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Sun, Moon } from 'lucide-react';
import { requestStaff } from '../services/api';
import './StaffRequest.css';

const SERVER_ID = '617702007188488205';
const SERVER_ICON = `https://cdn.discordapp.com/icons/${SERVER_ID}/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=128`;

const StaffRequest = () => {
    const navigate = useNavigate();
    const [discordId, setDiscordId] = useState('');
    const [staffType, setStaffType] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!staffType) {
            setError('Por favor selecciona el tipo de acceso que deseas');
            return;
        }
        
        setLoading(true);

        try {
            await requestStaff(discordId, staffType);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="staff-request-container">
                <button className="theme-toggle-floating" onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="staff-request-card success-card">
                    <div className="success-icon">
                        <CheckCircle size={48} />
                    </div>
                    <h1>¡Solicitud Enviada!</h1>
                    <p>
                        Tu solicitud de acceso ha sido enviada correctamente. Un administrador 
                        revisará tu solicitud y si es aprobada, recibirás tu contraseña.
                    </p>
                    <p className="note">
                        <AlertCircle size={16} />
                        Guarda bien tu ID de Discord, lo necesitarás para iniciar sesión.
                    </p>
                    <button onClick={() => navigate('/')} className="btn-home">
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="staff-request-container">
            <button className="theme-toggle-floating" onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="staff-request-card">
                <button onClick={() => navigate('/')} className="back-btn">
                    <ArrowLeft size={18} />
                    Volver
                </button>

                <div className="request-header">
                    <div className="request-icon">
                        <img src={SERVER_ICON} alt="Mango Army" className="request-logo" />
                    </div>
                    <h1>Solicitar Acceso</h1>
                    <p>Solicita acceso para gestionar eventos en Mango Army</p>
                </div>

                <form onSubmit={handleSubmit} className="request-form">
                    <div className="form-group">
                        <label>Tu ID de Discord</label>
                        <input
                            type="text"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            placeholder="Ej: 817515739711406140"
                            required
                        />
                        <span className="input-hint">
                            Puedes obtener tu ID activando el modo desarrollador en Discord 
                            y haciendo clic derecho en tu perfil.
                        </span>
                    </div>

                    <div className="form-group">
                        <label>¿Para qué tipo de eventos quieres tener acceso?</label>
                        <div className="staff-type-options">
                            <button
                                type="button"
                                className={`staff-type-btn ${staffType === 'discord' ? 'active' : ''}`}
                                onClick={() => setStaffType('discord')}
                            >
                                <span className="staff-type-icon">💬</span>
                                <span className="staff-type-label">Staff Discord</span>
                                <span className="staff-type-desc">Eventos de Discord</span>
                            </button>
                            <button
                                type="button"
                                className={`staff-type-btn ${staffType === 'minecraft' ? 'active' : ''}`}
                                onClick={() => setStaffType('minecraft')}
                            >
                                <span className="staff-type-icon">⛏️</span>
                                <span className="staff-type-label">Staff MC</span>
                                <span className="staff-type-desc">Eventos de Minecraft</span>
                            </button>
                            <button
                                type="button"
                                className={`staff-type-btn ${staffType === 'podcaster' ? 'active' : ''}`}
                                onClick={() => setStaffType('podcaster')}
                            >
                                <span className="staff-type-icon">🎙️</span>
                                <span className="staff-type-label">Podcaster</span>
                                <span className="staff-type-desc">Eventos de Podcast</span>
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>

                <div className="request-info">
                    <h3>¿Cómo funciona?</h3>
                    <ol>
                        <li>Envías tu solicitud con tu ID de Discord</li>
                        <li>Un administrador revisa tu solicitud</li>
                        <li>Si es aprobada, recibirás una contraseña</li>
                        <li>Podrás crear y gestionar eventos de tu categoría</li>
                    </ol>
                </div>

                <div className="request-footer">
                    <p>¿Ya tienes cuenta?</p>
                    <button onClick={() => navigate('/login')} className="link-btn">
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffRequest;
