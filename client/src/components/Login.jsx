import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { login } from '../services/api';
import './Login.css';

const SERVER_ID = '617702007188488205';
const SERVER_ICON = `https://cdn.discordapp.com/icons/${SERVER_ID}/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=128`;

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [discordId, setDiscordId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
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
        setLoading(true);

        try {
            const response = await login(discordId, password);
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
                onLogin(response.user);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <button className="theme-toggle-floating" onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="login-card">
                <button onClick={() => navigate('/')} className="back-btn">
                    <ArrowLeft size={18} />
                    Volver
                </button>

                <div className="login-header">
                    <div className="login-icon">
                        <img src={SERVER_ICON} alt="Mango Army" className="login-logo" />
                    </div>
                    <h1>Iniciar Sesión</h1>
                    <p>Accede al panel de staff de Mango Army</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>ID de Discord</label>
                        <input
                            type="text"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            placeholder="Ej: 817515739711406140"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Tu contraseña"
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>¿No tienes cuenta?</p>
                    <button onClick={() => navigate('/solicitar-staff')} className="link-btn">
                        Solicitar acceso de Staff
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
