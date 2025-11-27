const express = require('express');
const router = express.Router();
const discordCtrl = require('../controllers/discordController');

// Health check - público
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Mango Army API is running 🥭'
  });
});

router.get('/discord-user/:id', discordCtrl.getDiscordUser);

module.exports = router;
