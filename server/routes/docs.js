const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Leer rutas dinámicamente de los archivos
const getRoutesFromFile = (filename, basePath) => {
  const routes = [];
  const filePath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filePath)) return routes;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex para encontrar rutas
  const routeRegex = /router\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  let match;
  
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    routes.push({
      method,
      path: `${basePath}${routePath === '/' ? '' : routePath}`,
    });
  }
  
  return routes;
};

// Configuración de endpoints con metadata
const endpointConfig = {
  '/api/events': {
    'GET /': { desc: 'Obtener todos los eventos', auth: false, response: '[Event]' },
    'POST /': { desc: 'Crear un evento', auth: true, body: { title: 'string', description: 'string', date: 'ISO date', time: 'HH:mm', category: 'string', organizers: '[Organizer]', performedBy: 'User' }, response: 'Event' },
    'PUT /:id': { desc: 'Actualizar un evento', auth: true, params: { id: 'Event ID' }, body: 'Event fields + performedBy', response: 'Event' },
    'DELETE /:id': { desc: 'Eliminar un evento', auth: true, params: { id: 'Event ID' }, body: { performedBy: 'User' }, response: '{ message }' }
  },
  '/api/auth': {
    'POST /login': { desc: 'Iniciar sesión', auth: true, body: { discordId: 'string', password: 'string' }, response: '{ user: User }' },
    'POST /request-staff': { desc: 'Solicitar acceso de staff', auth: true, body: { discordId: 'string', staffType: 'podcaster|minecraft|discord' }, response: '{ message }' },
    'GET /requests': { desc: 'Obtener solicitudes pendientes', auth: true, response: '[StaffRequest]' },
    'POST /approve/:id': { desc: 'Aprobar solicitud', auth: true, params: { id: 'Request ID' }, body: { adminDiscordId: 'string' }, response: '{ message, user }' },
    'POST /reject/:id': { desc: 'Rechazar solicitud', auth: true, params: { id: 'Request ID' }, body: { adminDiscordId: 'string' }, response: '{ message }' },
    'GET /users': { desc: 'Obtener usuarios', auth: true, response: '[User]' },
    'PUT /users/:id/roles': { desc: 'Actualizar roles', auth: true, params: { id: 'Discord ID' }, body: { adminDiscordId: 'string', roles: '[string]' }, response: '{ message, roles }' },
    'DELETE /users/:id': { desc: 'Eliminar usuario', auth: true, params: { id: 'Discord ID' }, body: { adminDiscordId: 'string' }, response: '{ message }' },
    'GET /check-admin/:id': { desc: 'Verificar si es admin', auth: true, params: { id: 'Discord ID' }, response: '{ isAdmin, isUser }' }
  },
  '/api/logs': {
    'GET /': { desc: 'Obtener todos los logs', auth: true, response: '[Log]' },
    'POST /session': { desc: 'Registrar sesión', auth: true, response: '{ message }' }
  },
  '/api': {
    'GET /ping': { desc: 'Health check - verificar si la API está activa', auth: false, response: '{ status, timestamp }' },
    'GET /discord-user/:id': { desc: 'Obtener info de usuario Discord', auth: true, params: { id: 'Discord ID' }, response: 'Discord User' }
  }
};

// Generar docs dinámicamente
const generateDocs = () => {
  const routeFiles = {
    'events.js': '/api/events',
    'auth.js': '/api/auth',
    'logs.js': '/api/logs',
    'discord.js': '/api'
  };

  const allRoutes = {};
  
  Object.entries(routeFiles).forEach(([file, basePath]) => {
    const routes = getRoutesFromFile(file, basePath);
    const config = endpointConfig[basePath] || {};
    
    allRoutes[basePath] = routes.map(route => {
      const key = `${route.method} ${route.path.replace(basePath, '') || '/'}`;
      const meta = config[key] || { desc: 'Sin descripción', auth: true };
      
      return {
        ...route,
        description: meta.desc,
        auth: meta.auth,
        params: meta.params,
        body: meta.body,
        response: meta.response || 'object'
      };
    });
  });

  return allRoutes;
};

