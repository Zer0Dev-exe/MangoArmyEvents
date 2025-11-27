const apiKeyAuth = (req, res, next) => {
  // Rutas públicas que no requieren API key
  const publicGetPaths = [
    '/api/docs',          // Documentación
    '/api/events',        // GET eventos es público
    '/api/ping'           // Health check
  ];

  // Permitir GET a rutas públicas sin API key
  if (req.method === 'GET') {
    const isPublicGet = publicGetPaths.some(p => req.path.startsWith(p));
    if (isPublicGet) return next();
  }

  // Permitir root
  if (req.path === '/' || req.path === '') {
    return next();
  }

  // Para el resto, verificar API key
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.warn('API_KEY not configured in .env - all requests allowed');
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    // Si es una petición desde navegador, mostrar página informativa
    const acceptHeader = req.headers['accept'] || '';
    if (acceptHeader.includes('text/html')) {
      return res.status(401).send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mango Army API</title>
  
  <!-- Open Graph / Discord Embed -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="🔐 Mango Army API - Acceso Restringido">
  <meta property="og:description" content="Esta ruta requiere autenticación. Visita la documentación para más información.">
  <meta property="og:image" content="https://cdn.discordapp.com/icons/617702007188488205/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=512">
  <meta property="og:site_name" content="Mango Army">
  <meta name="theme-color" content="#f85149">
  
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
      --red: #f85149;
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
      max-width: 600px;
      text-align: center;
    }
    .logo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      margin-bottom: 1.5rem;
      filter: drop-shadow(0 0 20px rgba(255, 107, 53, 0.5));
    }
    h1 {
      font-size: 2.5rem;
      background: linear-gradient(135deg, var(--orange), var(--yellow));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: var(--muted);
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .card h3 {
      color: var(--orange);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .card p {
      color: var(--muted);
      line-height: 1.6;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .feature {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .feature-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .feature-text {
      font-size: 0.9rem;
      color: var(--muted);
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, var(--orange), var(--yellow));
      color: #000;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(255, 107, 53, 0.3);
    }
    .auth-notice {
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid var(--red);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      color: var(--red);
      font-size: 0.9rem;
    }
    .links {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .links a {
      color: var(--blue);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .links a:hover {
      text-decoration: underline;
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
    <p class="subtitle">Sistema de gestión de eventos para el servidor de Discord</p>

    <div class="auth-notice">
      🔒 Esta ruta requiere autenticación con API Key
    </div>

    <div class="card">
      <h3>📋 ¿Qué es esta API?</h3>
      <p>
        La API de Mango Army Eventos permite gestionar los eventos del servidor de Discord. 
        Maneja podcasts, eventos de Minecraft, reuniones del staff y más.
      </p>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">📅</div>
        <div class="feature-text">Gestión de Eventos</div>
      </div>
      <div class="feature">
        <div class="feature-icon">👥</div>
        <div class="feature-text">Sistema de Roles</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📝</div>
        <div class="feature-text">Registro de Logs</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔐</div>
        <div class="feature-text">Autenticación Segura</div>
      </div>
    </div>

    <a href="/api/docs" class="btn">📖 Ver Documentación</a>

    <div class="links">
      <a href="/api/ping">🏓 Health Check</a>
      <a href="/api/events">📅 Ver Eventos</a>
      <a href="/api/docs/json">📄 JSON Schema</a>
    </div>
  </div>
</body>
</html>
      `);
    }
    
    // Para peticiones de API, devolver JSON
    return res.status(401).json({ error: 'API key inválida o no proporcionada' });
  }

  next();
};

module.exports = apiKeyAuth;
