const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, profileController.show);
router.post('/update', requireAuth, profileController.update);
router.post('/password', requireAuth, profileController.updatePassword);
router.post('/folders', requireAuth, profileController.createFolder);

module.exports = router;