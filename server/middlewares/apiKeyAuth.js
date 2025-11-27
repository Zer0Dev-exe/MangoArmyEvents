const apiKeyAuth = (req, res, next) => {
  // Rutas públicas que no requieren API key
  const publicPaths = [
    '/api/events',        // GET eventos es público
    '/api/discord-user',  // Consultar usuarios Discord
    '/api/auth/login',    // Login
    '/api/auth/request-staff', // Solicitar staff
    '/api/auth/check-admin'    // Verificar admin
  ];

  // Permitir GET a eventos sin API key (lectura pública)
  if (req.method === 'GET' && req.path === '/api/events') {
    return next();
  }

  // Permitir rutas públicas
  const isPublic = publicPaths.some(p => req.path.startsWith(p) && 
    (req.method === 'GET' || req.method === 'POST' && (p.includes('login') || p.includes('request-staff'))));

  if (isPublic && req.method === 'GET') {
    return next();
  }
  if (req.path === '/api/auth/login' || req.path === '/api/auth/request-staff') {
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
    return res.status(401).json({ error: 'API key inválida o no proporcionada' });
  }

  next();
};

module.exports = apiKeyAuth;