const models = {
  Event: {
    id: 'string (auto)',
    title: 'string (required)',
    description: 'string',
    date: 'Date',
    time: 'string (HH:mm)',
    category: 'podcast | minecraft | discord | otro',
    organizers: '[{ id, username, avatarUrl }]',
    createdAt: 'Date (auto)'
  },
  User: {
    discordId: 'string (unique)',
    username: 'string',
    avatarUrl: 'string',
    password: 'string',
    role: 'string (legacy)',
    roles: '[owner | admin | developer | podcaster | staff-mc | staff-discord]',
    createdAt: 'Date'
  },
  StaffRequest: {
    id: 'string',
    discordId: 'string',
    username: 'string',
    avatarUrl: 'string',
    staffType: 'podcaster | minecraft | discord',
    status: 'pending | approved | rejected',
    createdAt: 'Date'
  },
  Log: {
    id: 'string',
    action: 'create | update | delete | session',
    timestamp: 'Date',
    event: 'Event object',
    performedBy: '{ discordId, username, avatarUrl }',
    changes: '{ field: { old, new } }'
  }
};

// Nombres amigables para la navegación
const sectionNames = {
  '/api/events': { name: 'Eventos', icon: '📅' },
  '/api/auth': { name: 'Autenticación', icon: '🔐' },
  '/api/logs': { name: 'Logs', icon: '📝' },
  '/api': { name: 'Discord', icon: '🎮' }
};

