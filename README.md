# Mango Army Eventos

Sistema de gestión de eventos para el servidor de Discord Mango Army.

## Estructura

```
├── client/          # Frontend React + Vite
└── server/          # Backend Express + MongoDB
```

## Desarrollo Local

### 1. Backend (servidor)

```bash
cd server
npm install
# Copiar .env.example a .env y configurar
npm run dev
```

### 2. Frontend (cliente)

```bash
cd client
npm install
# Copiar .env.example a .env y configurar
npm run dev
```

## Deploy en Vercel

### Backend (server/)

1. Crear nuevo proyecto en Vercel
2. Conectar el repositorio, seleccionar carpeta `server`
3. Configurar variables de entorno en Vercel Dashboard:
   - `MONGODB_URI` - URI de MongoDB Atlas
   - `DISCORD_BOT_TOKEN` - Token del bot de Discord
   - `API_KEY` - Clave secreta para proteger la API
   - `ADMIN_IDS` - IDs de Discord de administradores (separados por coma)

4. Deploy!

### Frontend (client/)

1. Crear nuevo proyecto en Vercel
2. Conectar el repositorio, seleccionar carpeta `client`
3. Configurar variables de entorno en Vercel Dashboard:
   - `VITE_API_URL` - URL del backend (ej: https://tu-api.vercel.app/api)
   - `VITE_API_KEY` - Misma API_KEY del servidor

4. Deploy!

## Variables de Entorno

### Server (.env)
| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 3001) |
| `MONGODB_URI` | URI de conexión a MongoDB |
| `DISCORD_BOT_TOKEN` | Token del bot de Discord |
| `API_KEY` | Clave para proteger endpoints |
| `ADMIN_IDS` | IDs de admins iniciales |

### Client (.env)
| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API |
| `VITE_API_KEY` | Clave de acceso a la API |

## Seguridad

- Las rutas públicas (GET /events, login, request-staff) no requieren API key
- Las rutas de escritura (POST, PUT, DELETE) requieren API key
- La API key se envía en el header `x-api-key`
