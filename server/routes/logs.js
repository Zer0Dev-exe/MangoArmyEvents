const express = require('express');
const router = express.Router();
const logsCtrl = require('../controllers/logsController');

router.get('/', logsCtrl.getLogs);
router.post('/session', logsCtrl.createSession);

module.exports = router;
