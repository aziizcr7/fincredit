const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/requests',           ctrl.getAllRequests);
router.put('/approve/:id',        ctrl.approveRequest);
router.put('/reject/:id',         ctrl.rejectRequest);
router.get('/stats',              ctrl.getStats);
router.get('/users',              ctrl.getAllUsers);
router.put('/users/:id/toggle',   ctrl.toggleUserStatus);

module.exports = router;
