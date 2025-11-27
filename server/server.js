const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const apiKeyAuth = require('./middlewares/apiKeyAuth');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// API Key middleware
app.use(apiKeyAuth);

// Routes
app.use('/api/docs', require('./routes/docs')); // Docs antes del auth middleware
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api', require('./routes/discord'));

// Root endpoint - Landing page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mango Army API</title>
  <link rel="icon" href="https://cdn.discordapp.com/icons/617702007188488205/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=128" type="image/gif">
  <style>
    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --muted: #8b949e;
      --orange: #ff6b35;
      --yellow: #f7c531;
      --green: #3fb950;
      --blue: #58a6ff;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 700px;
      text-align: center;
    }
    .logo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      margin-bottom: 1.5rem;
      filter: drop-shadow(0 0 30px rgba(255, 107, 53, 0.5));
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    h1 {
      font-size: 3rem;
      background: linear-gradient(135deg, var(--orange), var(--yellow));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    .version {
      display: inline-block;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }
    .subtitle {
      color: var(--muted);
      font-size: 1.2rem;
      margin-bottom: 2.5rem;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(63, 185, 80, 0.1);
      border: 1px solid var(--green);
      padding: 0.5rem 1rem;
      border-radius: 25px;
      color: var(--green);
      margin-bottom: 2.5rem;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .feature {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      transition: transform 0.2s, border-color 0.2s;
    }
    .feature:hover {
      transform: translateY(-3px);
      border-color: var(--orange);
    }
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .feature-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .feature-desc {
      font-size: 0.8rem;
      color: var(--muted);
    }
    .buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--orange), var(--yellow));
      color: #000;
    }
    .btn-primary:hover {
      box-shadow: 0 5px 25px rgba(255, 107, 53, 0.4);
    }
    .btn-secondary {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-secondary:hover {
      border-color: var(--orange);
      box-shadow: 0 5px 25px rgba(255, 107, 53, 0.2);
    }
    .endpoints {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: left;
    }
    .endpoints h3 {
      color: var(--orange);
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }
    .endpoint:last-child { border: none; }
    .method {
      font-size: 0.7rem;
      font-weight: bold;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      min-width: 45px;
      text-align: center;
    }
    .method.get { background: rgba(63, 185, 80, 0.2); color: var(--green); }
    .endpoint-path {
      font-family: monospace;
      color: var(--text);
      font-size: 0.9rem;
    }
    .endpoint-desc {
      margin-left: auto;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      margin-left: 0.5rem;
    }
    .badge.public { background: rgba(63, 185, 80, 0.2); color: var(--green); }
    footer {
      margin-top: 2.5rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    footer a {
      color: var(--blue);
      text-decoration: none;
    }
    footer a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .features { grid-template-columns: 1fr; }
      h1 { font-size: 2rem; }
      .buttons { flex-direction: column; }
      .endpoint-desc { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <img 
      src="https://cdn.discordapp.com/icons/617702007188488205/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=128" 
      alt="Mango Army" 
      class="logo"
      onerror="this.src='https://cdn.discordapp.com/icons/814300956998672404/a_fd59844582abe58fe13440528bf0955e.gif'"
    >
    <h1>Mango Army API</h1>
    <span class="version">v1.0.0</span>
    <p class="subtitle">Sistema de gestión de eventos para Discord</p>
    
    <div class="status">
      <span class="status-dot"></span>
      API Operativa
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">📅</div>
        <div class="feature-title">Eventos</div>
        <div class="feature-desc">Podcasts, MC, Discord</div>
      </div>
      <div class="feature">
        <div class="feature-icon">👥</div>
        <div class="feature-title">Usuarios</div>
        <div class="feature-desc">Multi-rol system</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📝</div>
        <div class="feature-title">Logs</div>
        <div class="feature-desc">Auditoría completa</div>
      </div>
    </div>

    <div class="buttons">
      <a href="/api/docs" class="btn btn-primary">📖 Documentación</a>
      <a href="/api/events" class="btn btn-secondary">📅 Ver Eventos</a>
    </div>

    <div class="endpoints">
      <h3>🚀 Endpoints Públicos</h3>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/ping</span>
        <span class="badge public">Public</span>
        <span class="endpoint-desc">Health check</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/events</span>
        <span class="badge public">Public</span>
        <span class="endpoint-desc">Lista de eventos</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/docs</span>
        <span class="badge public">Public</span>
        <span class="endpoint-desc">Documentación</span>
      </div>
    </div>

    <footer>
      <p>Desarrollado para <a href="https://discord.gg/mangoarmy" target="_blank">Mango Army</a> 🥭</p>
    </footer>
  </div>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