// HTML Generator con layout de sidebar
const generateHtml = (routes) => {
  const groupedRoutes = Object.entries(routes);
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mango Army API - Documentación</title>
  <link rel="icon" href="https://cdn.discordapp.com/icons/814300956998672404/a_fd59844582abe58fe13440528bf0955e.gif" type="image/gif">
  <style>
    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --sidebar: #0d1117;
      --border: #30363d;
      --text: #c9d1d9;
      --muted: #8b949e;
      --orange: #ff6b35;
      --yellow: #f7c531;
      --green: #3fb950;
      --blue: #58a6ff;
      --red: #f85149;
      --purple: #a371f7;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    /* Layout Principal */
    .layout {
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      text-align: center;
    }

    .logo-container {
      margin-bottom: 1rem;
    }
    .logo-img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.5));
    }
    .logo-container svg {
      filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.5));
    }

    .sidebar-title {
      font-size: 1.2rem;
      background: linear-gradient(135deg, var(--orange), var(--yellow));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: bold;
    }

    .sidebar-subtitle {
      color: var(--muted);
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(63, 185, 80, 0.15);
      color: var(--green);
      padding: 0.3rem 0.8rem;
      border-radius: 2rem;
      font-size: 0.75rem;
      margin-top: 0.75rem;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      background: var(--green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .sidebar-nav {
      padding: 1rem 0;
      flex: 1;
    }

    .nav-section-label {
      color: var(--muted);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.75rem 1.5rem 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: var(--text);
      text-decoration: none;
      transition: all 0.2s;
      border-left: 3px solid transparent;
      cursor: pointer;
    }
    .nav-item:hover {
      background: rgba(255, 107, 53, 0.1);
      border-left-color: var(--orange);
    }
    .nav-item.active {
      background: rgba(255, 107, 53, 0.15);
      border-left-color: var(--orange);
      color: var(--orange);
    }
    .nav-icon { font-size: 1.1rem; }
    .nav-text { font-size: 0.9rem; }
    .nav-count {
      margin-left: auto;
      background: var(--surface);
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      font-size: 0.75rem;
      color: var(--muted);
    }

    .sidebar-stats {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 1rem;
    }
    .stat {
      flex: 1;
      text-align: center;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--orange);
    }
    .stat-label { color: var(--muted); font-size: 0.7rem; }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 280px;
      padding: 2rem;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 2rem;
      background: linear-gradient(135deg, var(--orange), var(--yellow));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    .page-desc { color: var(--muted); }

    .auth-box {
      background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(247, 197, 49, 0.05));
      border: 1px solid var(--orange);
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .auth-icon { font-size: 1.5rem; }
    .auth-text h3 { color: var(--orange); font-size: 0.95rem; margin-bottom: 0.25rem; }
    .auth-text p { color: var(--muted); font-size: 0.85rem; margin: 0; }
    .auth-box code {
      background: var(--surface);
      padding: 0.5rem 1rem;
      border-radius: 5px;
      margin-left: auto;
      font-size: 0.85rem;
    }

    .section {
      margin-bottom: 2rem;
      scroll-margin-top: 2rem;
    }
    .section-title {
      font-size: 1.2rem;
      color: var(--orange);
      padding: 1rem;
      background: var(--surface);
      border-radius: 10px 10px 0 0;
      border-bottom: 2px solid var(--orange);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .section-icon { font-size: 1rem; }

    .endpoint {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.2s;
    }
    .endpoint:last-child { border-radius: 0 0 10px 10px; }
    .endpoint:hover { background: #1c2128; }
    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }
    .endpoint-body {
      display: none;
      padding: 1rem;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid var(--border);
    }
    .endpoint.open .endpoint-body { display: block; }

    .method {
      font-weight: bold;
      padding: 0.25rem 0.75rem;
      border-radius: 5px;
      font-size: 0.8rem;
      min-width: 60px;
      text-align: center;
    }
    .method.GET { background: rgba(63, 185, 80, 0.2); color: var(--green); }
    .method.POST { background: rgba(88, 166, 255, 0.2); color: var(--blue); }
    .method.PUT { background: rgba(163, 113, 247, 0.2); color: var(--purple); }
    .method.DELETE { background: rgba(248, 81, 73, 0.2); color: var(--red); }

    .path { font-family: monospace; color: var(--text); }
    .path-param { color: var(--yellow); }
    
    .badges { margin-left: auto; display: flex; gap: 0.5rem; }
    .badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 3px;
    }
    .badge.auth { background: rgba(248, 81, 73, 0.2); color: var(--red); }
    .badge.public { background: rgba(63, 185, 80, 0.2); color: var(--green); }

    .desc { color: var(--muted); margin-bottom: 1rem; }
    .params-title { color: var(--blue); font-size: 0.9rem; margin-bottom: 0.5rem; }
    .param-list { 
      background: var(--bg);
      padding: 0.75rem;
      border-radius: 5px;
      margin-bottom: 1rem;
    }
    .param-item {
      display: flex;
      gap: 1rem;
      padding: 0.25rem 0;
      font-size: 0.9rem;
    }
    .param-name { color: var(--yellow); font-family: monospace; }
    .param-type { color: var(--muted); }

    .response-type {
      font-family: monospace;
      background: rgba(88, 166, 255, 0.1);
      color: var(--blue);
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-size: 0.85rem;
    }

    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      padding: 1rem;
      background: var(--surface);
      border-radius: 0 0 10px 10px;
    }
    .model {
      background: var(--bg);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid var(--border);
    }
    .model h4 { color: var(--orange); margin-bottom: 0.75rem; }
    .model-field {
      display: flex;
      justify-content: space-between;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.85rem;
    }
    .model-field:last-child { border: none; }
    .field-name { color: var(--blue); font-family: monospace; }
    .field-type { color: var(--muted); }

    footer {
      text-align: center;
      padding: 2rem;
      color: var(--muted);
      border-top: 1px solid var(--border);
      margin-top: 2rem;
      font-size: 0.85rem;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .sidebar { width: 220px; }
      .main-content { margin-left: 220px; }
    }
    @media (max-width: 700px) {
      .sidebar {
        position: relative;
        width: 100%;
        height: auto;
      }
      .main-content {
        margin-left: 0;
      }
      .layout {
        flex-direction: column;
      }
      .auth-box {
        flex-direction: column;
        text-align: center;
      }
      .auth-box code { margin: 0.5rem 0 0 0; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-container">
          <img 
            src="https://cdn.discordapp.com/icons/814300956998672404/a_fd59844582abe58fe13440528bf0955e.gif" 
            alt="" 
            class="logo-img"
            onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='block';"
          >
          <svg id="logo-fallback" viewBox="0 0 100 100" width="64" height="64" style="display: none;">
            <defs>
              <linearGradient id="mangoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ff6b35"/>
                <stop offset="100%" style="stop-color:#f7c531"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#mangoGrad)"/>
            <text x="50" y="62" text-anchor="middle" font-size="40" font-weight="bold" fill="#000">MA</text>
          </svg>
        </div>
        <div class="sidebar-title">Mango Army API</div>
        <div class="sidebar-subtitle">Documentación v1.0</div>
        <div class="live-badge">
          <span class="live-dot"></span>
          Online
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Endpoints</div>
        ${groupedRoutes.map(([basePath, endpoints]) => `
          <a href="#${basePath.replace(/\//g, '-').slice(1)}" class="nav-item">
            <span class="nav-icon">${sectionNames[basePath]?.icon || '📁'}</span>
            <span class="nav-text">${sectionNames[basePath]?.name || basePath}</span>
            <span class="nav-count">${endpoints.length}</span>
          </a>
        `).join('')}
        <a href="#models" class="nav-item">
          <span class="nav-icon">🗃️</span>
          <span class="nav-text">Modelos</span>
          <span class="nav-count">${Object.keys(models).length}</span>
        </a>
      </nav>

      <div class="sidebar-stats">
        <div class="stat">
          <div class="stat-value">${Object.values(routes).flat().length}</div>
          <div class="stat-label">Endpoints</div>
        </div>
        <div class="stat">
          <div class="stat-value">${Object.keys(models).length}</div>
          <div class="stat-label">Modelos</div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">API Documentation</h1>
        <p class="page-desc">Documentación generada dinámicamente para Mango Army Eventos</p>
      </div>

      <div class="auth-box">
        <span class="auth-icon">🔐</span>
        <div class="auth-text">
          <h3>Autenticación Requerida</h3>
          <p>Las rutas protegidas requieren el header:</p>
        </div>
        <code>x-api-key: tu-api-key</code>
      </div>

      ${groupedRoutes.map(([basePath, endpoints]) => `
        <div class="section" id="${basePath.replace(/\//g, '-').slice(1)}">
          <h2 class="section-title">
            <span class="section-icon">${sectionNames[basePath]?.icon || '📁'}</span>
            ${sectionNames[basePath]?.name || basePath}
            <span style="font-weight: normal; color: var(--muted); font-size: 0.85rem; margin-left: 0.5rem;">${basePath}</span>
          </h2>
          ${endpoints.map(ep => `
            <div class="endpoint" onclick="this.classList.toggle('open')">
              <div class="endpoint-header">
                <span class="method ${ep.method}">${ep.method}</span>
                <span class="path">${ep.path.replace(/:(\w+)/g, '<span class="path-param">:$1</span>')}</span>
                <div class="badges">
                  <span class="badge ${ep.auth ? 'auth' : 'public'}">${ep.auth ? '🔒 Auth' : '🌐 Public'}</span>
                </div>
              </div>
              <div class="endpoint-body">
                <p class="desc">${ep.description}</p>
                ${ep.params ? `
                  <p class="params-title">Parámetros:</p>
                  <div class="param-list">
                    ${Object.entries(ep.params).map(([name, type]) => `
                      <div class="param-item">
                        <span class="param-name">${name}</span>
                        <span class="param-type">${type}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                ${ep.body ? `
                  <p class="params-title">Body:</p>
                  <div class="param-list">
                    ${typeof ep.body === 'string' ? `<code>${ep.body}</code>` : 
                      Object.entries(ep.body).map(([name, type]) => `
                        <div class="param-item">
                          <span class="param-name">${name}</span>
                          <span class="param-type">${type}</span>
                        </div>
                      `).join('')}
                  </div>
                ` : ''}
                <p class="params-title">Response:</p>
                <span class="response-type">${ep.response}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}

      <div class="section" id="models">
        <h2 class="section-title">
          <span class="section-icon">🗃️</span>
          Modelos de Datos
        </h2>
        <div class="models-grid">
          ${Object.entries(models).map(([name, fields]) => `
            <div class="model">
              <h4>${name}</h4>
              ${Object.entries(fields).map(([field, type]) => `
                <div class="model-field">
                  <span class="field-name">${field}</span>
                  <span class="field-type">${type}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>

      <footer>
        <p>Generado automáticamente · ${new Date().toLocaleDateString('es-ES')} · Mango Army Eventos</p>
      </footer>
    </main>
  </div>

  <script>
    // Highlight nav item on scroll
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-item');
    
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 100) {
          current = section.getAttribute('id');
        }
      });
      
      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + current) {
          item.classList.add('active');
        }
      });
    });
  </script>
</body>
</html>`;
};

// JSON endpoint
router.get('/json', (req, res) => {
  const routes = generateDocs();
  res.json({
    name: 'Mango Army Eventos API',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    endpoints: routes,
    models
  });
});

// HTML endpoint
router.get('/', (req, res) => {
  const routes = generateDocs();
  res.setHeader('Content-Type', 'text/html');
  res.send(generateHtml(routes));
});

module.exports = router;
