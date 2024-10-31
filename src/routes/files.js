const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const { requireAuth } = require('../middleware/auth');
const File = require('../models/file');

// Configuration de multer pour l'upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const user = req.user;
    cb(null, user.directory);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: async function (req, file, cb) {
    try {
      const totalUsed = await File.getTotalStorageUsed(req.user.directory);
      const fileSize = parseInt(req.headers['content-length']);
      
      if (totalUsed + fileSize > File.STORAGE_LIMIT) {
        return cb(new Error('Limite de stockage de 30 Go atteinte'));
      }
      cb(null, true);
    } catch (error) {
      cb(error);
    }
  }
});

router.get('/', requireAuth, fileController.index);
router.post('/upload', requireAuth, upload.single('file'), fileController.upload);
router.get('/download/:filename', requireAuth, fileController.download);
router.delete('/:filename', requireAuth, fileController.delete);

module.exports = router;