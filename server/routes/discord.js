const express = require('express');
const router = express.Router();
const discordCtrl = require('../controllers/discordController');

router.get('/user/:id', discordCtrl.getDiscordUser);

module.exports = router;
