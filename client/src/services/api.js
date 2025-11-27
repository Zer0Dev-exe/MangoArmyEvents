import axios from 'axios';

// En producción usa la variable de entorno, en desarrollo usa localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Configurar axios con headers por defecto
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'x-api-key': API_KEY })
  }
});

// ============ EVENTS ============
export const getEvents = async () => {
    const response = await api.get('/events');
    return response.data;
};

export const createEvent = async (eventData, performedBy = null) => {
    const response = await api.post('/events', { ...eventData, performedBy });
    return response.data;
};

export const updateEvent = async (eventId, eventData, performedBy = null) => {
    const response = await api.put(`/events/${eventId}`, { ...eventData, performedBy });
    return response.data;
};

export const deleteEvent = async (eventId, performedBy = null) => {
    const response = await api.delete(`/events/${eventId}`, { data: { performedBy } });
    return response.data;
};

// ============ DISCORD ============
export const getDiscordUser = async (discordId) => {
    try {
        const response = await api.get(`/discord-user/${discordId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching Discord user:", error);
        return null;
    }
};

// ============ LOGS ============
export const getLogs = async () => {
    const response = await api.get('/logs');
    return response.data;
};

export const logSession = async () => {
    try {
        await api.post('/session');
    } catch (error) {
        console.error("Error logging session:", error);
    }
};

// ============ AUTH ============
export const login = async (discordId, password) => {
    const response = await api.post('/auth/login', { discordId, password });
    return response.data;
};

export const requestStaff = async (discordId, staffType) => {
    const response = await api.post('/auth/request-staff', { discordId, staffType });
    return response.data;
};

export const getStaffRequests = async () => {
    const response = await api.get('/auth/requests');
    return response.data;
};

export const approveRequest = async (requestId, adminDiscordId) => {
    const response = await api.post(`/auth/approve/${requestId}`, { adminDiscordId });
    return response.data;
};

export const rejectRequest = async (requestId, adminDiscordId) => {
    const response = await api.post(`/auth/reject/${requestId}`, { adminDiscordId });
    return response.data;
};

export const getUsers = async () => {
    const response = await api.get('/auth/users');
    return response.data;
};

export const updateUserRoles = async (userId, roles, adminDiscordId) => {
    const response = await api.put(`/auth/users/${userId}/roles`, { roles, adminDiscordId });
    return response.data;
};

export const deleteUser = async (userId, adminDiscordId) => {
    const response = await api.delete(`/auth/users/${userId}`, { data: { adminDiscordId } });
    return response.data;
};

export const checkAdmin = async (discordId) => {
    const response = await api.get(`/auth/check-admin/${discordId}`);
    return response.data;
};
