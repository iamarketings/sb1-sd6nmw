const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, requireAdmin, adminController.dashboard);
router.get('/users', requireAuth, requireAdmin, adminController.users);
router.post('/users/:id/toggle', requireAuth, requireAdmin, adminController.toggleUser);
router.get('/storage', requireAuth, requireAdmin, adminController.storage);

module.exports = router;