const User = require('../models/user');
const File = require('../models/file');

exports.dashboard = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStorage = await File.getTotalStorageUsed('uploads');
    const activeUsers = await User.countActive();

    res.render('admin/dashboard', {
      totalUsers,
      totalStorage,
      activeUsers,
      formatSize: File.formatSize
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Erreur serveur' });
  }
};

exports.users = async (req, res) => {
  try {
    const users = await User.findAll();
    res.render('admin/users', { users });
  } catch (error) {
    res.status(500).render('error', { error: 'Erreur serveur' });
  }
};

exports.toggleUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.toggle(id);
    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).render('error', { error: 'Erreur serveur' });
  }
};

exports.storage = async (req, res) => {
  try {
    const users = await User.findAll();
    const storageData = await Promise.all(
      users.map(async (user) => ({
        ...user,
        storage: await File.getTotalStorageUsed(user.directory)
      }))
    );
    
    res.render('admin/storage', { 
      users: storageData,
      formatSize: File.formatSize
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Erreur serveur' });
  }
};