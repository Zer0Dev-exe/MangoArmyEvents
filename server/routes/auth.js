const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

router.post('/login', authCtrl.login);
router.post('/request-staff', authCtrl.requestStaff);
router.get('/requests', authCtrl.getRequests);
router.post('/approve/:id', authCtrl.approveRequest);
router.post('/reject/:id', authCtrl.rejectRequest);
router.get('/users', authCtrl.getUsers);
router.put('/users/:id/roles', authCtrl.updateRoles);
router.delete('/users/:id', authCtrl.deleteUser);
router.get('/check-admin/:id', authCtrl.checkAdmin);

module.exports = router;
