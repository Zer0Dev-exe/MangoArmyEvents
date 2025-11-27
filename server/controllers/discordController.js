const axios = require('axios');

exports.getDiscordUser = async (req, res) => {
  const { id } = req.params;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken || botToken === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
    console.error('Discord Token missing or default');
    return res.status(500).json({ error: 'Discord Bot Token no configurado en el servidor (.env)' });
  }

  try {
    const response = await axios.get(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${botToken}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Discord API Error:', error.response?.data || error.message);
    if (error.response && error.response.status === 404) return res.status(404).json({ error: 'Usuario de Discord no encontrado' });
    if (error.response && error.response.status === 401) return res.status(401).json({ error: 'Token de Bot inválido' });
    res.status(500).json({ error: 'Error al conectar con Discord' });
  }
};
