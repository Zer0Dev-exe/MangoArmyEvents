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
    return res.status(401).json({ error: 'API key inválida o no proporcionada' });
  }

  next();
};

module.exports = apiKeyAuth;
