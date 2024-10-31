const File = require('../models/file');
const User = require('../models/user');
const path = require('path');
const fs = require('fs');

exports.index = async (req, res) => {
  try {
    const files = await File.getAllForUser(req.user);
    const totalUsed = await File.getTotalStorageUsed(req.user.directory);

    res.render('files/index', {
      files,
      totalUsed,
      error: req.query.error || null,
      success: req.query.success || null,
      formatSize: File.formatSize,
      user: req.user
    });
  } catch (error) {
    console.error('Error in fileController.index:', error);
    res.render('files/index', {
      files: [],
      totalUsed: 0,
      error: 'Erreur lors du chargement des fichiers',
      success: null,
      formatSize: File.formatSize,
      user: req.user
    });
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/files?error=Aucun fichier sélectionné');
    }
    res.redirect('/files?success=Fichier uploadé avec succès');
  } catch (error) {
    res.redirect('/files?error=' + encodeURIComponent(error.message));
  }
};

exports.download = async (req, res) => {
  try {
    const filePath = path.join(req.user.directory, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.redirect('/files?error=Fichier non trouvé');
    }
    
    res.download(filePath);
  } catch (error) {
    res.redirect('/files?error=' + encodeURIComponent(error.message));
  }
};

exports.delete = async (req, res) => {
  try {
    const filePath = path.join(req.user.directory, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};