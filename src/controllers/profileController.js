const User = require('../models/user');
const File = require('../models/file');
const path = require('path');
const fs = require('fs');

exports.show = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const totalFiles = await File.countUserFiles(user);
    const totalFolders = await File.countUserFolders(user);
    const storageUsed = await File.getTotalStorageUsed(user.directory);
    const storageLimit = File.STORAGE_LIMIT;
    
    res.render('profile/show', {
      user,
      totalFiles,
      totalFolders,
      storageUsed,
      storageLimit,
      formatSize: File.formatSize,
      error: req.query.error,
      success: req.query.success
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Erreur serveur', user: req.user });
  }
};

exports.update = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    await User.update(req.session.userId, { firstName, lastName, email, phone });
    res.redirect('/profile?success=Profil mis à jour avec succès');
  } catch (error) {
    res.redirect('/profile?error=' + encodeURIComponent(error.message));
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      throw new Error('Les mots de passe ne correspondent pas');
    }
    
    await User.updatePassword(req.session.userId, currentPassword, newPassword);
    res.redirect('/profile?success=Mot de passe mis à jour avec succès');
  } catch (error) {
    res.redirect('/profile?error=' + encodeURIComponent(error.message));
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { folderName } = req.body;
    const user = await User.findById(req.session.userId);
    const folderPath = path.join(user.directory, folderName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
      res.redirect('/files?success=Dossier créé avec succès');
    } else {
      res.redirect('/files?error=Ce dossier existe déjà');
    }
  } catch (error) {
    res.redirect('/files?error=' + encodeURIComponent(error.message));
  }
};